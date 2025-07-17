import { Header } from '@/components/header';
import { PoolPositions } from '@/components/pool/pool-positions';
import { TokenRewards } from '@/components/pool/token-rewards';
import { TopPoolsList } from '@/components/pool/top-pools-list';
import { NewPositionWizard } from '@/components/pool/new-position-wizard';
import { StarsBackground } from '@/components/stars-background';

export const metadata = {
  title: 'Lunarswap | Pool',
  description:
    'Provide liquidity and earn fees on the most celestial DEX in the galaxy',
};

export default function PoolPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Pools</h1>

          <div className="mb-8">
            <TokenRewards />
          </div>

          <div className="mb-8">
            <NewPositionWizard />
          </div>

          <div className="mb-8">
            <PoolPositions />
          </div>

          <div className="mb-8">
            <TopPoolsList />
          </div>
        </div>
      </main>
    </div>
  );
}
