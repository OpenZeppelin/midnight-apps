/**
 * Get the appropriate faucet URL based on environment.
 * Uses proxy in development to avoid CORS issues.
 * @param endpoint - Path to append to the faucet base URL (e.g. '/health', '/api/request')
 * @param faucetBaseUrl - Base URL from active network config (e.g. activeNetwork.FAUCET_URL). When empty, faucet is disabled.
 */
export function getFaucetEndpoint(
  endpoint: string,
  faucetBaseUrl: string,
): string {
  if (!faucetBaseUrl) {
    return '';
  }

  // Check if we're in development by looking at the current hostname
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '8080');

  // In development, use proxy to avoid CORS issues
  if (isDevelopment) {
    return `/faucet${endpoint}`;
  }

  // In production, use direct URL
  return `${faucetBaseUrl}${endpoint}`;
}

/**
 * Check faucet health.
 * @param logger - Optional logger.
 * @param faucetBaseUrl - Base URL from runtime config (e.g. activeNetwork.FAUCET_URL). When empty, returns false (faucet disabled).
 */
export async function checkFaucetHealth(
  logger?: {
    info?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  },
  faucetBaseUrl?: string,
): Promise<boolean> {
  const url = getFaucetEndpoint('/health', faucetBaseUrl ?? '');
  if (!url) return false;
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    logger?.error?.('[Faucet] Health check failed', error);
    return false;
  }
}

/**
 * Request tokens from faucet with captcha token.
 * @param faucetBaseUrl - Base URL from runtime config (e.g. activeNetwork.FAUCET_URL). When empty, throws (faucet disabled).
 */
export async function requestFaucetTokens(
  address: string,
  captchaToken: string,
  logger?: {
    info?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  },
  faucetBaseUrl?: string,
): Promise<boolean> {
  const baseUrl = faucetBaseUrl ?? '';
  if (!baseUrl) {
    throw new Error('Faucet is not configured for this network.');
  }

  const endpoints = ['/api/request-tokens', '/request', '/api/request'];

  for (const endpoint of endpoints) {
    try {
      const url = getFaucetEndpoint(endpoint, baseUrl);
      if (!url) continue;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          captchaToken: captchaToken,
        }),
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      logger?.error?.(`[Faucet] Error with endpoint: ${endpoint}:`, error);
      // Try next endpoint
    }
  }

  throw new Error(
    'All faucet endpoints failed. Please check the faucet service status.',
  );
}
