'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Wallet, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { AccountPanel } from './account-panel';
import { Identicon } from './identicon';

interface WalletConnectProps {
  onAccountPanelStateChange?: (isOpen: boolean) => void;
}

export function WalletConnect({ onAccountPanelStateChange }: WalletConnectProps) {
  const { isConnected, isConnecting, connect, disconnect, address, walletAPI } = useWallet();
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);

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
