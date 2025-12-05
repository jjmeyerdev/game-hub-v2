'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AccentColor = 'cyan' | 'purple' | 'emerald' | 'red' | 'yellow';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  accent?: AccentColor;
  className?: string;
}

const accentStyles: Record<AccentColor, { bg: string; border: string; text: string; glow: string }> = {
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'bg-cyan-500/20',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'bg-purple-500/20',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'bg-emerald-500/20',
  },
  red: {
    bg: 'from-red-500/20 to-red-600/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'bg-red-500/20',
  },
  yellow: {
    bg: 'from-yellow-500/20 to-yellow-600/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'bg-yellow-500/20',
  },
};

/**
 * Section header with icon and gradient styling
 * Used consistently across settings pages and other sections
 */
export function SectionHeader({
  title,
  description,
  icon,
  accent = 'cyan',
  className,
}: SectionHeaderProps) {
  const styles = accentStyles[accent];

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-4 mb-2">
        {icon && (
          <div className="relative">
            <div
              className={cn(
                'w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center',
                styles.bg,
                styles.border
              )}
            >
              <span className={styles.text}>{icon}</span>
            </div>
            <div
              className={cn(
                'absolute -inset-1 rounded-xl blur-lg -z-10 animate-pulse',
                styles.glow
              )}
            />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">{title}</h2>
          {description && (
            <p className="text-gray-400 text-sm">{description}</p>
          )}
        </div>
      </div>
      {/* Decorative scanline */}
      <div
        className={cn(
          'absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent',
          accent === 'cyan' && 'via-cyan-500/50',
          accent === 'purple' && 'via-purple-500/50',
          accent === 'emerald' && 'via-emerald-500/50',
          accent === 'red' && 'via-red-500/50',
          accent === 'yellow' && 'via-yellow-500/50'
        )}
      />
    </div>
  );
}
