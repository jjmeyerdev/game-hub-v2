'use client';

import type { ComparePlatform } from '@/lib/types/compare';

interface PlatformTabsProps {
  selected: ComparePlatform;
  onSelect: (platform: ComparePlatform) => void;
  disabledPlatforms?: ComparePlatform[];
}

const platforms: Array<{ id: ComparePlatform; name: string; color: string; icon: React.ReactNode }> = [
  {
    id: 'psn',
    name: 'PlayStation',
    color: 'blue',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
      </svg>
    ),
  },
  {
    id: 'xbox',
    name: 'Xbox',
    color: 'green',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 0 1 3.25.87c-.87.87-1.75 1.87-2.5 2.87L8 6l-.75-.76c-.75-1-1.63-2-2.5-2.87A6.5 6.5 0 0 1 8 1.5zM3.37 3.87c.75.75 1.63 1.75 2.38 2.88C4.25 8.5 3 10.75 2.5 12A6.47 6.47 0 0 1 1.5 8c0-1.5.5-3 1.87-4.13zM8 7.5l.75.75c1.12 1.25 2.12 2.75 2.87 4.12a6.45 6.45 0 0 1-7.24 0c.75-1.37 1.75-2.87 2.87-4.12L8 7.5zm4.63-3.63A6.47 6.47 0 0 1 14.5 8c0 1.5-.5 2.87-1.37 4-.5-1.25-1.75-3.5-3.25-5.25.75-1.13 1.63-2.13 2.75-2.88z"/>
      </svg>
    ),
  },
  {
    id: 'steam',
    name: 'Steam',
    color: 'slate',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.191.006l2.866-4.158v-.058c0-2.495 2.03-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.091 2.921c0 .054.003.108.003.164 0 1.872-1.521 3.393-3.393 3.393-1.703 0-3.113-1.268-3.346-2.913l-4.603-1.905A11.996 11.996 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.372-12-12-12z"/>
      </svg>
    ),
  },
];

const colorClasses: Record<string, { active: string; hover: string; text: string; border: string }> = {
  blue: {
    active: 'bg-blue-500/20 border-blue-500/50',
    hover: 'hover:bg-blue-500/10 hover:border-blue-500/30',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  green: {
    active: 'bg-green-500/20 border-green-500/50',
    hover: 'hover:bg-green-500/10 hover:border-green-500/30',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  slate: {
    active: 'bg-slate-500/20 border-slate-500/50',
    hover: 'hover:bg-slate-500/10 hover:border-slate-500/30',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

export function PlatformTabs({ selected, onSelect, disabledPlatforms = [] }: PlatformTabsProps) {
  return (
    <div className="flex gap-2">
      {platforms.map((platform) => {
        const isSelected = selected === platform.id;
        const isDisabled = disabledPlatforms.includes(platform.id);
        const colors = colorClasses[platform.color];

        return (
          <button
            key={platform.id}
            onClick={() => !isDisabled && onSelect(platform.id)}
            disabled={isDisabled}
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200
              ${isSelected
                ? `${colors.active} ${colors.text}`
                : isDisabled
                  ? 'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-subtle)] opacity-50 cursor-not-allowed'
                  : `bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-muted)] ${colors.hover}`
              }
            `}
          >
            {/* HUD corners when selected */}
            {isSelected && (
              <>
                <div className={`absolute -top-px -left-px w-2 h-2 border-l border-t ${colors.border}`} />
                <div className={`absolute -top-px -right-px w-2 h-2 border-r border-t ${colors.border}`} />
                <div className={`absolute -bottom-px -left-px w-2 h-2 border-l border-b ${colors.border}`} />
                <div className={`absolute -bottom-px -right-px w-2 h-2 border-r border-b ${colors.border}`} />
              </>
            )}

            <span className={isSelected ? colors.text : ''}>{platform.icon}</span>
            <span className="text-sm font-medium">{platform.name}</span>

            {isDisabled && (
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">(Soon)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
