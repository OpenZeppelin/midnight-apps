'use client';

import type {
  ShieldedFungibleTokenCircuitKeys,
  ShieldedFungibleTokenProviders,
} from '@openzeppelin/midnight-apps-shielded-token-api';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useLogger } from '@/hooks/use-logger';
import { proofClient } from '@/providers/proof';
import { ZkConfigProviderWrapper } from '@/providers/zk-config';
import { useActiveNetworkConfig } from './runtime-configuration';
import {
  createShieldedTokenIntegration,
  type DeployTokenResult,
} from './shielded-token-integration';
import type { Token } from './token-config';
import { useMidnightWallet } from './wallet-context';

const USER_DEPLOYED_TOKENS_KEY = 'lunarswap-user-deployed-tokens';

export interface UserDeployedToken {
  name: string;
  symbol: string;
  address: string;
  type: string;
}

export type DeployStatus = 'idle' | 'deploying' | 'deployed' | 'error';

export type MintStatus = 'idle' | 'joining' | 'minting' | 'minted' | 'error';

interface ShieldedTokenContextType {
  deployToken: (
    name: string,
    symbol: string,
  ) => Promise<DeployTokenResult | null>;
  deployStatus: DeployStatus;
  deployError: string | null;
  userDeployedTokens: UserDeployedToken[];
  addUserDeployedToken: (token: UserDeployedToken) => void;
  removeUserDeployedToken: (address: string) => void;
  clearDeployState: () => void;
  mintStatus: MintStatus;
  mintError: string | null;
  activeTokenAddress: string | null;
  joinToken: (contractAddressHex: string) => Promise<void>;
  mintTokens: (
    recipientCoinPublicKey: string,
    amount: bigint,
  ) => Promise<unknown>;
  clearMintState: () => void;
}

const ShieldedTokenContext = createContext<ShieldedTokenContextType | null>(
  null,
);

