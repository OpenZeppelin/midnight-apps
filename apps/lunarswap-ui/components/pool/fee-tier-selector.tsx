'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FeeTierSelectorProps {
  selectedFee: number;
  onSelectFee: (fee: number) => void;
}

export function FeeTierSelector({
  selectedFee,
  onSelectFee,
}: FeeTierSelectorProps) {
  const feeTiers = [
    {
      value: 0.05,
      label: '0.05%',
      description: 'Best for stable pairs',
      example: 'DAI/USDC',
    },
    {
      value: 0.3,
      label: '0.3%',
      description: 'Best for most pairs',
      example: 'NIGHT/USDC',
    },
    {
      value: 1,
      label: '1%',
      description: 'Best for exotic pairs',
      example: 'NIGHT/DAI',
    },
  ];

  return (
    <RadioGroup
      value={selectedFee.toString()}
      onValueChange={(value) => onSelectFee(Number.parseFloat(value))}
      className="grid grid-cols-1 md:grid-cols-3 gap-3"
    >
      {feeTiers.map((tier) => (
        <div key={tier.value} className="relative">
          <RadioGroupItem
            value={tier.value.toString()}
            id={`fee-${tier.value}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`fee-${tier.value}`}
            className="flex flex-col p-4 border rounded-lg cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 peer-data-[state=checked]:border-blue-500 dark:peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50/50 dark:peer-data-[state=checked]:bg-blue-900/20"
          >
            <span className="font-medium text-lg">{tier.label}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tier.description}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Example: {tier.example}
            </span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
