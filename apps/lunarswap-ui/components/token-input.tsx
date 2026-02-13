'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { TokenIcon } from '@/components/token-icon';
import { Input } from '@/components/ui/input';

interface TokenInputProps {
  token: {
    symbol: string;
    name: string;
    address: string;
  } | null;
  amount: string;
  onChange: (value: string) => void;
  onSelectToken: () => void;
  label?: string;
  readonly?: boolean;
  disabled?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  labelPosition?: 'top' | 'left';
  labelAlignment?: 'left' | 'center';
}

export function TokenInput({
  token,
  amount,
  onChange,
  onSelectToken,
  label,
  readonly = false,
  disabled = false,
  isActive = false,
  isLoading = false,
  labelPosition = 'top',
  labelAlignment = 'center',
}: TokenInputProps) {
  return (
    <div
      className={`rounded-xl p-4 transition-all duration-200 ${
        isActive
          ? 'bg-gray-50/40 dark:bg-gray-800/30' // More transparent when active
          : 'bg-gray-100/80 dark:bg-gray-700/50' // Normal opacity when inactive
      }`}
    >
      {labelPosition === 'top' && label && (
        <div
          className={`text-sm text-gray-500 dark:text-gray-400 mb-2 ${
            labelAlignment === 'left' ? 'text-left' : 'text-center'
          }`}
        >
          {label}
        </div>
      )}
      <div className="flex justify-between items-center gap-3">
        {labelPosition === 'left' && label && (
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium min-w-[40px]">
            {label}
          </div>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            type="text"
            placeholder="0"
            value={amount}
            onChange={(e) => onChange(e.target.value)}
            className="border-0 bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto flex-1 min-w-0"
            readOnly={readonly}
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
        <button
          type="button"
          onClick={onSelectToken}
          disabled={disabled}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition border min-w-[140px] justify-between ${
            disabled
              ? 'bg-gray-100/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/30 cursor-not-allowed opacity-50'
              : token
                ? 'bg-white/80 dark:bg-blue-900/50 hover:bg-gray-100 dark:hover:bg-blue-800/50 border-gray-300/50 dark:border-blue-800/30'
                : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {token ? (
              <>
                <TokenIcon symbol={token.symbol} size={24} />
                <span className="font-medium truncate">{token.symbol}</span>
              </>
            ) : (
              <span className="font-medium truncate">Choose token</span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 ${token ? 'text-gray-400' : 'text-blue-500 dark:text-blue-400'}`}
          />
        </button>
      </div>
    </div>
  );
}
