'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Chrome, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BrowserCompatibility() {
  const [isFirefox, setIsFirefox] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is using Firefox
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefoxBrowser = userAgent.includes('firefox');

    setIsFirefox(isFirefoxBrowser);
    setIsVisible(isFirefoxBrowser);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const openChromeDownload = () => {
    window.open('https://www.google.com/chrome/', '_blank');
  };

  const openChromeExtension = () => {
    window.open('https://chrome.google.com/webstore/detail/midnight-lace/your-extension-id', '_blank');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Browser Compatibility Notice
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <div className="space-y-3">
          <p>
            Midnight Lace wallet is not available in Firefox-based browsers. Please use a Chromium-based browser (Chrome, Edge, Brave, etc.) for the best experience.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={openChromeDownload}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Download Chrome
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
