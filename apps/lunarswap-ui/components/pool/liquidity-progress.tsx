'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface LiquidityProgressProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  operationType?: 'add-liquidity' | 'remove-liquidity' | 'swap';
}

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export function LiquidityProgress({ isOpen, onClose, onComplete, operationType = 'add-liquidity' }: LiquidityProgressProps) {
  const [currentStep, setCurrentStep] = useState<string>('checking-balance');
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'checking-balance',
      title: 'Checking Balance',
      description: 'Verifying token balances and preparing transaction',
      status: 'pending'
    },
    {
      id: 'fetching-params',
      title: 'Fetching Parameters',
      description: 'Downloading proof parameters and circuit keys',
      status: 'pending'
    },
    {
      id: 'generating-proof',
      title: 'Generating ZK Proof',
      description: 'Creating zero-knowledge proof for privacy',
      status: 'pending'
    },
    {
      id: 'signing-transaction',
      title: 'Signing Transaction',
      description: 'Signing with Midnight Lace wallet',
      status: 'pending'
    },
    {
      id: 'submitting-transaction',
      title: 'Submitting Transaction',
      description: 'Broadcasting transaction to network',
      status: 'pending'
    },
    {
      id: 'confirming',
      title: 'Confirming Transaction',
      description: 'Waiting for blockchain confirmation',
      status: 'pending'
    }
  ]);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isTransactionActive, setIsTransactionActive] = useState(false);

  // Get operation-specific content
  const getOperationContent = () => {
    switch (operationType) {
      case 'remove-liquidity':
        return {
          title: 'Removing Liquidity',
          description: 'Please wait while we process your liquidity removal. This may take a few minutes.'
        };
      case 'swap':
        return {
          title: 'Swapping Tokens',
          description: 'Please wait while we process your token swap. This may take a few minutes.'
        };
      default:
        return {
          title: 'Adding Liquidity',
          description: 'Please wait while we process your liquidity addition. This may take a few minutes.'
        };
    }
  };

  const operationContent = getOperationContent();

  // Prevent page refresh and tab close during transaction
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTransactionActive) {
        e.preventDefault();
        e.returnValue = 'A transaction is in progress. Are you sure you want to leave? This may cause the transaction to fail.';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (isTransactionActive && document.visibilityState === 'hidden') {
        // User is trying to close the tab or switch away
        // We can't prevent tab close, but we can show a warning when they return
        console.warn('User attempted to close tab during transaction');
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
  }, [isTransactionActive]);

  // Reset steps when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
      setCurrentStep('checking-balance');
      setIsTransactionActive(true);
    } else {
      setIsTransactionActive(false);
    }
  }, [isOpen]);

  // Simulate progress through steps based on typical transaction flow
  useEffect(() => {
    if (!isOpen) return;

    const stepOrder = [
      'checking-balance',
      'fetching-params', 
      'generating-proof',
      'signing-transaction',
      'submitting-transaction',
      'confirming'
    ];

    let currentIndex = 0;

    const progressInterval = setInterval(() => {
      if (currentIndex < stepOrder.length) {
        const stepId = stepOrder[currentIndex];
        
        // Update previous step to completed
        if (currentIndex > 0) {
          setSteps(prev => prev.map(step => 
            step.id === stepOrder[currentIndex - 1] 
              ? { ...step, status: 'completed' as const }
              : step
          ));
        }

        // Set current step to active
        setSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { ...step, status: 'active' as const }
            : step
        ));

        setCurrentStep(stepId);
        currentIndex++;
      } else {
        // All steps completed
        setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
        clearInterval(progressInterval);
        setIsTransactionActive(false);
        
        // Call onComplete after a short delay
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }, 3000); // Change step every 3 seconds to match typical transaction times

    return () => clearInterval(progressInterval);
  }, [isOpen, onComplete]);

  const handleDialogClose = () => {
    if (isTransactionActive) {
      setShowCloseWarning(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setIsTransactionActive(false);
    setShowCloseWarning(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              {operationContent.title}
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              {operationContent.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Warning Banner */}
            {isTransactionActive && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Transaction in Progress
                  </span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Do not close this dialog or refresh the page. Your transaction may fail if interrupted.
                </p>
              </div>
            )}

            {/* Progress Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3">
                  {/* Step Dot and Line */}
                  <div className="flex flex-col items-center">
                    {/* Previous Line */}
                    {index > 0 && (
                      <div 
                        className={`w-0.5 h-6 mb-1 ${
                          steps[index - 1].status === 'completed' 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    )}
                    
                    {/* Step Dot */}
                    <div className="relative">
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          step.status === 'completed'
                            ? 'bg-blue-500 border-blue-500'
                            : step.status === 'active'
                            ? 'bg-blue-500 border-blue-500 animate-pulse'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : step.status === 'active' ? (
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Next Line */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`w-0.5 h-6 mt-1 ${
                          step.status === 'completed' 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pt-0.5">
                    <h3 
                      className={`font-medium text-sm ${
                        step.status === 'active' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : step.status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((steps.filter(s => s.status === 'completed').length + 
                    (steps.find(s => s.status === 'active') ? 0.5 : 0)) / steps.length) * 100}%` 
                }}
              />
            </div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {steps.find(s => s.status === 'active')?.description || 
                 'All steps completed successfully!'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDialogClose}
                disabled={isTransactionActive}
                className="text-sm px-3 py-1.5"
              >
                {isTransactionActive ? 'Close (Disabled)' : 'Close'}
              </Button>
            </div>
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
              A transaction is currently being processed. Closing this dialog may cause the transaction to fail or become stuck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">Continue Transaction</AlertDialogCancel>
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