import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
// layout.tsx
import type React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/hot-toast';
import { NetworkProvider } from '@/lib/network-context';
import { VersionProvider } from '@/lib/version-context';
import { WalletProvider } from '@/lib/wallet-context';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lunarswap | Decentralized Exchange',
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
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const stored = localStorage.getItem('theme');
              if (stored === 'dark' || (!stored && isDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            })();
          `}
        </Script>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <VersionProvider>
            <WalletProvider>
              <NetworkProvider>{children}</NetworkProvider>
            </WalletProvider>
          </VersionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
