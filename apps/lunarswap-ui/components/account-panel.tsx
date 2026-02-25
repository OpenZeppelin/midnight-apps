'use client';

import { ArrowLeft, ChevronsRight, LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useWalletRx } from '@/hooks/use-wallet-rx';
import { formatDustAmount } from '@/utils/format-dust';
import { AccountDetailsModal } from './account-details-modal';
import { GlobalPreferences } from './global-preferences';
import { Identicon } from './identicon';
import { NetworkSelector } from './network-selector';
import { Button } from './ui/button';

type AccountPanelPage = 'main' | 'settings';

export function AccountPanel({
  isVisible,
  onClose,
  onOpen,
  onDisconnect,
}: {
  isVisible: boolean;
  onClose: () => void;
  onOpen: () => void;
  onDisconnect: () => void;
}) {
  const { address, walletAPI } = useWallet();
  const { refresh, state: walletState } = useWalletRx();

  const [currentPage, setCurrentPage] = useState<AccountPanelPage>('main');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  useEffect(() => {
    if (isVisible) {
      refresh();
    }
  }, [isVisible, refresh]);

  // Reset to main page when panel closes
  useEffect(() => {
    if (!isVisible) {
      setCurrentPage('main');
    }
  }, [isVisible]);

  // Format token balances
  const formatTokenBalance = (_tokenType: string, amount: bigint): string => {
    // Simple formatting - can be enhanced based on token decimals
    return `${amount.toString()}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
  };

  const renderMainPage = () => (
    <>
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <NetworkSelector />
          <button
            type="button"
            onClick={() => setCurrentPage('settings')}
            className="p-2 rounded-full hover:bg-muted"
            title="Preferences"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="p-2 rounded-full hover:bg-muted text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center text-center p-6 pt-0 flex-1 overflow-y-auto">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
            {address && <Identicon address={address} size={64} />}
          </div>
        </div>
        <div className="font-medium text-base text-center">
          <span className="font-mono text-muted-foreground">
            {address ? `${address.slice(0, 6)}...${address.slice(-5)}` : '...'}
          </span>
        </div>

        {/* Balance Summary */}
        {walletState?.shieldedBalances &&
          Object.keys(walletState.shieldedBalances).length > 0 && (
            <div className="mt-4 w-full">
              <div className="bg-card border rounded-lg p-3">
                <div className="text-xs text-muted-foreground text-center mb-2">
                  Shielded Balances
                </div>
                <div className="space-y-1">
                  {Object.entries(walletState.shieldedBalances).map(
                    ([token, amount]) => (
                      <div
                        key={token}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-muted-foreground truncate">
                          {token.slice(0, 8)}...
                        </span>
                        <span className="font-mono font-semibold">
                          {formatTokenBalance(token, amount)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Dust Balance */}
        {walletState?.dustBalance && (
          <div className="mt-2 w-full">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="text-xs text-muted-foreground text-center mb-1">
                ✨ Dust Balance
              </div>
              <div className="text-center">
                <span className="font-mono font-bold text-sm">
                  {formatDustAmount(walletState.dustBalance.balance)}
                </span>
                <span className="text-xs text-muted-foreground mx-1">/</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDustAmount(walletState.dustBalance.cap)} tDUST cap
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Details Button */}
        {walletAPI && (
          <div className="mt-4 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccountDetails(true)}
              className="w-full"
            >
              View Full Details
            </Button>
          </div>
        )}

        {/* Account Details */}
        {walletAPI && (
          <div className="mt-6 w-full space-y-4">
            {/* Shielded Address */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center">
                Shielded Address
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(walletAPI.address, 'Shielded Address')
                }
                className={`w-full p-2 rounded-md transition-all duration-200 text-center group relative overflow-hidden ${
                  copiedField === 'Shielded Address'
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
                title="Click to copy shielded address"
              >
                <code
                  className={`text-xs break-all font-mono leading-relaxed transition-all duration-200 ${
                    copiedField === 'Shielded Address'
                      ? 'text-green-700 dark:text-green-300 blur-sm'
                      : 'text-foreground group-hover:text-primary'
                  }`}
                >
                  {walletAPI.address || 'Not available'}
                </code>
                {copiedField === 'Shielded Address' && (
                  <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                      ✓ Copied!
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Shielded Coin Public Key */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center">
                Shielded Coin Public Key
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    walletAPI.coinPublicKey,
                    'Shielded Coin Public Key',
                  )
                }
                className={`w-full p-2 rounded-md transition-all duration-200 text-center group relative overflow-hidden ${
                  copiedField === 'Shielded Coin Public Key'
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
                title="Click to copy shielded coin public key"
              >
                <code
                  className={`text-xs break-all font-mono leading-relaxed transition-all duration-200 ${
                    copiedField === 'Shielded Coin Public Key'
                      ? 'text-green-700 dark:text-green-300 blur-sm'
                      : 'text-foreground group-hover:text-primary'
                  }`}
                >
                  {walletAPI.coinPublicKey || 'Not available'}
                </code>
                {copiedField === 'Shielded Coin Public Key' && (
                  <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                      ✓ Copied!
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Shielded Encryption Public Key */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center">
                Shielded Encryption Public Key
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    walletAPI.encryptionPublicKey,
                    'Shielded Encryption Public Key',
                  )
                }
                className={`w-full p-2 rounded-md transition-all duration-200 text-center group relative overflow-hidden ${
                  copiedField === 'Shielded Encryption Public Key'
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
                title="Click to copy shielded encryption public key"
              >
                <code
                  className={`text-xs break-all font-mono leading-relaxed transition-all duration-200 ${
                    copiedField === 'Shielded Encryption Public Key'
                      ? 'text-green-700 dark:text-green-300 blur-sm'
                      : 'text-foreground group-hover:text-primary'
                  }`}
                >
                  {walletAPI.encryptionPublicKey || 'Not available'}
                </code>
                {copiedField === 'Shielded Encryption Public Key' && (
                  <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                      ✓ Copied!
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Copy tip */}
            <div className="text-xs text-muted-foreground text-center">
              💡 Click any field to copy to clipboard
            </div>
          </div>
        )}
      </div>

      {/* Account Details Modal */}
      {walletAPI && (
        <AccountDetailsModal
          isOpen={showAccountDetails}
          onClose={() => setShowAccountDetails(false)}
          walletAPI={walletAPI}
        />
      )}
    </>
  );

  const renderSettingsPage = () => (
    <>
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => setCurrentPage('main')}
          className="p-2 rounded-full hover:bg-muted"
          title="Back to account"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">Preferences</h2>
      </div>

      <div className="flex flex-col items-center text-left p-6 pt-0 flex-1 overflow-y-auto">
        <GlobalPreferences inline={true} />
      </div>
    </>
  );

  return (
    <>
      {/* Backdrop blur overlay */}
      {/* <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]" /> */}

      {/* External ">>" button - positioned exactly at the panel border */}
      <button
        type="button"
        onClick={isVisible ? onClose : () => onOpen()}
        className="fixed top-4 right-[336px] h-12 w-8 bg-background dark:bg-gray-900 border border-border rounded-l-lg z-[10001] flex items-center justify-center hover:bg-muted transition-colors"
        title={isVisible ? 'Close account panel' : 'Open account panel'}
      >
        <ChevronsRight
          className={`h-5 w-5 transition-transform ${isVisible ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Account Panel */}
      <div
        className={`fixed top-0 right-4 h-screen w-80 bg-background dark:bg-gray-900 border border-border z-[10000] flex flex-col transition-transform transform ${isVisible ? 'translate-x-0' : 'translate-x-full'} rounded-l-xl shadow-lg overflow-hidden`}
      >
        {currentPage === 'main' ? renderMainPage() : renderSettingsPage()}
      </div>
    </>
  );
}
