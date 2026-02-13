'use client';

import { Package } from 'lucide-react';
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
import { getVersionInfo } from '@/lib/version-info';

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
