import {
  type CoinPublicKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { beforeEach, describe, expect, test } from 'vitest';
import { AccessControl_Role } from '../artifacts/Index/contract/index.cjs';
import { pureCircuits } from '../artifacts/MockAccessControl/contract/index.cjs';
import type { RoleValue } from '../types';
import { AccessControlContractSimulator } from './AccessControlContractSimulator';

let mockAccessControlContract: AccessControlContractSimulator;
let admin: CoinPublicKey;
let adminPkBytes: Uint8Array;

const setup = () => {
  admin = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
  adminPkBytes = encodeCoinPublicKey(admin);
  mockAccessControlContract = new AccessControlContractSimulator(admin);
};

describe('AccessControl', () => {
  beforeEach(setup);

  describe('Initialize', () => {
    test('should initialize with admin role', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      const privateState = mockAccessControlContract.getCurrentPrivateState();
      const adminRoleCommit = pureCircuits.AccessControl_hashUserRole(
        { bytes: adminPkBytes },
        AccessControl_Role.Admin,
      );
      const expectedAdminRole: RoleValue = {
        commitment: adminRoleCommit,
        index: 0n,
        role: AccessControl_Role.Admin,
      };

      expect(privateState.roles[adminRoleCommit.toString()]).toEqual(
        expectedAdminRole,
      );
      expect(publicState.accessControlIsInitialized).toBe(true);
      expect(
        publicState.accessControlRoleCommits.checkRoot(
          publicState.accessControlRoleCommits.root(),
        ),
      ).toBe(true);
    });

    test('should have valid root after initialization', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      const root = publicState.accessControlRoleCommits.root();
      expect(publicState.accessControlRoleCommits.checkRoot(root)).toBe(true);
    });

    test('should not have full tree after initialization', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      expect(publicState.accessControlRoleCommits.isFull()).toBe(false);
    });
  });

  describe('Grant Role', () => {
    test('should grant role to user by admin', () => {
      const lpUser = sampleCoinPublicKey();
      const circuitResult = mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      );
      const lpRoleCommit = MockAccessContract.pureCircuits.hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      );
      const expectedLpRole: RoleValue = {
        role: MockAccessContract.AccessControl_Role.Lp,
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
          MockAccessContract.AccessControl_Role.Lp,
          notAuthorizedUser,
        ),
      ).toThrowError('AccessControl: Unauthorized user!');
    });

    test('should fail when granting duplicate role', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      );
      expect(() =>
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          MockAccessContract.AccessControl_Role.Lp,
          admin,
        ),
      ).toThrowError('AccessControl: Role already granted!');
    });

    test('should increment index after granting role', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      );
      const publicState = mockAccessControlContract.getCurrentPublicState();
      expect(publicState.accessControlIndex).toBe(2n); // 0 from init, 1 from grant
    });

    test('should fail when role tree is full', () => {
      for (let i = 0; i < 1023; i++) {
        const user = sampleCoinPublicKey();
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(user) },
          MockAccessContract.AccessControl_Role.Lp,
          admin,
        );
      }
      const lastUser = sampleCoinPublicKey();
      expect(() =>
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(lastUser) },
          MockAccessContract.AccessControl_Role.Lp,
          admin,
        ),
      ).toThrowError('AccessControl: Role commitments tree is full!');
    }, 15000); // 15s timeout

    test.concurrent(
      'should handle concurrent grants to unique users',
      async () => {
        const user1 = sampleCoinPublicKey();
        const user2 = sampleCoinPublicKey();
        await Promise.all([
          mockAccessControlContract.grantRole(
            { bytes: encodeCoinPublicKey(user1) },
            MockAccessContract.AccessControl_Role.Lp,
            admin,
          ),
          mockAccessControlContract.grantRole(
            { bytes: encodeCoinPublicKey(user2) },
            MockAccessContract.AccessControl_Role.Trader,
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
        MockAccessContract.AccessControl_Role.None,
        admin,
      );
      const noneRoleCommit = MockAccessContract.pureCircuits.hashUserRole(
        { bytes: encodeCoinPublicKey(user) },
        MockAccessContract.AccessControl_Role.None,
      );
      const expectedNoneRole: RoleValue = {
        role: MockAccessContract.AccessControl_Role.None,
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
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      );
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        MockAccessContract.AccessControl_Role.Trader,
        admin,
      );
      const privateState = mockAccessControlContract.getCurrentPrivateState();
      expect(Object.keys(privateState.roles).length).toBe(3); // Admin + Lp + Trader
    });
  });
});
