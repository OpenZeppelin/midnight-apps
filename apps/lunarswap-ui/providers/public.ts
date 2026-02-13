import type {
  ContractAddress,
  ContractState,
} from '@midnight-ntwrk/compact-runtime';
import type { TransactionId, ZswapChainState } from '@midnight-ntwrk/ledger-v7';
import type {
  BlockHashConfig,
  BlockHeightConfig,
  ContractStateObservableConfig,
  FinalizedTxData,
  PublicDataProvider,
  UnshieldedBalances,
} from '@midnight-ntwrk/midnight-js-types';
import type { Logger } from 'pino';
import type { Observable } from 'rxjs';
import { retry } from '@/utils/retry';

export class PublicDataProviderWrapper implements PublicDataProvider {
  constructor(
    private readonly wrapped: PublicDataProvider,
    private readonly callback: (
      action: 'watchForTxDataStarted' | 'watchForTxDataDone',
    ) => void,
    private readonly logger: Logger,
  ) {}

  queryContractState(
    contractAddress: ContractAddress,
    config?: BlockHeightConfig | BlockHashConfig,
  ): Promise<ContractState | null> {
    return retry(
      () => this.wrapped.queryContractState(contractAddress, config),
      'queryContractState',
      this.logger,
    );
  }

  queryZSwapAndContractState(
    contractAddress: ContractAddress,
    config?: BlockHeightConfig | BlockHashConfig,
  ): Promise<[ZswapChainState, ContractState] | null> {
    return retry(
      () => this.wrapped.queryZSwapAndContractState(contractAddress, config),
      'queryZSwapAndContractState',
      this.logger,
    );
  }

  queryDeployContractState(
    contractAddress: ContractAddress,
  ): Promise<ContractState | null> {
    return retry(
      () => this.wrapped.queryDeployContractState(contractAddress),
      'queryDeployContractState',
      this.logger,
    );
  }

  watchForContractState(
    contractAddress: ContractAddress,
  ): Promise<ContractState> {
    return retry(
      () => this.wrapped.watchForContractState(contractAddress),
      'watchForContractState',
      this.logger,
    );
  }

  watchForDeployTxData(
    contractAddress: ContractAddress,
  ): Promise<FinalizedTxData> {
    return retry(
      () => {
        return this.wrapped.watchForDeployTxData(contractAddress);
      },
      'watchForDeployTxData',
      this.logger,
    )
      .then((result) => {
        return result;
      })
      .catch((error) => {
        throw error;
      });
  }

  watchForTxData(txId: TransactionId): Promise<FinalizedTxData> {
    // calling a callback is a workaround to show in the UI when the watchForTxData is called
    this.callback('watchForTxDataStarted');
    return retry(
      () => this.wrapped.watchForTxData(txId),
      'watchForTxDataStarted',
      this.logger,
      1000, // we keep retrying long enough
    ).finally(() => {
      this.callback('watchForTxDataDone');
    });
  }

  contractStateObservable(
    address: ContractAddress,
    config: ContractStateObservableConfig,
  ): Observable<ContractState> {
    return this.wrapped.contractStateObservable(address, config);
  }

  queryUnshieldedBalances(
    contractAddress: ContractAddress,
    config?: BlockHeightConfig | BlockHashConfig,
  ): Promise<UnshieldedBalances | null> {
    return retry(
      () => this.wrapped.queryUnshieldedBalances(contractAddress, config),
      'queryUnshieldedBalances',
      this.logger,
    );
  }

  watchForUnshieldedBalances(
    contractAddress: ContractAddress,
  ): Promise<UnshieldedBalances> {
    return retry(
      () => this.wrapped.watchForUnshieldedBalances(contractAddress),
      'watchForUnshieldedBalances',
      this.logger,
    );
  }

  unshieldedBalancesObservable(
    address: ContractAddress,
    config: ContractStateObservableConfig,
  ): Observable<UnshieldedBalances> {
    return this.wrapped.unshieldedBalancesObservable(address, config);
  }
}
