#!/usr/bin/env node

import { exec } from 'child_process';
import { readdirSync } from 'fs';
import { join, basename, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';
import ora, { Ora } from 'ora';
import chalk from 'chalk';

// Promisified exec for async execution
const execAsync = promisify(exec);

// Directory paths
const DIRNAME: string = dirname(fileURLToPath(import.meta.url));
const SRC_DIR: string = 'src';
const ARTIFACTS_DIR: string = 'src/artifacts';
const COMPACT_HOME: string = process.env.COMPACT_HOME ?? resolve(DIRNAME, '../compactc');
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
   * Constructs a new CompactCompiler instance.
   * @param flags - Space-separated string of `compactc` flags (e.g., "--skip-zk --no-communications-commitment")
   */
  constructor(flags: string) {
    this.flags = flags.trim();
  }

  /**
   * Compiles all `.compact` files in the source directory.
   * Scans the `src` directory for `.compact` files, compiles each one using `compactc`,
   * and displays progress with a spinner and colored output.
   * Exits with code 0 if no files are found.
   *
   * @returns A promise that resolves when all files are compiled successfully
   * @throws Error if compilation fails for any file
   */
  public async compile(): Promise<void> {
    const compactFiles: string[] = readdirSync(SRC_DIR).filter((file: string): boolean =>
      file.endsWith('.compact')
    );

    if (compactFiles.length === 0) {
      ora().warn('[COMPILE] No .compact files found.');
      process.exit(0);
    }

    ora(`[COMPILE] Found ${compactFiles.length} .compact file(s) to compile`).info();

    for (const [index, file] of compactFiles.entries()) {
      await this.compileFile(file, index, compactFiles.length);
    }
  }

  /**
   * Compiles a single `.compact` file.
   * Executes the `compactc` compiler with the provided flags, input file, and output directory.
   * Displays a spinner during compilation and prints the compiler output with indentation.
   *
   * @param file - Name of the `.compact` file to compile
   * @param index - Current file index (0-based) for progress display
   * @param total - Total number of files to compile for progress display
   * @returns A promise that resolves when the file is compiled successfully
   * @throws Error if compilation fails
   */
  private async compileFile(file: string, index: number, total: number): Promise<void> {
    const inputPath: string = join(SRC_DIR, file);
    const outputDir: string = join(ARTIFACTS_DIR, basename(file, '.compact'));
    const step: string = `[${index + 1}/${total}]`;
    const spinner: Ora = ora(`[COMPILE] ${step} Compiling ${file}`).start();

    try {
      const command: string = `${COMPACTC_PATH} ${this.flags} "${inputPath}" "${outputDir}"`.trim();
      const { stdout }: { stdout: string; stderr: string } = await execAsync(command);
      spinner.succeed(`[COMPILE] ${step} Compiled ${file}`);
      this.printOutput(stdout, chalk.cyan);
    } catch (error: any) {
      spinner.fail(`[COMPILE] ${step} Failed ${file}`);
      this.printOutput(error.stdout, chalk.cyan); // Show stdout (e.g., version) in cyan
      this.printOutput(error.stderr, chalk.red);   // Show stderr (e.g., error message) in red
      process.exit(1);
    }
  }

  /**
   * Prints compiler output with indentation and specified color.
   * Filters out empty lines and indents each line for readability.
   *
   * @param output - The compiler output string to print (stdout or stderr)
   * @param colorFn - Chalk color function to style the output (e.g., `chalk.cyan` for success, `chalk.red` for errors)
   */
  private printOutput(output: string | undefined, colorFn: (text: string) => string): void {
    if (output) {
      const lines: string[] = output
        .split('\n')
        .filter((line: string): boolean => line.trim() !== '')
        .map((line: string): string => `    ${line}`);
      console.log(colorFn(lines.join('\n')));
    }
  }
}

// Only run if this file is the entry point (pnpm exec compact-compile)
if (import.meta.url === `file://${process.argv[1]}`) {
  const compilerFlags: string = process.argv.slice(2).join(' ');
  const compiler = new CompactCompiler(compilerFlags);
  compiler.compile().catch((err: Error) => {
    console.error(chalk.red('[COMPILE] Unexpected error:', err.message));
    process.exit(1);
  });
}
