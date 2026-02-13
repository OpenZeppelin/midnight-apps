'use client';

import { Check, ChevronsUpDown, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVersion } from '@/lib/version-context';
import { cn } from '@/utils/cn';

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
          disabled
          className="items-start cursor-not-allowed opacity-50"
        >
          <Clock className="mr-2 h-4 w-4 flex-shrink-0 mt-1 text-orange-500" />
          <div>
            <p className="font-semibold leading-none">V2</p>
            <p className="text-xs text-muted-foreground mt-1">
              Unpermissioned Shielded · Coming Soon
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="items-start cursor-not-allowed opacity-50"
        >
          <Clock className="mr-2 h-4 w-4 flex-shrink-0 mt-1 text-orange-500" />
          <div>
            <p className="font-semibold leading-none">V3</p>
            <p className="text-xs text-muted-foreground mt-1">
              Permissioned Shielded · Coming Soon
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="items-start cursor-pointer">
          <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold leading-none">Docs</p>
            <p className="text-xs text-muted-foreground mt-1">
              Read the documentation
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
