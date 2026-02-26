// layout.tsx
import type React from 'react';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import pino from 'pino';
import { Toaster } from '@/components/ui/sonner';
import { LunarswapProvider } from '@/lib/lunarswap-context';
import { NetworkProvider } from '@/lib/network-context';
import { RuntimeConfigurationProvider } from '@/lib/runtime-configuration';
import { ShieldedTokenProvider } from '@/lib/shielded-token-context';
import { VersionProvider } from '@/lib/version-context';
import { MidnightWalletProvider } from '@/lib/wallet-context';

// Create a logger instance
const logger = pino({
  level: 'info',
  browser: {
    asObject: true,
  },
});

// Remove Inter font and Script usage
// const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RuntimeConfigurationProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <VersionProvider>
              <MidnightWalletProvider logger={logger}>
                <LunarswapProvider>
                  <ShieldedTokenProvider>
                    <NetworkProvider>{children}</NetworkProvider>
                  </ShieldedTokenProvider>
                </LunarswapProvider>
              </MidnightWalletProvider>
            </VersionProvider>
            <Toaster />
          </ThemeProvider>
        </RuntimeConfigurationProvider>
      </body>
    </html>
  );
}
