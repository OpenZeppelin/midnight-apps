'use client';

import { ChevronDown, Chrome, ExternalLink, FlaskConical, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/hooks/use-wallet';
import { useRuntimeConfiguration } from '@/lib/runtime-configuration';
import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { getSupportedMidnightProviders } from '@/utils/wallet-utils';
import { AccountPanel } from './account-panel';
import { Identicon } from './identicon';

interface WalletConnectProps {
  onAccountPanelStateChange?: (isOpen: boolean) => void;
}

export function WalletConnect({
  onAccountPanelStateChange,
}: WalletConnectProps) {
  const { isConnected, isConnecting, connect, connectLocal, disconnect, address } =
    useWallet();
  const runtimeConfig = useRuntimeConfiguration();
  const testWalletAvailable = runtimeConfig.DEFAULT_NETWORK === 'undeployed';
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<
    'firefox' | 'no-wallet' | 'supported' | 'checking'
  >('checking');
  const [availableWallets, setAvailableWallets] = useState<InitialAPI[]>([]);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox =
      userAgent.includes('firefox') ||
      userAgent.includes('waterfox') ||
      userAgent.includes('iceweasel');

    if (isFirefox) {
      setBrowserStatus('firefox');
      return;
    }

    const isChromium =
      userAgent.includes('chrome') ||
      userAgent.includes('edge') ||
      userAgent.includes('brave') ||
      userAgent.includes('chromium');

    if (isChromium) {
      const checkWalletAvailability = () => {
        const providers = getSupportedMidnightProviders();
        setAvailableWallets(providers);
        setBrowserStatus(providers.length > 0 ? 'supported' : 'no-wallet');
      };

      checkWalletAvailability();
      const timeout = setTimeout(checkWalletAvailability, 1000);
      return () => clearTimeout(timeout);
    }

    setBrowserStatus('supported');
  }, []);

  const handleConnectLocal = async () => {
    try {
      await connectLocal();
      toast.success('Test wallet connecting (genesis seed, local node)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WalletConnect] connectLocal failed:', error);
      toast.error(message || 'Failed to start test wallet');
    }
  };

  const handleConnect = async (rdns?: string) => {
    try {
      await connect(true, rdns);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WalletConnect] Connect failed:', error);
      if (
        message.includes('Incompatible version') &&
        message.includes("Require '4.x'")
      ) {
        toast.error(
          'Midnight wallet is outdated. Please update your wallet extension to the latest version (requires connector API 4.x).',
          { duration: 8000 },
        );
      } else {
        toast.error(
          message.length > 80
            ? `Failed to connect to wallet: ${message.slice(0, 80)}…`
            : message || 'Failed to connect to wallet. Please try again.',
        );
      }
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
    window.open(
      'https://chrome.google.com/webstore/detail/midnight-lace/your-extension-id',
      '_blank',
    );
  };

  if (isConnected && address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-5)}`;

    return (
      <>
        <Button
          onClick={handleAccountPanelToggle}
          variant="outline"
          className="flex items-center gap-2 rounded-full px-3 py-2"
        >
          <Identicon address={address} size={20} />
          <span className="font-mono text-sm">{shortAddress}</span>
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

  if (browserStatus === 'firefox') {
    if (testWalletAvailable) {
      // Local-net dev still works in Firefox — only Lace requires Chromium.
      return (
        <Button
          onClick={handleConnectLocal}
          disabled={isConnecting}
          variant="outline"
          className="flex items-center gap-2 rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
        >
          <FlaskConical className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Use Test Wallet'}
        </Button>
      );
    }
    return (
      <Button
        onClick={openChromeDownload}
        variant="outline"
        className="flex items-center gap-2 rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
      >
        <Chrome className="h-4 w-4" />
        Midnight Wallets Not Available in Firefox
        <ExternalLink className="h-3 w-3" />
      </Button>
    );
  }

  if (browserStatus === 'no-wallet') {
    if (testWalletAvailable) {
      // Lace not installed but we're on local-net — offer the test wallet directly.
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isConnecting}
              className="flex items-center gap-2 rounded-full"
            >
              <Wallet className="h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Local network (undeployed)</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleConnectLocal}
              className="flex items-center gap-2"
            >
              <FlaskConical className="h-4 w-4 text-amber-600" />
              <div className="flex flex-col">
                <span>Test Wallet</span>
                <span className="text-muted-foreground text-xs">
                  Genesis seed, local docker only
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={openLaceWalletDownload}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Install a Midnight Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button
        onClick={openLaceWalletDownload}
        variant="outline"
        className="flex items-center gap-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
      >
        <Wallet className="h-4 w-4" />
        Install a Midnight Wallet
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

  // Multiple wallets, or single wallet + test wallet available on local-net:
  // show a picker dropdown so both options are reachable.
  if (availableWallets.length > 1 || testWalletAvailable) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-full"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableWallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.rdns}
              onClick={() => handleConnect(wallet.rdns)}
              className="flex items-center gap-2"
            >
              {wallet.icon ? (
                <img src={wallet.icon} alt="" className="h-4 w-4" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {wallet.name}
            </DropdownMenuItem>
          ))}
          {testWalletAvailable && (
            <>
              {availableWallets.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>Local network (undeployed)</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleConnectLocal}
                className="flex items-center gap-2"
              >
                <FlaskConical className="h-4 w-4 text-amber-600" />
                <div className="flex flex-col">
                  <span>Test Wallet</span>
                  <span className="text-muted-foreground text-xs">
                    Genesis seed, local docker only
                  </span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Single wallet, no test wallet available: connect directly to it.
  return (
    <Button
      onClick={() => handleConnect(availableWallets[0]?.rdns)}
      disabled={isConnecting}
      className="flex items-center gap-2 rounded-full"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
