'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SetDepositStepProps {
  pairData: any;
}

export function SetDepositStep({ pairData }: SetDepositStepProps) {
  const [amountA, setAmountA] = useState('1');
  const [amountB, setAmountB] = useState('1831.102949');

  // Simulated USD values
  const valueA = '$1,786.54';
  const valueB = '$1,831.55';

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
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl">
          Connect wallet
        </Button>
      </CardFooter>
    </>
  );
}
