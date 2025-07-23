'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';
import { useVersion } from '@/lib/version-context';
import { Check, ChevronsUpDown, ExternalLink } from 'lucide-react';

export function VersionSwitcher() {
  const { version, setVersion } = useVersion();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
        >
          {version}
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-border" sideOffset={8}>
        <DropdownMenuItem
          onClick={() => setVersion('V1')}
          className="items-start cursor-pointer"
        >
          <Check
            className={cn(
              'mr-2 h-4 w-4 flex-shrink-0 mt-1',
              version === 'V1' ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div>
            <p className="font-semibold leading-none">V1</p>
            <p className="text-xs text-muted-foreground mt-1">
              Unpermissioned Unshielded
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setVersion('V2')}
          className="items-start cursor-pointer"
        >
          <Check
            className={cn(
              'mr-2 h-4 w-4 flex-shrink-0 mt-1',
              version === 'V2' ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div>
            <p className="font-semibold leading-none">V2</p>
            <p className="text-xs text-muted-foreground mt-1">
              Unpermissioned Shielded
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setVersion('V3')}
          className="items-start cursor-pointer"
        >
          <Check
            className={cn(
              'mr-2 h-4 w-4 flex-shrink-0 mt-1',
              version === 'V3' ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div>
            <p className="font-semibold leading-none">V3</p>
            <p className="text-xs text-muted-foreground mt-1">
              Permissioned Shielded
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href={`https://docs.lunarswap.com/${version.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full"
          >
            Documentation
            <ExternalLink className="h-4 w-4 opacity-50" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
