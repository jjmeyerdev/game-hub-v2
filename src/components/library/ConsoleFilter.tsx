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

/**
 * Extract console name from platform string (e.g., "PlayStation (PS3)" -> "PS3")
 */
function extractConsoleName(platform: string): string {
  const match = platform.match(/\(([^)]+)\)$/);
  return match ? match[1] : platform;
}

/**
 * Check if a game matches the platform filter
 */
function matchesPlatformFilter(game: UserGame, selectedPlatforms: string[]): boolean {
  if (selectedPlatforms.length === 0) return true;

  const gamePlatform = game.platform.toLowerCase();

  return selectedPlatforms.some((filterPlatform) => {
    const lowerFilter = filterPlatform.toLowerCase();

    // Special case: Physical should check is_physical flag
    if (lowerFilter === 'physical') {
      return game.is_physical === true;
    }

    // Special case: PC should match exactly
    if (lowerFilter === 'pc') {
      return gamePlatform === 'pc';
    }

    // For other platforms, check if game platform contains the filter
    return gamePlatform.includes(lowerFilter);
  });
}

/**
 * Check if a game matches the source filter
 */
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
  // Pre-filter games to match the same filtering logic as filterAndSortGames
  // This ensures console counts match what will actually be shown when selected
  const filteredGames = useMemo(() => {
    return userGames.filter((game) => {
      // Apply platform filter
      if (!matchesPlatformFilter(game, selectedPlatforms)) return false;

      // Apply source filter
      if (!matchesSourceFilter(game, selectedSources)) return false;

      return true;
    });
  }, [userGames, selectedPlatforms, selectedSources]);

  // Determine which console families to show based on selected platforms/sources
  const allowedFamilies = useMemo(() => {
    const families: string[] = [];

    // Check platforms
    if (selectedPlatforms.some((p) => p.toLowerCase().includes('playstation'))) {
      families.push('PlayStation');
    }
    if (selectedPlatforms.some((p) => p.toLowerCase().includes('xbox'))) {
      families.push('Xbox');
    }
    if (selectedPlatforms.some((p) => p.toLowerCase().includes('nintendo'))) {
      families.push('Nintendo');
    }

    // Check sync sources
    if (selectedSources.includes('psn')) {
      if (!families.includes('PlayStation')) families.push('PlayStation');
    }
    if (selectedSources.includes('xbox')) {
      if (!families.includes('Xbox')) families.push('Xbox');
    }

    return families;
  }, [selectedPlatforms, selectedSources]);

  // Count games per console from the pre-filtered list
  const consoleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGames.forEach((game) => {
      const consoleName = extractConsoleName(game.platform);
      counts[consoleName] = (counts[consoleName] || 0) + 1;
    });
    return counts;
  }, [filteredGames]);

  // Get all consoles that have games, grouped by family (filtered by allowed families)
  const consolesWithGames = useMemo(() => {
    const result: Array<{
      family: string;
      icon: string;
      consoles: Array<{ id: string; label: string; count: number }>;
    }> = [];

    CONSOLE_GENERATIONS.forEach((gen) => {
      // Only include families that are allowed based on platform/source selection
      if (allowedFamilies.length > 0 && !allowedFamilies.includes(gen.family)) {
        return;
      }

      const familyConsoles = gen.consoles
        .filter((c) => consoleCounts[c.id] && consoleCounts[c.id] > 0)
        .map((c) => ({ id: c.id, label: c.label, count: consoleCounts[c.id] || 0 }));

      if (familyConsoles.length > 0) {
        result.push({
          family: gen.family,
          icon: gen.icon,
          consoles: familyConsoles,
        });
      }
    });

    return result;
  }, [consoleCounts, allowedFamilies]);

  if (consolesWithGames.length === 0) {
    return <p className="text-xs text-gray-600">No console-specific games found</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {consolesWithGames.map((family) =>
        family.consoles.map((console) => {
          const isSelected = selectedConsoles.includes(console.id);
          return (
            <button
              key={console.id}
              onClick={() => onToggleConsole(console.id)}
              className={`
                group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-200
                ${
                  isSelected
                    ? 'bg-cyan-500 text-void shadow-lg shadow-cyan-500/20'
                    : 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60'
                }
              `}
              title={`${console.label} (${console.count} games)`}
            >
              <span className={`text-sm ${isSelected ? '' : 'opacity-60'}`}>{family.icon}</span>
              <span>{console.id}</span>
              <span
                className={`
                ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                ${isSelected ? 'bg-void/20' : 'bg-steel/50'}
              `}
              >
                {console.count}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
