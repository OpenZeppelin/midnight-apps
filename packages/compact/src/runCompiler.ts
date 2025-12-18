#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { getLogger } from '@openzeppelin/midnight-apps-logger';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { CompactCompiler } from './Compiler.js';
import {
  type CompilationError,
  isPromisifiedChildProcessError,
} from './types/errors.js';

const logger = getLogger({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'time,pid,hostname',
      messageFormat: '{msg}',
    },
  },
});

/**
 * Executes the Compact compiler CLI with improved error handling and user feedback.
 *
 * Error Handling Architecture:
 *
 * This CLI follows a layered error handling approach:
 *
 * - Business logic (Compiler.ts) throws structured errors with context.
 * - CLI layer (runCompiler.ts) handles all user-facing error presentation.
 * - Custom error types (types/errors.ts) provide semantic meaning and context.
 *
 * Benefits: Better testability, consistent UI, separation of concerns.
 *
 * Note: This compiler uses fail-fast error handling.
 * Compilation stops on the first error encountered.
 * This provides immediate feedback but doesn't attempt to compile remaining files after a failure.
 *
 * @example Individual module compilation
 * ```bash
 * npx compact-compiler --dir security --skip-zk
 * turbo compact:access -- --skip-zk
 * turbo compact:security -- --skip-zk --other-flag
 * ```
 *
 * @example Full compilation with environment variables
 * ```bash
 * SKIP_ZK=true turbo compact
 * turbo compact
 * ```
 *
 * @example Version specification
 * ```bash
 * npx compact-compiler --dir security --skip-zk +0.26.0
 * ```
 *
 * @example Show circuit compilation details
 * ```bash
 * npx compact-compiler --show-circuits
 * turbo compact:access -- --show-circuits
 * ```
 */
async function runCompiler(): Promise<void> {
  const spinner = ora(chalk.blue('[COMPILE] Compact compiler started')).info();

  try {
    const args = process.argv.slice(2);
    const compiler = CompactCompiler.fromArgs(args);
    await compiler.compile();
  } catch (error) {
    handleError(error, spinner);
    process.exit(1);
  }
}

/**
 * Centralized error handling with specific error types and user-friendly messages.
 *
 * Handles different error types with appropriate user feedback:
 *
 * - `CompactCliNotFoundError`: Shows installation instructions.
 * - `DirectoryNotFoundError`: Shows available directories.
 * - `CompilationError`: Shows file-specific error details with context.
 * - Environment validation errors: Shows troubleshooting tips.
 * - Argument parsing errors: Shows usage help.
 * - Generic errors: Shows general troubleshooting guidance.
 *
 * @param error - The error that occurred during compilation
 * @param spinner - Ora spinner instance for consistent UI messaging
 */
