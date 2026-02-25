'use client';

import { AlertTriangle, Package } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DEMO_DISCLAIMER,
  getVersionInfo,
  PROTOCOL_NOTICES,
} from '@/lib/version-info';

export function VersionBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const versionInfo = getVersionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] font-mono bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/40"
        >
          compactc@{versionInfo.compactCompiler}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Version Information
          </DialogTitle>
          <DialogDescription>
            Compact compiler and Midnight Network package versions used in this
            application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Compact Compiler Version */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Badge variant="secondary">Compact Compiler</Badge>
            </h4>
            <div className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
              {versionInfo.compactCompiler}
            </div>
          </div>

          {/* Midnight Network Packages */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline">Midnight Network Packages</Badge>
            </h4>
            <ScrollArea className="h-64 w-full">
              <div className="space-y-1 pr-4">
                {Object.entries(versionInfo.midnightNtwrkPackages).map(
                  ([name, version]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                    >
                      <span className="font-mono text-xs">{name}</span>
                      <Badge variant="outline" className="text-xs">
                        {version}
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Security & protocol notices */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                Security & protocol notices
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Known limitations and planned revisions. Please read before
              providing liquidity.
            </p>
            <div className="space-y-3">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
