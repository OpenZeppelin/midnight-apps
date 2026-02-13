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
      (_logger as { info?: (msg: unknown) => void })?.info?.(
        `[${operationName}] Attempt ${retryCount + 1} of ${retries + 1}`,
      );
      operation()
        .then((result) => {
          if (isRetry) {
            (_logger as { info?: (msg: unknown) => void })?.info?.(
              `[${operationName}] Operation succeeded after retries.`,
            );
          }
          resolve(result);
        })
        .catch((error) => {
          (
            _logger as { error?: (msg: unknown, err?: unknown) => void }
          )?.error?.(
            `[${operationName}] Operation failed: ${error instanceof Error ? error.message : String(error)}`,
            error,
          );

          if (retryCount <= 0) {
            (
              _logger as { error?: (msg: unknown, err?: unknown) => void }
            )?.error?.(`[${operationName}] All retries exhausted. Rejecting.`);
            reject(error);
          } else {
            (_logger as { info?: (msg: unknown) => void })?.info?.(
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
