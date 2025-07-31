/**
 * Retries a promise-returning operation with exponential backoff.
 * Useful for network or async operations that may fail transiently.
 */
export function retry<T>(
  operation: () => Promise<T>, // The promise-returning operation
  operationName: string, // Name of the operation for logging
  _logger: unknown, // Logger parameter is ignored, kept for compatibility
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
      console.log(
        `[${operationName}] Attempt ${retryCount + 1} of ${retries + 1}`,
      );
      operation()
        .then((result) => {
          if (isRetry) {
            console.log(
              `[${operationName}] Operation succeeded after retries.`,
            );
          }
          resolve(result);
        })
        .catch((error) => {
          console.error(
            `[${operationName}] Operation failed: ${error.message}`,
          );

          if (retryCount <= 0) {
            console.error(
              `[${operationName}] All retries exhausted. Rejecting.`,
            );
            reject(error);
          } else {
            console.log(
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
