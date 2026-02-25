import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ExplorePage from '@/app/explore/page';
import PoolDetailPage from '@/app/explore/pool/[id]/page';
import Home from '@/app/page';
import NewPositionPage from '@/app/pool/new/page';
import PoolPage from '@/app/pool/page';
import TokensPage from '@/app/tokens/page';
import TradePage from '@/app/trade/page';
import { Toaster } from '@/components/ui/sonner';
import { LunarswapProvider } from '@/lib/lunarswap-context';
import { NetworkProvider } from '@/lib/network-context';
import {
  RuntimeConfigurationProvider,
  useRuntimeConfiguration,
} from '@/lib/runtime-configuration';
import { VersionProvider } from '@/lib/version-context';
import { MidnightWalletProvider } from '@/lib/wallet-context';
import '../app/globals.css';
import './animations.css';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import pino from 'pino';
import { type ReactNode, useMemo } from 'react';

// Component that creates logger with runtime configuration
function AppWithLogger({ children }: { children: ReactNode }) {
  const config = useRuntimeConfiguration();
  setNetworkId(config.DEFAULT_NETWORK);
  const logger = useMemo(
    () =>
      pino({
        level: config.LOGGING_LEVEL.toLowerCase(),
        browser: {
          asObject: true,
        },
      }),
    [config.LOGGING_LEVEL],
  );

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
            <LunarswapProvider>
              <NetworkProvider>
                <BrowserRouter basename="/lunarswap">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/trade" element={<TradePage />} />
                    <Route path="/pool" element={<PoolPage />} />
                    <Route path="/pool/new" element={<NewPositionPage />} />
                    <Route path="/tokens" element={<TokensPage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route
                      path="/explore/pool/:id"
                      element={<PoolDetailPage />}
                    />
                  </Routes>
                </BrowserRouter>
              </NetworkProvider>
            </LunarswapProvider>
          </AppWithLogger>
        </VersionProvider>
        <Toaster />
      </ThemeProvider>
    </RuntimeConfigurationProvider>
  );
};

export default App;
