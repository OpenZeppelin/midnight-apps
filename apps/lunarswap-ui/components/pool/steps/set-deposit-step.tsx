'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/hooks/use-wallet';
import { createContractIntegration, DEMO_TOKENS } from '@/lib/contract-integration';
import { 
  calculateAddLiquidityAmounts, 
  SLIPPAGE_TOLERANCE,
  hasLiquidity 
} from '@midnight-dapps/lunarswap-sdk';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PairData {
  version: string;
  fee: number;
  tokenA: string;
  tokenB: string;
}

interface SetDepositStepProps {
  pairData: PairData;
}

export function SetDepositStep({ pairData }: SetDepositStepProps) {
  const walletContext = useWallet();
  const { isConnected, address, providers } = walletContext;
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [poolReserves, setPoolReserves] = useState<[bigint, bigint] | null>(null);
  const [calculatedAmounts, setCalculatedAmounts] = useState<{
    amountAOptimal: bigint;
    amountBOptimal: bigint;
    amountAMin: bigint;
    amountBMin: bigint;
  } | null>(null);

  const [amountA, setAmountA] = useState('1');
  const [amountB, setAmountB] = useState('1831.102949');

  // Get token details from DEMO_TOKENS
  const tokenADetails = Object.values(DEMO_TOKENS).find(token => token.symbol === pairData.tokenA) || DEMO_TOKENS.TUSD;
  const tokenBDetails = Object.values(DEMO_TOKENS).find(token => token.symbol === pairData.tokenB) || DEMO_TOKENS.TEURO;

  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch pool data when component mounts
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (!walletContext.walletAPI || !isConnected) return;

      try {
        const contractIntegration = createContractIntegration(providers, walletContext.walletAPI.wallet);
        await contractIntegration.initialize();

        // Check if pair exists
        const exists = await contractIntegration.isPairExists(pairData.tokenA, pairData.tokenB);
        setPoolExists(exists);

        if (exists) {
          // Get reserves if pair exists
          const reserves = await contractIntegration.getPairReserves(pairData.tokenA, pairData.tokenB);
          setPoolReserves(reserves);
        }
      } catch (error) {
        console.error('Failed to fetch pool info:', error);
      }
    };

    fetchPoolInfo();
  }, [isConnected, walletContext.walletAPI, providers, pairData.tokenA, pairData.tokenB]);

  // Calculate optimal amounts when inputs change
  useEffect(() => {
    const calculateAmounts = () => {
      if (!amountA || !amountB || Number.parseFloat(amountA) <= 0 || Number.parseFloat(amountB) <= 0) {
        setCalculatedAmounts(null);
        return;
      }

      try {
        const amountADesired = BigInt(Math.floor(Number.parseFloat(amountA) * 1e18));
        const amountBDesired = BigInt(Math.floor(Number.parseFloat(amountB) * 1e18));

        // Get current reserves (use 0 for new pools)
        let reserveA = BigInt(0);
        let reserveB = BigInt(0);
        
        if (poolReserves && hasLiquidity(poolReserves[0], poolReserves[1])) {
          [reserveA, reserveB] = poolReserves;
        }

        // Calculate optimal amounts using SDK
        const amounts = calculateAddLiquidityAmounts(
          amountADesired,
          amountBDesired,
          reserveA,
          reserveB,
          SLIPPAGE_TOLERANCE.LOW
        );

        setCalculatedAmounts(amounts);
      } catch (error) {
        console.error('Error calculating optimal amounts:', error);
        setCalculatedAmounts(null);
      }
    };

    calculateAmounts();
  }, [amountA, amountB, poolReserves]);

  // Simulated USD values (you could calculate these based on reserves in production)
  const valueA = '$1,786.54';
  const valueB = '$1,831.55';

  const handleAddLiquidity = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!walletContext.walletAPI) {
      toast.error('Wallet API not available');
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

    setIsSubmitting(true);
    try {
      // Create contract integration instance
      const contractIntegration = createContractIntegration(providers, walletContext.walletAPI.wallet);

      // Initialize the contract
      await contractIntegration.initialize();

      // Convert input amounts to BigInt (assuming 18 decimals)
      const amountADesired = BigInt(Math.floor(Number.parseFloat(amountA) * 1e18));
      const amountBDesired = BigInt(Math.floor(Number.parseFloat(amountB) * 1e18));

      // Get current reserves (use 0 for new pools)
      let reserveA = BigInt(0);
      let reserveB = BigInt(0);
      
      if (poolReserves && hasLiquidity(poolReserves[0], poolReserves[1])) {
        [reserveA, reserveB] = poolReserves;
      }

      // Use SDK to calculate optimal amounts and minimum amounts with slippage protection
      const {
        amountAOptimal,
        amountBOptimal,
        amountAMin,
        amountBMin
      } = calculateAddLiquidityAmounts(
        amountADesired,
        amountBDesired,
        reserveA,
        reserveB,
        SLIPPAGE_TOLERANCE.LOW // 0.5% slippage tolerance
      );

      // Prepare liquidity parameters
      const liquidityParams = {
        tokenA: pairData.tokenA,
        tokenB: pairData.tokenB,
        amountADesired: amountAOptimal.toString(),
        amountBDesired: amountBOptimal.toString(),
        amountAMin: amountAMin.toString(),
        amountBMin: amountBMin.toString(),
        recipient: address,
        deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now
      };

      // Execute the add liquidity transaction
      await contractIntegration.addLiquidity(
        liquidityParams.tokenA,
        liquidityParams.tokenB,
        liquidityParams.amountADesired,
        liquidityParams.amountBDesired,
        liquidityParams.amountAMin,
        liquidityParams.amountBMin,
        liquidityParams.recipient
      );

      toast.success('Liquidity added successfully!');
        
      // Update the input amounts to reflect what was actually used
      setAmountA((Number(amountAOptimal) / 1e18).toString());
      setAmountB((Number(amountBOptimal) / 1e18).toString());
        
      // Refresh pool data after successful transaction
      const exists = await contractIntegration.isPairExists(pairData.tokenA, pairData.tokenB);
      setPoolExists(exists);
      if (exists) {
        const reserves = await contractIntegration.getPairReserves(pairData.tokenA, pairData.tokenB);
        setPoolReserves(reserves);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add liquidity';
      toast.error(errorMessage);
      console.error('Add liquidity error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (!isHydrated) return 'Loading...';
    if (!isConnected) return 'Connect Wallet';
    if (!amountA || !amountB) return 'Enter amounts';
    if (isSubmitting) return 'Adding Liquidity...';
    return 'Add Liquidity';
  };

  const isButtonDisabled = () => {
    return (
      !isHydrated ||
      !isConnected ||
      !amountA ||
      !amountB ||
      isSubmitting ||
      !walletContext.walletAPI ||
      !calculatedAmounts // Disable if calculations aren't ready
    );
  };

  return (
    <>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="relative h-8 w-8 mr-2">
                <div className="absolute top-0 left-0 h-8 w-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900">
                  <img
                    src="/placeholder.svg?height=32&width=32"
                    alt=""
                    width={32}
                    height={32}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">{tokenADetails.symbol}</span>
                <span className="text-gray-500">/</span>
                <span className="font-medium ml-2">{tokenBDetails.symbol}</span>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>{pairData.version}</span>
              <span className="mx-1">·</span>
              <span>{pairData.fee}%</span>
            </div>
          </div>

          {/* Pool Status */}
          {poolExists !== null && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-sm">
                <span className="font-medium">Pool Status: </span>
                {poolExists ? (
                  <span className="text-green-600">Exists</span>
                ) : (
                  <span className="text-orange-600">New Pool</span>
                )}
              </div>
              {poolExists && poolReserves && (
                <div className="text-xs text-gray-500 mt-1">
                  Reserves: {poolReserves[0].toString()} {tokenADetails.symbol} / {poolReserves[1].toString()} {tokenBDetails.symbol}
                </div>
              )}
            </div>
          )}

          <h3 className="text-lg font-medium mb-2">Deposit tokens</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Specify the token amounts for your liquidity contribution.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg">
              <Input
                type="text"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="text-2xl font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="0"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">{valueA}</span>
                <div className="flex items-center">
                  <div className="relative h-5 w-5 mr-1">
                    <img
                      src="/placeholder.svg?height=20&width=20"
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm font-medium">{tokenADetails.symbol}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg">
              <Input
                type="text"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="text-2xl font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="0"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">{valueB}</span>
                <div className="flex items-center">
                  <div className="relative h-5 w-5 mr-1">
                    <img
                      src="/placeholder.svg?height=20&width=20"
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm font-medium">{tokenBDetails.symbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          {calculatedAmounts && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                Liquidity Calculation Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Optimal {tokenADetails.symbol}:</span>
                  <span className="font-mono font-medium">
                    {(Number(calculatedAmounts.amountAOptimal) / 1e18).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Optimal {tokenBDetails.symbol}:</span>
                  <span className="font-mono font-medium">
                    {(Number(calculatedAmounts.amountBOptimal) / 1e18).toFixed(6)}
                  </span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Min {tokenADetails.symbol} (with 0.5% slippage):</span>
                    <span className="font-mono">
                      {(Number(calculatedAmounts.amountAMin) / 1e18).toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Min {tokenBDetails.symbol} (with 0.5% slippage):</span>
                    <span className="font-mono">
                      {(Number(calculatedAmounts.amountBMin) / 1e18).toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSubmitting && (
            <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
              Processing transaction... This may take a few minutes.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl disabled:opacity-50"
          disabled={isButtonDisabled()}
          onClick={handleAddLiquidity}
        >
          {isSubmitting && (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          )}
          {getButtonText()}
        </Button>
      </CardFooter>
    </>
  );
}