function loadUserDeployedTokens(): UserDeployedToken[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USER_DEPLOYED_TOKENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserDeployedToken[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserDeployedTokens(tokens: UserDeployedToken[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_DEPLOYED_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // ignore
  }
}

export const useShieldedTokenContext = (): ShieldedTokenContextType => {
  const context = useContext(ShieldedTokenContext);
  if (!context) {
    throw new Error(
      'useShieldedTokenContext must be used within a ShieldedTokenProvider',
    );
  }
  return context;
};

interface ShieldedTokenProviderProps {
  children: ReactNode;
}

export const ShieldedTokenProvider = ({
  children,
}: ShieldedTokenProviderProps) => {
  const logger = useLogger();
  const midnightWallet = useMidnightWallet();
  const activeNetwork = useActiveNetworkConfig();
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle');
  const [mintError, setMintError] = useState<string | null>(null);
  const [activeTokenAddress, setActiveTokenAddress] = useState<string | null>(
    null,
  );
  const [userDeployedTokens, setUserDeployedTokens] = useState<
    UserDeployedToken[]
  >(loadUserDeployedTokens);

  const shieldedTokenZkConfigProvider = useMemo(() => {
    const baseURL =
      typeof window !== 'undefined'
        ? `${window.location.origin}/shielded-token`
        : '';
    return new ZkConfigProviderWrapper<ShieldedFungibleTokenCircuitKeys>(
      baseURL,
      midnightWallet.callback,
      typeof fetch !== 'undefined' ? fetch.bind(window) : undefined,
    );
  }, [midnightWallet.callback]);

  const getShieldedTokenProviders =
    useCallback((): ShieldedFungibleTokenProviders => {
      const proofProvider =
        midnightWallet.walletAPI &&
        (activeNetwork.PROOF_SERVER_URL ||
          midnightWallet.walletAPI.configuration.proverServerUri)
          ? proofClient(
              activeNetwork.PROOF_SERVER_URL ||
                midnightWallet.walletAPI.configuration.proverServerUri ||
                '',
              shieldedTokenZkConfigProvider,
              midnightWallet.callback,
            )
          : {
              proveTx: async () => {
                throw new Error('Proof server not available');
              },
            };

      return {
        privateStateProvider: midnightWallet.privateStateProvider,
        publicDataProvider: midnightWallet.publicDataProvider,
        zkConfigProvider: shieldedTokenZkConfigProvider,
        proofProvider,
        walletProvider: midnightWallet.walletProvider,
        midnightProvider: midnightWallet.midnightProvider,
      } as unknown as ShieldedFungibleTokenProviders;
    }, [
      midnightWallet.privateStateProvider,
      midnightWallet.publicDataProvider,
      midnightWallet.walletProvider,
      midnightWallet.midnightProvider,
      midnightWallet.walletAPI,
      midnightWallet.callback,
      shieldedTokenZkConfigProvider,
      activeNetwork.PROOF_SERVER_URL,
    ]);

  const integration = useMemo(
    () =>
      createShieldedTokenIntegration(
        getShieldedTokenProviders,
        midnightWallet.callback,
        logger,
      ),
    [getShieldedTokenProviders, midnightWallet.callback, logger],
  );

  const deployToken = useCallback(
    async (name: string, symbol: string): Promise<DeployTokenResult | null> => {
      if (!midnightWallet.isConnected || !midnightWallet.walletAPI) {
        setDeployError('Please connect your wallet first');
        setDeployStatus('error');
        return null;
      }
      setDeployStatus('deploying');
      setDeployError(null);
      try {
        const result = await integration.deployToken(name, symbol);
        const newToken: UserDeployedToken = {
          name,
          symbol,
          address: result.contractAddress,
          type: result.tokenType,
        };
        setUserDeployedTokens((prev) => {
          const next = [...prev, newToken];
          saveUserDeployedTokens(next);
          return next;
        });
        setDeployStatus('deployed');
        setActiveTokenAddress(result.contractAddress);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setDeployError(message);
        setDeployStatus('error');
        logger?.error({ err }, `[ShieldedToken] Deploy failed: ${message}`);
        return null;
      }
    },
    [integration, midnightWallet.isConnected, midnightWallet.walletAPI, logger],
  );

  const addUserDeployedToken = useCallback((token: UserDeployedToken) => {
    setUserDeployedTokens((prev) => {
      if (prev.some((t) => t.address === token.address)) return prev;
      const next = [...prev, token];
      saveUserDeployedTokens(next);
      return next;
    });
  }, []);

  const removeUserDeployedToken = useCallback((address: string) => {
    setUserDeployedTokens((prev) => {
      const next = prev.filter((t) => t.address !== address);
      saveUserDeployedTokens(next);
      return next;
    });
  }, []);

  const clearDeployState = useCallback(() => {
    setDeployStatus('idle');
    setDeployError(null);
  }, []);

  const joinToken = useCallback(
    async (contractAddressHex: string): Promise<void> => {
      if (!midnightWallet.isConnected || !midnightWallet.walletAPI) {
        setMintError('Please connect your wallet first');
        setMintStatus('error');
        return;
      }
      const hex = contractAddressHex.replace(/^0x/, '');
      setMintStatus('joining');
      setMintError(null);
      try {
        await integration.joinToken(hex);
        setActiveTokenAddress(integration.currentTokenAddress ?? null);
        setMintStatus('idle');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMintError(message);
        setMintStatus('error');
        logger?.error({ err }, `[ShieldedToken] Join failed: ${message}`);
      }
    },
    [integration, midnightWallet.isConnected, midnightWallet.walletAPI, logger],
  );

  const mintTokens = useCallback(
    async (
      recipientCoinPublicKey: string,
      amount: bigint,
    ): Promise<unknown> => {
      if (!midnightWallet.isConnected || !midnightWallet.walletAPI) {
        setMintError('Please connect your wallet first');
        setMintStatus('error');
        return null;
      }
      setMintStatus('minting');
      setMintError(null);
      try {
        const result = await integration.mintTokens(
          recipientCoinPublicKey,
          amount,
        );
        setMintStatus('minted');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMintError(message);
        setMintStatus('error');
        logger?.error({ err }, `[ShieldedToken] Mint failed: ${message}`);
        return null;
      }
    },
    [integration, midnightWallet.isConnected, midnightWallet.walletAPI, logger],
  );

  const clearMintState = useCallback(() => {
    setMintStatus('idle');
    setMintError(null);
  }, []);

  const value = useMemo<ShieldedTokenContextType>(
    () => ({
      deployToken,
      deployStatus,
      deployError,
      userDeployedTokens,
      addUserDeployedToken,
      removeUserDeployedToken,
      clearDeployState,
      mintStatus,
      mintError,
      activeTokenAddress,
      joinToken,
      mintTokens,
      clearMintState,
    }),
    [
      deployToken,
      deployStatus,
      deployError,
      userDeployedTokens,
      addUserDeployedToken,
      removeUserDeployedToken,
      clearDeployState,
      mintStatus,
      mintError,
      activeTokenAddress,
      joinToken,
      mintTokens,
      clearMintState,
    ],
  );

  return (
    <ShieldedTokenContext.Provider value={value}>
      {children}
    </ShieldedTokenContext.Provider>
  );
};

/** Convert UserDeployedToken to Token for use in token lists */
export function userDeployedTokenToToken(t: UserDeployedToken): Token {
  return {
    symbol: t.symbol,
    name: t.name,
    type: t.type as Token['type'],
    address: t.address,
    shielded: true,
  };
}
