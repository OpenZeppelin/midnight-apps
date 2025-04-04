'use client';

import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useState } from 'react';

export function WalletConnect() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');

  const connectWallet = () => {
    // Simulate wallet connection
    setConnected(true);
    setAddress('0x1234...5678');
  };

  if (connected) {
    return (
      <Button
        variant="outline"
        className="rounded-full border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {address}
      </Button>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-sm font-medium text-white"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
