import type { Logger } from 'pino';

/**
 * Retries a promise-returning operation with exponential backoff.
 * Useful for network or async operations that may fail transiently.
 */
export function retry<T>(
  operation: () => Promise<T>, // The promise-returning operation
  operationName: string, // Name of the operation for logging
  logger: Logger,
  retries = 10, // Number of retries
  delay = 500, // Initial delay in milliseconds
  backoffFactor = 1.2, // Backoff factor
  maxDelay = 30000, // Maximum delay in milliseconds
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt: (
      retryCount: number,
      currentDelay: number,
      isRetry: boolean,
    ) => void = (
      retryCount: number,
      currentDelay: number,
      isRetry: boolean,
    ) => {
      operation()
        .then((result) => {
          if (isRetry) {
            logger.info(
              `[${operationName}] Operation succeeded after retries.`,
            );
          }
          resolve(result);
        })
        .catch((error) => {
          logger.error(`[${operationName}] Operation failed: ${error.message}`);

          if (retryCount <= 0) {
            logger.error(
              `[${operationName}] All retries exhausted. Rejecting.`,
            );
            reject(error);
          } else {
            logger.info(
              `[${operationName}] Retrying operation in ${currentDelay}ms...`,
            );
            setTimeout(() => {
              const nextDelay = Math.min(
                currentDelay * backoffFactor,
                maxDelay,
              );
              attempt(retryCount - 1, nextDelay, true);
            }, currentDelay);
          }
        });
    };

    // Start the first attempt (not considered a retry initially)
    attempt(retries, delay, false);
  });
} 