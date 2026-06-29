import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  createCallTxOptions,
  deployContract,
  type FinalizedCallTxData,
  findDeployedContract,
  submitCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';

/** coinPublicKey -> encryptionPublicKey mapping for shielded sends to other users. */
type CoinEncMappings = ReadonlyMap<unknown, unknown>;
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
    private readonly zkConfigPath?: string,
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
    return new ShieldedFungibleToken(deployedContract, providers, zkConfigPath, logger);
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
    return new ShieldedFungibleToken(deployedContract, providers, zkConfigPath, logger);
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

  /**
   * Sends `value` of `coin` to `to` (a user public key or a contract address).
   * Privacy experiment: the recipient is a public Either<ZswapCoinPublicKey,
   * ContractAddress> circuit argument; decode the resulting tx to see whether
   * the recipient stays private on-chain.
   */
  async send(
    to: Either<ZswapCoinPublicKey, ContractAddress>,
    coin: ShieldedCoinInfo,
    value: bigint,
    additionalCoinEncPublicKeyMappings?: CoinEncMappings,
  ): Promise<
    FinalizedCallTxData<ShieldedFungibleTokenContractInstance, 'send'>
  > {
    // Sending a shielded coin to ANOTHER USER's ZswapCoinPublicKey needs that
    // user's encryption (viewing) key so the SDK can build the coin ciphertext.
    // When a mapping is supplied, route through the lower-level call path that
    // accepts it; otherwise use the generated callTx (fine for self/contract).
    if (additionalCoinEncPublicKeyMappings && this.zkConfigPath) {
      const options = createCallTxOptions(
        createCompiledContract(this.zkConfigPath) as never,
        'send' as never,
        this.deployedContractAddressHex as never,
        ShieldedFungibleTokenPrivateStateId as never,
        additionalCoinEncPublicKeyMappings as never,
        [to, coin, value] as never,
      );
      const txData = (await submitCallTx(
        this.providers as never,
        options as never,
      )) as unknown as FinalizedCallTxData<
        ShieldedFungibleTokenContractInstance,
        'send'
      >;
      this.logger?.trace({
        transactionAdded: {
          circuit: 'send',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
      return txData;
    }

    const txData = await this.deployedContract.callTx.send(to, coin, value);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'send',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    return txData;
  }
}
