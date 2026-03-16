'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PoolPositions() {
  const [positions, _] = useState<any[]>([]);

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
          <Link href="/pool/new">
            <Button variant="outline" size="sm" className="gap-1 rounded-full">
              <Plus className="h-4 w-4" />
              New Position
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Your active liquidity positions will appear here
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Create a position by adding liquidity to start earning fees
            </p>
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
