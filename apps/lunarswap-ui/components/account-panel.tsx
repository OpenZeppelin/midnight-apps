'use client';

import { useWallet } from '@/hooks/use-wallet';
import { useWalletRx } from '@/hooks/use-wallet-rx';
import { formatAddress } from '@/lib/wallet-utils';
import { ChevronLeft, ChevronsRight, LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AccountDetailsModal } from './account-details-modal';
import { BalanceDisplay } from './balance-display';
import { Identicon } from './identicon';
import { NetworkSelector } from './network-selector';
import { ThemeToggle } from './theme-toggle';

export function AccountPanel({
  isVisible,
  onClose,
  onDisconnect,
}: {
  isVisible: boolean;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const { walletAddress, walletState } = useWallet();
  const { refresh } = useWalletRx();
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      refresh();
    }
  }, [isVisible, refresh]);

  const walletInfo = formatAddress(walletState?.address);

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

  const MainView = () => (
    <>
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted"
        >
          <ChevronsRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('settings')}
            className="p-2 rounded-full hover:bg-muted"
          >
            <Settings className="h-5 w-5" />
          </button>
          <NetworkSelector />
          <button
            type="button"
            onClick={handleDisconnect}
            className="p-2 rounded-full hover:bg-muted text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center text-center p-6 pt-0">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
            {walletAddress && <Identicon address={walletAddress} size={64} />}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAccountDetails(true)}
          className="font-medium text-base hover:text-primary transition-colors cursor-pointer flex items-center gap-2 group"
          title="Click to view account details"
        >
          <span className="font-mono text-muted-foreground">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-5)}`
              : '...'}
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors opacity-60">
            details
          </span>
        </button>

        {/* Balance Display */}
        <div className="mt-4">
          <BalanceDisplay
            showSyncStatus={true}
            showRefreshButton={true}
            className="text-4xl"
          />
        </div>

        {/* Transaction Count */}
        <div className="mt-2 text-sm text-muted-foreground">
          {/* transactionCount and error are no longer available */}
        </div>

        {/* Error Display */}
        {/* error and transactionCount are no longer available */}
        {/*
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-sm">
            <div className="text-red-700 dark:text-red-400 font-medium">
              Sync Error
            </div>
            <div className="text-red-600 dark:text-red-300">{error}</div>
          </div>
        */}

        <div className="px-6 space-y-4 mt-6">
          {walletInfo.encryptionPublicKey && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Encryption Public Key
              </h4>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    walletInfo.encryptionPublicKey,
                    'Encryption public key',
                  )
                }
                className={`w-full p-3 rounded-lg transition-all duration-200 text-left group relative overflow-hidden ${
                  copiedField === 'Encryption public key'
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
                title="Click to copy encryption public key"
              >
                <code
                  className={`text-xs break-all font-mono transition-all duration-200 ${
                    copiedField === 'Encryption public key'
                      ? 'text-green-700 dark:text-green-300 blur-sm'
                      : 'group-hover:text-primary'
                  }`}
                >
                  {walletInfo.encryptionPublicKey}
                </code>
                {copiedField === 'Encryption public key' && (
                  <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                      ✓ Copied!
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const SettingsView = () => (
    <>
      <div className="flex items-center p-4">
        <button
          type="button"
          onClick={() => setView('main')}
          className="p-2 rounded-full hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold mx-auto">Settings</h3>
      </div>
      <div className="p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Theme
        </h4>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <>
      <div className="fixed top-0 right-0 h-full w-80 bg-background/90 dark:bg-gray-900/80 backdrop-blur-md z-50 flex flex-col transition-transform transform translate-x-0">
        {view === 'main' ? <MainView /> : <SettingsView />}
      </div>
      <AccountDetailsModal
        isOpen={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        walletState={walletState}
      />
    </>
  );
}
