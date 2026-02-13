'use client';

import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Globe,
  Loader2,
  Settings,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLogger } from '@/hooks/use-logger';
import { useWallet } from '../hooks/use-wallet';
import { useLunarswapContext } from '../lib/lunarswap-context';
import { useVersion } from '../lib/version-context';
import { ThemeToggle } from './theme-toggle';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { VersionInfo } from './version-info';

interface GlobalPreferencesProps {
  inline?: boolean;
  className?: string;
}

function PreferencesContent() {
  const _logger = useLogger();
  const midnightWallet = useWallet();
  const { version, setVersion } = useVersion();
  const { statusInfo, isLoading, refreshContract } = useLunarswapContext();
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);
  const [showContractDetails, setShowContractDetails] = useState(false);

  // Use the contract integration context instead of local state
  // Load animation setting from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lunarswap-animations-enabled');
      if (stored !== null) {
        setAnimationsEnabledState(JSON.parse(stored));
      }
    } catch (error) {
      _logger?.warn(
        { error },
        `[GlobalPreferences] Failed to load animation settings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, [_logger]);

  // Save animation setting to localStorage
  const toggleAnimations = (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    try {
      localStorage.setItem(
        'lunarswap-animations-enabled',
        JSON.stringify(enabled),
      );
      // Trigger a custom event to notify background components
      window.dispatchEvent(
        new CustomEvent('animations-toggled', { detail: { enabled } }),
      );
    } catch (error) {
      _logger?.warn(
        { error },
        `[GlobalPreferences] Failed to save animation settings: ${error instanceof Error ? error.message : String(error)}`,
      );
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
    {
      id: 'V2',
      name: 'V2',
      description: 'Permissioned Shielded · Coming Soon',
      disabled: true,
    },
    {
      id: 'V3',
      name: 'V3',
      description: 'Unpermissioned Unshielded · Coming Soon',
      disabled: true,
    },
  ];

  return (
    <>
      {/* Contract Status Section - Only show when connected */}
      {midnightWallet.isConnected && (
        <>
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
                <span
                  className={`text-sm font-medium ${getStatusColor(statusInfo.status)}`}
                >
                  {getStatusText(statusInfo.status)}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Details
              </Badge>
            </button>
          </div>

          <div className="h-px bg-border my-2" />
        </>
      )}

      {/* Version Selection Section - Only show when connected */}
      {midnightWallet.isConnected && (
        <>
          <div className="px-2 py-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Version
            </div>
            <div className="space-y-1">
              {versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    !v.disabled && setVersion(v.id as 'V1' | 'V2' | 'V3')
                  }
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
        </>
      )}

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
            <span className="text-sm font-medium">Background Animations</span>
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

        {/* Version Information */}
        <div className="p-2 rounded-lg">
          <VersionInfo />
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
                <span
                  className={`text-sm font-medium ${getStatusColor(statusInfo.status)}`}
                >
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
                Contract address is configured but connection failed. Please
                check your network connection and try again.
                <Button
                  onClick={refreshContract}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                >
                  {isLoading ? 'Connecting...' : 'Retry Connection'}
                </Button>
              </div>
            )}

            {statusInfo.status === 'not-deployed' && (
              <div className="text-xs text-muted-foreground">
                Contract is configured but not yet deployed. Use the CLI to
                deploy.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GlobalPreferences({
  inline = false,
  className = '',
}: GlobalPreferencesProps = {}) {
  if (inline) {
    return (
      <div className={className}>
        <PreferencesContent />
      </div>
    );
  }

  return (
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
      <DropdownMenuContent
        align="end"
        className="w-80 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-white/20 dark:border-gray-800/30 rounded-xl shadow-lg"
      >
        <DropdownMenuLabel className="text-sm font-medium">
          Global Preferences
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <PreferencesContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
