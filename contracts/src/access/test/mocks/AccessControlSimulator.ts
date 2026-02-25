import type { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import { encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  type AccessControl_Role,
  ledger,
  Contract as MockAccessControl,
  pureCircuits,
  type ZswapCoinPublicKey,
} from '@src/artifacts/access/test/mocks/contracts/AccessControl.mock/contract/index.js';
import {
  AccessContractPrivateState,
  AccessControlWitnesses,
} from './witnesses/AccessControl.js';

type AccessControlArgs = readonly [{ bytes: Uint8Array }];

/**
 * Base simulator for AccessControl contract
 */
const AccessControlSimulatorBase = createSimulator<
  AccessContractPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof AccessControlWitnesses>,
  MockAccessControl<AccessContractPrivateState>,
  AccessControlArgs
>({
  contractFactory: (witnesses) =>
    new MockAccessControl<AccessContractPrivateState>(witnesses),
  defaultPrivateState: () => AccessContractPrivateState.generate(),
  contractArgs: (admin: { bytes: Uint8Array }) => [admin],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => AccessControlWitnesses(),
});

/**
 * @description A simulator implementation of an access control contract for testing purposes.
 */
export class AccessControlSimulator extends AccessControlSimulatorBase {
  /** @description The public key of the contract's admin. */
  readonly admin: CoinPublicKey;

  /**
   * @description Initializes the mock access control contract with an admin key.
   * @param admin - The public key of the admin who initializes the contract.
   * @param options - Optional simulator configuration options.
   */
  constructor(
    admin: CoinPublicKey,
    options: BaseSimulatorOptions<
      AccessContractPrivateState,
      ReturnType<typeof AccessControlWitnesses>
    > = {},
  ) {
    // Pass admin as coinPK to set the caller identity for subsequent calls
    super([{ bytes: encodeCoinPublicKey(admin) }], {
      ...options,
      coinPK: admin,
    });
    this.admin = admin;
  }

  /**
   * @description Grants a role to a user, updating the circuit context.
   * @param user - The public key of the user to grant the role to.
   * @param role - The role to grant (e.g., Admin, Lp, Trader, None).
   */
  public grantRole(user: ZswapCoinPublicKey, role: AccessControl_Role): void {
    this.circuits.impure.testGrantRole(user, role);
  }

  /**
   * @description Computes the hash of a user-role pair using pure circuits.
   * @param user - The public key of the user.
   * @param role - The role to hash with the user.
   * @returns The commitment hash as Uint8Array.
   */
  public hashUserRole(
    user: ZswapCoinPublicKey,
    role: AccessControl_Role,
  ): Uint8Array {
    return pureCircuits.AccessControl_hashUserRole(user, role);
  }
}
