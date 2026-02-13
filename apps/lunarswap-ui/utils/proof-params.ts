/**
 * Utility to download required proof parameters for lunarswap circuits
 */

const LUNARSWAP_K_VALUES = [18, 19, 14, 12, 11, 10, 15, 16, 17] as const;

interface DownloadParamsResult {
  success: boolean;
  downloaded: number[];
  failed: number[];
  errors: string[];
}

/**
 * Download all required public parameters for lunarswap circuits
 */
export async function downloadLunarswapProofParams(
  proofServerUrl = 'http://localhost:6300',
  logger?: {
    info?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  },
): Promise<DownloadParamsResult> {
  const result: DownloadParamsResult = {
    success: true,
    downloaded: [],
    failed: [],
    errors: [],
  };
  for (const k of LUNARSWAP_K_VALUES) {
    try {
      const response = await fetch(`${proofServerUrl}/fetch-params/${k}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        result.downloaded.push(k);
      } else {
        const errorText = await response.text();
        result.failed.push(k);
        result.errors.push(
          `k=${k}: ${response.status} ${response.statusText} - ${errorText}`,
        );
        result.success = false;
        logger?.error?.(
          `[downloadLunarswapProofParams] Failed to download parameters for k=${k}:`,
          errorText,
        );
      }
    } catch (error) {
      result.failed.push(k);
      result.errors.push(
        `k=${k}: ${error instanceof Error ? error.message : String(error)}`,
      );
      result.success = false;
      logger?.error?.(
        `[downloadLunarswapProofParams] Error downloading parameters for k=${k}:`,
        error,
      );
    }
  }
  return result;
}

/**
 * Check if parameters are already downloaded (optional optimization)
 */
export async function checkProofParamsStatus(
  proofServerUrl = 'http://localhost:6300',
  logger?: {
    info?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  },
): Promise<{ [k: number]: boolean }> {
  const status: { [k: number]: boolean } = {};

  for (const k of LUNARSWAP_K_VALUES) {
    try {
      // Try to use the parameters - if they're not available, this will fail
      const response = await fetch(`${proofServerUrl}/prove-tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Minimal test payload
          circuit_id: `test_k${k}`,
          public_inputs: [],
          private_inputs: [],
        }),
      });

      // If we get a specific error about missing parameters, they're not downloaded
      if (response.status === 400) {
        const errorText = await response.text();
        status[k] = !errorText.includes(`k=${k} not found in cache`);
        logger?.error?.(
          `[checkProofParamsStatus] Parameters for k=${k} not found in cache:`,
          errorText,
        );
      } else {
        status[k] = true; // Assume available if no specific error
      }
    } catch (error) {
      status[k] = false;
      logger?.error?.(
        `[checkProofParamsStatus] Error checking parameters for k=${k}:`,
        error,
      );
    }
  }

  return status;
}

/**
 * Smart parameter download - only download missing parameters
 */
export async function ensureLunarswapProofParams(
  proofServerUrl = 'http://localhost:6300',
  logger?: {
    info?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  },
): Promise<DownloadParamsResult> {
  // Check which parameters are already available
  //const status = await checkProofParamsStatus(proofServerUrl);
  const missingParams = LUNARSWAP_K_VALUES;

  // Download only missing parameters
  const result: DownloadParamsResult = {
    success: true,
    downloaded: [],
    failed: [],
    errors: [],
  };

  for (const k of missingParams) {
    try {
      const response = await fetch(`${proofServerUrl}/fetch-params/${k}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        result.downloaded.push(k);
      } else {
        const errorText = await response.text();
        result.failed.push(k);
        result.errors.push(
          `k=${k}: ${response.status} ${response.statusText} - ${errorText}`,
        );
        result.success = false;
        logger?.error?.(
          `[ensureLunarswapProofParams] Failed to download parameters for k=${k}:`,
          errorText,
        );
      }
    } catch (error) {
      result.failed.push(k);
      result.errors.push(
        `k=${k}: ${error instanceof Error ? error.message : String(error)}`,
      );
      result.success = false;
      logger?.error?.(
        `[ensureLunarswapProofParams] Error downloading parameters for k=${k}:`,
        error,
      );
    }
  }

  return result;
}
