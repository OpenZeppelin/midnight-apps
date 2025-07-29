'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from './theme-toggle';
import { useWallet } from '@/hooks/use-wallet';
import { useVersion } from '@/lib/version-context';
import { createContractIntegration, type ContractStatusInfo } from '@/lib/contract-integration';
import { Settings, Check, Clock, AlertCircle, CheckCircle, XCircle, Loader2, LayoutGrid, List, Globe, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

interface GlobalPreferencesProps {
  inline?: boolean;
  className?: string;
}

function PreferencesContent() {
  const { walletAPI, providers, isConnected } = useWallet();
  const { version, setVersion } = useVersion();
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);
  const [viewPreference, setViewPreferenceState] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [statusInfo, setStatusInfo] = useState<ContractStatusInfo>({ status: 'not-configured' });
  const [isLoading, setIsLoading] = useState(false);

  // Check contract status
  const checkContractStatus = useCallback(async () => {
    if (!walletAPI || !isConnected) {
      setStatusInfo({ 
        status: 'not-configured', 
        message: 'Please connect your wallet first' 
      });
      return;
    }

    setIsLoading(true);
    try {
      const contractIntegration = createContractIntegration(providers, walletAPI.wallet);
      const status = await contractIntegration.initialize();
      setStatusInfo(status);
    } catch (error) {
      setStatusInfo({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to check contract status',
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletAPI, providers, isConnected]);

  useEffect(() => {
    checkContractStatus();
  }, [checkContractStatus]);

  // Load animation setting from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lunarswap-animations-enabled');
      if (stored !== null) {
        setAnimationsEnabledState(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load animation settings:', error);
    }
  }, []);

  // Load view preference setting from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lunarswap-view-preference');
      if (stored === 'horizontal' || stored === 'vertical') {
        setViewPreferenceState(stored);
      }
    } catch (error) {
      console.warn('Failed to load view preference settings:', error);
    }
  }, []);

  // Save animation setting to localStorage
  const toggleAnimations = (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    try {
      localStorage.setItem('lunarswap-animations-enabled', JSON.stringify(enabled));
      // Trigger a custom event to notify background components
      window.dispatchEvent(new CustomEvent('animations-toggled', { detail: { enabled } }));
    } catch (error) {
      console.warn('Failed to save animation settings:', error);
    }
  };

  // Save view preference setting to localStorage
  const setViewPreference = (preference: 'horizontal' | 'vertical') => {
    setViewPreferenceState(preference);
    try {
      localStorage.setItem('lunarswap-view-preference', preference);
      // Trigger a custom event to notify components about view preference change
      window.dispatchEvent(new CustomEvent('view-preference-changed', { detail: { preference } }));
    } catch (error) {
      console.warn('Failed to save view preference settings:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'not-configured':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'not-deployed':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'not-configured':
        return 'Not Configured';
      case 'not-deployed':
        return 'Not Deployed';
      case 'error':
        return 'Error';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-blue-600 dark:text-blue-400';
      case 'not-configured':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'not-deployed':
        return 'text-orange-600 dark:text-orange-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const versions = [
    { id: 'V1', name: 'V1', description: 'Unpermissioned Shielded' },
    { id: 'V2', name: 'V2', description: 'Permissioned Shielded · Coming Soon', disabled: true },
    { id: 'V3', name: 'V3', description: 'Unpermissioned Unshielded · Coming Soon', disabled: true },
  ];

  return (
    <>
      {/* Contract Status Section */}
      <div className="px-2 py-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Contract Status
        </div>
        <button
          type="button"
          onClick={() => setShowContractDetails(true)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            {getStatusIcon(statusInfo.status)}
            <span className={`text-sm font-medium ${getStatusColor(statusInfo.status)}`}>
              {getStatusText(statusInfo.status)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Details
          </Badge>
        </button>
      </div>

      <div className="h-px bg-border my-2" />

      {/* Version Selection Section */}
      <div className="px-2 py-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Version
        </div>
        <div className="space-y-1">
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => !v.disabled && setVersion(v.id as 'V1' | 'V2' | 'V3')}
              disabled={v.disabled}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                v.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-muted cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2">
                {version === v.id ? (
                  <Check className="h-4 w-4 text-blue-500" />
                ) : v.disabled ? (
                  <Clock className="h-4 w-4 text-gray-400" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <div>
                  <div className="text-sm font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border my-2" />

      {/* Settings Section */}
      <div className="px-2 py-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Settings
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Theme</span>
            <span className="text-xs text-muted-foreground">
              Choose your preferred theme
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Background Animations Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              Background Animations
            </span>
            <span className="text-xs text-muted-foreground">
              Show floating particles and stars
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleAnimations(!animationsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              animationsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                animationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* View Preference Selection */}
        <div className="flex items-center justify-between p-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Layout</span>
            <span className="text-xs text-muted-foreground">
              Choose layout orientation
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewPreference('horizontal')}
              className={cn(
                'flex items-center justify-center text-muted-foreground',
                viewPreference === 'horizontal' && 'bg-background text-foreground',
              )}
              aria-label="Set horizontal layout"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewPreference('vertical')}
              className={cn(
                'flex items-center justify-center text-muted-foreground',
                viewPreference === 'vertical' && 'bg-background text-foreground',
              )}
              aria-label="Set vertical layout"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between p-2 rounded-lg opacity-60">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Language</span>
            <span className="text-xs text-muted-foreground">
              Choose your preferred language
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="flex items-center justify-between p-2 rounded-lg opacity-60">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Currency</span>
            <span className="text-xs text-muted-foreground">
              Choose your preferred currency
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
        </div>
      </div>

      {/* Contract Details Dialog */}
      <Dialog open={showContractDetails} onOpenChange={setShowContractDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon(statusInfo.status)}
              Contract Status
            </DialogTitle>
            <DialogDescription>
              Current status of the Lunarswap contract deployment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(statusInfo.status)}
                <span className={`text-sm font-medium ${getStatusColor(statusInfo.status)}`}>
                  {getStatusText(statusInfo.status)}
                </span>
              </div>
            </div>

            {statusInfo.contractAddress && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Contract Address</div>
                <code className="text-xs text-muted-foreground break-all">
                  {statusInfo.contractAddress}
                </code>
              </div>
            )}

            {statusInfo.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                  Error Details
                </div>
                <div className="text-xs text-red-600 dark:text-red-300">
                  {statusInfo.error}
                </div>
              </div>
            )}

            {statusInfo.status === 'not-configured' && (
              <div className="text-xs text-muted-foreground">
                Configure NEXT_PUBLIC_LUNARSWAP_CONTRACT_ADDRESS to deploy or connect to an existing contract.
              </div>
            )}

            {statusInfo.status === 'not-deployed' && (
              <div className="text-xs text-muted-foreground">
                Contract is configured but not yet deployed. Use the CLI to deploy.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GlobalPreferences({ inline = false, className = '' }: GlobalPreferencesProps = {}) {
  if (inline) {
    return (
      <div className={className}>
        <PreferencesContent />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-muted rounded-full"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Global preferences</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-white/20 dark:border-gray-800/30 rounded-xl shadow-lg">
          <DropdownMenuLabel className="text-sm font-medium">
            Global Preferences
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <PreferencesContent />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 