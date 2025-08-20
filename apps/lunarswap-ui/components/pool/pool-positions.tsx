'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Shield, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';

export function PoolPositions() {
  const [positions, _] = useState<unknown[]>([]);
  const { isConnected } = useWallet();

  return (
    <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Your Positions</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage your liquidity positions
            </p>
          </div>
          {/* {isConnected ? (
            <Link to="/pool/new">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-full"
              >
                <Plus className="h-4 w-4" />
                New Position
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 rounded-full"
              disabled={true}
            >
              <Plus className="h-4 w-4" />
              New Position
            </Button>
          )} */}
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Active Positions
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              You don't have any active liquidity positions yet. Create your
              first position to start earning trading fees.
            </p>
            {isConnected && (
              <Link to="/pool/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Position
                </Button>
              </Link>
            )}

            {/* Privacy Information */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md mx-auto">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Privacy Note</p>
                  <p>
                    Your positions are managed privately. The system cannot see
                    your actual balances but will generate proofs assuming
                    sufficient funds for operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Position list would go here */}
            <p>Your positions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
