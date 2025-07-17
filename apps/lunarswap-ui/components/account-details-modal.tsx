'use client';

import { Copy, X } from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { Identicon } from './identicon';
import type { WalletState } from '@/lib/types';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletState: WalletState | null;
}

interface AccountField {
  label: string;
  value: string;
  description?: string;
}

export function AccountDetailsModal({ isOpen, onClose, walletState }: AccountDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
    
    // Make all elements behind the modal non-interactive
    const style = document.createElement('style');
    style.id = 'modal-overlay-style';
    style.textContent = `
      html, body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      body > *:not([data-modal-portal]) {
        pointer-events: none !important;
        filter: grayscale(0.3) brightness(0.7) !important;
        opacity: 0.6 !important;
      }
      
      [data-modal-portal] {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 99999 !important;
        background-color: rgba(0, 0, 0, 0.8) !important;
        backdrop-filter: blur(8px) !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
      
      // Remove the style
      const existingStyle = document.getElementById('modal-overlay-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !walletState || !mounted) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle backdrop keyboard events
  const handleBackdropKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  // Define the account fields to display
  const accountFields: AccountField[] = [
    {
      label: 'Address',
      value: walletState.address || '',
      description: 'Your main wallet address'
    },
    {
      label: 'Address (Legacy)',
      value: walletState.addressLegacy || '',
      description: 'Legacy format wallet address'
    },
    {
      label: 'Coin Public Key',
      value: walletState.coinPublicKey || '',
      description: 'Public key for coin operations'
    },
    {
      label: 'Coin Public Key (Legacy)',
      value: walletState.coinPublicKeyLegacy || '',
      description: 'Legacy format coin public key'
    },
    {
      label: 'Encryption Public Key',
      value: walletState.encryptionPublicKey || '',
      description: 'Public key for encryption operations'
    },
    {
      label: 'Encryption Public Key (Legacy)',
      value: walletState.encryptionPublicKeyLegacy || '',
      description: 'Legacy format encryption public key'
    }
  ];

  const modalContent = (
    <dialog
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[99999] flex items-center justify-center p-4 border-0 pointer-events-auto animate-in fade-in duration-200" 
      style={{ 
        position: 'fixed', 
        top: '0px', 
        left: '0px', 
        right: '0px', 
        bottom: '0px',
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        margin: '0',
        padding: '0'
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      aria-modal="true"
      aria-labelledby="modal-title"
      open
      data-modal-portal
    >
      <div 
        className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden relative pointer-events-auto" 
        style={{ 
          zIndex: 100000,
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
              <Identicon address={walletState.address || ''} size={40} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="modal-title" className="text-lg font-bold text-foreground truncate">Account Details</h2>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {walletState.address ? `${walletState.address.slice(0, 10)}...${walletState.address.slice(-10)}` : '...'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0 hover:bg-muted/80 ml-2"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-4">
            {accountFields.map((field) => (
              <div key={field.label} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{field.label}</h3>
                    {field.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{field.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(field.value, field.label)}
                  className={`w-full p-3 rounded-lg transition-all duration-200 text-left group relative overflow-hidden ${
                    copiedField === field.label
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                  disabled={!field.value}
                  title={`Click to copy ${field.label.toLowerCase()}`}
                >
                  <code className={`text-xs break-all font-mono leading-relaxed transition-all duration-200 ${
                    copiedField === field.label
                      ? 'text-green-700 dark:text-green-300 blur-sm'
                      : 'text-foreground group-hover:text-primary'
                  }`}>
                    {field.value || (
                      <span className="text-muted-foreground italic">Not available</span>
                    )}
                  </code>
                  {copiedField === field.label && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                        ✓ Copied!
                      </span>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>💡 Click any address to copy it to your clipboard</div>
          </div>
        </div>
      </div>
    </dialog>
  );

  return createPortal(modalContent, document.body);
} 