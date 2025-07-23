import type {
  ContractAddress,
  ContractState,
} from '@midnight-ntwrk/compact-runtime';
import type {
  BlockHashConfig,
  BlockHeightConfig,
  ContractStateObservableConfig,
  FinalizedTxData,
  PublicDataProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { Logger } from 'pino';
import { retry } from '@/utils/retry';
import type { TransactionId, ZswapChainState } from '@midnight-ntwrk/ledger';
import type { Observable } from 'rxjs';

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

  queryDeployContractState(contractAddress: ContractAddress): Promise<ContractState | null> {
    return retry(
      () => this.wrapped.queryDeployContractState(contractAddress),
      'queryDeployContractState',
      this.logger,
    );
  }

  watchForContractState(contractAddress: ContractAddress): Promise<ContractState> {
    return retry(
      () => this.wrapped.watchForContractState(contractAddress),
      'watchForContractState',
      this.logger,
    );
  }

  watchForDeployTxData(contractAddress: ContractAddress): Promise<FinalizedTxData> {
    return retry(
      () => this.wrapped.watchForDeployTxData(contractAddress),
      'watchForDeployTxData',
      this.logger,
    );
  }

  watchForTxData(txId: TransactionId): Promise<FinalizedTxData> {
    return retry(
      () => this.wrapped.watchForTxData(txId),
      'watchForTxData',
      this.logger,
    );
  }

  contractStateObservable(address: ContractAddress, config: ContractStateObservableConfig): Observable<ContractState> {
    return this.wrapped.contractStateObservable(address, config);
  }
}
