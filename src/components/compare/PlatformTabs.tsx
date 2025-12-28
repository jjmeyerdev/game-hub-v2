'use client';

import type { ComparePlatform } from '@/lib/types/compare';
import { PlayStationLogo, XboxLogo, SteamLogo } from '@/components/icons/PlatformLogos';

interface PlatformTabsProps {
  selected: ComparePlatform;
  onSelect: (platform: ComparePlatform) => void;
  disabledPlatforms?: ComparePlatform[];
}

const platforms: Array<{ id: ComparePlatform; name: string; color: string; Logo: React.ComponentType<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> }> = [
  {
    id: 'psn',
    name: 'PlayStation',
    color: 'blue',
    Logo: PlayStationLogo,
  },
  {
    id: 'xbox',
    name: 'Xbox',
    color: 'green',
    Logo: XboxLogo,
  },
  {
    id: 'steam',
    name: 'Steam',
    color: 'slate',
    Logo: SteamLogo,
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
        const Logo = platform.Logo;

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
                  ? 'bg-theme-secondary border-theme text-theme-subtle opacity-50 cursor-not-allowed'
                  : `bg-theme-secondary border-theme text-theme-muted ${colors.hover}`
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

            <Logo size="sm" className={isSelected ? colors.text : ''} />
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
