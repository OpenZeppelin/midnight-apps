'use client';

import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';
import { Identicon } from '@/components/identicon';

interface TokenInputProps {
  token: {
    symbol: string;
    name: string;
    address: string;
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
          placeholder="0"
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          className="border-0 bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
          readOnly={readonly}
        />
        <button
          type="button"
          onClick={onSelectToken}
          className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-blue-900/50 hover:bg-gray-100 dark:hover:bg-blue-800/50 px-3 py-1.5 transition border border-gray-300/50 dark:border-blue-800/30"
        >
          <div className="relative h-6 w-6 rounded-full overflow-hidden">
            <Identicon address={token.address} size={24} />
          </div>
          <span className="font-medium">{token.symbol}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
