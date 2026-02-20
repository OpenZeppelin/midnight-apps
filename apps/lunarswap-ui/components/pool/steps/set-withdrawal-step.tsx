'use client';
import { decodeRawTokenType } from '@midnight-ntwrk/ledger-v7';
import {
  calculateRemoveLiquidityMinimums,
  SLIPPAGE_TOLERANCE,
} from '@openzeppelin/midnight-apps-lunarswap-sdk';
import { Buffer } from 'buffer';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SplitTokenIcon } from '@/components/pool/split-token-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogger } from '@/hooks/use-logger';
import { useWallet } from '@/hooks/use-wallet';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import { LiquidityProgress } from '../liquidity-progress';
import { ZkWarningDialog } from '../zk-warning-dialog';

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

interface SetWithdrawalStepProps {
  positionData: PositionData;
}

export function SetWithdrawalStep({ positionData }: SetWithdrawalStepProps) {
  const _logger = useLogger();
  const {
    lunarswap,
    status,
    totalSupply: lpTotalSupply,
  } = useLunarswapContext();
  const { isConnected, walletAPI } = useWallet();
  const [lpTokenAmount, setLpTokenAmount] = useState('');
  const [token0Amount, setToken0Amount] = useState('');
  const [token1Amount, setToken1Amount] = useState('');
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pairReserves, setPairReserves] = useState<[bigint, bigint] | null>(
    null,
  );
  const [totalLpSupply, setTotalLpSupply] = useState<bigint | null>(null);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(
    SLIPPAGE_TOLERANCE.LOW,
  );
  const [showZkWarning, setShowZkWarning] = useState(false);
  const [isProofGenerating, setIsProofGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Prevent page refresh during proof generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProofGenerating) {
        e.preventDefault();
        e.returnValue =
          'ZK proof is being generated. Please wait and do not refresh the page.';
        return e.returnValue;
      }
    };

    if (isProofGenerating) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProofGenerating]);

  const fetchPairData = useCallback(async () => {
    if (!lunarswap) return;

    setIsCalculating(true);
    try {
      // Get current reserves
      const reserves = await lunarswap.getPairReserves(
        decodeRawTokenType(positionData.token0Type),
        decodeRawTokenType(positionData.token1Type),
      );
      setPairReserves(reserves);

      // Use lpTotalSupply from context (ledger state) for this pair
      if (!lpTotalSupply) {
        throw new Error('LP total supply not available in context');
      }

      const pairId = await lunarswap.getPairId(
        decodeRawTokenType(positionData.token0Type),
        decodeRawTokenType(positionData.token1Type),
      );
      const supplyFound = lpTotalSupply.lookup(pairId);

      setTotalLpSupply(supplyFound);
    } catch (error) {
      _logger?.error(
        { error },
        `[SetWithdrawalStep] Failed to fetch pair data: ${error instanceof Error ? error.message : String(error)}`,
      );
      toast.error('Failed to fetch pool data. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  }, [
    lunarswap,
    positionData.token0Type,
    positionData.token1Type,
    lpTotalSupply,
    _logger,
  ]);

  // Fetch pair data when component mounts
  useEffect(() => {
    if (lunarswap && status === 'connected') {
      fetchPairData();
    }
  }, [lunarswap, status, fetchPairData]);

  const calculateTokenAmounts = (lpAmount: string) => {
    if (!pairReserves || !totalLpSupply || !lpAmount) {
      setToken0Amount('');
      setToken1Amount('');
      return;
    }

    try {
      const lpAmountBigInt = BigInt(lpAmount);
      if (lpAmountBigInt <= 0n || lpAmountBigInt > totalLpSupply) {
        setToken0Amount('');
        setToken1Amount('');
        return;
      }

      // Calculate expected token amounts based on LP token proportion
      const [reserveA, reserveB] = pairReserves;
      const expectedAmountA = (lpAmountBigInt * reserveA) / totalLpSupply;
      const expectedAmountB = (lpAmountBigInt * reserveB) / totalLpSupply;

      // Format amounts with 6 decimals (Midnight standard)
      setToken0Amount((Number(expectedAmountA) / 1e6).toFixed(6));
      setToken1Amount((Number(expectedAmountB) / 1e6).toFixed(6));
    } catch (error) {
      _logger?.error(
        { error },
        `[SetWithdrawalStep] Error calculating token amounts: ${error instanceof Error ? error.message : String(error)}`,
      );
      setToken0Amount('');
      setToken1Amount('');
    }
  };

  const handleLpAmountChange = (value: string) => {
    setLpTokenAmount(value);
    calculateTokenAmounts(value);
  };

  const handleRemoveLiquidity = async () => {
    if (!isConnected || !walletAPI || !lunarswap || status !== 'connected') {
      toast.error('Wallet not connected or contract not ready');
      return;
    }

    if (!lpTokenAmount || !pairReserves || !totalLpSupply) {
      toast.error('Please enter a valid LP token amount');
      return;
    }

    const lpAmountBigInt = BigInt(lpTokenAmount);
    if (lpAmountBigInt <= 0n || lpAmountBigInt > totalLpSupply) {
      toast.error('Invalid LP token amount');
      return;
    }

    // Show ZK warning popup first
    setShowZkWarning(true);
  };

  const handleProceedWithRemoval = async () => {
    setShowZkWarning(false);
    setIsRemovingLiquidity(true);
    setIsProofGenerating(true);
    setShowProgress(true);

    try {
      // Prepare token type hex strings
      const token0Type = decodeRawTokenType(positionData.token0Type).toString();
      const token1Type = decodeRawTokenType(positionData.token1Type).toString();
      const lpTokenType = decodeRawTokenType(
        positionData.lpTokenType,
      ).toString();

      // Ensure we have all required data
      if (!pairReserves || !totalLpSupply) {
        throw new Error('Missing pair data for liquidity removal');
      }

      if (!lunarswap || !walletAPI) {
        throw new Error('Wallet or contract not ready');
      }

      // Calculate minimum amounts using SDK
      const { amountAMin, amountBMin } = calculateRemoveLiquidityMinimums(
        BigInt(lpTokenAmount),
        totalLpSupply,
        pairReserves[0],
        pairReserves[1],
        slippageTolerance,
      );

      // Call the actual removeLiquidity method
      await lunarswap.removeLiquidity(
        token0Type,
        token1Type,
        lpTokenType,
        lpTokenAmount,
        amountAMin,
        amountBMin,
        walletAPI.coinPublicKey,
      );

      toast.success(
        `Successfully initiated liquidity removal for ${lpTokenAmount} LP tokens`,
      );

      // Reset form
      setLpTokenAmount('');
      setToken0Amount('');
      setToken1Amount('');

      // Transaction completed successfully - progress dialog will close via onComplete callback
    } catch (error) {
      console.error('Error removing liquidity:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Insufficient')) {
          toast.error('Insufficient liquidity balance for removal');
        } else if (error.message.includes('Slippage')) {
          toast.error(
            'Transaction failed due to high slippage. Try reducing the amount.',
          );
        } else if (
          error.message.includes('network') ||
          error.message.includes('connection')
        ) {
          toast.error(
            'Network connection issue. Please check your internet connection and try again.',
          );
        } else if (error.message.includes('wallet')) {
          toast.error(
            'Wallet connection issue. Please ensure your Midnight Lace wallet is connected and try again.',
          );
        } else {
          toast.error(`Remove liquidity failed: ${error.message}`);
        }
      } else {
        toast.error('Remove liquidity failed. Please try again.');
      }

      // Close progress dialog on error
      setShowProgress(false);
      setIsRemovingLiquidity(false);
      setIsProofGenerating(false);
    }
  };

  const getSlippagePercentage = () => {
    return (slippageTolerance / 100).toFixed(1);
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setIsRemovingLiquidity(false);
    setIsProofGenerating(false);
  };

  const handleProgressComplete = () => {
    setShowProgress(false);
    setIsRemovingLiquidity(false);
    setIsProofGenerating(false);
    // Reset form after successful completion
    setLpTokenAmount('');
    setToken0Amount('');
    setToken1Amount('');
  };

  return (
    <div className="p-6">
      {/* ZK Proof Warning Dialog */}
      <ZkWarningDialog
        isOpen={showZkWarning}
        onClose={() => setShowZkWarning(false)}
        onProceed={handleProceedWithRemoval}
        isSubmitting={isRemovingLiquidity}
        operationType="remove-liquidity"
      />

      {/* Progress Dialog */}
      <LiquidityProgress
        isOpen={showProgress}
        onClose={handleProgressClose}
        onComplete={handleProgressComplete}
        operationType="remove-liquidity"
      />

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Remove Liquidity</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Specify the amount of LP tokens to remove from your{' '}
          {positionData.token0Symbol}/{positionData.token1Symbol} position
        </p>
      </div>

      {/* Position Summary */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SplitTokenIcon
                tokenASymbol={positionData.token0Symbol}
                tokenBSymbol={positionData.token1Symbol}
                size={32}
              />
              <div>
                <div className="font-medium">
                  {positionData.token0Symbol}/{positionData.token1Symbol}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Fee: {positionData.fee}% • {positionData.version}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  LP Token:{' '}
                  {Buffer.from(positionData.lpTokenType)
                    .toString('hex')
                    .slice(0, 8)}
                  ...
                  {Buffer.from(positionData.lpTokenType)
                    .toString('hex')
                    .slice(-8)}
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {positionData.pairId.slice(0, 8)}...
              {positionData.pairId.slice(-8)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pool Information */}
      {pairReserves !== null && totalLpSupply !== null && (
        <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">
                  Total LP Supply
                </Label>
                <div className="font-medium">{totalLpSupply.toString()}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">
                  Current Reserves
                </Label>
                <div className="font-medium">
                  {positionData.token0Symbol}: {pairReserves[0].toString()}
                </div>
                <div className="font-medium">
                  {positionData.token1Symbol}: {pairReserves[1].toString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LP Token Input */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">
          LP Token Amount to Remove
        </Label>
        <Input
          value={lpTokenAmount}
          onChange={(e) => handleLpAmountChange(e.target.value)}
          placeholder="Enter LP token amount"
          className="w-full"
          type="number"
          min="0"
          step="1"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Enter the amount of LP tokens you want to remove
        </p>
        {totalLpSupply !== null && lpTokenAmount && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Max available: {totalLpSupply.toString()} LP tokens
          </p>
        )}
      </div>

      {/* Calculated Token Amounts */}
      {(token0Amount || token1Amount) && (
        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {positionData.token0Symbol} Amount (Calculated)
            </Label>
            <Input
              value={token0Amount}
              placeholder="0.000000"
              className="w-full"
              disabled
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {positionData.token1Symbol} Amount (Calculated)
            </Label>
            <Input
              value={token1Amount}
              placeholder="0.000000"
              className="w-full"
              disabled
            />
          </div>
        </div>
      )}

      {/* Slippage Tolerance */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">
          Slippage Tolerance: {getSlippagePercentage()}%
        </Label>
        <div className="flex space-x-2">
          {Object.entries(SLIPPAGE_TOLERANCE).map(([key, value]) => (
            <Button
              key={key}
              variant={slippageTolerance === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSlippageTolerance(value)}
            >
              {(value / 100).toFixed(1)}%
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" disabled={isRemovingLiquidity}>
          Cancel
        </Button>
        <Button
          onClick={handleRemoveLiquidity}
          disabled={
            isRemovingLiquidity ||
            !isConnected ||
            status !== 'connected' ||
            !lpTokenAmount ||
            !pairReserves ||
            !totalLpSupply
          }
          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
        >
          {isRemovingLiquidity && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {isRemovingLiquidity ? 'Removing Liquidity...' : 'Remove Liquidity'}
        </Button>
      </div>

      {/* Loading State */}
      {isCalculating && (
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
          Fetching pool data...
        </div>
      )}
    </div>
  );
}
