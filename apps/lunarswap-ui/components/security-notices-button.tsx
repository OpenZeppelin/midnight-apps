'use client';

import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEMO_DISCLAIMER, PROTOCOL_NOTICES } from '@/lib/version-info';

export function SecurityNoticesButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300"
          aria-label="Security and protocol notices"
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">
            Security notices
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Security & protocol notices
          </DialogTitle>
          <DialogDescription>
            Known limitations and planned revisions for the Lunarswap protocol.
            Please read before providing liquidity or trading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-left">
            <div className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">
              {DEMO_DISCLAIMER.title}
            </div>
            <div className="text-xs text-muted-foreground">
              {DEMO_DISCLAIMER.description}
            </div>
          </div>
          {PROTOCOL_NOTICES.map((notice) => (
            <div
              key={notice.id}
              className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-left"
            >
              <div className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-1">
                {notice.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {notice.description}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
