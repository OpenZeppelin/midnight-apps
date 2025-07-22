'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMidnightTransaction } from '@/hooks/use-midnight-transaction';
import { useWallet } from '@/hooks/use-wallet';
import { createContractIntegration } from '@/lib/contract-integration';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface SetDepositStepProps {
  pairData: any;
}

export function SetDepositStep({ pairData }: SetDepositStepProps) {
  const { isWalletConnected, walletState } = useWallet();
  const { transactionState, executeTransaction, resetTransaction } =
    useMidnightTransaction();
  const [isHydrated, setIsHydrated] = useState(false);

  const [amountA, setAmountA] = useState('1');
  const [amountB, setAmountB] = useState('1831.102949');

  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Simulated USD values
  const valueA = '$1,786.54';
  const valueB = '$1,831.55';

  const handleAddLiquidity = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amountA || !amountB) {
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

        // Execute the actual add liquidity transaction
        const addLiquidityResult = await contractIntegration.addLiquidity({
          tokenA: pairData.tokenA?.symbol || 'NIGHT',
          tokenB: pairData.tokenB?.symbol || 'USDT',
          amountADesired: amountA,
          amountBDesired: amountB,
          amountAMin: amountA, // In real implementation, calculate minimum based on slippage
          amountBMin: amountB, // In real implementation, calculate minimum based on slippage
          recipient: walletState?.address || '',
          deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now
        });

        return addLiquidityResult;
      });

      if (result) {
        toast.success('Liquidity added successfully!');
        // Reset form
        setAmountA('');
        setAmountB('');
        resetTransaction();
      }
    } catch (error) {
      console.error('Add liquidity failed:', error);
      toast.error('Failed to add liquidity. Please try again.');
    }
  };

  const getButtonText = () => {
    if (!isHydrated) return 'Loading...';
    if (!isWalletConnected) return 'Connect Wallet';
    if (!amountA || !amountB) return 'Enter amounts';
    if (transactionState.status === 'preparing') return 'Preparing...';
    if (transactionState.status === 'proving') return 'Generating Proof...';
    if (transactionState.status === 'submitting') return 'Adding Liquidity...';
    return 'Add Liquidity';
  };

  const isButtonDisabled = () => {
    return (
      !isHydrated ||
      !isWalletConnected ||
      !amountA ||
      !amountB ||
      transactionState.status === 'preparing' ||
      transactionState.status === 'proving' ||
      transactionState.status === 'submitting'
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
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    alt=""
                    width={32}
                    height={32}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">NIGHT</span>
                <span className="text-gray-500">/</span>
                <span className="font-medium ml-2">USDT</span>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>{pairData.version}</span>
              <span className="mx-1">·</span>
              <span>{pairData.fee}%</span>
            </div>
          </div>

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
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">{valueA}</span>
                <div className="flex items-center">
                  <div className="relative h-5 w-5 mr-1">
                    <Image
                      src="/placeholder.svg?height=20&width=20"
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm font-medium">NIGHT</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg">
              <Input
                type="text"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="text-2xl font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">{valueB}</span>
                <div className="flex items-center">
                  <div className="relative h-5 w-5 mr-1">
                    <Image
                      src="/placeholder.svg?height=20&width=20"
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm font-medium">USDT</span>
                </div>
              </div>
            </div>
          </div>

          {transactionState.error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-4">
              {transactionState.error}
            </div>
          )}

          {transactionState.txHash && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mt-4">
              Liquidity added successfully! Hash: {transactionState.txHash}
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
          {(transactionState.status === 'preparing' ||
            transactionState.status === 'proving' ||
            transactionState.status === 'submitting') && (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          )}
          {getButtonText()}
        </Button>
      </CardFooter>
    </>
  );
}
