'use client';

import { Button } from '../../ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { TokenSelector } from '../token-selector';
import { getTokenByName } from '../../../lib/token-config';
import { useState, useEffect } from 'react';

import type { Token as UiToken } from '@/lib/token-config';

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

export function SelectPairStep({ onSubmit, initialData }: SelectPairStepProps) {
  const [tokenA, setTokenA] = useState<UiToken | null>(
    initialData?.tokenA || getTokenByName('tDUST') || null
  );
  const [tokenB, setTokenB] = useState<UiToken | null>(
    initialData?.tokenB || null
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

  // Validate tokens whenever they change
  useEffect(() => {
    const tokenASymbol = tokenA?.symbol || null;
    const tokenBSymbol = tokenB?.symbol || null;
    const tokenAExists = !!tokenA;
    const tokenBExists = !!tokenB;
    const symbolsDifferent = tokenASymbol !== tokenBSymbol;

    const isValid = tokenAExists && tokenBExists && symbolsDifferent;

    setValidationState({
      tokenA: tokenASymbol,
      tokenB: tokenBSymbol,
      isValid,
      tokenAExists,
      tokenBExists,
      symbolsDifferent,
    });
  }, [tokenA, tokenB]);

  const handleTokenASelect = (token: UiToken) => {
    setTokenA(token);
  };

  const handleTokenBSelect = (token: UiToken) => {
    // If the selected token is the same as tokenA, reset tokenA to null
    if (tokenA && token.symbol === tokenA.symbol) {
      setTokenA(null);
    }
    setTokenB(token);
  };

  const handleSubmit = () => {
    if (!tokenA || !tokenB) {
      return;
    }

    const pairData: PairSelectionData = {
      tokenA,
      tokenB,
      fee,
      version: 'v1',
    };

    onSubmit(pairData);
  };



  return (
    <>
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Select token pair</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Choose the tokens you want to provide liquidity for.
          </p>

          <div className="space-y-3">
            {/* Token selectors on the same line */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="block text-xs font-medium mb-1">Token A</div>
                <TokenSelector
                  selectedToken={tokenA}
                  onSelectToken={handleTokenASelect}
                  showTokenIcon={false}
                />
              </div>

              <div>
                <div className="block text-xs font-medium mb-1">Token B</div>
                <TokenSelector
                  selectedToken={tokenB}
                  onSelectToken={handleTokenBSelect}
                  showTokenIcon={false}
                />
              </div>
            </div>

            {/* Fixed fee display */}
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

          {/* Validation Messages */}
          {validationState.tokenA && validationState.tokenB && !validationState.symbolsDifferent && (
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
