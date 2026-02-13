import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = '',
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const _errorName = typeof error === 'string' ? 'Error' : error.name;

  // Determine error type and icon
  const getErrorConfig = () => {
    const message = errorMessage.toLowerCase();

    if (
      message.includes('insufficient balance') ||
      message.includes('insufficient funds')
    ) {
      return {
        type: 'warning' as const,
        icon: AlertTriangle,
        title: 'Insufficient Balance',
        variant: 'default' as const,
      };
    }

    if (message.includes('slippage')) {
      return {
        type: 'warning' as const,
        icon: AlertTriangle,
        title: 'Slippage Error',
        variant: 'default' as const,
      };
    }

    if (message.includes('network') || message.includes('connection')) {
      return {
        type: 'error' as const,
        icon: XCircle,
        title: 'Network Error',
        variant: 'destructive' as const,
      };
    }

    if (message.includes('user rejected') || message.includes('cancelled')) {
      return {
        type: 'info' as const,
        icon: Info,
        title: 'Transaction Cancelled',
        variant: 'default' as const,
      };
    }

    return {
      type: 'error' as const,
      icon: XCircle,
      title: 'Transaction Failed',
      variant: 'destructive' as const,
    };
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <Alert variant={config.variant} className={className}>
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{errorMessage}</p>

        {showDetails && typeof error !== 'string' && error.stack && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Show technical details
            </summary>
            <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="text-xs"
            >
              Try Again
            </Button>
          )}

          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-xs"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Specialized error display for insufficient balance
export function InsufficientBalanceError({
  tokenA,
  tokenB,
  onRetry,
  onDismiss,
}: {
  tokenA: string;
  tokenB: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <Alert variant="default" className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">
        Insufficient Token Balance
      </AlertTitle>
      <AlertDescription className="mt-2 text-yellow-700">
        <p className="text-sm">
          You don't have enough {tokenA} and/or {tokenB} tokens to add
          liquidity.
        </p>
        <p className="text-xs mt-1 text-yellow-600">
          Please check your wallet balance and ensure you have sufficient tokens
          for this transaction.
        </p>

        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Check Balance
            </Button>
          )}

          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-xs text-yellow-600 hover:bg-yellow-100"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
