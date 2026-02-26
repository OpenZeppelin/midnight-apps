'use client';

import {
  calculateAmountIn,
  calculateAmountOut,
  computeAmountInMax,
  computeAmountOutMin,
  SLIPPAGE_TOLERANCE,
} from '@openzeppelin/midnight-apps-lunarswap-sdk';
import { ArrowDown, ExternalLink, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/use-wallet';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import { useActiveNetworkConfig } from '@/lib/runtime-configuration';
import {
  userDeployedTokenToToken,
  useShieldedTokenContext,
} from '@/lib/shielded-token-context';
import {
  getAllTokens,
  getAvailableTokensForSelection,
} from '@/lib/token-config';
import { cn } from '@/utils/cn';
import { LiquidityProgress } from './pool/liquidity-progress';
import { ZkWarningDialog } from './pool/zk-warning-dialog';
import { TokenInput } from './token-input';
import { TokenSelectModal } from './token-select-modal';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { TooltipProvider } from './ui/tooltip';

interface Token {
  symbol: string;
  name: string;
  address: string;
  type: string;
}

type SwapType = 'EXACT_INPUT' | 'EXACT_OUTPUT';
type ActiveField = 'from' | 'to' | null;
type CardMode = 'swap' | 'buy';

interface SwapCardProps {
  initialTokens?: {
    fromToken?: string;
    toToken?: string;
    fromTokenType?: string;
    toTokenType?: string;
  };
  previewMode?: boolean;
  mode?: CardMode;
}

export function SwapCard({
  initialTokens,
  previewMode,
  mode = 'swap',
}: SwapCardProps) {
  const midnightWallet = useWallet();
  const { status, allPairs, lunarswap } = useLunarswapContext();
  const { userDeployedTokens } = useShieldedTokenContext();
  const activeNetwork = useActiveNetworkConfig();
  const allTokensList = getAllTokens(
    userDeployedTokens.map(userDeployedTokenToToken),
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingToken, setSelectingToken] = useState<'from' | 'to'>('from');
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [availableTokensForFrom, setAvailableTokensForFrom] = useState<Token[]>(
    [],
  );
  const [availableTokensForTo, setAvailableTokensForTo] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [swapType, setSwapType] = useState<SwapType>('EXACT_INPUT');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippageTolerance] = useState(SLIPPAGE_TOLERANCE.LOW); // 0.5% using SDK constant
  const [poolReserves, setPoolReserves] = useState<[bigint, bigint] | null>(
    null,
  );

  // ZK Proof warning state
  const [showZkWarning, setShowZkWarning] = useState(false);
  const [isProofGenerating, setIsProofGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set default preview values for preview mode
  useEffect(() => {
    if (previewMode && availableTokens.length > 0) {
      // Set default tokens for preview
      if (availableTokens.length >= 2) {
        setFromToken(availableTokens[0]);
        setToToken(availableTokens[1]);
        setFromAmount('100');
        setToAmount('95.5');
      }
    }
  }, [previewMode, availableTokens]);

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

  // Set initial tokens from navigation state
  useEffect(() => {
    if (initialTokens?.fromToken && initialTokens?.toToken) {
      // Use popularTokens directly since we know they contain all available tokens
      const fromTokenData = allTokensList.find(
        (t) => t.symbol === initialTokens.fromToken,
      );
      const toTokenData = allTokensList.find(
        (t) => t.symbol === initialTokens.toToken,
      );

      if (fromTokenData) {
        setFromToken(fromTokenData);
      }
      if (toTokenData) {
        setToToken(toTokenData);
      }
    }
  }, [initialTokens, allTokensList]);

  // Function to get available tokens for a specific selected token
  const getAvailableTokensForToken = useCallback(
    (selectedToken: Token | null, allTokens: Token[]) => {
      // Debug logging removed

      if (!selectedToken || allPairs.length === 0) {
        // Debug logging removed
        return allTokens;
      }

      const selectedTokenType = selectedToken.type
        .replace(/^0x/i, '')
        .toLowerCase();
      const selectedTokenTypeWithoutPrefix = selectedTokenType.replace(
        /^0200/,
        '',
      );

      // Find all pairs that contain the selected token
      const relevantPairs = allPairs.filter((pair) => {
        const token0Type = Array.from(pair.pair.token0Type)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toLowerCase();
        const token1Type = Array.from(pair.pair.token1Type)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toLowerCase();

        return (
          token0Type === selectedTokenTypeWithoutPrefix ||
          token1Type === selectedTokenTypeWithoutPrefix ||
          token0Type === selectedTokenType ||
          token1Type === selectedTokenType
        );
      });

      // Get the other token from each relevant pair
      const availableTokenTypes = new Set<string>();
      for (const pair of relevantPairs) {
        const token0Type = Array.from(pair.pair.token0Type)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toLowerCase();
        const token1Type = Array.from(pair.pair.token1Type)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toLowerCase();

        if (
          token0Type === selectedTokenTypeWithoutPrefix ||
          token0Type === selectedTokenType
        ) {
          availableTokenTypes.add(token1Type);
        } else {
          availableTokenTypes.add(token0Type);
        }
      }

      // Filter tokens that match the available types
      const filteredTokens = allTokens.filter((token) => {
        const tokenType = token.type.replace(/^0x/i, '').toLowerCase();
        const tokenTypeWithoutPrefix = tokenType.replace(/^0200/, '');

        const hasMatch =
          availableTokenTypes.has(tokenType) ||
          availableTokenTypes.has(tokenTypeWithoutPrefix) ||
          availableTokenTypes.has(`0200${tokenTypeWithoutPrefix}`) ||
          availableTokenTypes.has(tokenType.replace(/^0200/, ''));

        return hasMatch;
      });

      return filteredTokens;
    },
    [allPairs],
  );

  // Get available tokens from global context - run immediately when component mounts
  useEffect(() => {
    // Set loading state when starting to fetch tokens
    setIsLoadingTokens(true);

    // If we have initial tokens from navigation, show all popular tokens
    // This allows users to select any token pair from the landing page
    if (initialTokens?.fromToken && initialTokens?.toToken) {
      setAvailableTokens(allTokensList);
      setAvailableTokensForFrom(allTokensList);
      setAvailableTokensForTo(allTokensList);
      setIsLoadingTokens(false);
      return;
    }

    // If we have pairs but status is not connected yet, still try to get tokens
    if (allPairs.length === 0) {
      setAvailableTokens([]);
      setAvailableTokensForFrom([]);
      setAvailableTokensForTo([]);
      setIsLoadingTokens(false);
      return;
    }

    // Use the new function to get tokens from available pools
    const available = getAvailableTokensForSelection(allPairs, allTokensList);

    // Only set available tokens if we have matches from pools
    if (available.length > 0) {
      setAvailableTokens(available);
    } else {
      setAvailableTokens([]);
    }

    // No default token selection - let user choose
    // Clear loading state after token processing is complete
    setIsLoadingTokens(false);
  }, [allPairs, initialTokens, allTokensList]);

  // Update contextual token lists when tokens change or when availableTokens are loaded
  useEffect(() => {
    if (availableTokens.length > 0) {
      const fromTokens = getAvailableTokensForToken(toToken, availableTokens);
      const toTokens = getAvailableTokensForToken(fromToken, availableTokens);

      setAvailableTokensForFrom(fromTokens);
      setAvailableTokensForTo(toTokens);
    } else {
      // Clear contextual tokens if no available tokens
      setAvailableTokensForFrom([]);
      setAvailableTokensForTo([]);
    }
  }, [fromToken, toToken, availableTokens, getAvailableTokensForToken]);

  // Get pool reserves via integration API (reliable across schema changes)
  useEffect(() => {
    const fetchReserves = async () => {
      if (!fromToken || !toToken || fromToken.symbol === toToken.symbol) {
        setPoolReserves(null);
        return;
      }

      if (status !== 'connected' || !lunarswap) {
        setPoolReserves(null);
        return;
      }

      try {
        // Fetch reserves with fromToken first, toToken second
        // This ensures consistent ordering: [fromTokenReserve, toTokenReserve]
        const reserves = await lunarswap.getPairReserves(
          fromToken.type,
          toToken.type,
        );
        if (reserves) {
          const [fromTokenReserve, toTokenReserve] = reserves;
          // Store reserves in consistent order: [fromTokenReserve, toTokenReserve]
          setPoolReserves([fromTokenReserve, toTokenReserve]);
        } else {
          setPoolReserves(null);
        }
      } catch (_err) {
        setPoolReserves(null);
      }
    };

    fetchReserves();
  }, [fromToken, toToken, lunarswap, status]);

  // Calculate output amount for exact input using SDK
  const calculateOutputAmount = useCallback(
    (inputAmount: string): string => {
      if (!poolReserves || !fromToken || !toToken) {
        return '';
      }

      try {
        const amountIn = BigInt(inputAmount);
        // poolReserves[0] = fromTokenReserve, poolReserves[1] = toTokenReserve
        const reserveIn = poolReserves[0]; // fromTokenReserve
        const reserveOut = poolReserves[1]; // toTokenReserve

        if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) {
          return '';
        }

        // Use SDK function for accurate calculation
        const amountOut = calculateAmountOut(
          amountIn,
          reserveIn,
          reserveOut,
          30,
        ); // 0.3% fee
        return amountOut.toString();
      } catch (error) {
        console.error('Error calculating output amount:', error);
        return '';
      }
    },
    [poolReserves, fromToken, toToken],
  );

  // Calculate input amount for exact output (reverse calculation)
  const calculateInputAmount = useCallback(
    (outputAmount: string): string => {
      if (!poolReserves || !fromToken || !toToken) {
        return '';
      }

      try {
        const amountOut = BigInt(outputAmount);
        // poolReserves[0] = fromTokenReserve, poolReserves[1] = toTokenReserve
        const reserveIn = poolReserves[0]; // fromTokenReserve
        const reserveOut = poolReserves[1]; // toTokenReserve

        if (amountOut === 0n || reserveIn === 0n || reserveOut === 0n) {
          return '';
        }

        // Use SDK function for accurate calculation
        const amountIn = calculateAmountIn(
          amountOut,
          reserveIn,
          reserveOut,
          30,
        ); // 0.3% fee
        return amountIn.toString();
      } catch (error) {
        console.error('Error calculating input amount:', error);
        return '';
      }
    },
    [poolReserves, fromToken, toToken],
  );

  // Handle from amount change (exact input)
  const handleFromAmountChange = useCallback(
    async (value: string) => {
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
    },
    [calculateOutputAmount, poolReserves],
  );

  // Handle to amount change (exact output)
  const handleToAmountChange = useCallback(
    async (value: string) => {
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
    },
    [calculateInputAmount, poolReserves],
  );

  const handleTokenSelect = (token: Token | null) => {
    if (token === null) {
      // Clear both selected tokens when clearing
      setFromToken(null);
      setToToken(null);
    } else {
      // Set the selected token
      if (selectingToken === 'from') {
        setFromToken(token);
      } else {
        setToToken(token);
      }
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

  // Get the appropriate token list based on which field is being selected
  const getTokensForSelection = (): Token[] => {
    let tokens: Token[];

    // If no token is selected in the other field, show all available tokens
    if (selectingToken === 'from' && !toToken) {
      tokens = availableTokens;
    } else if (selectingToken === 'to' && !fromToken) {
      tokens = availableTokens;
    } else {
      // If a token is selected in the other field, show contextual tokens
      if (selectingToken === 'from') {
        tokens =
          availableTokensForFrom.length > 0
            ? availableTokensForFrom
            : availableTokens;
      } else {
        tokens =
          availableTokensForTo.length > 0
            ? availableTokensForTo
            : availableTokens;
      }
    }

    // If no tokens available, return empty array
    if (tokens.length === 0) {
      return [];
    }

    return tokens;
  };

  const handleSwap = async () => {
    if (
      !fromToken ||
      !toToken ||
      !fromAmount ||
      !toAmount ||
      !midnightWallet.walletAPI ||
      !midnightWallet.address ||
      status !== 'connected'
    ) {
      return;
    }

    // Additional validation
    if (!poolReserves) {
      toast.error('Pool reserves not available. Please try again.');
      return;
    }

    const fromAmountBigInt = BigInt(fromAmount);
    const toAmountBigInt = BigInt(toAmount);

    // Check if amounts are reasonable
    if (fromAmountBigInt <= 0n || toAmountBigInt <= 0n) {
      toast.error('Invalid amounts. Please enter valid amounts.');
      return;
    }

    // Check if reserves are valid
    const [fromTokenReserve, toTokenReserve] = poolReserves;
    if (fromTokenReserve <= 0n || toTokenReserve <= 0n) {
      toast.error('Invalid pool reserves. Please try again.');
      return;
    }

    // Check if the swap amounts are reasonable relative to reserves
    if (swapType === 'EXACT_INPUT' && fromAmountBigInt > fromTokenReserve) {
      toast.error('Input amount exceeds available liquidity.');
      return;
    }

    if (swapType === 'EXACT_OUTPUT' && toAmountBigInt > toTokenReserve) {
      toast.error('Output amount exceeds available liquidity.');
      return;
    }

    // Show ZK warning popup first
    setShowZkWarning(true);
  };

  const handleProceedWithSwap = async () => {
    setShowZkWarning(false);
    setIsSwapping(true);
    setIsProofGenerating(true);
    setShowProgress(true);

    try {
      // Use the global lunarswap context instead of creating a new integration
      // The contract should already be connected through the context

      if (!lunarswap) {
        throw new Error('Lunarswap contract not available');
      }

      const fromAmountBigInt = BigInt(fromAmount);
      const toAmountBigInt = BigInt(toAmount);

      if (swapType === 'EXACT_INPUT') {
        // For EXACT_INPUT, we need to apply slippage tolerance to amountOutMin
        const calculatedAmountOut = toAmountBigInt;
        const amountOutMin = computeAmountOutMin(
          calculatedAmountOut,
          slippageTolerance,
        );

        // Validate slippage-adjusted amount
        if (amountOutMin <= 0n) {
          toast.error('Invalid slippage calculation. Please try again.');
          return;
        }

        if (
          !fromToken ||
          !toToken ||
          !poolReserves ||
          !midnightWallet.walletAPI?.coinPublicKey
        ) {
          throw new Error('Required token, pool data, or wallet not available');
        }

        await lunarswap.swapExactTokensForTokens(
          fromToken.type, // tokenIn
          toToken.type, // tokenOut
          fromAmountBigInt, // amountIn
          amountOutMin, // amountOutMin (with slippage)
          midnightWallet.walletAPI.coinPublicKey,
        );
        toast.success(
          `Swapped ${fromAmount} ${fromToken.symbol} for ${toToken.symbol}`,
        );
      } else {
        // EXACT_OUTPUT
        const calculatedAmountIn = fromAmountBigInt;
        const amountInMax = computeAmountInMax(
          calculatedAmountIn,
          slippageTolerance,
        );

        // Validate slippage-adjusted amount
        if (amountInMax <= 0n) {
          toast.error('Invalid slippage calculation. Please try again.');
          return;
        }

        if (
          !fromToken ||
          !toToken ||
          !poolReserves ||
          !midnightWallet.walletAPI?.coinPublicKey
        ) {
          throw new Error('Required token, pool data, or wallet not available');
        }

        await lunarswap.swapTokensForExactTokens(
          fromToken.type, // tokenIn
          toToken.type, // tokenOut
          toAmountBigInt, // amountOut
          amountInMax, // amountInMax (with slippage)
          midnightWallet.walletAPI.coinPublicKey,
        );
        toast.success(
          `Swapped ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
        );
      }

      // Reset form after successful swap
      setFromAmount('');
      setToAmount('');

      // Transaction completed successfully - progress dialog will close via onComplete callback
    } catch (error) {
      console.error('Swap error:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Insufficient')) {
          toast.error('Insufficient token balance for swap');
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
          toast.error(`Swap failed: ${error.message}`);
        }
      } else {
        toast.error('Swap failed. Please try again.');
      }

      // Close progress dialog on error
      setShowProgress(false);
      setIsSwapping(false);
      setIsProofGenerating(false);
    }
  };

  const getExchangeRate = () => {
    if (!poolReserves || !fromToken || !toToken) {
      return 'No rate available';
    }

    const [reserve0, reserve1] = poolReserves;
    if (reserve0 === 0n || reserve1 === 0n) {
      return 'No liquidity';
    }

    const rate = Number(reserve1) / Number(reserve0);
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  };

  const getButtonText = () => {
    if (!isHydrated) return 'Loading...';
    if (previewMode) return 'Get Started';
    if (mode === 'buy') return 'Get tNIGHT from Faucet';
    if (!midnightWallet.isConnected) return 'Connect Wallet';
    if (!fromToken || !toToken) return 'Select Tokens';
    if (!fromAmount || !toAmount) return 'Enter amounts';
    if (status !== 'connected') return 'Contract not ready';
    if (isCalculating) return 'Finalizing quote...';
    if (isSwapping) return 'Swapping...';
    return 'Swap';
  };

  const isButtonDisabled = () => {
    if (mode === 'buy') return false; // Buy mode is always enabled
    return (
      !isHydrated ||
      (!previewMode &&
        (!midnightWallet.isConnected ||
          !fromToken ||
          !toToken ||
          !fromAmount ||
          !toAmount ||
          status !== 'connected' ||
          isCalculating ||
          isSwapping))
    );
  };

  const handleBuyModeClick = () => {
    const faucetUrl = activeNetwork.FAUCET_URL;
    if (faucetUrl) window.open(faucetUrl, '_blank');
  };

  const handleProgressComplete = () => {
    setShowProgress(false);
    setIsSwapping(false);
    setIsProofGenerating(false);
    // Reset form after successful completion
    setFromAmount('');
    setToAmount('');
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setIsSwapping(false);
    setIsProofGenerating(false);
  };

  // Render different content based on mode
  if (mode === 'buy') {
    return (
      <Card className="w-full max-w-md mx-auto border-0 shadow-none bg-transparent">
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <img
                src="/tDust-icon.svg"
                alt="tNIGHT Token Icon"
                className="h-8 w-8"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Get tNIGHT Test Tokens
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Need tNIGHT to start trading? Get free test tokens from the
              Midnight faucet. Tokens are sent to your unshielded address.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              How to get tNIGHT:
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Visit the Midnight faucet</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Enter your unshielded wallet address</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Request tNIGHT tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>Wait for confirmation and start trading!</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleBuyModeClick}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-6 rounded-xl text-lg shadow-lg shadow-blue-900/20"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Get tNIGHT from Faucet
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      {/* ZK Proof Warning Dialog */}
      <ZkWarningDialog
        isOpen={showZkWarning}
        onClose={() => setShowZkWarning(false)}
        onProceed={handleProceedWithSwap}
        isSubmitting={isSwapping}
        operationType="swap"
        tokenASymbol={fromToken?.symbol}
        tokenBSymbol={toToken?.symbol}
      />

      {/* Progress Dialog */}
      <LiquidityProgress
        isOpen={showProgress}
        onClose={handleProgressClose}
        onComplete={handleProgressComplete}
        operationType="swap"
      />

      <TooltipProvider>
        <Card className="w-full max-w-md mx-auto border-0 shadow-none bg-transparent">
          <CardContent className="space-y-4">
            <TokenInput
              token={fromToken}
              amount={fromAmount}
              onChange={handleFromAmountChange}
              onSelectToken={() => openTokenModal('from')}
              label="Sell"
              readonly={!midnightWallet.isConnected || !fromToken}
              disabled={!midnightWallet.isConnected}
              isActive={activeField === 'from'}
              isLoading={isCalculating && activeField === 'to'}
              labelPosition="top"
              labelAlignment="left"
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
              readonly={!midnightWallet.isConnected || !toToken}
              disabled={!midnightWallet.isConnected}
              isActive={activeField === 'to'}
              isLoading={isCalculating && activeField === 'from'}
              labelPosition="top"
              labelAlignment="left"
            />

            {fromAmount && toAmount && (
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
                    {swapType === 'EXACT_INPUT'
                      ? 'Exact Input'
                      : 'Exact Output'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className={cn(
                'w-full font-medium py-6 rounded-xl disabled:opacity-50',
                previewMode || !midnightWallet.isConnected
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg shadow-lg shadow-blue-900/20'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white',
              )}
              disabled={isButtonDisabled()}
              onClick={() => {
                if (previewMode) {
                  // Pass selected tokens to the trade page
                  const selectedTokens = {
                    fromToken: fromToken?.symbol,
                    toToken: toToken?.symbol,
                    fromTokenType: fromToken?.type,
                    toTokenType: toToken?.type,
                  };

                  // Navigate to trade page with selected tokens
                  window.location.href = `/trade?fromToken=${encodeURIComponent(selectedTokens.fromToken || '')}&toToken=${encodeURIComponent(selectedTokens.toToken || '')}&fromTokenType=${encodeURIComponent(selectedTokens.fromTokenType || '')}&toTokenType=${encodeURIComponent(selectedTokens.toTokenType || '')}`;
                  return;
                }
                void handleSwap();
              }}
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
          customTokens={getTokensForSelection()}
          selectedToken={selectingToken === 'from' ? fromToken : toToken}
          isLoading={isLoadingTokens}
        />
      </TooltipProvider>
    </>
  );
}
