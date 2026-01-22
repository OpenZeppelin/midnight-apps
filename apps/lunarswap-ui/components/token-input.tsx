'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface TokenInputProps {
  token: {
    symbol: string;
    name: string;
    logo: string;
    balance: string;
  };
  amount: string;
  onChange: (value: string) => void;
  onSelectToken: () => void;
  label?: string;
  readonly?: boolean;
}

export function TokenInput({
  token,
  amount,
  onChange,
  onSelectToken,
  label,
  readonly = false,
}: TokenInputProps) {
  return (
    <div className="rounded-xl bg-gray-100/80 dark:bg-gray-700/50 p-4">
      {label && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </div>
      )}
      <div className="flex justify-between">
        <Input
          type="text"
          placeholder="0.0"
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          className="border-0 bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
          readOnly={readonly}
        />
        <button
          onClick={onSelectToken}
          className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-blue-900/50 hover:bg-gray-100 dark:hover:bg-blue-800/50 px-3 py-1.5 transition border border-gray-300/50 dark:border-blue-800/30"
        >
          <div className="relative h-6 w-6 rounded-full overflow-hidden">
            <Image
              src={token.logo || '/placeholder.svg'}
              alt={token.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="font-medium">{token.symbol}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Balance: {token.balance}</span>
        <button
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          onClick={() => onChange(token.balance)}
        >
          Max
        </button>
      </div>
    </div>
  );
}
