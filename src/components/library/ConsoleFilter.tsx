'use client';

import { useMemo } from 'react';
import { CONSOLE_GENERATIONS } from '@/lib/constants/platforms';
import type { UserGame } from '@/app/actions/games';

interface ConsoleFilterProps {
  userGames: UserGame[];
  selectedConsoles: string[];
  onToggleConsole: (console: string) => void;
}

export function ConsoleFilter({ userGames, selectedConsoles, onToggleConsole }: ConsoleFilterProps) {
  // Count games per console
  const consoleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    userGames.forEach(game => {
      const platform = game.platform;
      // Extract console name from platform string like "PlayStation (PS5)"
      const match = platform.match(/\(([^)]+)\)$/);
      const consoleName = match ? match[1] : platform;
      counts[consoleName] = (counts[consoleName] || 0) + 1;
    });
    return counts;
  }, [userGames]);

  // Get all consoles that have games, grouped by family
  const consolesWithGames = useMemo(() => {
    const result: Array<{ family: string; icon: string; consoles: Array<{ id: string; label: string; count: number }> }> = [];

    CONSOLE_GENERATIONS.forEach(gen => {
      const familyConsoles = gen.consoles
        .filter(c => consoleCounts[c.id] && consoleCounts[c.id] > 0)
        .map(c => ({ id: c.id, label: c.label, count: consoleCounts[c.id] || 0 }));

      if (familyConsoles.length > 0) {
        result.push({
          family: gen.family,
          icon: gen.icon,
          consoles: familyConsoles,
        });
      }
    });

    return result;
  }, [consoleCounts]);

  if (consolesWithGames.length === 0) {
    return (
      <p className="text-xs text-gray-600">No console-specific games found</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {consolesWithGames.map((family) => (
        family.consoles.map((console) => {
          const isSelected = selectedConsoles.includes(console.id);
          return (
            <button
              key={console.id}
              onClick={() => onToggleConsole(console.id)}
              className={`
                group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-200
                ${isSelected
                  ? 'bg-cyan-500 text-void shadow-lg shadow-cyan-500/20'
                  : 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60'
                }
              `}
              title={`${console.label} (${console.count} games)`}
            >
              <span className={`text-sm ${isSelected ? '' : 'opacity-60'}`}>{family.icon}</span>
              <span>{console.id}</span>
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                ${isSelected ? 'bg-void/20' : 'bg-steel/50'}
              `}>
                {console.count}
              </span>
            </button>
          );
        })
      ))}
    </div>
  );
}
