import { Header } from '@/components/header';
import { SwapCard } from '@/components/swap-card';
import { StarsBackground } from '@/components/stars-background';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { useEffect } from 'react';

export const metadata = {
  title: 'Buy & Sell Midnight Tokens',
  description:
    'Buy and sell Midnight tokens on top of Lunarswap - the most celestial DEX in the galaxy. Swap TUSD, TEURO, TJPY, TCNY, and TARS tokens instantly.',
};

export default function Home() {
  useEffect(() => {
    document.title = 'Buy & Sell Midnight Tokens';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-md mx-auto">
          <SwapCard />
        </div>
      </main>
    </div>
  );
}
