import { getFaucetUrl } from './config';

/**
 * Get the appropriate faucet URL based on environment
 * Uses proxy in development to avoid CORS issues
 */
export function getFaucetEndpoint(endpoint: string): string {
  const baseUrl = getFaucetUrl();

  // Check if we're in development by looking at the current hostname
  const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '8080';

  // In development, use proxy to avoid CORS issues
  if (isDevelopment) {
    return `/faucet${endpoint}`;
  }

  // In production, use direct URL
  return `${baseUrl}${endpoint}`;
}

/**
 * Check faucet health
 */
export async function checkFaucetHealth(logger?: {
  info?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}): Promise<boolean> {
  try {
    const response = await fetch(getFaucetEndpoint('/health'));
    return response.ok;
  } catch (error) {
    logger?.error?.('[Faucet] Health check failed', error);
    return false;
  }
}

/**
 * Request tokens from faucet with captcha token
 */
export async function requestFaucetTokens(
  address: string,
  captchaToken: string,
  logger?: {
    info?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  },
): Promise<boolean> {
  const endpoints = ['/api/request-tokens', '/request', '/api/request'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(getFaucetEndpoint(endpoint), {
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
