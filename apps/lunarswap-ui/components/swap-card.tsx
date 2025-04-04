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
import { ArrowDown, Fuel, Info, Settings } from 'lucide-react';
import { useState } from 'react';
import { TokenInput } from './token-input';
import { TokenSelectModal } from './token-select-modal';

export function SwapCard() {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingToken, setSelectingToken] = useState<'from' | 'to'>('from');
  const [fromToken, setFromToken] = useState({
    symbol: 'ETH',
    name: 'Ethereum',
    logo: '/placeholder.svg?height=24&width=24',
    balance: '1.56',
  });
  const [toToken, setToToken] = useState({
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '/placeholder.svg?height=24&width=24',
    balance: '2,456.78',
  });
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const handleTokenSelect = (token: any) => {
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

  const handleSwap = () => {
    // Swap logic would go here
    alert('Swap functionality would be implemented here');
  };

  // Simulated gas price - in a real app, this would come from an API
  const gasPrice = '$0.01234';

  return (
    <>
      <Card className="bg-white/90 dark:bg-card/80 backdrop-blur-sm border border-gray-200 dark:border-blue-900/50 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-xl font-bold">Swap</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </Button>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <TooltipProvider>
            <div className="flex items-center justify-center w-full text-xs text-gray-500 dark:text-gray-400">
              <Fuel className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <span>Average gas fee: {gasPrice} DUST</span>
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
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white font-medium py-6 rounded-xl"
            disabled={!fromAmount}
            onClick={handleSwap}
          >
            {!fromAmount ? 'Enter an amount' : 'Swap'}
          </Button>
        </CardFooter>
      </Card>

      <TokenSelectModal
        show={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onSelect={handleTokenSelect}
      />
    </>
  );
}
