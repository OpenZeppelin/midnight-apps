// layout.tsx
import type React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/hot-toast';
import { NetworkProvider } from '@/lib/network-context';
import { VersionProvider } from '@/lib/version-context';
import { MidnightWalletProvider } from '@/lib/wallet-context';
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

export const metadata = {
  title: 'Decentralized Exchange',
  description:
    'Swap tokens on the lunar surface with the most celestial DEX in the galaxy',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: ['/logo.svg'],
    apple: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
      </head>
      <body>
        <RuntimeConfigurationProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <VersionProvider>
              <MidnightWalletProvider logger={logger}>
                <NetworkProvider>{children}</NetworkProvider>
              </MidnightWalletProvider>
            </VersionProvider>
            <Toaster />
          </ThemeProvider>
        </RuntimeConfigurationProvider>
      </body>
    </html>
  );
}
