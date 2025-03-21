import {
  type CoinPublicKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { beforeEach, describe, expect, test } from 'vitest';
import * as TestAccessControlContract from '..//artifacts/TestAccessControl/contract/index.cjs';
import type { RoleValue } from '../types';
import { circuitContext } from '../utils';
import { TestAccessControlMockContract } from './mock/AccessControlMockContract';

let testAccessControlMockContract: TestAccessControlMockContract;
let admin: CoinPublicKey;
let adminPkBytes: Uint8Array;

describe('AccessControl', () => {
  beforeEach(() => {
    // Fixing Admin address for testing purposes
    admin = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
    adminPkBytes = encodeCoinPublicKey(admin);
    testAccessControlMockContract = new TestAccessControlMockContract(admin);
  });

  test.skip('initialize', () => {
    const currentPublicState = testAccessControlMockContract.getCurrentLedger();
    const currentPrivateState =
      testAccessControlMockContract.getCurrentPrivateState();

    const adminRoleCommitContract =
      TestAccessControlContract.pureCircuits.hashUserRole(
        { bytes: adminPkBytes },
        TestAccessControlContract.Role.Admin,
      );

    // const adminRoleHash = persistentHash<[AccessControlContract.Role]>(
    //   AccessControlContract.Role,
    //   [AccessControlContract.Role.Admin],
    // );
    //   const adminRoleCommitmt = persistentHash<[Uint8Array, Uint8Array]>(
    //     CompactTypeBytes.arguments,
    //     [adminPkBytes, adminRoleHash],
    //   );

    const actualAdminRoleValue = currentPrivateState.roles[admin];
    const expectedAdminRoleValue: RoleValue = {
      role: TestAccessControlContract.Role.Admin,
      commitment: adminRoleCommitContract,
      index: 0n,
    };

    // Check the hash calculation
    expect(actualAdminRoleValue).toEqual(expectedAdminRoleValue);

    const root = currentPublicState.roleCommits.root();

    expect(!currentPublicState.roleCommits.isFull(), 'It is not full!');
    expect(
      currentPublicState.roleCommits.checkRoot(root),
      'Failed to check the root',
    );
  });

  test('add role', () => {
    const currentPrivateState =
      testAccessControlMockContract.getCurrentPrivateState();
    const currentContractState =
      testAccessControlMockContract.getCurrentContractState();

    const lpUser = sampleCoinPublicKey();
    const notAuthorizedUser = sampleCoinPublicKey();

    // Failed test: Non Admin call!
    expect(() =>
      testAccessControlMockContract.contract.circuits.testGrantRole(
        circuitContext(
          currentPrivateState,
          currentContractState,
          notAuthorizedUser,
          testAccessControlMockContract.contractAddress,
        ),
        { bytes: encodeCoinPublicKey(lpUser) },
        TestAccessControlContract.Role.Lp,
      ),
    ).toThrowError('RoleError: Unauthorized action!');

    // Success test: Admin call!
    const circuitResult =
      testAccessControlMockContract.contract.impureCircuits.testGrantRole(
        circuitContext(
          currentPrivateState,
          currentContractState,
          admin,
          testAccessControlMockContract.contractAddress,
        ),
        { bytes: encodeCoinPublicKey(lpUser) },
        TestAccessControlContract.Role.Lp,
      );

    const lpRoleCommitContract =
      TestAccessControlContract.pureCircuits.hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        TestAccessControlContract.Role.Lp,
      );

    const actualLpRoleValue =
      circuitResult.context.currentPrivateState.roles[
        lpRoleCommitContract.toString()
      ];
    const expectedLpRoleValue: RoleValue = {
      role: TestAccessControlContract.Role.Lp,
      commitment: lpRoleCommitContract,
      index: 1n,
    };

    expect(actualLpRoleValue).toEqual(expectedLpRoleValue);
  });

  test.concurrent('add role concurrent 1', () => {});

  test.concurrent('add role concurrent 2', () => {});

  //test('remove role', () => {});
});
