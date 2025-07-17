import type {
  CoinInfo,
  ContractAddress,
  Either,
  ZswapCoinPublicKey,
} from '@midnight-dapps/compact-std';
import {
  Contract,
  ledger,
  ShieldedFungibleTokenWitnesses,
  ShieldedFungibleTokenPrivateState,
  type Ledger,
} from '@midnight-dapps/shielded-token-contract';
import type { ContractAddress as ContractAddressRuntime, ContractState } from '@midnight-ntwrk/compact-runtime';
import type { ZswapChainState } from '@midnight-ntwrk/ledger';
import { async, combineLatest, from, map, tap, type Observable } from 'rxjs';
import type { Logger } from 'pino';
import {
  type ShieldedTokenProviders,
  type ShieldedTokenPublicState,
  type DeployedShieldedTokenContract,
  ShieldedTokenPrivateStateId,
  type ShieldedTokenContract,
} from './types';
import {
  deployContract,
  findDeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';

const shieldedTokenContractInstance: ShieldedTokenContract = new Contract(ShieldedFungibleTokenWitnesses());

export interface IShieldedToken {
  deployedContractAddressHex: string;
  state$: Observable<ShieldedTokenPublicState>;
  getPublicState(providers: ShieldedTokenProviders): Promise<Ledger | null>,
  getZswapChainState(providers: ShieldedTokenProviders): Promise<ZswapChainState | null>,
  getDeployedContractState(providers: ShieldedTokenProviders): Promise<ContractState | null>,
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<bigint>;
  totalSupply(): Promise<bigint>;
  mint(
    recipient: Either<ZswapCoinPublicKey, ContractAddress>,
    amount: bigint
  ): Promise<void>;
  burn(
    coin: CoinInfo,
    amount: bigint
  ): Promise<void>;
}

export class ShieldedToken implements IShieldedToken {
  public deployedContractAddressHex: string;
  public state$: Observable<ShieldedTokenPublicState>;

  private constructor(
    public readonly deployedContract: DeployedShieldedTokenContract,
    providers: ShieldedTokenProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddressHex = deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddressHex, {
            type: 'latest',
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerState: {
                  ...ledgerState,
                },
              }),
            ),
          ),
        from(providers.privateStateProvider.get('shieldedTokenPrivateState')).pipe(
          map((privateStates) => privateStates?.shieldedTokenPrivateState),
        ),
      ],
      (ledgerState, privateState) => {
        return {
          ledger: ledgerState,
          privateState: privateState,
        };
      },
    );
  }

  static async deploy(
    providers: ShieldedTokenProviders,
    nonce: Uint8Array,
    name: string,
    symbol: string,
    domain: Uint8Array,
    logger?: Logger,
  ): Promise<ShieldedToken> {
    logger?.info('Deploying Shielded Token contract...', {
      name,
      symbol,
      nonce: Buffer.from(nonce).toString('hex'),
      domain: Buffer.from(domain).toString('hex')
    });

    const deployedContract = await deployContract<ShieldedTokenContract>(
      providers,
      {
        contract: shieldedTokenContractInstance,
        privateStateId: ShieldedTokenPrivateStateId,
        initialPrivateState: await ShieldedToken.getPrivateState(providers),
        args: [
          nonce,      // nonce (32 bytes)
          name,       // name
          symbol,     // symbol
          domain,     // domain (32 bytes)
        ],
      },
    );

    logger?.info('Shielded Token contract deployed');
    return new ShieldedToken(deployedContract, providers, logger);
  }

  static async join(
    providers: ShieldedTokenProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<ShieldedToken> {
    logger?.info('Joining Shielded Token contract...');

    // Convert contractAddress.bytes (Uint8Array) to hex string for findDeployedContract
    const contractAddressHex = Buffer.from(contractAddress.bytes).toString('hex');

    const deployedContract = await findDeployedContract(providers, {
      contractAddress: contractAddressHex,
      contract: shieldedTokenContractInstance,
      privateStateId: 'shieldedTokenPrivateState',
      initialPrivateState: await ShieldedToken.getPrivateState(providers),
    });
    
    logger?.info('Shielded Token contract joined');
    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new ShieldedToken(deployedContract, providers, logger);
  }

  async getPublicState(providers: ShieldedTokenProviders): Promise<Ledger | null> {
    const contractState = await providers.publicDataProvider.queryContractState(this.deployedContractAddressHex);
    return contractState ? ledger(contractState.data) : null;
  }

  async getZswapChainState(providers: ShieldedTokenProviders): Promise<ZswapChainState | null> {
    const result = await providers.publicDataProvider.queryZSwapAndContractState(this.deployedContractAddressHex);
    return result ? result[0] : null;
  }

  async getDeployedContractState(providers: ShieldedTokenProviders): Promise<ContractState | null> {
    const deployedContract = await providers.publicDataProvider.queryDeployContractState(this.deployedContractAddressHex);
    return deployedContract ?? null;
  }

  private static async getPrivateState(providers: ShieldedTokenProviders): Promise<ShieldedFungibleTokenPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      'shieldedTokenPrivateState',
    );
    return (
      existingPrivateState?.shieldedTokenPrivateState ??
      ShieldedFungibleTokenPrivateState.generate()
    );
  }

  async name(): Promise<string> {
    const txData = await this.deployedContract.callTx.name();
    return txData.private.result;
  }
  
  async symbol(): Promise<string> {
    const txData = await this.deployedContract.callTx.symbol();
    return txData.private.result;
  }

  async decimals(): Promise<bigint> {
    const txData = await this.deployedContract.callTx.decimals();
    return txData.private.result;
  }

  async totalSupply(): Promise<bigint> {
    const txData = await this.deployedContract.callTx.totalSupply();
    return txData.private.result;
  }

  async mint(
    recipient: Either<ZswapCoinPublicKey, ContractAddress>,
    amount: bigint,
  ): Promise<void> {
    const txData = await this.deployedContract.callTx.mint(
      recipient,
      amount,
    );
    
    this.logger?.trace({
      transactionAdded: {
        circuit: 'mint',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
        newCoinInfo: txData.private.result,
      },
    });

    return;
  }

  async burn(
    coin: CoinInfo,
    amount: bigint,
  ): Promise<void> {
    const txData = await this.deployedContract.callTx.burn(
      coin,
      amount,
    );
    
    this.logger?.trace({
      transactionAdded: {
        circuit: 'burn',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
        changeCoinInfo: txData.private.result.change,
        sentCoinInfo: txData.private.result.sent,
      },
    });

    return;
  }
} 