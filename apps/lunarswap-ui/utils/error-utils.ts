/**
 * Serialize an error to a full string for logging: message, stack, cause chain,
 * and any enumerable properties (e.g. response body from proof server).
 */
export function serializeError(error: unknown): string {
  const parts: string[] = [];

  function walk(err: unknown, depth: number): void {
    if (depth > 10) return; // avoid infinite cause chains
    const indent = '  '.repeat(depth);
    if (err instanceof Error) {
      parts.push(`${indent}message: ${err.message}`);
      if (err.stack) parts.push(`${indent}stack:\n${err.stack}`);
      // Log enumerable own properties (e.g. response, statusCode, body)
      const keys = Object.keys(err) as (keyof Error)[];
      for (const k of keys) {
        if (k === 'message' || k === 'stack' || k === 'cause') continue;
        try {
          const v = (err as unknown as Record<string, unknown>)[k];
          if (v !== undefined)
            parts.push(
              `${indent}${String(k)}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`,
            );
        } catch {
          parts.push(`${indent}${String(k)}: [unserializable]`);
        }
      }
      if (err.cause !== undefined) {
        parts.push(`${indent}cause:`);
        walk(err.cause, depth + 1);
      }
    } else {
      parts.push(`${indent}${String(err)}`);
    }
  }

  walk(error, 0);
  return parts.join('\n');
}
