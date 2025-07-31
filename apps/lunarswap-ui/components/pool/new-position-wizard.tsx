'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { SelectPairStep } from './steps/select-pair-step';
import { SetDepositStep } from './steps/set-deposit-step';

type Step = 'select-pair' | 'set-deposit';

interface PairSelectionData {
  tokenA: string | null;
  tokenB: string | null;
  fee: number;
  version: string;
}

interface CompletePairData {
  tokenA: string;
  tokenB: string;
  fee: number;
  version: string;
}

interface NewPositionWizardProps {
  onClose?: () => void;
}

export function NewPositionWizard({ onClose }: NewPositionWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('select-pair');
  const [pairData, setPairData] = useState<PairSelectionData>({
    tokenA: null,
    tokenB: null,
    fee: 0.3, // Default fee tier
    version: 'v1', // Default to V1 since V2/V3 are coming soon
  });

  const handlePairSubmit = (data: CompletePairData) => {
    setPairData(data);
    setCurrentStep('set-deposit');
  };

  const handleReset = () => {
    setPairData({
      tokenA: null,
      tokenB: null,
      fee: 0.3,
      version: 'v1', // Reset to V1 since V2/V3 are coming soon
    });
    setCurrentStep('select-pair');
  };

  // Type guard to check if pair data is complete
  const isCompletePairData = (
    data: PairSelectionData,
  ): data is CompletePairData => {
    return data.tokenA !== null && data.tokenB !== null;
  };

  return (
    <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
      <div className="flex">
        {/* Left sidebar with steps */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-6">
          <div className="relative">
            {/* Line connecting steps */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Step 1 */}
            <div className="relative mb-12">
              <div
                className={`flex items-center ${currentStep === 'select-pair' ? '' : 'opacity-60'}`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full z-10 ${
                    currentStep === 'select-pair'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  1
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">Step 1</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Select token pair and fees
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div
                className={`flex items-center ${currentStep === 'set-deposit' ? '' : 'opacity-60'}`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full z-10 ${
                    currentStep === 'set-deposit'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  2
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">Step 2</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Enter deposit amounts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-500"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Settings className="h-4 w-4" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {currentStep === 'select-pair' && (
            <SelectPairStep
              onSubmit={handlePairSubmit}
              initialData={pairData}
            />
          )}
          {currentStep === 'set-deposit' && isCompletePairData(pairData) && (
            <SetDepositStep pairData={pairData} />
          )}
          {currentStep === 'set-deposit' && !isCompletePairData(pairData) && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Please select both tokens before proceeding to deposit step.
              </p>
              <Button
                onClick={() => setCurrentStep('select-pair')}
                variant="outline"
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
