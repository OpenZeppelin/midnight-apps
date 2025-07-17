import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the native token identifier hash
 * This matches the pattern used in the example script
 */
export function nativeToken(): string {
  return '02000000000000000000000000000000000000000000000000000000000000000000';
}

/**
 * Serializes bigint values in an object to strings for JSON serialization
 * This matches the pattern used in the example script
 */
export function serializeBigInts(obj: Record<string, unknown>): Record<string, unknown> {
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
