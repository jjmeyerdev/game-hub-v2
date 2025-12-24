'use client';

import { useMemo } from 'react';
import { CONSOLE_GENERATIONS } from '@/lib/constants/platforms';
import { getGameSyncSource } from '@/lib/utils';
import {
  PlayStationLogo,
  XboxLogo,
  NintendoSwitchLogo,
  WiiLogo,
  WiiULogo,
  Nintendo3DSLogo,
  NintendoDSLogo,
  GameCubeLogo,
  Nintendo64Logo,
  GameBoyLogo,
  GBALogo,
  SNESLogo,
  NESLogo,
  PSPLogo,
  PSVitaLogo,
} from '@/components/icons/PlatformLogos';
import type { UserGame } from '@/lib/actions/games';
import type { SyncSourceId } from '@/lib/constants/platforms';

// Console-specific styling configuration
// PlayStation: Current gen = bright, older = progressively dimmer
// Xbox: Current gen = bright, older = progressively dimmer
// Nintendo: Each has unique icon
const CONSOLE_CONFIG: Record<string, {
  color: string;
  selectedColor: string;
  generation: 'current' | 'previous' | 'legacy' | 'retro';
}> = {
  // PlayStation consoles - generation-based opacity
  PS5: { color: 'text-[#0070cc]/70', selectedColor: 'text-[#0070cc]', generation: 'current' },
  PS4: { color: 'text-[#0070cc]/55', selectedColor: 'text-[#0070cc]/90', generation: 'previous' },
  PS3: { color: 'text-[#0070cc]/45', selectedColor: 'text-[#0070cc]/80', generation: 'legacy' },
  PS2: { color: 'text-[#0070cc]/35', selectedColor: 'text-[#0070cc]/70', generation: 'retro' },
  PS1: { color: 'text-[#0070cc]/30', selectedColor: 'text-[#0070cc]/60', generation: 'retro' },
  PSP: { color: 'text-[#0070cc]/45', selectedColor: 'text-[#0070cc]/80', generation: 'legacy' },
  'PS Vita': { color: 'text-[#0070cc]/50', selectedColor: 'text-[#0070cc]/85', generation: 'previous' },
  // Xbox consoles - generation-based opacity
  'Xbox Series X|S': { color: 'text-[#52b043]/70', selectedColor: 'text-[#52b043]', generation: 'current' },
  'Xbox One': { color: 'text-[#52b043]/55', selectedColor: 'text-[#52b043]/90', generation: 'previous' },
  'Xbox 360': { color: 'text-[#52b043]/45', selectedColor: 'text-[#52b043]/80', generation: 'legacy' },
  Xbox: { color: 'text-[#52b043]/35', selectedColor: 'text-[#52b043]/70', generation: 'retro' },
  // Nintendo consoles - all use distinct icons
  'Switch 2': { color: 'text-[#e60012]/70', selectedColor: 'text-[#e60012]', generation: 'current' },
  Switch: { color: 'text-[#e60012]/65', selectedColor: 'text-[#e60012]', generation: 'current' },
  'Wii U': { color: 'text-[#00a9e0]/60', selectedColor: 'text-[#00a9e0]', generation: 'previous' },
  Wii: { color: 'text-[#8b8b8b]/60', selectedColor: 'text-[#8b8b8b]', generation: 'legacy' },
  '3DS': { color: 'text-[#ce181e]/55', selectedColor: 'text-[#ce181e]', generation: 'previous' },
  DS: { color: 'text-[#888]/50', selectedColor: 'text-[#888]', generation: 'legacy' },
  GameCube: { color: 'text-[#6a5acd]/55', selectedColor: 'text-[#6a5acd]', generation: 'legacy' },
  'Nintendo 64': { color: 'text-[#008000]/50', selectedColor: 'text-[#008000]', generation: 'retro' },
  SNES: { color: 'text-[#7b68ee]/45', selectedColor: 'text-[#7b68ee]', generation: 'retro' },
  NES: { color: 'text-[#c41e3a]/40', selectedColor: 'text-[#c41e3a]', generation: 'retro' },
  'Game Boy': { color: 'text-[#8bac0f]/45', selectedColor: 'text-[#8bac0f]', generation: 'retro' },
  GBA: { color: 'text-[#5c5ccd]/50', selectedColor: 'text-[#5c5ccd]', generation: 'legacy' },
};

