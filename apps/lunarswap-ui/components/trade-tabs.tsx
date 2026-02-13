'use client';

import { useState } from 'react';
import { SwapCard } from './swap-card';
import { Button } from './ui/button';

interface TradeTabsProps {
  initialTokens?: {
    fromToken?: string;
    toToken?: string;
    fromTokenType?: string;
    toTokenType?: string;
  };
  previewMode?: boolean;
}

export function TradeTabs({ initialTokens, previewMode }: TradeTabsProps) {
  const [activeTab, setActiveTab] = useState<'swap' | 'buy'>('swap');

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Label-style navigation above the box */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 py-1 rounded-full transition-all text-sm ${
              activeTab === 'swap'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('swap')}
          >
            Swap
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 py-1 rounded-full transition-all text-sm ${
              activeTab === 'buy'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('buy')}
          >
            Buy
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className="transition-all duration-200">
        <SwapCard
          initialTokens={initialTokens}
          mode={activeTab}
          previewMode={previewMode}
        />
      </div>
    </div>
  );
}