function handleError(error: unknown, spinner: Ora): void {
  // CompactCliNotFoundError
  if (error instanceof Error && error.name === 'CompactCliNotFoundError') {
    spinner.fail(chalk.red(`[COMPILE] Error: ${error.message}`));
    spinner.info(
      chalk.blue(
        `[COMPILE] Install with: curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh`,
      ),
    );
    return;
  }

  // DirectoryNotFoundError
  if (error instanceof Error && error.name === 'DirectoryNotFoundError') {
    spinner.fail(chalk.red(`[COMPILE] Error: ${error.message}`));
    showAvailableDirectories();
    return;
  }

  // CompilationError
  if (error instanceof Error && error.name === 'CompilationError') {
    // The compilation error details (file name, stdout/stderr) are already displayed
    // by `compileFile`; therefore, this just handles the final err state
    const compilationError = error as CompilationError;
    // Convert absolute path to use ~ notation for better readability
    const fullPath = compilationError.file || 'unknown';
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const readablePath = fullPath.startsWith(homeDir)
      ? fullPath.replace(homeDir, '~')
      : fullPath;

    spinner.fail(
      chalk.red(`[COMPILE] Compilation failed for file: ${readablePath}`),
    );

    if (isPromisifiedChildProcessError(compilationError.cause)) {
      const execError = compilationError.cause;
      if (
        execError.stderr &&
        !execError.stderr.includes('stdout') &&
        !execError.stderr.includes('stderr')
      ) {
        const fullPath = compilationError.file || '';
        const fileDir = fullPath ? dirname(fullPath) : '';
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';

        /**
         * NOTE (error path normalization):
         * The Compact CLI often emits relative filenames in diagnostics and,
         * when compiling mocks under src/test, references may point to the
         * main contract file name (e.g. AccessControl.compact, not AccessControl.mock.compact) rather than the
         * mock. This made errors hard to click/navigate.
         *
         * Fix: Print tilde-shortened absolute paths and, if the failing file
         * lives under src/test, prefer resolving bare "Name.compact" to
         * src/Name.compact (the main contract). Otherwise, resolve in the
         * failing file's directory. Keep the logic terse and deterministic.
         */
        const isTest = fullPath.includes('/src/test/');
        const srcRoot = fullPath.includes('/src/')
          ? `${fullPath.split('/src/')[0]}/src`
          : '';
        const shorten = (p: string) =>
          homeDir && p.startsWith(homeDir) ? p.replace(homeDir, '~') : p;
        const updatedStderr = execError.stderr.replace(
          /([A-Za-z0-9_.\-/]+\.compact)\b/g,
          (match) => {
            if (match.startsWith('/') || match.startsWith('~'))
              return shorten(match);
            const filename = basename(match);
            const baseDir = isTest && srcRoot ? srcRoot : fileDir;
            if (baseDir) {
              const candidate = join(baseDir, filename);
              if (existsSync(candidate)) return shorten(candidate);
            }
            return match;
          },
        );

        logger.info(
          chalk.red(`    Additional error details: ${updatedStderr}`),
        );
      }
    }
    return;
  }

  // Env validation errors (non-CLI errors)
  if (isPromisifiedChildProcessError(error)) {
    spinner.fail(
      chalk.red(`[COMPILE] Environment validation failed: ${error.message}`),
    );
    logger.info(chalk.gray('\nTroubleshooting:'));
    logger.info(
      chalk.gray('  • Check that Compact CLI is installed and in PATH'),
    );
    logger.info(chalk.gray('  • Verify the specified Compact version exists'));
    logger.info(chalk.gray('  • Ensure you have proper permissions'));
    return;
  }

  // Arg parsing
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('--dir flag requires a directory name')) {
    spinner.fail(
      chalk.red('[COMPILE] Error: --dir flag requires a directory name'),
    );
    showUsageHelp();
    return;
  }

  // Unexpected errors
  spinner.fail(chalk.red(`[COMPILE] Unexpected error: ${errorMessage}`));
  logger.info(chalk.gray('\nIf this error persists, please check:'));
  logger.info(chalk.gray('  • Compact CLI is installed and in PATH'));
  logger.info(chalk.gray('  • Source files exist and are readable'));
  logger.info(chalk.gray('  • Specified Compact version exists'));
  logger.info(chalk.gray('  • File system permissions are correct'));
}

/**
 * Shows available directories when `DirectoryNotFoundError` occurs.
 */
function showAvailableDirectories(): void {
  logger.info(chalk.yellow('\nAvailable directories:'));
  logger.info(
    chalk.yellow('  --dir access    # Compile access control contracts'),
  );
  logger.info(chalk.yellow('  --dir archive   # Compile archive contracts'));
  logger.info(chalk.yellow('  --dir security  # Compile security contracts'));
  logger.info(chalk.yellow('  --dir token     # Compile token contracts'));
  logger.info(chalk.yellow('  --dir utils     # Compile utility contracts'));
}

/**
 * Shows usage help with examples for different scenarios.
 */
function showUsageHelp(): void {
  logger.info(chalk.yellow('\nUsage: compact-compiler [options]'));
  logger.info(chalk.yellow('\nOptions:'));
  logger.info(
    chalk.yellow(
      '  --dir <directory> Compile specific directory (access, archive, security, token, utils)',
    ),
  );
  logger.info(
    chalk.yellow('  --skip-zk         Skip zero-knowledge proof generation'),
  );
  logger.info(
    chalk.yellow(
      '  +<version>        Use specific toolchain version (e.g., +0.26.0)',
    ),
  );
  logger.info(chalk.yellow('\nExamples:'));
  logger.info(
    chalk.yellow(
      '  compact-compiler                           # Compile all files',
    ),
  );
  logger.info(
    chalk.yellow(
      '  compact-compiler --dir security             # Compile security directory',
    ),
  );
  logger.info(
    chalk.yellow(
      '  compact-compiler --dir access --skip-zk     # Compile access with flags',
    ),
  );
  logger.info(
    chalk.yellow(
      '  SKIP_ZK=true compact-compiler --dir token   # Use environment variable',
    ),
  );
  logger.info(
    chalk.yellow(
      '  compact-compiler --skip-zk +0.26.0          # Use specific version',
    ),
  );
  logger.info(chalk.yellow('\nTurbo integration:'));
  logger.info(
    chalk.yellow('  turbo compact                               # Full build'),
  );
  logger.info(
    chalk.yellow(
      '  turbo compact:security -- --skip-zk         # Directory with flags',
    ),
  );
  logger.info(
    chalk.yellow(
      '  SKIP_ZK=true turbo compact                  # Environment variables',
    ),
  );
}

runCompiler();
