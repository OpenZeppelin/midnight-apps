import { Button } from '@/components/ui/button';
import { Menu, Settings } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './logo';
import { NetworkSelector } from './network-selector';
import { ThemeToggle } from './theme-toggle';
import { WalletConnect } from './wallet-connect';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <Logo size={36} />
              <span className="bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-300 dark:to-blue-400 bg-clip-text text-transparent font-bold tracking-tight">
                Lunarswap
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-purple-400 transition"
              >
                Swap
              </Link>
              <Link
                href="/pool"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-purple-400 transition"
              >
                Pool
              </Link>
              <Link
                href="/charts"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-purple-400 transition"
              >
                Charts
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NetworkSelector />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <WalletConnect />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
