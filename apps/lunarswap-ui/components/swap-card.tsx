'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWallet } from '@/hooks/use-wallet';
import { createContractIntegration, DEMO_TOKENS } from '@/lib/contract-integration';
import { 
  calculateAmountOut, 
  calculateAmountIn,
  computeAmountOutMin, 
  computeAmountInMax,
  SLIPPAGE_TOLERANCE 
} from '@midnight-dapps/lunarswap-sdk';
import { ArrowDown, Fuel, Info, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { TokenInput } from './token-input';
import { TokenSelectModal } from './token-select-modal';

interface Token {
  symbol: string;
  name: string;
  address: string;
}

type SwapType = 'EXACT_INPUT' | 'EXACT_OUTPUT';
type ActiveField = 'from' | 'to' | null;

export function SwapCard() {
  const { isConnected, address, providers, walletAPI } = useWallet();
  const [isHydrated, setIsHydrated] = useState(false);
  const [contractReady, setContractReady] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingToken, setSelectingToken] = useState<'from' | 'to'>('from');
  const [fromToken, setFromToken] = useState<Token>({
    symbol: 'TUSD',
    name: 'Test USD',
    address: '020050fdd8e2eea82068e6bab6ad0c78ef7e0c050dd9fc1d0a32495c95310c4e1959',
  });
  const [toToken, setToToken] = useState<Token>({
    symbol: 'TEURO',
    name: 'Test Euro',
    address: '02007285b48ebb1f85fc6cc7b1754a64deed1f2210b4c758a37309039510acb8781a',
  });
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [swapType, setSwapType] = useState<SwapType>('EXACT_INPUT');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippageTolerance] = useState(SLIPPAGE_TOLERANCE.LOW); // 0.5% using SDK constant
  const [poolReserves, setPoolReserves] = useState<[bigint, bigint] | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check contract status when wallet connects
  useEffect(() => {
    const checkContractStatus = async () => {
      if (!walletAPI || !isConnected) {
        setContractReady(false);
        return;
      }

      try {
        const contractIntegration = createContractIntegration(providers, walletAPI.wallet);
        const status = await contractIntegration.initialize();
        setContractReady(status.status === 'connected');
      } catch (error) {
        console.error('Contract status check failed:', error);
        setContractReady(false);
      }
    };

    checkContractStatus();
  }, [walletAPI, providers, isConnected]);

  // Fetch pool reserves when tokens change
  useEffect(() => {
    const fetchReserves = async () => {
      if (!walletAPI || !fromToken || !toToken || fromToken.symbol === toToken.symbol) {
        setPoolReserves(null);
        return;
      }

      try {
        const contractIntegration = createContractIntegration(providers, walletAPI.wallet);
        await contractIntegration.initialize();
        
        const exists = await contractIntegration.isPairExists(fromToken.symbol, toToken.symbol);
        if (exists) {
          const reserves = await contractIntegration.getPairReserves(fromToken.symbol, toToken.symbol);
          setPoolReserves(reserves);
        } else {
          setPoolReserves(null);
        }
      } catch (error) {
        console.error('Failed to fetch pool reserves:', error);
        setPoolReserves(null);
      }
    };

    fetchReserves();
  }, [fromToken, toToken, walletAPI, providers]);

  // Calculate output amount for exact input using SDK
  const calculateOutputAmount = useCallback((inputAmount: string): string => {
    if (!inputAmount || !poolReserves || Number.parseFloat(inputAmount) <= 0) {
      return '';
    }

    try {
      const amountIn = BigInt(Math.floor(Number.parseFloat(inputAmount) * 1e18));
      const [reserveIn, reserveOut] = poolReserves;
      
      // Use SDK function with default 0.3% fee
      const amountOut = calculateAmountOut(amountIn, reserveIn, reserveOut);
      
      return (Number(amountOut) / 1e18).toFixed(6);
    } catch (error) {
      console.error('Error calculating output amount:', error);
      return '';
    }
  }, [poolReserves]);

  // Calculate input amount for exact output (reverse calculation)
  const calculateInputAmount = useCallback((outputAmount: string): string => {
    if (!outputAmount || !poolReserves || Number.parseFloat(outputAmount) <= 0) {
      return '';
    }

    try {
      const amountOut = BigInt(Math.floor(Number.parseFloat(outputAmount) * 1e18));
      const [reserveIn, reserveOut] = poolReserves;
      
      // Use SDK function with default 0.3% fee
      const amountIn = calculateAmountIn(amountOut, reserveIn, reserveOut);
      
      return (Number(amountIn) / 1e18).toFixed(6);
    } catch (error) {
      console.error('Error calculating input amount:', error);
      return '';
    }
  }, [poolReserves]);

  // Handle from amount change (exact input)
  const handleFromAmountChange = useCallback(async (value: string) => {
    setFromAmount(value);
    setActiveField('from');
    setSwapType('EXACT_INPUT');

    if (!value || !poolReserves) {
      setToAmount('');
      return;
    }

    setIsCalculating(true);
    try {
      const calculatedToAmount = calculateOutputAmount(value);
      setToAmount(calculatedToAmount);
    } finally {
      setIsCalculating(false);
    }
  }, [calculateOutputAmount, poolReserves]);

  // Handle to amount change (exact output)
  const handleToAmountChange = useCallback(async (value: string) => {
    setToAmount(value);
    setActiveField('to');
    setSwapType('EXACT_OUTPUT');

    if (!value || !poolReserves) {
      setFromAmount('');
      return;
    }

    setIsCalculating(true);
    try {
      const calculatedFromAmount = calculateInputAmount(value);
      setFromAmount(calculatedFromAmount);
    } finally {
      setIsCalculating(false);
    }
  }, [calculateInputAmount, poolReserves]);

  const handleTokenSelect = (token: Token) => {
    if (selectingToken === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenModal(false);
    
    // Clear amounts when tokens change
    setFromAmount('');
    setToAmount('');
    setActiveField(null);
  };

  const openTokenModal = (type: 'from' | 'to') => {
    setSelectingToken(type);
    setShowTokenModal(true);
  };

  const handleSwap = async () => {
    if (!isConnected || !walletAPI || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!fromAmount || !toAmount) {
      toast.error('Please enter valid amounts');
      return;
    }

    if (!poolReserves) {
      toast.error('Pool not found');
      return;
    }

    setIsSwapping(true);
    try {
      const contractIntegration = createContractIntegration(providers, walletAPI.wallet);
      await contractIntegration.initialize();

      // Convert amounts to BigInt (assuming 18 decimals)
      const fromAmountBigInt = BigInt(Math.floor(Number.parseFloat(fromAmount) * 1e18));
      const toAmountBigInt = BigInt(Math.floor(Number.parseFloat(toAmount) * 1e18));

      if (swapType === 'EXACT_INPUT') {
        // User specified exact input amount, calculate minimum output with slippage using SDK
        const amountOutMin = computeAmountOutMin(toAmountBigInt, slippageTolerance);
        
        await contractIntegration.swapExactTokensForTokens(
          fromToken.symbol,
          toToken.symbol,
          fromAmountBigInt.toString(),
          amountOutMin.toString(),
          address
        );

        toast.success(`Swapped ${fromAmount} ${fromToken.symbol} for ${toToken.symbol}`);
      } else {
        // User specified exact output amount, calculate maximum input with slippage using SDK
        const amountInMax = computeAmountInMax(fromAmountBigInt, slippageTolerance);
        
        await contractIntegration.swapTokensForExactTokens(
          fromToken.symbol,
          toToken.symbol,
          toAmountBigInt.toString(),
          amountInMax.toString(),
          address
        );

        toast.success(`Swapped ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`);
      }

      // Clear amounts after successful swap
      setFromAmount('');
      setToAmount('');
      setActiveField(null);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Swap failed: ${errorMsg}`);
      console.error('Swap error:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  const getExchangeRate = () => {
    if (!fromAmount || !toAmount || Number.parseFloat(fromAmount) === 0) return null;
    const rate = Number.parseFloat(toAmount) / Number.parseFloat(fromAmount);
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  };

  const getButtonText = () => {
    if (!isHydrated) return 'Loading...';
    if (!isConnected) return 'Connect Wallet';
    if (!contractReady) return 'Contract Not Available';
    if (!fromAmount || !toAmount) return 'Enter amounts';
    if (!poolReserves) return 'Pool not found';
    if (isCalculating) return 'Calculating...';
    if (isSwapping) return 'Swapping...';
    
    if (swapType === 'EXACT_INPUT') {
      return `Swap ${fromAmount} ${fromToken.symbol}`;
    }
    return `Swap for ${toAmount} ${toToken.symbol}`;
  };

  const isButtonDisabled = () => {
    return (
      !isHydrated ||
      !isConnected ||
      !contractReady ||
      !fromAmount ||
      !toAmount ||
      !poolReserves ||
      isCalculating ||
      isSwapping
    );
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Swap</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TokenInput
            token={fromToken}
            amount={fromAmount}
            onChange={handleFromAmountChange}
            onSelectToken={() => openTokenModal('from')}
            label="Sell"
          />
          <div className="flex justify-center -my-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 z-10"
              onClick={() => {
                // Swap tokens and amounts
                const tempToken = fromToken;
                setFromToken(toToken);
                setToToken(tempToken);
                
                // Swap amounts and maintain active field logic
                if (activeField === 'from') {
                  setToAmount(fromAmount);
                  setFromAmount(toAmount);
                  handleToAmountChange(fromAmount);
                } else if (activeField === 'to') {
                  setFromAmount(toAmount);
                  setToAmount(fromAmount);
                  handleFromAmountChange(toAmount);
                } else {
                  setFromAmount(toAmount);
                  setToAmount(fromAmount);
                }
              }}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
          <TokenInput
            token={toToken}
            amount={toAmount}
            onChange={handleToAmountChange}
            onSelectToken={() => openTokenModal('to')}
            label="Buy"
          />

          {(fromAmount && toAmount) && (
            <div className="text-sm text-gray-500 dark:text-gray-400 pt-2">
              <div className="flex justify-between">
                <span>Rate</span>
                <span>{getExchangeRate()}</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage Tolerance</span>
                <span>{slippageTolerance / 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>Trade Type</span>
                <span className="text-xs">
                  {swapType === 'EXACT_INPUT' ? 'Exact Input' : 'Exact Output'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <TooltipProvider>
            <div className="flex items-center justify-center w-full text-xs text-gray-500 dark:text-gray-400">
              <Fuel className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <span>Network fee applies</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 p-0"
                  >
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    {swapType === 'EXACT_INPUT' 
                      ? 'You will receive at least the calculated amount minus slippage.'
                      : 'You will pay at most the calculated amount plus slippage.'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white font-medium py-6 rounded-xl disabled:opacity-50"
            disabled={isButtonDisabled()}
            onClick={handleSwap}
          >
            {(isCalculating || isSwapping) && (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            )}
            {getButtonText()}
          </Button>
        </CardFooter>
      </Card>

      <TokenSelectModal
        show={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onSelect={handleTokenSelect}
      />
    </TooltipProvider>
  );
}
