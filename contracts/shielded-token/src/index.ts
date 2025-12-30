// Export contract types and interfaces from ShieldedFungibleToken
// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  type Circuits,
  Contract,
  type ContractReferenceLocations,
  contractReferenceLocations,
  type ImpureCircuits,
  type Ledger,
  ledger,
  type PureCircuits,
  pureCircuits,
  type Witnesses,
} from '../artifacts/ShieldedFungibleToken/contract/index.cjs';

// Export witnesses
export {
  type IShieldedFungibleTokenWitnesses,
  ShieldedFungibleTokenPrivateState,
  ShieldedFungibleTokenWitnesses,
} from './witnesses/index.js';
