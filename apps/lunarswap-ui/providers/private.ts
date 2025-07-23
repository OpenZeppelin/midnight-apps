import type { SigningKey } from '@midnight-ntwrk/compact-runtime';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import type { PrivateStateId } from '@midnight-ntwrk/midnight-js-types';
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
}
