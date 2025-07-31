'use client';

import { Logo } from '@/components/logo';
import { WalletConnect } from '@/components/wallet-connect';
import { GlobalPreferences } from '@/components/global-preferences';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/utils/cn';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Trade' },
  { href: '/pool', label: 'Pool' },
  { href: '/explore', label: 'Explore' },
];

export function Header() {
  const location = useLocation();
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const { isConnected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/30 dark:bg-gray-900/20 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/30 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Logo size={36} />
              <span className="bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-300 dark:to-blue-400 bg-clip-text text-transparent font-bold tracking-tight">
                Lunarswap
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side - Global Preferences (only when not connected) and Wallet Connect */}
          <div className="flex items-center space-x-2">
            {!isConnected && !isAccountPanelOpen && <GlobalPreferences />}
            <WalletConnect onAccountPanelStateChange={setIsAccountPanelOpen} />
          </div>
        </div>
      </div>
    </header>
  );
}