function getConsoleIcon(consoleId: string, family: string, isSelected: boolean) {
  const config = CONSOLE_CONFIG[consoleId];
  const colorClass = isSelected ? config?.selectedColor : config?.color;
  const defaultColor = isSelected ? 'text-white' : 'text-white/50';

  // Nintendo - use console-specific icons
  if (family === 'Nintendo') {
    switch (consoleId) {
      case 'Switch 2':
      case 'Switch':
        return <NintendoSwitchLogo size="sm" className={colorClass || defaultColor} />;
      case 'Wii U':
        return <WiiULogo size="sm" className={colorClass || defaultColor} />;
      case 'Wii':
        return <WiiLogo size="sm" className={colorClass || defaultColor} />;
      case '3DS':
        return <Nintendo3DSLogo size="sm" className={colorClass || defaultColor} />;
      case 'DS':
        return <NintendoDSLogo size="sm" className={colorClass || defaultColor} />;
      case 'GameCube':
        return <GameCubeLogo size="sm" className={colorClass || defaultColor} />;
      case 'Nintendo 64':
        return <Nintendo64Logo size="sm" className={colorClass || defaultColor} />;
      case 'SNES':
        return <SNESLogo size="sm" className={colorClass || defaultColor} />;
      case 'NES':
        return <NESLogo size="sm" className={colorClass || defaultColor} />;
      case 'Game Boy':
        return <GameBoyLogo size="sm" className={colorClass || defaultColor} />;
      case 'GBA':
        return <GBALogo size="sm" className={colorClass || defaultColor} />;
      default:
        return <NintendoSwitchLogo size="sm" className={colorClass || defaultColor} />;
    }
  }

  // PlayStation - use PS logo with handheld variants
  if (family === 'PlayStation') {
    switch (consoleId) {
      case 'PSP':
        return <PSPLogo size="sm" className={colorClass || 'text-[#0070cc]/60'} />;
      case 'PS Vita':
        return <PSVitaLogo size="sm" className={colorClass || 'text-[#0070cc]/60'} />;
      default:
        return <PlayStationLogo size="sm" className={colorClass || 'text-[#0070cc]/60'} />;
    }
  }

  // Xbox - use Xbox logo
  if (family === 'Xbox') {
    return <XboxLogo size="sm" className={colorClass || 'text-[#52b043]/60'} />;
  }

  return <span className="text-sm">👾</span>;
}

// Get generation indicator style for PlayStation/Xbox
function getGenerationStyle(consoleId: string): string {
  const config = CONSOLE_CONFIG[consoleId];
  if (!config) return '';

  switch (config.generation) {
    case 'current':
      return 'ring-1 ring-white/20';
    case 'previous':
      return '';
    case 'legacy':
      return 'opacity-90';
    case 'retro':
      return 'opacity-80';
    default:
      return '';
  }
}

interface ConsoleFilterProps {
  userGames: UserGame[];
  selectedConsoles: string[];
  onToggleConsole: (console: string) => void;
  selectedPlatforms?: string[];
  selectedSources?: SyncSourceId[];
}

function extractConsoleName(platform: string): string {
  const match = platform.match(/\(([^)]+)\)$/);
  return match ? match[1] : platform;
}

function matchesPlatformFilter(game: UserGame, selectedPlatforms: string[]): boolean {
  if (selectedPlatforms.length === 0) return true;
  const gamePlatform = game.platform.toLowerCase();
  return selectedPlatforms.some((filterPlatform) => {
    const lowerFilter = filterPlatform.toLowerCase();
    if (lowerFilter === 'physical') return game.is_physical === true;
    if (lowerFilter === 'pc') return gamePlatform === 'pc';
    // PlayStation filter should match PS5, PS4, PS3, PS Vita, etc.
    if (lowerFilter === 'playstation') {
      return gamePlatform.startsWith('ps') || gamePlatform.includes('playstation');
    }
    return gamePlatform.includes(lowerFilter);
  });
}

