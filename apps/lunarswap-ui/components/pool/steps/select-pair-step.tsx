'use client';

import { useEffect, useMemo, useState } from 'react';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useWalletRx } from '@/hooks/use-wallet-rx';
import {
  userDeployedTokenToToken,
  useShieldedTokenContext,
} from '@/lib/shielded-token-context';
import {
  getAllTokens,
  getTokensFromShieldedBalances,
  type Token as UiToken,
} from '@/lib/token-config';
import { Button } from '../../ui/button';
import { TokenSelector } from '../token-selector';

interface PairSelectionData {
  tokenA: UiToken;
  tokenB: UiToken;
  fee: number;
  version: string;
}

interface SelectPairStepProps {
  onSubmit: (data: PairSelectionData) => void;
  initialData?: Partial<PairSelectionData>;
}

function normalizeType(t: string): string {
  return t.replace(/^0x/i, '').toLowerCase();
}

export function SelectPairStep({ onSubmit, initialData }: SelectPairStepProps) {
  const { state: walletState } = useWalletRx();
  const { userDeployedTokens } = useShieldedTokenContext();
  const [tokenA, setTokenA] = useState<UiToken | null>(
    initialData?.tokenA ?? null,
  );
  const [tokenB, setTokenB] = useState<UiToken | null>(
    initialData?.tokenB ?? null,
  );
  const [fee] = useState<number>(0.3); // Fixed fee at 0.3%
  const [validationState, setValidationState] = useState<{
    tokenA: string | null;
    tokenB: string | null;
    isValid: boolean | null;
    tokenAExists: boolean;
    tokenBExists: boolean;
    symbolsDifferent: boolean;
  }>({
    tokenA: null,
    tokenB: null,
    isValid: null,
    tokenAExists: false,
    tokenBExists: false,
    symbolsDifferent: true,
  });

  const baseTokens = useMemo(
    () => getAllTokens(userDeployedTokens.map(userDeployedTokenToToken)),
    [userDeployedTokens],
  );
  const walletTokens = useMemo(
    () =>
      walletState?.shieldedBalances
        ? getTokensFromShieldedBalances(walletState.shieldedBalances)
        : [],
    [walletState?.shieldedBalances],
  );
  const baseTypes = useMemo(
    () => new Set(baseTokens.map((t) => normalizeType(t.type))),
    [baseTokens],
  );
  const combinedTokens = useMemo(() => {
    const fromWallet = walletTokens.filter(
      (t) => !baseTypes.has(normalizeType(t.type)),
    );
    return [...baseTokens, ...fromWallet];
  }, [baseTokens, walletTokens, baseTypes]);

  // Validate tokens whenever they change
  useEffect(() => {
    const tokenASymbol = tokenA?.symbol ?? null;
    const tokenBSymbol = tokenB?.symbol ?? null;
    const tokenAExists = !!tokenA;
    const tokenBExists = !!tokenB;
    const sameType =
      tokenA && tokenB
        ? normalizeType(tokenA.type) === normalizeType(tokenB.type)
        : false;

    setValidationState({
      tokenA: tokenASymbol,
      tokenB: tokenBSymbol,
      isValid: tokenAExists && tokenBExists && !sameType,
      tokenAExists,
      tokenBExists,
      symbolsDifferent: !sameType,
    });
  }, [tokenA, tokenB]);

  const handleTokenASelect = (token: UiToken) => {
    setTokenA(token);
  };

  const handleTokenBSelect = (token: UiToken) => {
    if (tokenA && normalizeType(token.type) === normalizeType(tokenA.type)) {
      setTokenA(null);
    }
    setTokenB(token);
  };

  const handleSubmit = () => {
    if (!tokenA || !tokenB) return;
    onSubmit({
      tokenA,
      tokenB,
      fee,
      version: 'v1',
    });
  };

  return (
    <>
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Select token pair</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Choose Token A and Token B from your deployed tokens or from your
            wallet balances. You can add liquidity even if the pair is not on
            the contract yet.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="block text-xs font-medium mb-1">Token A</div>
                <TokenSelector
                  selectedToken={tokenA}
                  onSelectToken={handleTokenASelect}
                  showTokenIcon={false}
                  tokens={combinedTokens}
                />
              </div>

              <div>
                <div className="block text-xs font-medium mb-1">Token B</div>
                <TokenSelector
                  selectedToken={tokenB}
                  onSelectToken={handleTokenBSelect}
                  showTokenIcon={false}
                  tokens={combinedTokens}
                />
              </div>
            </div>

            <div>
              <div className="block text-xs font-medium mb-1">Fee Tier</div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  Fixed fee: <span className="font-medium">0.3%</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Standard fee for v1 pools
                </div>
              </div>
            </div>
          </div>

          {validationState.tokenA &&
            validationState.tokenB &&
            !validationState.symbolsDifferent && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-xs text-red-800 dark:text-red-200">
                  ⚠️ Please select different tokens for the pair.
                </p>
              </div>
            )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50 transition-all duration-300 text-sm"
          disabled={!validationState.isValid}
          onClick={handleSubmit}
        >
          Continue
        </Button>
      </CardFooter>
    </>
  );
}
