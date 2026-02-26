import { Coins, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DeployTokenModal } from '@/components/deploy-token-modal';
import { Header } from '@/components/header';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { NewPositionWizard } from '@/components/pool/new-position-wizard';
import { RemoveLiquidityWizard } from '@/components/pool/remove-liquidity-wizard';
import { TopPoolsList } from '@/components/pool/top-pools-list';
import { StarsBackground } from '@/components/stars-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/hooks/use-wallet';
import {
  userDeployedTokenToToken,
  useShieldedTokenContext,
} from '@/lib/shielded-token-context';
import { getAllTokens } from '@/lib/token-config';

export const metadata = {
  title: 'Manage Liquidity & Positions',
  description:
    'Add or remove liquidity from Midnight token pairs on Lunarswap. Manage your positions and earn trading fees while maintaining privacy.',
};

export default function PoolPage() {
  const [showNewPosition, setShowNewPosition] = useState(true); // Default to Add Liquidity
  const [showRemoveLiquidity, setShowRemoveLiquidity] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const { isConnected } = useWallet();
  const { userDeployedTokens } = useShieldedTokenContext();
  const allTokensList = getAllTokens(
    userDeployedTokens.map(userDeployedTokenToToken),
  );
  const hasNoTokens = isConnected && allTokensList.length === 0;

  useEffect(() => {
    document.title = 'Manage Liquidity & Positions';
  }, []);

  const handleCloseWizards = () => {
    setShowNewPosition(false);
    setShowRemoveLiquidity(false);
  };

  const handleAddLiquidity = () => {
    setShowRemoveLiquidity(false);
    setShowNewPosition(true);
  };

  const handleRemoveLiquidity = () => {
    setShowNewPosition(false);
    setShowRemoveLiquidity(true);
  };

  // Get the current action title
  const getActionTitle = () => {
    if (showRemoveLiquidity) return 'Remove Liquidity';
    return 'Add Liquidity';
  };

  // Get the current action description
  const getActionDescription = () => {
    if (showRemoveLiquidity) {
      return 'Remove liquidity from your existing positions to withdraw your tokens and collect accumulated fees. Your privacy is maintained throughout the process.';
    }
    return 'Add liquidity to token pairs to earn trading fees. Create new positions or add to existing pools while maintaining privacy.';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />

      <main className="container mx-auto px-3 py-4 relative z-0 pt-[var(--header-offset)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Main Content - Left Side (70%) */}
            <div className="lg:col-span-7">
              {/* Centered Liquidity Wizard */}
              <div className="w-full max-w-3xl mx-auto">
                {/* Simple Add/Remove Choices */}
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    variant={showNewPosition ? 'default' : 'ghost'}
                    size="sm"
                    onClick={handleAddLiquidity}
                    className={`px-3 py-1.5 rounded-full transition-all text-sm ${
                      showNewPosition
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-gray-600/80'
                    }`}
                  >
                    <Plus className="h-3 w-3 mr-1.5" />
                    Add
                  </Button>
                  <Button
                    variant={showRemoveLiquidity ? 'default' : 'ghost'}
                    size="sm"
                    onClick={handleRemoveLiquidity}
                    className={`px-3 py-1.5 rounded-full transition-all text-sm ${
                      showRemoveLiquidity
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-gray-600/80'
                    }`}
                  >
                    <Minus className="h-3 w-3 mr-1.5" />
                    Remove
                  </Button>
                </div>

                {/* Dynamic Title */}
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold">{getActionTitle()}</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-xl mx-auto text-sm">
                    {getActionDescription()}
                  </p>
                </div>

                {/* Add Liquidity Wizard - Default */}
                {showNewPosition && (
                  <div>
                    {hasNoTokens ? (
                      <Card className="bg-transparent border border-gray-200/50 dark:border-blue-900/30 rounded-xl overflow-hidden">
                        <CardContent className="p-8 text-center">
                          <Coins className="h-14 w-14 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No tokens available
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            You need tokens to create liquidity pools. Deploy a
                            shielded token to get started.
                          </p>
                          <Button
                            onClick={() => setDeployModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Deploy Token
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <NewPositionWizard onClose={handleCloseWizards} />
                    )}
                  </div>
                )}

                {/* Remove Liquidity Wizard */}
                {showRemoveLiquidity && (
                  <div>
                    <RemoveLiquidityWizard onClose={handleCloseWizards} />
                  </div>
                )}
              </div>
            </div>

            {/* Top Pools - Right Side (30%) */}
            <div className="lg:col-span-3">
              <div className="sticky top-20">
                <TopPoolsList />
              </div>
            </div>
          </div>
        </div>
      </main>

      <DeployTokenModal
        open={deployModalOpen}
        onOpenChange={setDeployModalOpen}
      />
    </div>
  );
}
