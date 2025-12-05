'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AccentColor = 'cyan' | 'purple' | 'emerald' | 'red' | 'yellow';

interface SettingsPanelProps {
  children: ReactNode;
  accent?: AccentColor;
  className?: string;
}

const glowStyles: Record<AccentColor, string> = {
  cyan: 'from-cyan-500/20 via-purple-500/10 to-cyan-500/20',
  purple: 'from-purple-500/20 via-cyan-500/10 to-purple-500/20',
  emerald: 'from-emerald-500/20 via-cyan-500/10 to-emerald-500/20',
  red: 'from-red-500/20 via-red-600/10 to-red-500/20',
  yellow: 'from-yellow-500/20 via-orange-500/10 to-yellow-500/20',
};

const accentBarStyles: Record<AccentColor, string> = {
  cyan: 'via-cyan-500',
  purple: 'via-purple-500',
  emerald: 'via-emerald-500',
  red: 'via-red-500/50',
  yellow: 'via-yellow-500',
};

const borderStyles: Record<AccentColor, string> = {
  cyan: 'border-steel/50',
  purple: 'border-steel/50',
  emerald: 'border-steel/50',
  red: 'border-red-500/20',
  yellow: 'border-steel/50',
};

/**
 * Settings panel card with gradient glow effect and accent bar
 * Provides consistent styling for settings sections
 */
export function SettingsPanel({ children, accent = 'cyan', className }: SettingsPanelProps) {
  return (
    <div className="relative group">
      {/* Hover glow */}
      <div
        className={cn(
          'absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          glowStyles[accent]
        )}
      />
      <div
        className={cn(
          'relative bg-abyss/90 backdrop-blur-sm border rounded-2xl overflow-hidden',
          borderStyles[accent],
          className
        )}
      >
        {/* Accent bar */}
        <div
          className={cn(
            'h-1 bg-gradient-to-r from-transparent to-transparent',
            accentBarStyles[accent]
          )}
        />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface SettingsPanelHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  accent?: AccentColor;
  action?: ReactNode;
}

const headerIconStyles: Record<AccentColor, { bg: string; border: string; text: string }> = {
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  yellow: {
    bg: 'from-yellow-500/20 to-yellow-600/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
  },
};

/**
 * Header for settings panel with icon and optional action
 */
export function SettingsPanelHeader({
  icon,
  title,
  description,
  accent = 'cyan',
  action,
}: SettingsPanelHeaderProps) {
  const styles = headerIconStyles[accent];
  const titleColor = accent === 'red' ? 'text-red-400' : 'text-white';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center',
            styles.bg,
            styles.border
          )}
        >
          <span className={styles.text}>{icon}</span>
        </div>
        <div>
          <h3 className={cn('text-lg font-bold', titleColor)}>{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