function matchesSourceFilter(game: UserGame, selectedSources: SyncSourceId[]): boolean {
  if (selectedSources.length === 0) return true;
  const gameSource = getGameSyncSource(game);
  return selectedSources.includes(gameSource);
}

export function ConsoleFilter({
  userGames,
  selectedConsoles,
  onToggleConsole,
  selectedPlatforms = [],
  selectedSources = [],
}: ConsoleFilterProps) {
  const filteredGames = useMemo(() => {
    return userGames.filter((game) => {
      if (!matchesPlatformFilter(game, selectedPlatforms)) return false;
      if (!matchesSourceFilter(game, selectedSources)) return false;
      return true;
    });
  }, [userGames, selectedPlatforms, selectedSources]);

  const allowedFamilies = useMemo(() => {
    const families: string[] = [];
    if (selectedPlatforms.some((p) => p.toLowerCase().includes('playstation'))) families.push('PlayStation');
    if (selectedPlatforms.some((p) => p.toLowerCase().includes('xbox'))) families.push('Xbox');
    if (selectedPlatforms.some((p) => p.toLowerCase().includes('nintendo'))) families.push('Nintendo');
    if (selectedSources.includes('psn') && !families.includes('PlayStation')) families.push('PlayStation');
    if (selectedSources.includes('xbox') && !families.includes('Xbox')) families.push('Xbox');
    return families;
  }, [selectedPlatforms, selectedSources]);

  const consoleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGames.forEach((game) => {
      const consoleName = extractConsoleName(game.platform);
      counts[consoleName] = (counts[consoleName] || 0) + 1;
    });
    return counts;
  }, [filteredGames]);

  const consolesWithGames = useMemo(() => {
    const result: Array<{
      family: string;
      icon: string;
      consoles: Array<{ id: string; label: string; count: number }>;
    }> = [];

    CONSOLE_GENERATIONS.forEach((gen) => {
      if (allowedFamilies.length > 0 && !allowedFamilies.includes(gen.family)) return;
      const familyConsoles = gen.consoles
        .filter((c) => consoleCounts[c.id] && consoleCounts[c.id] > 0)
        .map((c) => ({ id: c.id, label: c.label, count: consoleCounts[c.id] || 0 }));
      if (familyConsoles.length > 0) {
        result.push({ family: gen.family, icon: gen.icon, consoles: familyConsoles });
      }
    });

    return result;
  }, [consoleCounts, allowedFamilies]);

  if (consolesWithGames.length === 0) {
    return <p className="text-xs text-white/30">No console-specific games found</p>;
  }

  const getButtonStyle = (family: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white/[0.03] text-white/50 hover:text-white border-transparent hover:border-white/[0.08]';
    }
    switch (family) {
      case 'PlayStation':
        return 'bg-[#003791]/30 text-white border-[#0070cc]/40';
      case 'Xbox':
        return 'bg-[#107c10]/30 text-white border-[#52b043]/40';
      case 'Nintendo':
        return 'bg-[#e60012]/20 text-white border-[#e60012]/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {consolesWithGames.map((family) =>
        family.consoles.map((console) => {
          const isSelected = selectedConsoles.includes(console.id);
          const generationStyle = getGenerationStyle(console.id);
          return (
            <button
              key={console.id}
              onClick={() => onToggleConsole(console.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${getButtonStyle(family.family, isSelected)} ${generationStyle}`}
              title={`${console.label} (${console.count} games)`}
            >
              {getConsoleIcon(console.id, family.family, isSelected)}
              <span>{console.id}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-white/20' : 'bg-white/[0.06]'}`}>
                {console.count}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
