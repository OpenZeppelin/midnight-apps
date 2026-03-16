import { encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import { AccessControl_Role } from '@src/artifacts/access/test/mocks/contracts/AccessControl.mock/contract/index.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccessControlSimulator } from './mocks/AccessControlSimulator.js';
import type { RoleValue } from './mocks/witnesses/AccessControl.js';

let simulator: AccessControlSimulator;
let admin: string;
let adminPkBytes: Uint8Array;

const setup = () => {
  admin = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
  adminPkBytes = encodeCoinPublicKey(admin);
  simulator = new AccessControlSimulator(admin);
};

describe('AccessControl', () => {
  beforeEach(setup);

  describe('Initialize', () => {
    it('should initialize with admin role', () => {
      const publicState = simulator.getPublicState();
      const privateState = simulator.getPrivateState();
      const adminRoleCommit = simulator.hashUserRole(
        { bytes: adminPkBytes },
        AccessControl_Role.Admin,
      );
      const expectedAdminRole: RoleValue = {
        commitment: adminRoleCommit,
        index: 0n,
        role: AccessControl_Role.Admin,
      };

      expect(
        privateState.roles[Buffer.from(adminRoleCommit).toString('hex')],
      ).toEqual(expectedAdminRole);
      expect(publicState.AccessControl_isInitialized).toBe(true);
      expect(
        publicState.AccessControl_roleCommits.checkRoot(
          publicState.AccessControl_roleCommits.root(),
        ),
      ).toBe(true);
    });

    it('should have valid root after initialization', () => {
      const publicState = simulator.getPublicState();
      const root = publicState.AccessControl_roleCommits.root();
      expect(publicState.AccessControl_roleCommits.checkRoot(root)).toBe(true);
    });

    it('should not have full tree after initialization', () => {
      const publicState = simulator.getPublicState();
      expect(publicState.AccessControl_roleCommits.isFull()).toBe(false);
    });
  });

  describe('Grant Role', () => {
    it('should grant role to user by admin', () => {
      const lpUser = sampleCoinPublicKey();
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControl_Role.Lp,
      );

      const lpRoleCommit = simulator.hashUserRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControl_Role.Lp,
      );
      const privateState = simulator.getPrivateState();
      const expectedLpRole: RoleValue = {
        role: AccessControl_Role.Lp,
        commitment: lpRoleCommit,
        index: 1n,
      };

      expect(
        privateState.roles[Buffer.from(lpRoleCommit).toString('hex')],
      ).toEqual(expectedLpRole);
    });

    it('should fail when non-admin calls grantRole', () => {
      const lpUser = sampleCoinPublicKey();
      const notAuthorizedUser = sampleCoinPublicKey();

      // Use as() to simulate a non-admin caller
      expect(() =>
        simulator
          .as(notAuthorizedUser)
          .grantRole(
            { bytes: encodeCoinPublicKey(lpUser) },
            AccessControl_Role.Lp,
          ),
      ).toThrowError('AccessControl: Unauthorized user!');
    });

    it('should fail when granting duplicate role', () => {
      const lpUser = sampleCoinPublicKey();
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControl_Role.Lp,
      );
      expect(() =>
        simulator.grantRole(
          { bytes: encodeCoinPublicKey(lpUser) },
          AccessControl_Role.Lp,
        ),
      ).toThrowError('AccessControl: Role already granted!');
    });

    it('should increment index after granting role', () => {
      const lpUser = sampleCoinPublicKey();
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(lpUser) },
        AccessControl_Role.Lp,
      );
      const publicState = simulator.getPublicState();
      expect(publicState.AccessControl_index).toBe(2n); // 0 from init, 1 from grant
    });

    it('should fail when role tree is full', () => {
      for (let i = 0; i < 1023; i++) {
        const user = sampleCoinPublicKey();
        simulator.grantRole(
          { bytes: encodeCoinPublicKey(user) },
          AccessControl_Role.Lp,
        );
      }
      const lastUser = sampleCoinPublicKey();
      expect(() =>
        simulator.grantRole(
          { bytes: encodeCoinPublicKey(lastUser) },
          AccessControl_Role.Lp,
        ),
      ).toThrowError('AccessControl: Role commitments tree is full!');
    }, 60000); // 60s timeout

    it('should handle concurrent grants to unique users', async () => {
      const user1 = sampleCoinPublicKey();
      const user2 = sampleCoinPublicKey();

      simulator.grantRole(
        { bytes: encodeCoinPublicKey(user1) },
        AccessControl_Role.Lp,
      );
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(user2) },
        AccessControl_Role.Trader,
      );

      const privateState = simulator.getPrivateState();
      expect(Object.keys(privateState.roles).length).toBe(3); // Admin + 2 new roles
    });

    it('should grant None role', () => {
      const user = sampleCoinPublicKey();
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControl_Role.None,
      );

      const noneRoleCommit = simulator.hashUserRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControl_Role.None,
      );
      const privateState = simulator.getPrivateState();
      const expectedNoneRole: RoleValue = {
        role: AccessControl_Role.None,
        commitment: noneRoleCommit,
        index: 1n,
      };

      expect(
        privateState.roles[Buffer.from(noneRoleCommit).toString('hex')],
      ).toEqual(expectedNoneRole);
    });

    it('should grant multiple roles to same user', () => {
      const user = sampleCoinPublicKey();
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControl_Role.Lp,
      );
      simulator.grantRole(
        { bytes: encodeCoinPublicKey(user) },
        AccessControl_Role.Trader,
      );
      const privateState = simulator.getPrivateState();
      expect(Object.keys(privateState.roles).length).toBe(3); // Admin + Lp + Trader
    });
  });
});
