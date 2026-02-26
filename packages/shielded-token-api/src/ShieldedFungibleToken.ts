import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  deployContract,
  type FinalizedCallTxData,
  findDeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import type {
  ContractAddress,
  Either,
  ShieldedCoinInfo,
  Witnesses,
  ZswapCoinPublicKey,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/shielded-token/ShieldedFungibleToken/contract';
import {
  Contract,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/shielded-token/ShieldedFungibleToken/contract';
import type { Logger } from 'pino';
import type {
  DeployedShieldedFungibleTokenContract,
  ShieldedFungibleTokenContract,
  ShieldedFungibleTokenPrivateState,
  ShieldedFungibleTokenProviders,
} from './types.js';
import {
  ShieldedFungibleTokenPrivateStateId,
} from './types.js';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function createWitnesses(): Witnesses<ShieldedFungibleTokenPrivateState> {
  return {} as Witnesses<ShieldedFungibleTokenPrivateState>;
}

const createCompiledContract = (zkConfigPath: string) => {
  const base = CompiledContract.make(
    'ShieldedFungibleToken',
    Contract<ShieldedFungibleTokenPrivateState>,
  );
  // Empty witnesses object; type assertion needed as Witnesses<PS> is empty type
  const withWit = CompiledContract.withWitnesses(base, createWitnesses() as never);
  return CompiledContract.withCompiledFileAssets(withWit, zkConfigPath);
};

export class ShieldedFungibleToken {
  constructor(
    private readonly deployedContract: DeployedShieldedFungibleTokenContract,
    private readonly providers: ShieldedFungibleTokenProviders,
    private readonly logger?: Logger,
  ) {}

  get deployedContractAddressHex(): string {
    return this.deployedContract.deployTxData.public.contractAddress;
  }

  static getPrivateState(): ShieldedFungibleTokenPrivateState {
    return {};
  }

  static async deploy(
    providers: ShieldedFungibleTokenProviders,
    nonce: Uint8Array,
    name: string,
    symbol: string,
    domain: Uint8Array,
    zkConfigPath: string,
    logger?: Logger,
  ): Promise<ShieldedFungibleToken> {
    logger?.info('Deploying ShieldedFungibleToken contract...');

    await providers.privateStateProvider.set(
      ShieldedFungibleTokenPrivateStateId,
      ShieldedFungibleToken.getPrivateState(),
    );

    const deployedContract =
      await deployContract<ShieldedFungibleTokenContract>(providers, {
        compiledContract: createCompiledContract(zkConfigPath),
        privateStateId: ShieldedFungibleTokenPrivateStateId,
        initialPrivateState: ShieldedFungibleToken.getPrivateState(),
        args: [nonce, name, symbol, domain],
      });

    logger?.info('ShieldedFungibleToken contract deployed');
    return new ShieldedFungibleToken(deployedContract, providers, logger);
  }

  static async join(
    providers: ShieldedFungibleTokenProviders,
    contractAddress: ContractAddress,
    zkConfigPath: string,
    logger?: Logger,
  ): Promise<ShieldedFungibleToken> {
    logger?.info('Joining ShieldedFungibleToken contract...');

    await providers.privateStateProvider.set(
      ShieldedFungibleTokenPrivateStateId,
      ShieldedFungibleToken.getPrivateState(),
    );

    const contractAddressHex = bytesToHex(contractAddress.bytes);

    const deployedContract =
      await findDeployedContract<ShieldedFungibleTokenContract>(providers, {
        contractAddress: contractAddressHex,
        compiledContract: createCompiledContract(zkConfigPath),
        privateStateId: ShieldedFungibleTokenPrivateStateId,
        initialPrivateState: ShieldedFungibleToken.getPrivateState(),
      });

    logger?.info('ShieldedFungibleToken contract joined');
    return new ShieldedFungibleToken(deployedContract, providers, logger);
  }

  async mint(
    recipient: Either<ZswapCoinPublicKey, ContractAddress>,
    amount: bigint,
  ): Promise<
    FinalizedCallTxData<ShieldedFungibleTokenContract, 'mint'>
  > {
    const txData = await this.deployedContract.callTx.mint(recipient, amount);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'mint',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    return txData;
  }

  async burn(
    coin: ShieldedCoinInfo,
    amount: bigint,
  ): Promise<
    FinalizedCallTxData<ShieldedFungibleTokenContract, 'burn'>
  > {
    const txData = await this.deployedContract.callTx.burn(coin, amount);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'burn',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    return txData;
  }
}
