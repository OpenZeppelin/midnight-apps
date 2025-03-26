import {
  type CoinPublicKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { beforeEach, describe, expect, test } from 'vitest';
import * as MockAccessContract from '../artifacts/MockAccessControl/contract/index.cjs';
import type { RoleValue } from '../types';
import { MockAccessControlContract } from './mock/MockAccessControlContract';

let mockAccessControlContract: MockAccessControlContract;
let admin: CoinPublicKey;
let adminPkBytes: Uint8Array;

describe('AccessControl', () => {
  beforeEach(() => {
    // Fixing Admin address for testing purposes
    admin = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
    adminPkBytes = encodeCoinPublicKey(admin);
    mockAccessControlContract = new MockAccessControlContract(admin);
  });

  test('initialize', () => {
    const currentPublicState =
      mockAccessControlContract.getCurrentPublicState();
    const currentPrivateState =
      mockAccessControlContract.getCurrentPrivateState();

    const adminRoleCommitContract =
      MockAccessContract.pureCircuits.AccessControl_hashUserRole(
        { bytes: adminPkBytes },
        MockAccessContract.AccessControl_Role.Admin,
      );

    // const adminRoleHash = persistentHash<[AccessControlContract.Role]>(
    //   AccessControlContract.Role,
    //   [AccessControlContract.Role.Admin],
    // );
    //   const adminRoleCommitmt = persistentHash<[Uint8Array, Uint8Array]>(
    //     CompactTypeBytes.arguments,
    //     [adminPkBytes, adminRoleHash],
    //   );

    const actualAdminRoleValue =
      currentPrivateState.roles[adminRoleCommitContract.toString()];
    const expectedAdminRoleValue: RoleValue = {
      commitment: adminRoleCommitContract,
      index: 0n,
      role: MockAccessContract.AccessControl_Role.Admin,
    };

    // Check the hash calculation
    expect(actualAdminRoleValue).toEqual(expectedAdminRoleValue);

    const root = currentPublicState.accessControlRoleCommits.root();

    expect(
      !currentPublicState.accessControlRoleCommits.isFull(),
      'It is not full!',
    );
    expect(
      currentPublicState.accessControlRoleCommits.checkRoot(root),
      'Failed to check the root',
    );
  });

  test('grant role', () => {
    const lpUser = sampleCoinPublicKey();
    const notAuthorizedUser = sampleCoinPublicKey();

    // Failed test: Non Admin call!
    expect(() =>
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        notAuthorizedUser,
      ),
    ).toThrowError('AccessControl: Unauthorized user!');

    // Success test: Admin call!
    const circuitResult = mockAccessControlContract.grantRole(
      { bytes: encodeCoinPublicKey(lpUser) },
      MockAccessContract.AccessControl_Role.Lp,
      admin,
    );

    const lpRoleCommitContract =
      MockAccessContract.pureCircuits.AccessControl_hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      );

    const actualLpRoleValue =
      circuitResult.currentPrivateState.roles[lpRoleCommitContract.toString()];
    const expectedLpRoleValue: RoleValue = {
      role: MockAccessContract.AccessControl_Role.Lp,
      commitment: lpRoleCommitContract,
      index: 1n,
    };

    expect(actualLpRoleValue).toEqual(expectedLpRoleValue);

    // Fail test: Prevent double granting the same role to the same address!
    expect(() =>
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ),
    ).toThrowError('AccessControl: Role already granted!');
  });

  // TODO: Test concurrency for `grantRole()`
  test.concurrent('grant role concurrent 1', () => {});

  test.concurrent('grant role concurrent 2', () => {});

  //test('revoke role', () => {});
});
