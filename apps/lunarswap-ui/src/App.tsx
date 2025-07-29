import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { NetworkProvider } from '@/lib/network-context';
import { VersionProvider } from '@/lib/version-context';
import { MidnightWalletProvider } from '@/lib/wallet-context';
import { ThemeProvider } from 'next-themes';
import { RuntimeConfigurationProvider } from '@/lib/runtime-configuration';
import Home from '@/app/page';
import PoolPage from '@/app/pool/page';
import NewPositionPage from '@/app/pool/new/page';
import TokensPage from '@/app/tokens/page';
import ExplorePage from '@/app/explore/page';
import '../app/globals.css';
import pino from 'pino';

// Create a logger instance
const logger = pino({
  level: 'info',
  browser: {
    asObject: true,
  },
});

const App = () => {
  return (
    <RuntimeConfigurationProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <VersionProvider>
          <MidnightWalletProvider logger={logger}>
            <NetworkProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/pool" element={<PoolPage />} />
                  <Route path="/pool/new" element={<NewPositionPage />} />
                  <Route path="/tokens" element={<TokensPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                </Routes>
              </BrowserRouter>
            </NetworkProvider>
          </MidnightWalletProvider>
        </VersionProvider>
        <Toaster />
      </ThemeProvider>
    </RuntimeConfigurationProvider>
  );
};

export default App;
