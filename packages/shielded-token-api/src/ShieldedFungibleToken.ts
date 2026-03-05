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
  ShieldedTokenWitnesses,
  ZswapCoinPublicKey,
} from '@openzeppelin/midnight-apps-contracts';
import {
  ShieldedTokenContract,
} from '@openzeppelin/midnight-apps-contracts';
import type { Logger } from 'pino';
import type {
  DeployedShieldedFungibleTokenContract,
  ShieldedFungibleTokenContractInstance,
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

function createWitnesses(): ShieldedTokenWitnesses<ShieldedFungibleTokenPrivateState> {
  return {} as ShieldedTokenWitnesses<ShieldedFungibleTokenPrivateState>;
}

const createCompiledContract = (zkConfigPath: string) => {
  const base = CompiledContract.make(
    'ShieldedFungibleToken',
    ShieldedTokenContract<ShieldedFungibleTokenPrivateState>,
  );
  // Empty witnesses object; type assertion needed as ShieldedTokenWitnesses<PS> is empty type
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

    // deployContract sets contract address and initial private state internally (midnight-js 3.1.0)
    const deployedContract =
      await deployContract<ShieldedFungibleTokenContractInstance>(providers, {
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

    // findDeployedContract sets contract address and initial private state internally (midnight-js 3.1.0)
    const contractAddressHex = bytesToHex(contractAddress.bytes);

    const deployedContract =
      await findDeployedContract<ShieldedFungibleTokenContractInstance>(providers, {
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
    FinalizedCallTxData<ShieldedFungibleTokenContractInstance, 'mint'>
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
    FinalizedCallTxData<ShieldedFungibleTokenContractInstance, 'burn'>
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
