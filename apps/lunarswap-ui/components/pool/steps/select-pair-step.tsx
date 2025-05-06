'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { TokenSelector } from '../token-selector';

interface SelectPairStepProps {
  onSubmit: (data: any) => void;
  initialData: any;
}

export function SelectPairStep({ onSubmit, initialData }: SelectPairStepProps) {
  const [tokenA, setTokenA] = useState(initialData.tokenA);
  const [tokenB, setTokenB] = useState(initialData.tokenB);
  const [fee] = useState(initialData.fee);
  const [version] = useState(initialData.version);

  // Track which token was last changed
  const lastChanged = useRef<'A' | 'B' | null>(null);

  const handleTokenASelect = (token: any) => {
    // Mark tokenA as last changed
    lastChanged.current = 'A';

    // Check if the new token is the same as tokenB
    if (tokenB && token.symbol === tokenB.symbol) {
      // Reset tokenB since tokenA was changed last
      setTokenB(null);
    }

    setTokenA(token);
  };

  const handleTokenBSelect = (token: any) => {
    // Mark tokenB as last changed
    lastChanged.current = 'B';

    // Check if the new token is the same as tokenA
    if (tokenA && token.symbol === tokenA.symbol) {
      // Reset tokenA since tokenB was changed last
      setTokenA(null);
    }

    setTokenB(token);
  };

  const handleSubmit = () => {
    onSubmit({ tokenA, tokenB, fee, version });
  };

  const isValid =
    tokenA && tokenB && (!tokenA || !tokenB || tokenA.symbol !== tokenB.symbol);

  return (
    <>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Select pair</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose the tokens you want to provide liquidity for. You can select
            tokens on all supported networks.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <TokenSelector
                selectedToken={tokenA}
                onSelectToken={handleTokenASelect}
                placeholder="NIGHT"
                showTokenIcon={true}
              />
            </div>
            <div>
              <TokenSelector
                selectedToken={tokenB}
                onSelectToken={handleTokenBSelect}
                placeholder="Choose token"
                showTokenIcon={false}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Fee tier</h3>
          <div className="flex items-center mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fixed 0.3% fee for v1.
            </p>
            <div className="relative inline-flex group">
              <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-48">
                The fee earned for providing liquidity
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl"
        >
          Continue
        </Button>
      </CardFooter>
    </>
  );
}
