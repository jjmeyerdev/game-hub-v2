'use client';

import { useMemo } from 'react';
import { CONSOLE_GENERATIONS } from '@/lib/constants/platforms';
import { getGameSyncSource } from '@/lib/utils';
import type { UserGame } from '@/app/(dashboard)/_actions/games';
import type { SyncSourceId } from '@/lib/constants/platforms';

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

  return (
    <div className="flex flex-wrap gap-2">
      {consolesWithGames.map((family) =>
        family.consoles.map((console) => {
          const isSelected = selectedConsoles.includes(console.id);
          return (
            <button
              key={console.id}
              onClick={() => onToggleConsole(console.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  : 'bg-white/[0.03] text-white/50 hover:text-white border-transparent hover:border-white/[0.08]'
              }`}
              title={`${console.label} (${console.count} games)`}
            >
              <span className={`${isSelected ? '' : 'opacity-60'}`}>{family.icon}</span>
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
