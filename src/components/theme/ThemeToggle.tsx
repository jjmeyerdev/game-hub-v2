'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 w-full ${collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'} rounded-xl`}>
        <div className="w-5 h-5 bg-[var(--theme-border)] rounded animate-pulse" />
        {!collapsed && <div className="h-4 w-20 bg-[var(--theme-border)] rounded animate-pulse" />}
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative group flex items-center gap-3 w-full
        ${collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'}
        rounded-xl transition-all duration-300
        text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]
        hover:bg-[var(--theme-border)]
        border border-transparent hover:border-[var(--theme-border)]
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Icon container with animated switch */}
      <div className="relative w-5 h-5 flex-shrink-0">
        {/* Sun icon */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-500
            ${isDark
              ? 'opacity-0 rotate-90 scale-50'
              : 'opacity-100 rotate-0 scale-100 text-amber-500'
            }
          `}
        />
        {/* Moon icon */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-500
            ${isDark
              ? 'opacity-100 rotate-0 scale-100 text-cyan-400'
              : 'opacity-0 -rotate-90 scale-50'
            }
          `}
        />
      </div>

      {/* Label */}
      <span
        className={`
          text-sm font-medium transition-all duration-500
          ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
        `}
      >
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>

      {/* Toggle switch visualization */}
      {!collapsed && (
        <div className="ml-auto">
          <div
            className={`
              relative w-10 h-5 rounded-full transition-all duration-300
              ${isDark
                ? 'bg-cyan-500/20 border border-cyan-400/30'
                : 'bg-amber-500/20 border border-amber-400/30'
              }
            `}
          >
            {/* Toggle knob */}
            <div
              className={`
                absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-lg
                ${isDark
                  ? 'left-0.5 bg-cyan-400 shadow-cyan-400/50'
                  : 'left-[calc(100%-18px)] bg-amber-400 shadow-amber-400/50'
                }
              `}
            >
              {/* Inner glow */}
              <div
                className={`
                  absolute inset-0.5 rounded-full
                  ${isDark ? 'bg-cyan-300' : 'bg-amber-300'}
                `}
              />
            </div>

            {/* Track glow effect */}
            <div
              className={`
                absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                ${isDark
                  ? 'shadow-[inset_0_0_8px_rgba(34,211,238,0.3)]'
                  : 'shadow-[inset_0_0_8px_rgba(251,191,36,0.3)]'
                }
              `}
            />
          </div>
        </div>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl">
          <span className="text-sm text-[var(--theme-text-primary)] whitespace-nowrap">
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </span>
        </div>
      )}
    </button>
  );
}
