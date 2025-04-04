import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function TokenStats() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-white/90 dark:bg-card/80 backdrop-blur-sm border border-gray-200 dark:border-blue-900/50 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ETH Price
            </div>
            <div className="flex items-center text-green-500 dark:text-green-400 text-sm">
              <ArrowUp className="h-3 w-3 mr-1" />
              2.5%
            </div>
          </div>
          <div className="text-xl font-bold mt-1">$1,802.45</div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 dark:bg-card/80 backdrop-blur-sm border border-gray-200 dark:border-blue-900/50 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              24h Volume
            </div>
            <div className="flex items-center text-red-500 dark:text-red-400 text-sm">
              <ArrowDown className="h-3 w-3 mr-1" />
              1.2%
            </div>
          </div>
          <div className="text-xl font-bold mt-1">$24.5M</div>
        </CardContent>
      </Card>
    </div>
  );
}
