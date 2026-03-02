import type { SigningKey } from '@midnight-ntwrk/compact-runtime';
import type {
  PrivateStateId,
  PrivateStateProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { Logger } from 'pino';

export class PrivateDataProviderWrapper<
  PSI extends PrivateStateId = PrivateStateId,
  PS = unknown,
> implements PrivateStateProvider<PSI, PS>
{
  constructor(
    private readonly wrapped: PrivateStateProvider<PSI, PS>,
    private readonly logger: Logger,
  ) {}

  set(key: PSI, state: PS): Promise<void> {
    this.logger.trace(`Setting private state for key: ${key}`);
    return this.wrapped.set(key, state);
  }

  get(key: PSI): Promise<PS | null> {
    this.logger.trace(`Getting private state for key: ${key}`);
    return this.wrapped.get(key);
  }

  remove(key: PSI): Promise<void> {
    this.logger.trace(`Removing private state for key: ${key}`);
    return this.wrapped.remove(key);
  }

  clear(): Promise<void> {
    this.logger.trace('Clearing private state');
    return this.wrapped.clear();
  }

  setSigningKey(key: PSI, signingKey: SigningKey): Promise<void> {
    this.logger.trace(`Setting signing key for key: ${key}`);
    return this.wrapped.setSigningKey(key, signingKey);
  }

  getSigningKey(key: PSI): Promise<SigningKey | null> {
    this.logger.trace(`Getting signing key for key: ${key}`);
    return this.wrapped.getSigningKey(key);
  }

  removeSigningKey(key: PSI): Promise<void> {
    this.logger.trace(`Removing signing key for key: ${key}`);
    return this.wrapped.removeSigningKey(key);
  }

  clearSigningKeys(): Promise<void> {
    this.logger.trace('Clearing signing keys');
    return this.wrapped.clearSigningKeys();
  }

  setContractAddress(address: string): void {
    this.logger.trace(`Setting contract address: ${address}`);
    this.wrapped.setContractAddress(address);
  }

  exportPrivateStates(
    options?: Parameters<
      PrivateStateProvider<PSI, PS>['exportPrivateStates']
    >[0],
  ): ReturnType<PrivateStateProvider<PSI, PS>['exportPrivateStates']> {
    this.logger.trace('Exporting private states');
    return this.wrapped.exportPrivateStates(options);
  }

  importPrivateStates(
    exportData: Parameters<
      PrivateStateProvider<PSI, PS>['importPrivateStates']
    >[0],
    options?: Parameters<
      PrivateStateProvider<PSI, PS>['importPrivateStates']
    >[1],
  ): ReturnType<PrivateStateProvider<PSI, PS>['importPrivateStates']> {
    this.logger.trace('Importing private states');
    return this.wrapped.importPrivateStates(exportData, options);
  }

  exportSigningKeys(
    options?: Parameters<PrivateStateProvider<PSI, PS>['exportSigningKeys']>[0],
  ): ReturnType<PrivateStateProvider<PSI, PS>['exportSigningKeys']> {
    this.logger.trace('Exporting signing keys');
    return this.wrapped.exportSigningKeys(options);
  }

  importSigningKeys(
    exportData: Parameters<
      PrivateStateProvider<PSI, PS>['importSigningKeys']
    >[0],
    options?: Parameters<PrivateStateProvider<PSI, PS>['importSigningKeys']>[1],
  ): ReturnType<PrivateStateProvider<PSI, PS>['importSigningKeys']> {
    this.logger.trace('Importing signing keys');
    return this.wrapped.importSigningKeys(exportData, options);
  }
}
