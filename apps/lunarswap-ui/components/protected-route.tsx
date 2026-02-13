import { Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/use-wallet';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
            <CardContent className="p-8 text-center">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Wallet Required</h3>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to access this page. You need a
                connected wallet to create liquidity positions.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
