import {
  type CoinPublicKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { beforeEach, describe, expect, test } from 'vitest';
import * as MockAccessContract from '../artifacts/MockAccessControl/contract/index.cjs';
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
      const adminRoleCommit = MockAccessContract.pureCircuits.hashUserRole(
        { bytes: adminPkBytes },
        MockAccessContract.AccessControl_Role.Admin,
      );
      const expectedAdminRole: RoleValue = {
        commitment: adminRoleCommit,
        index: 0n,
        role: MockAccessContract.AccessControl_Role.Admin,
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
      expect(
        publicState.accessControlRoleCommits.checkRoot(
          publicState.accessControlRoleCommits.root(),
        ),
      ).toBe(true);
    });

    test('should not have full tree after initialization', () => {
      const publicState = mockAccessControlContract.getCurrentPublicState();
      expect(publicState.accessControlRoleCommits.isFull()).toBe(false);
    });
  });

  describe('Grant Role', () => {
    test('should grant role with empty queue using index', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
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
      const privateState = mockAccessControlContract.getCurrentPrivateState();
      expect(privateState.roles[lpRoleCommit.toString()]).toEqual(
        expectedLpRole,
      );
      expect(
        mockAccessControlContract.getCurrentPublicState().accessControlIndex,
      ).toBe(2n);
    });

    test('should fail when non-admin calls grantRole', () => {
      const lpUser = sampleCoinPublicKey();
      const notAdmin = sampleCoinPublicKey();
      expect(() =>
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          MockAccessContract.AccessControl_Role.Lp,
          notAdmin,
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

    test.runIf(process.env.LONG_TESTS)(
      'should fail when role tree is full and queue is empty',
      () => {
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
      },
      150000,
    );

    test('should reuse index from queue when not empty', () => {
      const user1 = sampleCoinPublicKey();
      const user2 = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user1) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ); // index 1
      mockAccessControlContract.revokeRole(
        { bytes: encodeCoinPublicKey(user1) },
        MockAccessContract.AccessControl_Role.Lp,
        1n,
        admin,
      ); // queue: [1]
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user2) },
        MockAccessContract.AccessControl_Role.Trader,
        admin,
      ); // reuses index 1
      const traderRoleCommit = MockAccessContract.pureCircuits.hashUserRole(
        { bytes: encodeCoinPublicKey(user2) },
        MockAccessContract.AccessControl_Role.Trader,
      );
      const expectedTraderRole: RoleValue = {
        role: MockAccessContract.AccessControl_Role.Trader,
        commitment: traderRoleCommit,
        index: 1n,
      };
      expect(
        mockAccessControlContract.getCurrentPrivateState().roles[
          traderRoleCommit.toString()
        ],
      ).toEqual(expectedTraderRole);
    });

    test.runIf(process.env.LONG_TESTS)(
      'should grant role when tree is full but queue has index',
      () => {
        // 1022 including the admin in 0 will be 1023;
        for (let i = 0; i < 1022; i++) {
          const user = sampleCoinPublicKey();
          mockAccessControlContract.grantRole(
            { bytes: encodeCoinPublicKey(user) },
            MockAccessContract.AccessControl_Role.Lp,
            admin,
          );
        }
        const userToRevoke = sampleCoinPublicKey();
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(userToRevoke) },
          MockAccessContract.AccessControl_Role.Lp,
          admin,
        ); // Fills tree (1024)
        mockAccessControlContract.revokeRole(
          { bytes: encodeCoinPublicKey(userToRevoke) },
          MockAccessContract.AccessControl_Role.Lp,
          1023n,
          admin,
        ); // Queue: [1023]
        const newUser = sampleCoinPublicKey();
        mockAccessControlContract.grantRole(
          { bytes: encodeCoinPublicKey(newUser) },
          MockAccessContract.AccessControl_Role.Trader,
          admin,
        ); // Reuses 1023
        const traderRoleCommit = MockAccessContract.pureCircuits.hashUserRole(
          { bytes: encodeCoinPublicKey(newUser) },
          MockAccessContract.AccessControl_Role.Trader,
        );
        expect(
          mockAccessControlContract.getCurrentPrivateState().roles[
            traderRoleCommit.toString()
          ].index,
        ).toBe(1023n);
      },
      150000,
    );
  });

  describe('Revoke Role', () => {
    test('should revoke role and add index to queue', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ); // index 1
      const lpRoleCommit = MockAccessContract.pureCircuits.hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
      );
      mockAccessControlContract.revokeRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        1n,
        admin,
      );
      expect(
        Object.keys(mockAccessControlContract.getCurrentPrivateState().roles),
      ).not.toContain(lpRoleCommit.toString());
      // Queue check not directly accessible, but next grant will test reuse
    });

    test('should fail when non-admin calls revokeRole', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      );
      const notAdmin = sampleCoinPublicKey();
      expect(() =>
        mockAccessControlContract.revokeRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          MockAccessContract.AccessControl_Role.Lp,
          1n,
          notAdmin,
        ),
      ).toThrowError('AccessControl: Unauthorized user!');
    });

    test('should fail when revoking non-existent role', () => {
      const user = sampleCoinPublicKey();
      expect(() =>
        mockAccessControlContract.revokeRole(
          { bytes: encodeCoinPublicKey(user) },
          MockAccessContract.AccessControl_Role.Lp,
          1n,
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

    test('should fail when revoking with wrong index', () => {
      const lpUser = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ); // index 1
      expect(() =>
        mockAccessControlContract.revokeRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          MockAccessContract.AccessControl_Role.Lp,
          2n, // Wrong index
          admin,
        ),
      ).toThrowError('AccessControl: User does not have a role!'); // Path check fails
    });

    test('should handle multiple revocations and reuse indices', () => {
      const user1 = sampleCoinPublicKey();
      const user2 = sampleCoinPublicKey();
      const user3 = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user1) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ); // index 1
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user2) },
        MockAccessContract.AccessControl_Role.Trader,
        admin,
      ); // index 2
      mockAccessControlContract.revokeRole(
        { bytes: encodeCoinPublicKey(user1) },
        MockAccessContract.AccessControl_Role.Lp,
        1n,
        admin,
      ); // Queue: [1]
      mockAccessControlContract.revokeRole(
        { bytes: encodeCoinPublicKey(user2) },
        MockAccessContract.AccessControl_Role.Trader,
        2n,
        admin,
      ); // Queue: [1, 2]
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user3) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ); // Reuses 1
      const user3RoleCommit = MockAccessContract.pureCircuits.hashUserRole(
        { bytes: encodeCoinPublicKey(user3) },
        MockAccessContract.AccessControl_Role.Lp,
      );
      expect(
        mockAccessControlContract.getCurrentPrivateState().roles[
          user3RoleCommit.toString()
        ].index,
      ).toBe(1n);
    });

    test('should not affect index counter when reusing queue', () => {
      const user1 = sampleCoinPublicKey();
      const user2 = sampleCoinPublicKey();
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user1) },
        MockAccessContract.AccessControl_Role.Lp,
        admin,
      ); // index 1
      mockAccessControlContract.revokeRole(
        { bytes: encodeCoinPublicKey(user1) },
        MockAccessContract.AccessControl_Role.Lp,
        1n,
        admin,
      ); // Queue: [1]
      const initialIndex =
        mockAccessControlContract.getCurrentPublicState().accessControlIndex;
      mockAccessControlContract.grantRole(
        { bytes: encodeCoinPublicKey(user2) },
        MockAccessContract.AccessControl_Role.Trader,
        admin,
      ); // Reuses 1
      expect(
        mockAccessControlContract.getCurrentPublicState().accessControlIndex,
      ).toBe(initialIndex); // No increment
    });
  });
});
