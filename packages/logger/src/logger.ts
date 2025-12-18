import pino from 'pino';

let singletonLogger: pino.Logger | null = null;

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  level?: pino.LevelWithSilent;
  browser?: {
    asObject?: boolean;
    serialize?: boolean;
  };
  transport?: pino.TransportSingleOptions | pino.TransportMultiOptions;
}

/**
 * Get or create the singleton logger instance
 *
 * Logger is silent by default (no output). To enable logging, pass options on first call:
 *
 * @example
 * ```typescript
 * // Silent by default
 * const logger = getLogger();
 *
 * // Enable with specific level
 * const logger = getLogger({ level: 'info' });
 * ```
 *
 * @param options - Optional configuration for the logger (only used on first initialization)
 * @returns The singleton logger instance
 */
export function getLogger(options?: LoggerOptions): pino.Logger {
  if (!singletonLogger) {
    const defaultOptions: LoggerOptions = {
      level: 'silent',
      browser: { asObject: true },
    };

    singletonLogger = pino({
      ...defaultOptions,
      ...options,
    });
  }
  return singletonLogger;
}

/**
 * Reset the singleton logger instance (useful for testing)
 */
export function resetLogger(): void {
  singletonLogger = null;
}

/**
 * Check if the logger has been initialized
 */
export function isLoggerInitialized(): boolean {
  return singletonLogger !== null;
}
