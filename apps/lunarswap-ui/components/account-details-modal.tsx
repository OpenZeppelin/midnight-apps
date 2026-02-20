'use client';

// DAppConnectorWalletState no longer exists in new API
import { Coins, Database, Globe, Server, Wallet, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWalletRx } from '@/hooks/use-wallet-rx';
import type { WalletAPI } from '@/lib/wallet-context';
import { Identicon } from './identicon';
import { Button } from './ui/button';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAPI?: WalletAPI;
}

interface AccountField {
  label: string;
  value: string;
  description?: string;
  isLegacy?: boolean;
  type: 'shielded' | 'unshielded' | 'dust' | 'balance' | 'service' | 'network';
  icon?: React.ReactNode;
}

export function AccountDetailsModal({
  isOpen,
  onClose,
  walletAPI,
}: AccountDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState<Record<string, boolean>>({});
  const { state: walletState } = useWalletRx();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

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
      const existingStyle = document.getElementById('modal-overlay-style');
      if (existingStyle) existingStyle.remove();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setShowLegacy({});
  }, [isOpen]);

  if (!isOpen || !walletAPI || !mounted) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleBackdropKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };

  const toggleLegacy = (type: string) => {
    setShowLegacy((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Format balances for display
  const formatBalance = (
    balances: Record<string, bigint> | undefined,
  ): string => {
    if (!balances || Object.keys(balances).length === 0) return 'No balances';
    return Object.entries(balances)
      .map(([token, amount]) => `${token}: ${amount.toString()}`)
      .join(', ');
  };

  const accountFields: AccountField[] = [
    // Shielded Section
    {
      label: 'Shielded Address',
      value: walletAPI.address || '',
      description: 'Your main shielded wallet address for private transactions',
      type: 'shielded',
      isLegacy: false,
    },
    {
      label: 'Shielded Coin Public Key',
      value: walletAPI.coinPublicKey || '',
      description: 'Public key for shielded coin operations',
      type: 'shielded',
      isLegacy: false,
    },
    {
      label: 'Shielded Encryption Public Key',
      value: walletAPI.encryptionPublicKey || '',
      description: 'Public key for shielded encryption operations',
      type: 'shielded',
      isLegacy: false,
    },
    {
      label: 'Shielded Balances',
      value: formatBalance(walletState?.shieldedBalances),
      description: 'Your shielded token balances',
      type: 'balance',
      isLegacy: false,
      icon: <Wallet className="h-3 w-3" />,
    },
    // Unshielded Section
    ...(walletState?.unshieldedAddress
      ? [
          {
            label: 'Unshielded Address',
            value: walletState.unshieldedAddress,
            description:
              'Your unshielded wallet address for public transactions',
            type: 'unshielded' as const,
            isLegacy: false,
          },
        ]
      : []),
    ...(walletState?.unshieldedBalances
      ? [
          {
            label: 'Unshielded Balances',
            value: formatBalance(walletState.unshieldedBalances),
            description: 'Your unshielded token balances',
            type: 'balance' as const,
            isLegacy: false,
            icon: <Coins className="h-3 w-3" />,
          },
        ]
      : []),
    // Dust Section
    ...(walletState?.dustAddress
      ? [
          {
            label: 'Dust Address',
            value: walletState.dustAddress,
            description: 'Your Dust wallet address',
            type: 'dust' as const,
            isLegacy: false,
          },
        ]
      : []),
    ...(walletState?.dustBalance
      ? [
          {
            label: 'Dust Balance',
            value: `${walletState.dustBalance.balance.toString()} / ${walletState.dustBalance.cap.toString()} (cap)`,
            description: 'Your current Dust balance and generation cap',
            type: 'balance' as const,
            isLegacy: false,
            icon: <Coins className="h-3 w-3" />,
          },
        ]
      : []),
    // Network & Services Section
    {
      label: 'Network ID',
      value: walletAPI?.configuration?.networkId || 'unknown',
      description: 'Connected network identifier',
      type: 'network',
      isLegacy: false,
      icon: <Globe className="h-3 w-3" />,
    },
    {
      label: 'Indexer HTTP',
      value: walletAPI?.configuration?.indexerUri || 'Not configured',
      description: 'Blockchain data indexer (HTTP endpoint)',
      type: 'service',
      isLegacy: false,
      icon: <Database className="h-3 w-3" />,
    },
    {
      label: 'Indexer WebSocket',
      value: walletAPI?.configuration?.indexerWsUri || 'Not configured',
      description: 'Blockchain data indexer (WebSocket endpoint)',
      type: 'service',
      isLegacy: false,
      icon: <Database className="h-3 w-3" />,
    },
    {
      label: 'Substrate Node',
      value: walletAPI?.configuration?.substrateNodeUri || 'Not configured',
      description: 'Substrate blockchain node URI',
      type: 'service',
      isLegacy: false,
      icon: <Server className="h-3 w-3" />,
    },
    ...(walletAPI?.configuration?.proverServerUri
      ? [
          {
            label: 'Prover Server (Deprecated)',
            value: walletAPI.configuration.proverServerUri,
            description:
              'Legacy ZK proof generation server - use getProvingProvider instead',
            type: 'service' as const,
            isLegacy: true,
            icon: <Server className="h-3 w-3" />,
          },
        ]
      : []),
  ];

  const groupedFields = accountFields.reduce(
    (acc, field) => {
      if (!acc[field.type]) acc[field.type] = [];
      acc[field.type].push(field);
      return acc;
    },
    {} as Record<string, AccountField[]>,
  );

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
        padding: '0',
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      aria-modal="true"
      aria-labelledby="modal-title"
      open
      data-modal-portal
    >
      {/* biome-ignore lint/a11y/useSemanticElements: fieldset is for forms; div with role=group is correct for modal content */}
      <div
        role="group"
        className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden relative pointer-events-auto"
        style={{
          zIndex: 100000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-muted/30 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
              <Identicon address={walletAPI.address || ''} size={40} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="modal-title"
                className="text-lg font-bold text-foreground truncate"
              >
                Account Details
              </h2>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {walletAPI.address
                  ? `${walletAPI.address.slice(0, 10)}...${walletAPI.address.slice(-10)}`
                  : '...'}
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

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {Object.entries(groupedFields).map(([type, fields]) => (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {type === 'shielded'
                    ? '🛡️ Shielded'
                    : type === 'unshielded'
                      ? '👁️ Unshielded'
                      : type === 'dust'
                        ? '✨ Dust'
                        : type === 'balance'
                          ? '💰 Balances'
                          : type === 'service'
                            ? '⚙️ Services'
                            : type === 'network'
                              ? '🌐 Network'
                              : type}
                </h3>
                {fields.map((field, _index) => (
                  <div key={field.label} className="relative">
                    {!field.isLegacy && (
                      <div className="bg-card border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/20 shrink-0 mt-0.5">
                            {field.icon ? (
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400">
                                  {field.icon}
                                </span>
                              </div>
                            ) : field.type === 'balance' ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Coins className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <Identicon
                                address={field.value || walletAPI.address || ''}
                                size={24}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground text-sm">
                                {field.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                •{' '}
                                {field.type === 'shielded'
                                  ? 'Shielded'
                                  : field.type === 'unshielded'
                                    ? 'Unshielded'
                                    : field.type === 'dust'
                                      ? 'Dust'
                                      : field.type === 'balance'
                                        ? 'Balance'
                                        : field.type === 'service'
                                          ? 'Service'
                                          : field.type === 'network'
                                            ? 'Network'
                                            : 'Info'}
                              </span>
                            </div>
                            {field.description && (
                              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                                {field.description}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(field.value, field.label)
                              }
                              className={`w-full p-2 rounded-md transition-all duration-200 text-left group relative overflow-hidden ${
                                copiedField === field.label
                                  ? 'bg-green-50 dark:bg-green-950/20'
                                  : 'bg-muted/30 hover:bg-muted/50'
                              }`}
                              disabled={!field.value}
                              title={`Click to copy ${field.label.toLowerCase()}`}
                            >
                              <code
                                className={`text-xs break-all font-mono leading-relaxed transition-all duration-200 ${
                                  copiedField === field.label
                                    ? 'text-green-700 dark:text-green-300 blur-sm'
                                    : 'text-foreground group-hover:text-primary'
                                }`}
                              >
                                {field.value || (
                                  <span className="text-muted-foreground italic">
                                    Not available
                                  </span>
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
                            {fields.some(
                              (f) => f.isLegacy && f.type === field.type,
                            ) && (
                              <button
                                type="button"
                                onClick={() => toggleLegacy(field.type)}
                                className="text-xs text-primary hover:underline mt-2"
                              >
                                {showLegacy[field.type]
                                  ? 'Hide Legacy'
                                  : 'Show Legacy'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {field.isLegacy && (
                      <div className="relative ml-6">
                        {showLegacy[field.type] && (
                          <div className="bg-muted/20 border border-dashed border-muted-foreground/30 rounded-lg p-3 hover:bg-muted/40 transition-colors animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-muted-foreground/30 shrink-0 mt-0.5">
                                <Identicon
                                  address={
                                    field.value || walletAPI.address || ''
                                  }
                                  size={20}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-foreground text-sm">
                                    {field.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    • Legacy
                                  </span>
                                </div>
                                {field.description && (
                                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                                    {field.description}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(field.value, field.label)
                                  }
                                  className={`w-full p-2 rounded-md transition-all duration-200 text-left group relative overflow-hidden ${
                                    copiedField === field.label
                                      ? 'bg-green-50 dark:bg-green-950/20'
                                      : 'bg-muted/30 hover:bg-muted/50'
                                  }`}
                                  disabled={!field.value}
                                  title={`Click to copy ${field.label.toLowerCase()}`}
                                >
                                  <code
                                    className={`text-xs break-all font-mono leading-relaxed transition-all duration-200 ${
                                      copiedField === field.label
                                        ? 'text-green-700 dark:text-green-300 blur-sm'
                                        : 'text-foreground group-hover:text-primary'
                                    }`}
                                  >
                                    {field.value || (
                                      <span className="text-muted-foreground italic">
                                        Not available
                                      </span>
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
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

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
