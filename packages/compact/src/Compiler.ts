#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';

const DIRNAME: string = dirname(fileURLToPath(import.meta.url));
const SRC_DIR: string = 'src';
const ARTIFACTS_DIR: string = 'src/artifacts';
const COMPACT_HOME: string =
  process.env.COMPACT_HOME ?? resolve(DIRNAME, '../compactc');
const COMPACTC_PATH: string = join(COMPACT_HOME, 'compactc');

/**
 * A class to handle compilation of `.compact` files using the `compactc` compiler.
 * Provides progress feedback and colored output for success and error states.
 *
 * @example
 * ```typescript
 * const compiler = new CompactCompiler('--skip-zk');
 * compiler.compile().catch(err => console.error(err));
 * ```
 *
 * @example Successful Compilation Output
 * ```
 * ℹ [COMPILE] Found 2 .compact file(s) to compile
 * ✔ [COMPILE] [1/2] Compiled AccessControl.compact
 *     Compactc version: 0.22.0
 * ✔ [COMPILE] [2/2] Compiled MockAccessControl.compact
 *     Compactc version: 0.22.0
 *     Compiling circuit "src/artifacts/MockAccessControl/zkir/grantRole.zkir"... (skipped proving keys)
 * ```
 *
 * @example Failed Compilation Output
 * ```
 * ℹ [COMPILE] Found 2 .compact file(s) to compile
 * ✖ [COMPILE] [1/2] Failed AccessControl.compact
 *     Compactc version: 0.22.0
 *     Error: Expected ';' at line 5 in AccessControl.compact
 * ```
 */
export class CompactCompiler {
  /** Stores the compiler flags passed via command-line arguments */
  private readonly flags: string;

  /**
   * Constructs a new CompactCompiler instance, validating the `compactc` binary path.
   *
   * @param flags - Space-separated string of `compactc` flags (e.g., "--skip-zk --no-communications-commitment")
   * @throws {Error} If the `compactc` binary is not found at the resolved path
   */
  constructor(flags: string) {
    this.flags = flags.trim();
    const spinner = ora();

    spinner.info(chalk.blue(`[COMPILE] COMPACT_HOME: ${COMPACT_HOME}`));
    spinner.info(chalk.blue(`[COMPILE] COMPACTC_PATH: ${COMPACTC_PATH}`));

    if (!existsSync(COMPACTC_PATH)) {
      spinner.fail(
        chalk.red(
          `[COMPILE] Error: compactc not found at ${COMPACTC_PATH}. Set COMPACT_HOME to the compactc binary path.`,
        ),
      );
      throw new Error(`compactc not found at ${COMPACTC_PATH}`);
    }
  }

  /**
   * Compiles all `.compact` files in the source directory and its subdirectories (e.g., `src/test/mock/`).
   * Scans the `src` directory recursively for `.compact` files, compiles each one using `compactc`,
   * and displays progress with a spinner and colored output.
   *
   * @returns A promise that resolves when all files are compiled successfully
   * @throws {Error} If compilation fails for any file
   */
  public async compile(): Promise<void> {
    const compactFiles: string[] = readdirSync(SRC_DIR, {
      recursive: true,
      withFileTypes: true,
    })
      .filter((dirent): boolean => {
        const filePath = join(dirent.path, dirent.name);
        return dirent.isFile() && filePath.endsWith('.compact');
      })
      .map((dirent): string =>
        join(dirent.path, dirent.name).replace(`${SRC_DIR}/`, ''),
      );

    const spinner = ora();
    if (compactFiles.length === 0) {
      spinner.warn(chalk.yellow('[COMPILE] No .compact files found.'));
      return;
    }

    spinner.info(
      chalk.blue(
        `[COMPILE] Found ${compactFiles.length} .compact file(s) to compile`,
      ),
    );

    for (const [index, file] of compactFiles.entries()) {
      await this.compileFile(file, index, compactFiles.length);
    }
  }

  /**
   * Compiles a single `.compact` file.
   * Executes the `compactc` compiler with the provided flags, input file, and output directory.
   *
   * @param file - Relative path of the `.compact` file to compile (e.g., "test/mock/MockFile.compact")
   * @param index - Current file index (0-based) for progress display
   * @param total - Total number of files to compile for progress display
   * @returns A promise that resolves when the file is compiled successfully
   * @throws {Error} If compilation fails
   */
  private async compileFile(
    file: string,
    index: number,
    total: number,
  ): Promise<void> {
    const inputPath: string = join(SRC_DIR, file);
    const outputDir: string = join(ARTIFACTS_DIR, basename(file, '.compact'));
    const step: string = `[${index + 1}/${total}]`;
    const spinner: Ora = ora(
      chalk.blue(`[COMPILE] ${step} Compiling ${file}`),
    ).start();

    try {
      const args = [...this.flags.split(' '), inputPath, outputDir].filter(
        Boolean,
      );
      const command = COMPACTC_PATH;

      spinner.text = chalk.blue(`[COMPILE] ${step} Compiling ${file}...`);

      return new Promise((resolve, reject) => {
        spinner.stop();

        const shortCommand = basename(command);
        console.info(chalk.blue(`  [COMPILE] ${step} ${shortCommand} ${file}`));

        const process = spawn(command, args, {
          stdio: 'inherit',
        });

        process.on('close', (code) => {
          if (code === 0) {
            spinner.succeed(chalk.green(`[COMPILE] ${step} ✓ ${file}`));
            resolve();
          } else {
            // Only show error with full file path when compilation fails
            spinner.fail(chalk.red(`[COMPILE] ${step} ✗ ${file}`));
            // biome-ignore lint/suspicious/noConsoleLog: needed for error reporting
            console.log(chalk.red(`[COMPILE] Error in file: ${inputPath}`));
            reject(new Error(`Process exited with code ${code}`));
          }
        });

        process.on('error', (err) => {
          spinner.fail(chalk.red(`[COMPILE] ${step} ✗ ${file}`));
          reject(err);
        });
      });
    } catch (error: unknown) {
      spinner.fail(chalk.red(`[COMPILE] ${step} ✗ ${file}`));
      throw error;
    }
  }


}
