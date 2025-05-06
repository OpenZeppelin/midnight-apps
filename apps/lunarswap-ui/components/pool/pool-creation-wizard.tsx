'use client';

import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { SelectPairStep } from './steps/select-pair-step';

type Step = 'select-pair' | 'set-range';

export function PoolCreationWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('select-pair');
  const [pairData, setPairData] = useState({
    tokenA: null,
    tokenB: null,
    fee: 0.3, // Default fee tier
  });

  const handlePairSubmit = (data: any) => {
    setPairData(data);
    setCurrentStep('set-range');
  };

  const _handleBack = () => {
    setCurrentStep('select-pair');
  };

  return (
    <Card className="overflow-hidden">
      {currentStep === 'select-pair' && (
        <SelectPairStep onSubmit={handlePairSubmit} initialData={pairData} />
      )}
    </Card>
  );
}
