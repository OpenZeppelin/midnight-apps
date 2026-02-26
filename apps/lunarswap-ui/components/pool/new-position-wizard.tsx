'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  userDeployedTokenToToken,
  useShieldedTokenContext,
} from '@/lib/shielded-token-context';
import type { Token as UiToken } from '@/lib/token-config';
import { getAllTokens } from '@/lib/token-config';
import { SelectPairStep } from './steps/select-pair-step';
import { SetDepositStep } from './steps/set-deposit-step';

// Define the interface locally since it's not exported from SelectPairStep
interface PairSelectionData {
  tokenA: UiToken | null;
  tokenB: UiToken | null;
  fee: number;
  version: string;
}

interface CompletePairData {
  tokenA: UiToken;
  tokenB: UiToken;
  fee: number;
  version: string;
}

interface NewPositionWizardProps {
  onClose?: () => void;
  initialTokens?: {
    tokenA?: string;
    tokenB?: string;
    tokenAType?: string;
    tokenBType?: string;
  };
}

type Step = 'select-pair' | 'set-deposit';

export function NewPositionWizard({
  onClose,
  initialTokens,
}: NewPositionWizardProps) {
  const { userDeployedTokens } = useShieldedTokenContext();
  const allTokensList = getAllTokens(
    userDeployedTokens.map(userDeployedTokenToToken),
  );
  const [currentStep, setCurrentStep] = useState<Step>('select-pair');
  const [pairData, setPairData] = useState<PairSelectionData>({
    tokenA: null,
    tokenB: null,
    fee: 0.3, // Default fee tier
    version: 'v1', // Default to V1 since V2/V3 are coming soon
  });
  const [forceRenderKey, setForceRenderKey] = useState(0);

  // Set initial tokens from navigation state
  useEffect(() => {
    if (initialTokens?.tokenA && initialTokens?.tokenB) {
      const tokenAData = allTokensList.find(
        (t) => t.symbol === initialTokens.tokenA,
      );
      const tokenBData = allTokensList.find(
        (t) => t.symbol === initialTokens.tokenB,
      );

      if (tokenAData && tokenBData) {
        setPairData((prev) => ({
          ...prev,
          tokenA: tokenAData,
          tokenB: tokenBData,
        }));
      }
    }
  }, [initialTokens, allTokensList]);

  const handlePairSubmit = (data: PairSelectionData) => {
    // Validate that we have complete pair data
    if (!data.tokenA || !data.tokenB) {
      console.error('[NewPositionWizard] Incomplete pair data received:', data);
      return;
    }

    // Cast to CompletePairData since we've validated the data
    const completeData: CompletePairData = {
      tokenA: data.tokenA,
      tokenB: data.tokenB,
      fee: data.fee,
      version: data.version,
    };

    setPairData(completeData);
    setCurrentStep('set-deposit');
    setForceRenderKey((prev: number) => prev + 1);
  };

  const _handleReset = () => {
    setPairData({
      tokenA: null,
      tokenB: null,
      fee: 0.3,
      version: 'v1', // Reset to V1 since V2/V3 are coming soon
    });
    setCurrentStep('select-pair');
    setForceRenderKey((prev) => prev + 1);
  };

  const handleClose = () => {
    _handleReset();
    onClose?.();
  };

  // Type guard to check if pair data is complete
  const isCompletePairData = (
    data: PairSelectionData,
  ): data is CompletePairData => {
    return data.tokenA !== null && data.tokenB !== null;
  };

  return (
    <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-lg overflow-hidden">
      <div className="flex">
        {/* Left sidebar with steps */}
        <div className="w-56 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            {/* Line connecting steps */}
            <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Step 1 */}
            <div className="relative mb-8">
              <button
                onClick={() => setCurrentStep('select-pair')}
                type="button"
                className={`w-full text-left ${currentStep === 'select-pair' ? '' : 'opacity-60 hover:opacity-80'}`}
              >
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full z-10 ${
                      currentStep === 'select-pair'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    1
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-medium">Step 1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Select token pair and fees
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <button
                onClick={() =>
                  isCompletePairData(pairData) && setCurrentStep('set-deposit')
                }
                disabled={!isCompletePairData(pairData)}
                type="button"
                className={`w-full text-left ${
                  currentStep === 'set-deposit'
                    ? ''
                    : isCompletePairData(pairData)
                      ? 'opacity-60 hover:opacity-80'
                      : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full z-10 ${
                      currentStep === 'set-deposit'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    2
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-medium">Step 2</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Enter deposit amounts
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1" key={forceRenderKey}>
          {/* Privacy Notice */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
            <div className="flex items-start space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-2 h-2 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-xs">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Privacy-First Position Creation
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  When creating positions, the system assumes you have
                  sufficient balance to generate the required zero-knowledge
                  proofs. Your actual balances remain private.
                </p>
              </div>
            </div>
            <div className="ml-2">
              <Button onClick={handleClose} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>

          {currentStep === 'select-pair' && (
            <SelectPairStep
              onSubmit={handlePairSubmit}
              initialData={{
                tokenA: pairData.tokenA || undefined,
                tokenB: pairData.tokenB || undefined,
                fee: pairData.fee,
                version: pairData.version,
              }}
            />
          )}
          {currentStep === 'set-deposit' && isCompletePairData(pairData) && (
            <SetDepositStep pairData={pairData} />
          )}
          {currentStep === 'set-deposit' && !isCompletePairData(pairData) && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                Please select both tokens before proceeding to deposit step.
              </p>
              <Button
                onClick={() => setCurrentStep('select-pair')}
                variant="outline"
                size="sm"
              >
                Back to Token Selection
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
