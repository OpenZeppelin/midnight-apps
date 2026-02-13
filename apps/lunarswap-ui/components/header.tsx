'use client';

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GlobalPreferences } from '@/components/global-preferences';
import { Logo } from '@/components/logo';
import { VersionBadge } from '@/components/version-badge';
import { WalletConnect } from '@/components/wallet-connect';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/trade', label: 'Trade' },
  { href: '/explore', label: 'Explore' },
  { href: '/pool', label: 'Pool' },
];

export function Header() {
  const location = useLocation();
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const { isConnected } = useWallet();

  // Check if we're on the landing page (home page)
  const isLandingPage = location.pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        isLandingPage
          ? 'bg-transparent border-transparent'
          : 'backdrop-blur-xl border-b bg-white/30 dark:bg-gray-900/20 border-white/20 dark:border-gray-800/30',
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Logo size={36} />
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
            <VersionBadge />
            {!isConnected && !isAccountPanelOpen && <GlobalPreferences />}
            <WalletConnect onAccountPanelStateChange={setIsAccountPanelOpen} />
          </div>
        </div>
      </div>
    </header>
  );
}
