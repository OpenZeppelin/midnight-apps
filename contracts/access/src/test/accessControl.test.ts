import {
  type CoinPublicKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { beforeEach, describe, expect, test } from 'vitest';
import { pureCircuits } from '../artifacts/AccessControl.mock/contract/index.cjs';
import { AccessControlRole } from '../types/ledger';
import type { RoleValue } from '../types/role';
import { AccessControlSimulator } from './AccessControlSimulator';

let mockAccessControlContract: AccessControlSimulator;
let admin: CoinPublicKey;
let adminPkBytes: Uint8Array;

const setup = () => {
  admin = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
  adminPkBytes = encodeCoinPublicKey(admin);
  mockAccessControlContract = new AccessControlSimulator(admin);
};

describe('AccessControl', () => {
  beforeEach(setup);

  describe('Initialize', () => {
    test('should initialize with admin role', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      const privateState = mockAccessControlContract.getCurrentPrivateState();
      const adminRoleCommit = pureCircuits.AccessControl_hashUserRole(
        { bytes: adminPkBytes },
        AccessControlRole.Admin,
      );
      const expectedAdminRole: RoleValue = {
        commitment: adminRoleCommit,
        index: 0n,
        role: AccessControlRole.Admin,
      };

      expect(privateState.roles[adminRoleCommit.toString()]).toEqual(
        expectedAdminRole,
      );
      expect(publicState.AccessControl_isInitialized).toBe(true);
      expect(
        publicState.AccessControl_roleCommits.checkRoot(
          publicState.AccessControl_roleCommits.root(),
        ),
      ).toBe(true);
    });

    test('should have valid root after initialization', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      const root = publicState.AccessControl_roleCommits.root();
      expect(publicState.AccessControl_roleCommits.checkRoot(root)).toBe(true);
    });

    test('should not have full tree after initialization', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      expect(publicState.AccessControl_roleCommits.isFull()).toBe(false);
    });
  });

  describe('Grant Role', () => {
    test('should grant role to user by admin', () => {
      const lpUser = sampleCoinPublicKey();
      const circuitResult = mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControlRole.Lp,
        admin,
      );
      const lpRoleCommit = pureCircuits.AccessControl_hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControlRole.Lp,
      );
      const expectedLpRole: RoleValue = {
        role: AccessControlRole.Lp,
        commitment: lpRoleCommit,
        index: 1n,
      };

      expect(
        circuitResult.currentPrivateState.roles[lpRoleCommit.toString()],
      ).toEqual(expectedLpRole);
    });

    test('should fail when non-admin calls grantRole', () => {
      const lpUser = sampleCoinPublicKey();
      const notAuthorizedUser = sampleCoinPublicKey();
      expect(() =>
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          AccessControlRole.Lp,
          notAuthorizedUser,
        ),
      ).toThrowError('AccessControl: Unauthorized user!');
    });

    test('should fail when granting duplicate role', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControlRole.Lp,
        admin,
      );
      expect(() =>
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          AccessControlRole.Lp,
          admin,
        ),
      ).toThrowError('AccessControl: Role already granted!');
    });

    test('should increment index after granting role', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControlRole.Lp,
        admin,
      );
      const publicState = mockAccessControlContract.getCurrentPublicState();
      expect(publicState.AccessControl_index).toBe(2n); // 0 from init, 1 from grant
    });

    test('should fail when role tree is full', () => {
      for (let i = 0; i < 1023; i++) {
        const user = sampleCoinPublicKey();
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(user) },
          AccessControlRole.Lp,
          admin,
        );
      }
      const lastUser = sampleCoinPublicKey();
      expect(() =>
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(lastUser) },
          AccessControlRole.Lp,
          admin,
        ),
      ).toThrowError('AccessControl: Role commitments tree is full!');
    }, 60000); // 60s timeout

    test.concurrent(
      'should handle concurrent grants to unique users',
      async () => {
        const user1 = sampleCoinPublicKey();
        const user2 = sampleCoinPublicKey();
        await Promise.all([
          mockAccessControlContract.grantRole(
            { bytes: encodeCoinPublicKey(user1) },
            AccessControlRole.Lp,
            admin,
          ),
          mockAccessControlContract.grantRole(
            { bytes: encodeCoinPublicKey(user2) },
            AccessControlRole.Trader,
            admin,
          ),
        ]);
        const privateState = mockAccessControlContract.getCurrentPrivateState();
        expect(Object.keys(privateState.roles).length).toBe(3); // Admin + 2 new roles
      },
    );

    test('should grant None role', () => {
      const user = sampleCoinPublicKey();
      const circuitResult = mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControlRole.None,
        admin,
      );
      const noneRoleCommit = pureCircuits.AccessControl_hashUserRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControlRole.None,
      );
      const expectedNoneRole: RoleValue = {
        role: AccessControlRole.None,
        commitment: noneRoleCommit,
        index: 1n,
      };
      expect(
        circuitResult.currentPrivateState.roles[noneRoleCommit.toString()],
      ).toEqual(expectedNoneRole);
    });

    test('should grant multiple roles to same user', () => {
      const user = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControlRole.Lp,
        admin,
      );
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControlRole.Trader,
        admin,
      );
      const privateState = mockAccessControlContract.getCurrentPrivateState();
      expect(Object.keys(privateState.roles).length).toBe(3); // Admin + Lp + Trader
    });
  });
});
