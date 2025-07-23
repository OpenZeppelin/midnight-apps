export function serializeBigInts(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'bigint') {
      result[key] = value.toString();
    } else if (typeof value === 'object' && value !== null) {
      result[key] = serializeBigInts(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
