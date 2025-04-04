import { Header } from '@/components/header';
import { StarsBackground } from '@/components/stars-background';
import { SwapCard } from '@/components/swap-card';
import { TokenStats } from '@/components/token-stats';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-md mx-auto">
          <SwapCard />
          <TokenStats />
        </div>
      </main>
    </div>
  );
}
