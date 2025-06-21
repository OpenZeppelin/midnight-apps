'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center justify-center text-muted-foreground',
          theme === 'light' && 'bg-background text-foreground'
        )}
        aria-label="Set light theme"
      >
        <Sun className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center justify-center text-muted-foreground',
          theme === 'dark' && 'bg-background text-foreground'
        )}
        aria-label="Set dark theme"
      >
        <Moon className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme('system')}
        className={cn(
          'text-muted-foreground',
          theme === 'system' && 'bg-background text-foreground'
        )}
      >
        Auto
      </Button>
    </div>
  );
}
