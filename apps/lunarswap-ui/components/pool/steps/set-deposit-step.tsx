'use client';

import {
  calculateAddLiquidityAmounts,
  hasLiquidity,
  SLIPPAGE_TOLERANCE,
} from '@openzeppelin/midnight-apps-lunarswap-sdk';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLogger } from '@/hooks/use-logger';
import { useActiveNetworkConfig } from '@/lib/runtime-configuration';
import type { Token as UiToken } from '@/lib/token-config';
import { useWallet } from '../../../hooks/use-wallet';
import { useLunarswapContext } from '../../../lib/lunarswap-context';
import { createContractIntegration } from '../../../lib/lunarswap-integration';
import { Button } from '../../ui/button';
import { LiquidityProgress } from '../liquidity-progress';
import { SplitTokenIcon } from '../split-token-icon';
import { ZkWarningDialog } from '../zk-warning-dialog';

interface PairData {
  version: string;
  fee: number;
  tokenA: UiToken;
  tokenB: UiToken;
}

interface SetDepositStepProps {
  pairData: PairData;
}

export function SetDepositStep({ pairData }: SetDepositStepProps) {
  const _logger = useLogger();
  const activeNetwork = useActiveNetworkConfig();
  const { isConnected, address, providers, walletAPI, callback } = useWallet();
  const { lunarswap, status, pauseRefresh, resumeRefresh } =
    useLunarswapContext();
  const [refreshPauseTimeout, setRefreshPauseTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');
  const [_poolExists, _setPoolExists] = useState<boolean | null>(null);
  const [poolReserves, _setPoolReserves] = useState<[bigint, bigint] | null>(
    null,
  );
  const [calculatedAmounts, setCalculatedAmounts] = useState<{
    amountAOptimal: bigint;
    amountBOptimal: bigint;
    amountAMin: bigint;
    amountBMin: bigint;
  } | null>(null);

  // Transaction state tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showZkWarning, setShowZkWarning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Temporarily pause refresh when component mounts to prevent interference
  useEffect(() => {
    pauseRefresh();

    // Resume refresh after a short delay
    const resumeTimer = setTimeout(() => {
      resumeRefresh();
    }, 2000);

    return () => {
      clearTimeout(resumeTimer);
      // Ensure refresh is resumed if component unmounts
      resumeRefresh();
    };
  }, [pauseRefresh, resumeRefresh]);

  // Calculate optimal amounts when inputs change
  useEffect(() => {
    const calculateAmounts = () => {
      if (
        !amountA ||
        !amountB ||
        Number.parseFloat(amountA) <= 0 ||
        Number.parseFloat(amountB) <= 0
      ) {
        setCalculatedAmounts(null);
        return;
      }

      try {
        // Get current reserves (use 0 for new pools)
        let reserveA = BigInt(0);
        let reserveB = BigInt(0);

        if (poolReserves && hasLiquidity(poolReserves[0], poolReserves[1])) {
          [reserveA, reserveB] = poolReserves;
        }

        // Calculate optimal amounts using SDK
        const amounts = calculateAddLiquidityAmounts(
          BigInt(amountA),
          BigInt(amountB),
          reserveA,
          reserveB,
          SLIPPAGE_TOLERANCE.LOW,
        );

        setCalculatedAmounts(amounts);
      } catch (error) {
        _logger?.error(
          { error },
          `[SetDepositStep] Error calculating optimal amounts: ${error instanceof Error ? error.message : String(error)}`,
        );
        setCalculatedAmounts(null);
      }
    };

    calculateAmounts();
  }, [amountA, amountB, poolReserves, _logger]);

  const handleAddLiquidity = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!lunarswap || status !== 'connected') {
      toast.error('Contract not connected. Please try again.');
      return;
    }

    if (!amountA || !amountB) {
      toast.error('Please enter valid amounts');
      return;
    }

    if (!address) {
      toast.error('Wallet address not available');
      return;
    }

    if (!walletAPI) {
      toast.error('Wallet API not available');
      return;
    }

    // Pause the context refresh immediately to prevent memory issues
    pauseRefresh();

    // Set a safety timeout to resume refresh after 5 minutes (in case something goes wrong)
    const timeout = setTimeout(
      () => {
        resumeRefresh();
      },
      5 * 60 * 1000,
    ); // 5 minutes
    setRefreshPauseTimeout(timeout);

    // Show ZK warning popup first
    setShowZkWarning(true);
  };

  const handleProceedWithAddLiquidity = async () => {
    setShowZkWarning(false);
    setIsSubmitting(true);
    setShowProgress(true);

    try {
      // Pause the context refresh during transaction
      pauseRefresh();

      // Validate amounts
      if (
        !amountA ||
        !amountB ||
        Number.parseFloat(amountA) <= 0 ||
        Number.parseFloat(amountB) <= 0
      ) {
        throw new Error('Please enter valid amounts greater than 0');
      }

      // Ensure walletAPI is available
      if (!walletAPI) {
        throw new Error('Wallet API not available');
      }

      // Ensure coinPublicKey is available
      if (!walletAPI.coinPublicKey) {
        throw new Error(
          'Wallet coin public key not available. Please ensure your wallet is properly connected.',
        );
      }

      // Create contract integration
      const lunarswapIntegration = createContractIntegration(
        providers,
        walletAPI,
        callback,
        activeNetwork.LUNARSWAP_ADDRESS,
        undefined,
        undefined,
      );
      if (!lunarswapIntegration) {
        throw new Error(
          'Failed to create contract integration. Please try again.',
        );
      }

      // Get current reserves (use 0 for new pools)
      let reserveA = BigInt(0);
      let reserveB = BigInt(0);

      if (poolReserves && hasLiquidity(poolReserves[0], poolReserves[1])) {
        [reserveA, reserveB] = poolReserves;
      }

      // Use SDK to calculate optimal amounts and minimum amounts with slippage protection
      const { amountAMin, amountBMin } = calculateAddLiquidityAmounts(
        BigInt(amountA),
        BigInt(amountB),
        reserveA,
        reserveB,
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage tolerance
      );

      await lunarswapIntegration.addLiquidity(
        pairData.tokenA.type,
        pairData.tokenB.type,
        BigInt(amountA),
        BigInt(amountB),
        BigInt(amountAMin),
        BigInt(amountBMin),
        walletAPI.coinPublicKey,
      );

      toast.success('Liquidity added successfully!');

      // Reset form
      setAmountA('');
      setAmountB('');
      setCalculatedAmounts(null);

      // Transaction completed successfully - progress dialog will close via onComplete callback
    } catch (error) {
      _logger?.error(
        { error },
        `[AddLiquidity] Error: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Insufficient')) {
          toast.error('Insufficient token balance for liquidity addition');
        } else if (error.message.includes('Slippage')) {
          toast.error(
            'Transaction failed due to high slippage. Try adjusting amounts.',
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
          toast.error(`Add liquidity failed: ${error.message}`);
        }
      } else {
        toast.error('Add liquidity failed. Please try again.');
      }

      // Close progress dialog on error
      setShowProgress(false);
      setIsSubmitting(false);
    } finally {
      // Resume the context refresh after transaction
      resumeRefresh();
      // Clear the safety timeout
      if (refreshPauseTimeout) {
        clearTimeout(refreshPauseTimeout);
        setRefreshPauseTimeout(null);
      }
    }
  };

  const handleProgressComplete = () => {
    setShowProgress(false);
    setIsSubmitting(false);
    // Reset form after successful completion
    setAmountA('');
    setAmountB('');
    setCalculatedAmounts(null);
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setIsSubmitting(false);
    // Resume refresh if user closes progress
    resumeRefresh();
    // Clear the safety timeout
    if (refreshPauseTimeout) {
      clearTimeout(refreshPauseTimeout);
      setRefreshPauseTimeout(null);
    }
  };

  // Use the token objects directly from pairData with validation
  const tokenADetails = pairData?.tokenA;
  const tokenBDetails = pairData?.tokenB;

  // Validate token details exist
  if (!tokenADetails || !tokenBDetails) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400">
          Error: Token details not available. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ZK Proof Warning Dialog */}
      <ZkWarningDialog
        isOpen={showZkWarning}
        onClose={() => {
          setShowZkWarning(false);
          // Resume refresh if user cancels
          resumeRefresh();
          // Clear the safety timeout
          if (refreshPauseTimeout) {
            clearTimeout(refreshPauseTimeout);
            setRefreshPauseTimeout(null);
          }
        }}
        onProceed={handleProceedWithAddLiquidity}
        isSubmitting={isSubmitting}
        operationType="add-liquidity"
        tokenASymbol={tokenADetails.symbol}
        tokenBSymbol={tokenBDetails.symbol}
      />

      {/* Progress Dialog */}
      <LiquidityProgress
        isOpen={showProgress}
        onClose={handleProgressClose}
        onComplete={handleProgressComplete}
        operationType="add-liquidity"
      />

      <CardContent className="p-4">
        <div className="mb-4">
          {/* Pair Header with Icons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <SplitTokenIcon
                tokenASymbol={tokenADetails.symbol || 'UNKNOWN'}
                tokenBSymbol={tokenBDetails.symbol || 'UNKNOWN'}
                size={24}
                className="mr-2"
              />
              <div className="flex items-center">
                <span className="font-medium mr-1 text-sm">
                  {tokenADetails.symbol || 'Unknown'}
                </span>
                <span className="text-gray-500">/</span>
                <span className="font-medium ml-1 text-sm">
                  {tokenBDetails.symbol || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span>{pairData.version}</span>
              <span className="mx-1">·</span>
              <span>{pairData.fee}%</span>
            </div>
          </div>

          {/* Pool Status */}
          <div className="mb-3 p-2 rounded bg-gray-50 dark:bg-gray-800/50">
            <div className="text-xs">
              <span className="font-medium">Pool Status: </span>
              <span className="text-orange-600">New Pool</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              This will be a new liquidity pool
            </div>
          </div>

          <h3 className="text-base font-medium mb-2">Deposit tokens</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Specify the token amounts for your liquidity contribution.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm rounded">
              <Input
                type="text"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="text-xl font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="0"
              />
              <div className="flex justify-between mt-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium">
                    {tokenADetails.symbol || 'Unknown Token'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm rounded">
              <Input
                type="text"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="text-xl font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="0"
              />
              <div className="flex justify-between mt-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium">
                    {tokenBDetails.symbol || 'Unknown Token'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          {calculatedAmounts && (
            <div className="mt-3 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
              <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                Liquidity Calculation Preview
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    Optimal {tokenADetails.symbol || 'Unknown'}:
                  </span>
                  <span className="font-mono font-medium">
                    {Number(calculatedAmounts.amountAOptimal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    Optimal {tokenBDetails.symbol || 'Unknown'}:
                  </span>
                  <span className="font-mono font-medium">
                    {Number(calculatedAmounts.amountBOptimal)}
                  </span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-700 pt-1 mt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">
                      Min {tokenADetails.symbol || 'Unknown'} (with 0.5%
                      slippage):
                    </span>
                    <span className="font-mono">
                      {Number(calculatedAmounts.amountAMin)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">
                      Min {tokenBDetails.symbol || 'Unknown'} (with 0.5%
                      slippage):
                    </span>
                    <span className="font-mono">
                      {Number(calculatedAmounts.amountBMin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isConnected && (!lunarswap || status !== 'connected') && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              🔄 Connecting to LunarSwap contract...
            </p>
          </div>
        )}

        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50 transition-all duration-300 text-sm"
          disabled={
            !isConnected ||
            !lunarswap ||
            status !== 'connected' ||
            !amountA ||
            !amountB ||
            isSubmitting
          }
          onClick={handleAddLiquidity}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {!isConnected
            ? 'Connect Wallet'
            : !lunarswap || status !== 'connected'
              ? 'Connecting...'
              : !amountA || !amountB
                ? 'Enter Amounts'
                : isSubmitting
                  ? 'Processing...'
                  : 'Add Liquidity'}
        </Button>
      </CardFooter>
    </>
  );
}
