'use client';

import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLogger } from '@/hooks/use-logger';
import { useWallet } from '@/hooks/use-wallet';

interface LiquidityProgressProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  operationType?: 'add-liquidity' | 'remove-liquidity' | 'swap';
}

export function LiquidityProgress({
  isOpen,
  onClose,
  onComplete,
  operationType = 'add-liquidity',
}: LiquidityProgressProps) {
  const _logger = useLogger();
  const { snackBarText } = useWallet();
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isTransactionActive, setIsTransactionActive] = useState(false);
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);

  // Get operation-specific content
  const getOperationContent = () => {
    switch (operationType) {
      case 'remove-liquidity':
        return {
          title: 'Removing Liquidity',
          description:
            'Please wait while we process your liquidity removal. This may take a few minutes.',
        };
      case 'swap':
        return {
          title: 'Swapping Tokens',
          description:
            'Please wait while we process your token swap. This may take a few minutes.',
        };
      default:
        return {
          title: 'Adding Liquidity',
          description:
            'Please wait while we process your liquidity addition. This may take a few minutes.',
        };
    }
  };

  const operationContent = getOperationContent();

  // Prevent page refresh and tab close during transaction
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTransactionActive) {
        e.preventDefault();
        e.returnValue =
          'A transaction is in progress. Are you sure you want to leave? This may cause the transaction to fail.';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (isTransactionActive && document.visibilityState === 'hidden') {
        // User is trying to close the tab or switch away
        // We can't prevent tab close, but we can show a warning when they return
        _logger?.warn(
          '[LiquidityProgress] User attempted to close tab during transaction',
        );
      }
    };

    if (isTransactionActive) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTransactionActive, _logger]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsTransactionActive(true);
      setIsTransactionComplete(false);
    } else {
      setIsTransactionActive(false);
      setIsTransactionComplete(false);
    }
  }, [isOpen]);

  // Check for completion when snackBarText indicates transaction is finalized
  useEffect(() => {
    if (!isOpen || !snackBarText) return;

    // Check if the transaction is finalized
    if (snackBarText.includes('Transaction finalized')) {
      setIsTransactionComplete(true);
      setIsTransactionActive(false);

      // Call onComplete after a short delay to show the success state
      setTimeout(() => {
        onComplete();
      }, 2000); // Give user time to see the success message
    }
  }, [snackBarText, isOpen, onComplete]);

  const handleDialogClose = () => {
    if (isTransactionActive && !isTransactionComplete) {
      setShowCloseWarning(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setIsTransactionActive(false);
    setIsTransactionComplete(false);
    setShowCloseWarning(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-blue-600">
              {isTransactionComplete ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isTransactionComplete
                ? 'Transaction Complete'
                : operationContent.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isTransactionComplete
                ? 'Your transaction has been successfully processed and finalized on the blockchain.'
                : operationContent.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Warning Banner */}
            {isTransactionActive && !isTransactionComplete && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span className="font-medium text-xs">
                    Transaction in Progress
                  </span>
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">
                  Do not close this dialog or refresh the page. Your transaction
                  may fail if interrupted.
                </div>
              </div>
            )}

            {/* Success Banner */}
            {isTransactionComplete && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="font-medium text-xs">
                    Transaction Successful
                  </span>
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Your transaction has been finalized on the blockchain. You can
                  now close this dialog.
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div
              className={`p-3 rounded ${isTransactionComplete ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
            >
              <div className="flex items-center gap-3">
                {isTransactionComplete ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {snackBarText ||
                      (isTransactionComplete
                        ? 'Transaction completed successfully!'
                        : 'Processing transaction...')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {isTransactionComplete
                      ? 'Your transaction is now live on the blockchain'
                      : snackBarText
                        ? 'Please wait while we process your transaction'
                        : 'Initializing transaction...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Progress
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    isTransactionComplete
                      ? 'bg-green-500'
                      : 'bg-blue-500 animate-pulse'
                  }`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Status Information */}
            <div
              className={`p-2 rounded ${isTransactionComplete ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
            >
              <div className="text-xs space-y-0.5">
                <div
                  className={`font-medium ${isTransactionComplete ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}
                >
                  {isTransactionComplete ? 'Final Status:' : 'Current Status:'}
                </div>
                <div
                  className={
                    isTransactionComplete
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-blue-700 dark:text-blue-300'
                  }
                >
                  {snackBarText ||
                    (isTransactionComplete
                      ? 'Transaction finalized successfully!'
                      : 'Initializing transaction...')}
                </div>
                {!snackBarText && !isTransactionComplete && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Waiting for transaction to start...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDialogClose}
              disabled={isTransactionActive && !isTransactionComplete}
              className="text-sm px-3 py-1.5"
            >
              {isTransactionComplete
                ? 'Close'
                : isTransactionActive
                  ? 'Close (Disabled)'
                  : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Warning Dialog */}
      <AlertDialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Transaction in Progress
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              A transaction is currently being processed. Closing this dialog
              may cause the transaction to fail or become stuck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">
              Continue Transaction
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceClose}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              Force Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
