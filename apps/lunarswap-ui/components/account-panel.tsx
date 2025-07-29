'use client';

import { useWallet } from '@/hooks/use-wallet';
import { useWalletRx } from '@/hooks/use-wallet-rx';
import { formatAddress } from '@/utils/wallet-utils';
import { ChevronsRight, LogOut, Settings, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AccountDetailsModal } from './account-details-modal';
import { BalanceDisplay } from './balance-display';
import { Identicon } from './identicon';
import { NetworkSelector } from './network-selector';
import { GlobalPreferences } from './global-preferences';
import { Button } from '@/components/ui/button';
import type { DAppConnectorWalletState } from '@midnight-ntwrk/dapp-connector-api';

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
  const { address, walletAPI, isConnected } = useWallet();
  const { refresh } = useWalletRx();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState<AccountPanelPage>('main');
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Create a compatible wallet state object for the AccountDetailsModal
  const walletState: DAppConnectorWalletState | null = walletAPI && address ? {
    address,
    addressLegacy: address, // Use the same address for legacy for now
    coinPublicKey: walletAPI.coinPublicKey,
    coinPublicKeyLegacy: walletAPI.coinPublicKey, // Use the same key for legacy for now
    encryptionPublicKey: walletAPI.encryptionPublicKey,
    encryptionPublicKeyLegacy: walletAPI.encryptionPublicKey, // Use the same key for legacy for now
  } : null;

  const walletInfo = formatAddress(address);

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
      <div className="flex items-center justify-between p-4">
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
        <button
          type="button"
          onClick={() => setShowAccountDetails(true)}
          className="font-medium text-base hover:text-primary transition-colors cursor-pointer flex items-center gap-2 group"
          title="Click to view account details"
        >
          <span className="font-mono text-muted-foreground">
            {address
              ? `${address.slice(0, 6)}...${address.slice(-5)}`
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

        {/* Additional buttons or info can be added here */}
      </div>
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
      
      {/* External ">>" button - positioned on left side of the panel */}
      <button
        type="button"
        onClick={isVisible ? onClose : () => onOpen()}
        className="fixed top-4 right-84 h-12 w-8 bg-background dark:bg-gray-900 border border-border border-r-0 rounded-l-lg shadow-lg z-[10001] flex items-center justify-center hover:bg-muted transition-colors"
        title={isVisible ? "Close account panel" : "Open account panel"}
      >
        <ChevronsRight className={`h-5 w-5 transition-transform ${isVisible ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Account Panel */}
      <div className={`fixed top-0 right-4 h-screen w-80 bg-background dark:bg-gray-900 border border-border z-[10000] flex flex-col transition-transform transform ${isVisible ? 'translate-x-0' : 'translate-x-full'} rounded-l-xl shadow-lg overflow-hidden`}>
        {currentPage === 'main' ? renderMainPage() : renderSettingsPage()}
      </div>

      <AccountDetailsModal
        isOpen={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        walletState={walletState}
      />
    </>
  );
}

