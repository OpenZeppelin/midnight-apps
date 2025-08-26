// layout.tsx
import React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/hot-toast';
import { NetworkProvider } from '@/lib/network-context';
import { VersionProvider } from '@/lib/version-context';
import { MidnightWalletProvider } from '@/lib/wallet-context';
import { LunarswapProvider } from '@/lib/lunarswap-context';
import { ThemeProvider } from 'next-themes';
import { RuntimeConfigurationProvider } from '@/lib/runtime-configuration';
import pino from 'pino';

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
}: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RuntimeConfigurationProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <VersionProvider>
              <MidnightWalletProvider logger={logger}>
                <LunarswapProvider>
                  <NetworkProvider>
                    {children}
                  </NetworkProvider>
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
