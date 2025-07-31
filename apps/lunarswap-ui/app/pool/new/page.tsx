import { Header } from '@/components/header';
import { NewPositionWizard } from '@/components/pool/new-position-wizard';
import { StarsBackground } from '@/components/stars-background';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export const metadata = {
  title: 'Create New Liquidity Position',
  description:
    'Create a new liquidity position on Lunarswap to earn trading fees. Provide liquidity to Midnight token pairs and start earning rewards.',
};

export default function NewPositionPage() {
  useEffect(() => {
    document.title = 'Create New Liquidity Position';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center text-sm mb-4 text-gray-500 dark:text-gray-400">
            <Link
              to="/pool"
              className="hover:text-blue-500 dark:hover:text-blue-400"
            >
              Your positions
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-foreground">New position</span>
          </div>

          <h1 className="text-3xl font-bold mb-6">New position</h1>

          <NewPositionWizard />
        </div>
      </main>
    </div>
  );
}
