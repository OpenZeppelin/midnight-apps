#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { CompactCompiler } from './Compiler.js';

// Promisified exec for async execution
const execAsync = promisify(exec);

/**
 * A class to handle the build process for a project.
 * Runs CompactCompiler as a prerequisite, then executes build steps (TypeScript compilation,
 * artifact copying, etc.) with progress feedback and colored output for success and error states.
 */
export class CompactBuilder {
  private readonly compilerFlags: string;
  private readonly steps: Array<{ cmd: string; msg: string; shell?: string }> =
    [
      {
        cmd: 'tsc --project tsconfig.build.json',
        msg: 'Compiling TypeScript',
      },
      {
        cmd: 'mkdir -p dist/artifacts && cp -Rf src/artifacts/* dist/artifacts/ 2>/dev/null || true',
        msg: 'Copying artifacts',
        shell: '/bin/bash',
      },
      {
        /**
         * Shell command to copy and clean `.compact` files from `src` to `dist`.
         * - Creates `dist` directory if it doesn't exist.
         * - Copies `.compact` files from `src` root to `dist` root (e.g., `src/Math.compact` → `dist/Math.compact`).
         * - Copies `.compact` files from `src` subdirectories to `dist` with preserved structure (e.g., `src/interfaces/IMath.compact` → `dist/interfaces/IMath.compact`).
         * - Excludes files in `src/test` and `src/src` directories.
         * - Removes `Mock*.compact` files from `dist`.
         * - Redirects errors to `/dev/null` and ensures the command succeeds with `|| true`.
         */
        cmd: [
          'mkdir -p dist && \\', // Create dist directory if it doesn't exist
          'find src -maxdepth 1 -type f -name "*.compact" -exec cp {} dist/ \\; && \\', // Copy .compact files from src root to dist root
          'find src -type f -name "*.compact" \\', // Find .compact files in src subdirectories
          '  -not -path "src/test/*" \\', // Exclude src/test directory
          '  -not -path "src/src/*" \\', // Exclude src/src directory
          '  -path "src/*/*" \\', // Only include files in subdirectories
          '  -exec sh -c \\', // Execute a shell command for each file
          '    \'mkdir -p "dist/$(dirname "{}" | sed "s|^src/||")" && \\', // Create subdirectory in dist
          '     cp "{}" "dist/$(dirname "{}" | sed "s|^src/||")/"\' \\; \\', // Copy file to matching dist subdirectory
          '2>/dev/null && \\', // Suppress error output
          'rm dist/Mock*.compact 2>/dev/null || true', // Remove Mock*.compact files, ignore errors
        ].join('\n'),
        msg: 'Copying and cleaning .compact files',
        shell: '/bin/bash',
      },
    ];

  /**
   * Constructs a new ProjectBuilder instance.
   * @param compilerFlags - Optional space-separated string of `compactc` flags (e.g., "--skip-zk")
   */
  constructor(compilerFlags = '') {
    this.compilerFlags = compilerFlags;
  }

  /**
   * Executes the full build process: compiles .compact files first, then runs build steps.
   * Displays progress with spinners and outputs results in color.
   */
  public async build(): Promise<void> {
    const compiler = new CompactCompiler(this.compilerFlags);
    await compiler.compile();

    for (const [index, step] of this.steps.entries()) {
      await this.executeStep(step, index, this.steps.length);
    }
  }

  /**
   * Executes a single build step.
   * Runs the command, shows a spinner, and prints output with indentation.
   */
  private async executeStep(
    step: { cmd: string; msg: string; shell?: string },
    index: number,
    total: number,
  ): Promise<void> {
    const stepLabel: string = `[${index + 1}/${total}]`;
    const spinner: Ora = ora(`[BUILD] ${stepLabel} ${step.msg}`).start();

    try {
      const { stdout, stderr }: { stdout: string; stderr: string } =
        await execAsync(step.cmd, {
          shell: step.shell,
        });
      spinner.succeed(`[BUILD] ${stepLabel} ${step.msg}`);
      this.printOutput(stdout, chalk.cyan);
      this.printOutput(stderr, chalk.yellow);
    } catch (error: any) {
      spinner.fail(`[BUILD] ${stepLabel} ${step.msg}`);
      this.printOutput(error.stdout, chalk.cyan);
      this.printOutput(error.stderr, chalk.red);
      console.error(chalk.red('[BUILD] ❌ Build failed:', error.message));
      process.exit(1);
    }
  }

  /**
   * Prints command output with indentation and specified color.
   * Filters out empty lines and indents each line for readability.
   */
  private printOutput(
    output: string | undefined,
    colorFn: (text: string) => string,
  ): void {
    if (output) {
      const lines: string[] = output
        .split('\n')
        .filter((line: string): boolean => line.trim() !== '')
        .map((line: string): string => `    ${line}`);
      console.info(colorFn(lines.join('\n')));
    }
  }
}
