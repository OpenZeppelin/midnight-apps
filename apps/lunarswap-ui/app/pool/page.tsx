import { Header } from '@/components/header';
import { NewPositionWizard } from '@/components/pool/new-position-wizard';
import { PoolPositions } from '@/components/pool/pool-positions';
import { TokenRewards } from '@/components/pool/token-rewards';
import { TopPoolsList } from '@/components/pool/top-pools-list';
import { StarsBackground } from '@/components/stars-background';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useViewPreference } from '@/hooks/use-view-preference';

export const metadata = {
  title: 'Provide Liquidity & Earn Fees',
  description:
    'Provide liquidity to Midnight token pairs and earn trading fees on Lunarswap. Create new positions, manage existing pools, and track your rewards.',
};

export default function PoolPage() {
  const [showNewPosition, setShowNewPosition] = useState(false);
  const viewPreference = useViewPreference();

  useEffect(() => {
    document.title = 'Provide Liquidity & Earn Fees';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Pools</h1>
            <Button
              onClick={() => setShowNewPosition(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Position
            </Button>
          </div>

          <div
            className={`${
              viewPreference === 'horizontal'
                ? 'grid grid-cols-1 lg:grid-cols-3 gap-8'
                : 'space-y-8'
            }`}
          >
            {/* Main Content */}
            <div
              className={`${
                viewPreference === 'horizontal'
                  ? 'lg:col-span-2 space-y-8'
                  : 'space-y-8'
              }`}
            >
              <div>
                <TokenRewards />
              </div>

              {showNewPosition && (
                <div>
                  <NewPositionWizard
                    onClose={() => setShowNewPosition(false)}
                  />
                </div>
              )}

              <div>
                <PoolPositions />
              </div>
            </div>

            {/* Top Pools */}
            <div
              className={`${
                viewPreference === 'horizontal' ? 'lg:col-span-1' : ''
              }`}
            >
              <div
                className={
                  viewPreference === 'horizontal' ? 'sticky top-24' : ''
                }
              >
                <TopPoolsList />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
