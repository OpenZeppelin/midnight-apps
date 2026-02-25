import { ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/header';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { NewPositionWizard } from '@/components/pool/new-position-wizard';
import { ProtectedRoute } from '@/components/protected-route';
import { StarsBackground } from '@/components/stars-background';

export const metadata = {
  title: 'Create New Liquidity Position',
  description:
    'Create a new liquidity position on Lunarswap to earn trading fees. Provide liquidity to Midnight token pairs and start earning rewards.',
};

export default function NewPositionPage() {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Create New Liquidity Position';
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
        <StarsBackground />
        <MoonDustBackground />
        <Header />
        <main className="container mx-auto px-4 py-8 relative z-0 pt-[var(--header-offset)]">
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

            <NewPositionWizard initialTokens={location.state} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
