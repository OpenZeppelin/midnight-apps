// Export contract types and interfaces from ShieldedFungibleToken
export {
	type Witnesses,
	type ImpureCircuits,
	type PureCircuits,
	type Circuits,
	type Ledger,
	type ContractReferenceLocations,
	contractReferenceLocations,
	Contract,
	ledger,
	pureCircuits,
} from "./artifacts/ShieldedFungibleToken/contract/index.cjs";

// Export witnesses
export {
	ShieldedFungibleTokenPrivateState,
	ShieldedFungibleTokenWitnesses,
	type IShieldedFungibleTokenWitnesses,
} from "./witnesses/index.js";
