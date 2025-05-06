import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
// layout.tsx
import type React from 'react';
import './globals.css';
import { ThemeScript } from './theme-script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lunarswap | Decentralized Exchange',
  description:
    'Swap tokens on the lunar surface with the most celestial DEX in the galaxy',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: ['/logo.png'],
    apple: [{ url: '/logo.png' }],
  },
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
      </head>
      <body className={inter.className}>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
