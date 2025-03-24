import {
  type CoinPublicKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { beforeEach, describe, expect, test } from 'vitest';
import * as MockAccessContract from '../artifacts/MockAccessControl/contract/index.cjs';
import type { RoleValue } from '../types';
import { MockAccessControlContract } from './mock/AccessControlMockContract';
import { useCircuitContextSender } from '../utils/test';

let testAccessControlMockContract: MockAccessControlContract;
let admin: CoinPublicKey;
let adminPkBytes: Uint8Array;

describe('AccessControl', () => {
  beforeEach(() => {
    // Fixing Admin address for testing purposes
    admin = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
    adminPkBytes = encodeCoinPublicKey(admin);
    testAccessControlMockContract = new MockAccessControlContract(admin);
  });

  test('initialize', () => {
    const currentPublicState = testAccessControlMockContract.getCurrentLedger();
    const currentPrivateState =
      testAccessControlMockContract.getCurrentPrivateState();

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

    const actualAdminRoleValue = currentPrivateState.roles[adminRoleCommitContract.toString()];
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
      testAccessControlMockContract.contract.circuits.grantRole(
        useCircuitContextSender(
          testAccessControlMockContract,
          notAuthorizedUser,
        ),
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      ),
    ).toThrowError('AccessControl: Unauthorized user!');

    // Success test: Admin call!
    const circuitResult =
      testAccessControlMockContract.contract.impureCircuits.grantRole(
        useCircuitContextSender(testAccessControlMockContract, admin),
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      );

    const lpRoleCommitContract =
      MockAccessContract.pureCircuits.AccessControl_hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      );

    const actualLpRoleValue =
      circuitResult.context.currentPrivateState.roles[
        lpRoleCommitContract.toString()
      ];
    const expectedLpRoleValue: RoleValue = {
      role: MockAccessContract.AccessControl_Role.Lp,
      commitment: lpRoleCommitContract,
      index: 1n,
    };

    expect(actualLpRoleValue).toEqual(expectedLpRoleValue);

    // Fail test: Prevent double granting the same role to the same address!
    expect(() =>
      testAccessControlMockContract.contract.impureCircuits.grantRole(
        useCircuitContextSender(testAccessControlMockContract, admin),
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      ),
    ).toThrowError('AccessControl: Role already granted!');
  });

  // TODO: Test concurrency for `grantRole()`
  test.concurrent('grant role concurrent 1', () => {});

  test.concurrent('grant role concurrent 2', () => {});

  //test('revoke role', () => {});
});
