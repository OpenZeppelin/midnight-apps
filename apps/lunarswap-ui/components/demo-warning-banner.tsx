'use client';

import { AlertTriangle } from 'lucide-react';

export function DemoWarningBanner() {
  return (
    <div
      className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-amber-500/95 dark:bg-amber-600/95 text-amber-950 dark:text-amber-100 border-b border-amber-600/50 dark:border-amber-500/50"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-sm font-medium">
        For demo purposes only. Not for production use. Do not use with mainnet
        assets.
      </span>
    </div>
  );
}
