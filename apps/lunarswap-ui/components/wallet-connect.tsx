'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Wallet, ChevronDown, Chrome, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AccountPanel } from './account-panel';
import { Identicon } from './identicon';

interface WalletConnectProps {
  onAccountPanelStateChange?: (isOpen: boolean) => void;
}

export function WalletConnect({ onAccountPanelStateChange }: WalletConnectProps) {
  const { isConnected, isConnecting, connect, disconnect, address, walletAPI } = useWallet();
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<'firefox' | 'no-wallet' | 'supported' | 'checking'>('checking');

  useEffect(() => {
    // Check browser type
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.includes('firefox') || userAgent.includes('waterfox') || userAgent.includes('iceweasel');
    
    if (isFirefox) {
      setBrowserStatus('firefox');
      return;
    }

    // Check if it's a Chromium-based browser
    const isChromium = userAgent.includes('chrome') || userAgent.includes('edge') || userAgent.includes('brave') || userAgent.includes('chromium');
    
    if (isChromium) {
      // Check if Midnight Lace wallet is available
      const checkWalletAvailability = () => {
        if (typeof window !== 'undefined' && window.midnight?.mnLace) {
          setBrowserStatus('supported');
        } else {
          setBrowserStatus('no-wallet');
        }
      };

      // Check immediately
      checkWalletAvailability();

      // Also check after a short delay in case the wallet loads later
      const timeout = setTimeout(checkWalletAvailability, 1000);
      return () => clearTimeout(timeout);
    }
    
    // Other browsers, assume supported
    setBrowserStatus('supported');
  }, []);

  const handleConnect = async () => {
    try {
      await connect(true);
    } catch (error) {
      toast.error('Failed to connect to wallet. Please try again.');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsAccountPanelOpen(false);
    toast.success('Wallet disconnected');
  };

  const handleAccountPanelToggle = () => {
    const newState = !isAccountPanelOpen;
    setIsAccountPanelOpen(newState);
    onAccountPanelStateChange?.(newState);
  };

  const handleAccountPanelClose = () => {
    setIsAccountPanelOpen(false);
    onAccountPanelStateChange?.(false);
  };

  const openChromeDownload = () => {
    window.open('https://www.google.com/chrome/', '_blank');
  };

  const openLaceWalletDownload = () => {
    window.open('https://chrome.google.com/webstore/detail/midnight-lace/your-extension-id', '_blank');
  };

  if (isConnected && address) {
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-5)}` : '...';
    
    return (
      <>
        <Button
          onClick={handleAccountPanelToggle}
          variant="outline"
          className="flex items-center gap-2 rounded-full px-3 py-2"
        >
          <Identicon address={address} size={20} />
          <span className="font-mono text-sm">
            {shortAddress}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        <AccountPanel
          isVisible={isAccountPanelOpen}
          onClose={handleAccountPanelClose}
          onOpen={handleAccountPanelToggle}
          onDisconnect={handleDisconnect}
        />
      </>
    );
  }

  // Show appropriate message based on browser status
  if (browserStatus === 'firefox') {
    return (
      <Button
        onClick={openChromeDownload}
        variant="outline"
        className="flex items-center gap-2 rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
      >
        <Chrome className="h-4 w-4" />
        Lace Wallet Not Available in Firefox
        <ExternalLink className="h-3 w-3" />
      </Button>
    );
  }

  if (browserStatus === 'no-wallet') {
    return (
      <Button
        onClick={openLaceWalletDownload}
        variant="outline"
        className="flex items-center gap-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
      >
        <Wallet className="h-4 w-4" />
        Install Lace Wallet
        <ExternalLink className="h-3 w-3" />
      </Button>
    );
  }

  if (browserStatus === 'checking') {
    return (
      <Button
        disabled
        variant="outline"
        className="flex items-center gap-2 rounded-full"
      >
        <Wallet className="h-4 w-4" />
        Checking...
      </Button>
    );
  }

  // Default case - show normal connect wallet button
  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 rounded-full"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
