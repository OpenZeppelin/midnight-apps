'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

// Sample data for top pools
const topPools = [
  {
    id: 1,
    pair: 'USDC/USDT',
    version: 'v4',
    fee: '0.01%',
    tvl: '$126.1M',
    apr: '0.41% APR',
    change: '+12.41%',
    positive: true,
  },
  {
    id: 2,
    pair: 'WBTC/USDC',
    version: 'v3',
    fee: '0.3%',
    tvl: '$125.9M',
    apr: '25.8% APR',
    change: '',
    positive: false,
  },
  {
    id: 3,
    pair: 'USDC/NIGHT',
    version: 'v3',
    fee: '0.05%',
    tvl: '$110.5M',
    apr: '20.11% APR',
    change: '',
    positive: false,
  },
  {
    id: 4,
    pair: 'NIGHT/wstETH',
    version: 'v4',
    fee: '0.01%',
    tvl: '$106.4M',
    apr: '0.12% APR',
    change: '+12.64%',
    positive: true,
  },
];

export function TopPoolsList() {
  return (
    <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Top pools by TVL</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Pool</th>
                <th className="pb-2 font-medium">Fee tier</th>
                <th className="pb-2 font-medium">TVL</th>
                <th className="pb-2 font-medium">Pool APR</th>
              </tr>
            </thead>
            <tbody>
              {topPools.map((pool) => (
                <tr
                  key={pool.id}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <td className="py-3">{pool.id}</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="relative h-8 w-8 mr-2">
                        <div className="absolute top-0 left-0 h-6 w-6 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900">
                          <Image
                            src="/placeholder.svg?height=24&width=24"
                            alt=""
                            width={24}
                            height={24}
                          />
                        </div>
                        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full overflow-hidden bg-green-100 dark:bg-green-900">
                          <Image
                            src="/placeholder.svg?height=24&width=24"
                            alt=""
                            width={24}
                            height={24}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{pool.pair}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {pool.version}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{pool.fee}</td>
                  <td className="py-3">{pool.tvl}</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <span className="mr-2">{pool.apr}</span>
                      {pool.change && (
                        <span
                          className={
                            pool.positive ? 'text-green-500' : 'text-red-500'
                          }
                        >
                          {pool.change}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            className="text-blue-600 dark:text-blue-400 gap-1"
          >
            Explore more pools
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
