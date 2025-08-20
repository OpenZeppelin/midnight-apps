'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import { useWallet } from '@/hooks/use-wallet';
import { getTokenSymbolByColor } from '@/lib/token-utils';
import { SplitTokenIcon } from '@/components/pool/split-token-icon';

interface PositionData {
  pairId: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Type: Uint8Array;
  token1Type: Uint8Array;
  fee: number;
  version: string;
  lpTokenType: Uint8Array;
}

interface SelectPositionStepProps {
  onSubmit: (data: PositionData) => void;
  initialData: PositionData | null;
}

export function SelectPositionStep({
  onSubmit,
  initialData,
}: SelectPositionStepProps) {
  const { allPairs } = useLunarswapContext();
  const { isConnected } = useWallet();
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(
    initialData,
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Convert allPairs to position data format
  const availablePositions = allPairs.map((pool) => {
    const token0Symbol = getTokenSymbolByColor(
      Buffer.from(pool.pair.token0Type).toString('hex'),
    );
    const token1Symbol = getTokenSymbolByColor(
      Buffer.from(pool.pair.token1Type).toString('hex'),
    );

    return {
      pairId: pool.pairId,
      token0Symbol,
      token1Symbol,
      token0Type: pool.pair.token0Type,
      token1Type: pool.pair.token1Type,
      fee: 0.3, // Default fee tier for now
      version: 'v1', // Default version for now
      lpTokenType: pool.pair.lpTokenType, // Add LP token type for liquidity parameter
    };
  });

  // Filter positions based on search query
  const filteredPositions = availablePositions.filter(
    (position) =>
      position.token0Symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.token1Symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.pairId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleContinue = () => {
    if (selectedPosition) {
      onSubmit(selectedPosition);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Select Position</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the liquidity position you want to remove liquidity from
          </p>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Connect wallet first to fetch liquidity positions.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You need to connect your wallet to view and manage your liquidity
            positions.
          </p>
        </div>
      </div>
    );
  }

  if (availablePositions.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Select Position</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the liquidity position you want to remove liquidity from
          </p>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Pools Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            There are currently no liquidity pools available to remove liquidity
            from.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You can create new positions by adding liquidity to existing pools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Position</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the liquidity position you want to remove liquidity from
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by token pair or pair ID"
            className="pl-9 bg-gray-100/80 dark:bg-gray-700/60 border-gray-300/50 dark:border-blue-900/30 focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {filteredPositions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No positions found matching your search</p>
          </div>
        ) : (
          filteredPositions.map((position) => (
            <Card
              key={position.pairId}
              className={`cursor-pointer transition-all ${
                selectedPosition?.pairId === position.pairId
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedPosition(position)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SplitTokenIcon
                      tokenASymbol={position.token0Symbol}
                      tokenBSymbol={position.token1Symbol}
                      size={32}
                    />
                    <div>
                      <div className="font-medium">
                        {position.token0Symbol}/{position.token1Symbol}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Pair ID: {position.pairId.slice(0, 8)}...
                        {position.pairId.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {position.fee}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {position.version}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => setSelectedPosition(null)}>
          Clear Selection
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedPosition}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Continue to Withdrawal
        </Button>
      </div>
    </div>
  );
}
