'use client';

import { useWallet } from '@/hooks/use-wallet';
import { ChevronLeft, ChevronsRight, LogOut, Settings, Copy } from 'lucide-react';
import { NetworkSelector } from './network-selector';
import { Identicon } from './identicon';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { useState } from 'react';
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
  const [view, setView] = useState<'main' | 'settings'>('main');

  const formatAddress = (address: string | undefined) => {
    if (!address) return { coinPublicKey: '', encryptionPublicKey: '' };
    const parts = address.split('|');
    if (parts.length >= 2) {
      return {
        coinPublicKey: parts[0],
        encryptionPublicKey: parts[1]
      };
    }
    return {
      coinPublicKey: address,
      encryptionPublicKey: ''
    };
  };

  const walletInfo = formatAddress(walletState?.address);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error('Could not copy to clipboard');
    });
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
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-muted">
          <ChevronsRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView('settings')} className="p-2 rounded-full hover:bg-muted">
            <Settings className="h-5 w-5" />
          </button>
          <NetworkSelector />
          <button type="button" onClick={handleDisconnect} className="p-2 rounded-full hover:bg-muted text-destructive">
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
        <p className="font-semibold text-lg">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '...'}</p>
        <p className="text-4xl font-bold mt-2">0 <span className="text-2xl font-medium text-muted-foreground">DUST</span></p>
      </div>

      <div className="px-6 space-y-4 mt-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Coin Public Key</h4>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <code className="text-xs flex-1 break-all text-left">{walletInfo.coinPublicKey}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(walletInfo.coinPublicKey, 'Coin public key')}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {walletInfo.encryptionPublicKey && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Encryption Public Key</h4>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <code className="text-xs flex-1 break-all text-left">{walletInfo.encryptionPublicKey}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(walletInfo.encryptionPublicKey, 'Encryption public key')}
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Full Address</h4>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <code className="text-xs flex-1 break-all text-left">{walletState?.address}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(walletState?.address || '', 'Full address')}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  const SettingsView = () => (
    <>
      <div className="flex items-center p-4">
        <button type="button" onClick={() => setView('main')} className="p-2 rounded-full hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold mx-auto">Settings</h3>
      </div>
      <div className="p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Theme</h4>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-background/90 dark:bg-gray-900/80 backdrop-blur-md z-50 flex flex-col transition-transform transform translate-x-0">
      {view === 'main' ? <MainView /> : <SettingsView />}
    </div>
  );
} 