import type * as Contract from '../artifacts/MockAccessControl/contract/index.cjs';

export const maybeFromNullable = <T>(
  nullable: T | null | undefined,
  emptyT: T,
): Contract.Maybe<T> => {
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
