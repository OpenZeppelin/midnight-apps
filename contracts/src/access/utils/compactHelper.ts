import type { Maybe } from '../../types/StandardLibrary.js';

/**
 * @description Converts a nullable value into a Maybe type, providing a default empty value if null or undefined.
 * @template T - The type of the value being converted.
 * @param nullable - The value to convert, which may be null or undefined.
 * @param emptyT - The default value to use when nullable is null or undefined.
 * @returns A Maybe<T> object representing either Some(value) or None with the empty value.
 * @todo  TODO: Move this utility to a generic package for broader reuse across contracts.
 */
export const maybeFromNullable = <T>(
  nullable: T | null | undefined,
  emptyT: T,
): Maybe<T> => {
  return nullable !== null && nullable !== undefined
    ? {
        is_some: true,
        value: nullable,
      }
    : {
        is_some: false,
        value: emptyT,
      };
};
