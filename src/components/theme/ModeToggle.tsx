'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-9 h-9">
        <div className="h-[1.2rem] w-[1.2rem] bg-[var(--theme-border)] rounded animate-pulse" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-9 h-9 bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-hover-bg)] hover:border-[var(--theme-border-hover)]">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-cyan-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4 text-amber-500" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4 text-cyan-400" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4 text-violet-400" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
