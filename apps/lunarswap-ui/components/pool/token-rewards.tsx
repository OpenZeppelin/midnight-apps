import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export function TokenRewards() {
  return (
    <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl font-bold">0 LUNAR</div>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <span>Rewards earned</span>
              <div className="relative inline-flex group">
                <HelpCircle className="h-4 w-4 ml-1" />
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-48">
                  Rewards are distributed according to the AMM protocol
                </div>
              </div>
            </div>
          </div>
          <Button className="bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
            Collect rewards
          </Button>
        </div>

        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <span className="font-medium">Find pools with LUNAR rewards</span>
              <svg
                role="img"
                aria-labelledby="find-rewards-arrow-title"
                className="h-4 w-4 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title id="find-rewards-arrow-title">Right arrow</title>
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Eligible pools have token rewards so you can earn more
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
