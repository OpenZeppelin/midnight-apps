import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { NetworkProvider } from '@/lib/network-context';
import { VersionProvider } from '@/lib/version-context';
import { MidnightWalletProvider } from '@/lib/wallet-context';
import { ThemeProvider } from 'next-themes';
import {
  RuntimeConfigurationProvider,
  useRuntimeConfiguration,
} from '@/lib/runtime-configuration';
import Home from '@/app/page';
import PoolPage from '@/app/pool/page';
import NewPositionPage from '@/app/pool/new/page';
import TokensPage from '@/app/tokens/page';
import ExplorePage from '@/app/explore/page';
import '../app/globals.css';
import pino from 'pino';
import type { ReactNode } from 'react';
import type { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// Component that creates logger with runtime configuration
function AppWithLogger({ children }: { children: ReactNode }) {
  const config = useRuntimeConfiguration();
  // TODO: question: why do we need to set the network id here? why not directly detected from the wallet?
  setNetworkId(config.NETWORK_ID as NetworkId);
  const logger = pino({
    level: config.LOGGING_LEVEL.toLowerCase(),
    browser: {
      asObject: true,
    },
  });

  return (
    <MidnightWalletProvider logger={logger}>{children}</MidnightWalletProvider>
  );
}

const App = () => {
  return (
    <RuntimeConfigurationProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <VersionProvider>
          <AppWithLogger>
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
          </AppWithLogger>
        </VersionProvider>
        <Toaster />
      </ThemeProvider>
    </RuntimeConfigurationProvider>
  );
};

export default App;
