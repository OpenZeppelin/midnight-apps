'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/use-wallet';

interface LiquidityActionsProps {
  onAddLiquidity?: () => void;
  onRemoveLiquidity?: () => void;
}

export function LiquidityActions({
  onAddLiquidity,
  onRemoveLiquidity,
}: LiquidityActionsProps) {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleAddLiquidity = () => {
    if (onAddLiquidity) {
      onAddLiquidity();
    } else {
      navigate('/pool/new');
    }
  };

  const handleRemoveLiquidity = () => {
    if (onRemoveLiquidity) {
      onRemoveLiquidity();
    } else {
      navigate('/explore', { state: { selectedOption: 'pools' } });
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Liquidity Actions</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your wallet to manage liquidity positions
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Connect your wallet to add or remove liquidity from token pairs
            </p>
            <Button disabled variant="outline">
              Connect Wallet First
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add or remove liquidity from your preferred token pairs
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Liquidity */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Add Liquidity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Provide liquidity to earn fees
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Add tokens to existing pools or create new positions. The system
              will generate zero-knowledge proofs assuming sufficient balance.
            </p>
            <Button
              onClick={handleAddLiquidity}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              Add Liquidity
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Remove Liquidity */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Minus className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Remove Liquidity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Withdraw your tokens and fees
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Remove liquidity from your positions and collect accumulated fees.
              Your privacy is maintained throughout the process.
            </p>
            <Button
              onClick={handleRemoveLiquidity}
              variant="outline"
              className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
            >
              Remove Liquidity
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Privacy-First Operations
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                All liquidity operations use zero-knowledge proofs. The system
                cannot see your actual balances but assumes sufficient funds for
                proof generation. This maintains your privacy while enabling
                seamless DeFi operations.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
