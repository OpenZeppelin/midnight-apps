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
import { ArrowDown, Fuel, Info, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TokenInput } from './token-input';
import { TokenSelectModal } from './token-select-modal';
import { useMidnightTransaction } from '@/hooks/use-midnight-transaction';
import { useWallet } from '@/hooks/use-wallet';
import { createContractIntegration } from '@/lib/contract-integration';
import toast from 'react-hot-toast';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  balance: string;
}

export function SwapCard() {
  const { isWalletConnected, walletState } = useWallet();
  const { transactionState, executeTransaction, resetTransaction } =
    useMidnightTransaction();
  const [isHydrated, setIsHydrated] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingToken, setSelectingToken] = useState<'from' | 'to'>('from');
  const [fromToken, setFromToken] = useState<Token>({
    symbol: 'NIGHT',
    name: 'Midnight',
    logo: '/placeholder.svg?height=24&width=24',
    balance: '1.56',
  });
  const [toToken, setToToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '/placeholder.svg?height=24&width=24',
    balance: '2,456.78',
  });
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const handleTokenSelect = (token: Token) => {
    if (selectingToken === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenModal(false);
  };

  const openTokenModal = (type: 'from' | 'to') => {
    setSelectingToken(type);
    setShowTokenModal(true);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    // In a real app, you would calculate the equivalent amount based on exchange rate
    setToAmount(value ? (Number.parseFloat(value) * 1800).toString() : '');
  };

  const handleSwap = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!fromAmount || !toAmount) {
      toast.error('Please enter valid amounts');
      return;
    }

    try {
      const result = await executeTransaction(async (providers, walletAPI) => {
        // Create contract integration
        const contractIntegration = createContractIntegration(
          providers,
          walletAPI,
        );

        // Execute the actual swap transaction
        const swapResult = await contractIntegration.executeSwap({
          tokenIn: fromToken.symbol,
          tokenOut: toToken.symbol,
          amountIn: fromAmount,
          amountOutMin: toAmount, // In real implementation, calculate minimum based on slippage
          recipient: walletState?.address || '',
          deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now
        });

        return swapResult;
      });

      if (result) {
        toast.success('Swap completed successfully!');
        // Reset form
        setFromAmount('');
        setToAmount('');
        resetTransaction();
      }
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. Please try again.');
    }
  };

  // Simulated gas price - in a real app, this would come from an API
  const gasPrice = '$0.01234';

  const getButtonText = () => {
    if (!isHydrated) return 'Loading...';
    if (!isWalletConnected) return 'Connect Wallet';
    if (!fromAmount) return 'Enter an amount';
    if (transactionState.status === 'preparing') return 'Preparing...';
    if (transactionState.status === 'proving') return 'Generating Proof...';
    if (transactionState.status === 'submitting') return 'Submitting...';
    return 'Swap';
  };

  const isButtonDisabled = () => {
    return (
      !isHydrated ||
      !isWalletConnected ||
      !fromAmount ||
      transactionState.status === 'preparing' ||
      transactionState.status === 'proving' ||
      transactionState.status === 'submitting'
    );
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Swap</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Swap settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TokenInput
            token={fromToken}
            amount={fromAmount}
            onChange={handleFromAmountChange}
            onSelectToken={() => openTokenModal('from')}
            label="From"
          />
          <div className="flex justify-center -my-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 z-10"
              onClick={() => {
                const temp = fromToken;
                setFromToken(toToken);
                setToToken(temp);
                setFromAmount(toAmount);
                setToAmount(fromAmount);
              }}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
          <TokenInput
            token={toToken}
            amount={toAmount}
            onChange={setToAmount}
            onSelectToken={() => openTokenModal('to')}
            label="To"
            readonly
          />

          {fromAmount && (
            <div className="text-sm text-gray-500 dark:text-gray-400 pt-2">
              <div className="flex justify-between">
                <span>Rate</span>
                <span>
                  1 {fromToken.symbol} = 1,800 {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slippage Tolerance</span>
                <span>0.5%</span>
              </div>
            </div>
          )}

          {transactionState.error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {transactionState.error}
            </div>
          )}

          {transactionState.txHash && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              Transaction successful! Hash: {transactionState.txHash}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <TooltipProvider>
            <div className="flex items-center justify-center w-full text-xs text-gray-500 dark:text-gray-400">
              <Fuel className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <span>Average gas fee: {gasPrice}</span>
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
                    This is the estimated network fee to complete this
                    transaction. Actual gas costs may vary.
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
            {(transactionState.status === 'preparing' ||
              transactionState.status === 'proving' ||
              transactionState.status === 'submitting') && (
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
