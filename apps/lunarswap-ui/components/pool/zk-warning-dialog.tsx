'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Info, AlertTriangle, Clock, Shield, Wallet } from 'lucide-react';

interface ZkWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  isSubmitting: boolean;
  operationType?: 'add-liquidity' | 'remove-liquidity' | 'swap';
  tokenASymbol?: string;
  tokenBSymbol?: string;
}

export function ZkWarningDialog({ 
  isOpen, 
  onClose, 
  onProceed, 
  isSubmitting, 
  operationType = 'add-liquidity',
  tokenASymbol = 'token A',
  tokenBSymbol = 'token B'
}: ZkWarningDialogProps) {
  
  // Get operation-specific content
  const getOperationContent = () => {
    switch (operationType) {
      case 'remove-liquidity':
        return {
          title: 'Remove Liquidity',
          description: 'This transaction requires a ZK proof to be generated for privacy and security.',
          circuit: 'removeLiquidity',
          iconColor: 'text-red-500'
        };
      case 'swap':
        return {
          title: 'Swap Tokens',
          description: 'This transaction requires a ZK proof to be generated for privacy and security.',
          circuit: 'swap',
          iconColor: 'text-green-500'
        };
      default:
        return {
          title: 'Add Liquidity',
          description: 'This transaction requires a ZK proof to be generated for privacy and security.',
          circuit: 'addLiquidity',
          iconColor: 'text-orange-500'
        };
    }
  };

  const operationContent = getOperationContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-lg ${operationContent.iconColor}`}>
            <Shield className="h-4 w-4" />
            Zero-Knowledge Proof Required
          </DialogTitle>
          <DialogDescription className="text-sm">
            {operationContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Circuit Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-xs">Circuit Constraints</span>
            </div>
            <div className="text-xs space-y-0.5">
              <div><strong>Circuit:</strong> {operationContent.circuit}</div>
              <div><strong>Complexity:</strong> k=19, rows=334,954</div>
              <div><strong>Security Level:</strong> 128-bit</div>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-yellow-600" />
              <span className="font-medium text-xs">Estimated Time</span>
            </div>
            <div className="text-xs">
              <strong>Local Proof Server:</strong> 3-8 minutes<br/>
              <strong>Remote Proof Server:</strong> 45-90 seconds<br/>
              <span className="text-xs text-gray-600">Time may vary based on your hardware and network</span>
            </div>
          </div>

          {/* Balance Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-3 w-3 text-red-600" />
              <span className="font-medium text-xs">Important Checks</span>
            </div>
            <div className="text-xs space-y-0.5">
              {operationType === 'swap' ? (
                <>
                  <div>✓ Verify you have sufficient {tokenASymbol} balance</div>
                  <div>✓ Ensure you have enough DUST for transaction fees</div>
                  <div>✓ Check your wallet connection is stable</div>
                </>
              ) : operationType === 'remove-liquidity' ? (
                <>
                  <div>✓ Verify you have sufficient LP token balance</div>
                  <div>✓ Ensure you have enough DUST for transaction fees</div>
                  <div>✓ Check your wallet connection is stable</div>
                </>
              ) : (
                <>
                  <div>✓ Verify you have sufficient {tokenASymbol} balance</div>
                  <div>✓ Verify you have sufficient {tokenBSymbol} balance</div>
                  <div>✓ Ensure you have enough DUST for transaction fees</div>
                  <div>✓ Check your wallet connection is stable</div>
                </>
              )}
            </div>
          </div>

          {/* Process Warning */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3 w-3 text-purple-600" />
              <span className="font-medium text-xs">During Proof Generation</span>
            </div>
            <div className="text-xs space-y-0.5">
              <div>⚠️ Do not refresh the page</div>
              <div>⚠️ Do not close the browser tab</div>
              <div>⚠️ Keep your wallet connected</div>
              <div>⚠️ The dialog will remain open until complete</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-sm px-3 py-1.5"
          >
            Cancel
          </Button>
          <Button 
            onClick={onProceed}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5"
          >
            {isSubmitting && (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            )}
            {isSubmitting ? 'Generating Proof...' : `Proceed with ${operationContent.title}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 