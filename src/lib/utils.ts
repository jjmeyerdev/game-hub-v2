import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserGame } from "@/app/actions/games"
import { type SortOption, PRIORITY_ORDER } from "@/lib/constants/platforms"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Filter options for the game library
 */
export interface GameFilterOptions {
  showHiddenGames: boolean;
  selectedPlatform: string;
  selectedPriority: string;
  searchQuery: string;
}

/**
 * Filter games based on the provided options
 */
export function filterGames(games: UserGame[], options: GameFilterOptions): UserGame[] {
  const { showHiddenGames, selectedPlatform, selectedPriority, searchQuery } = options;

  return games.filter((userGame) => {
    // Hidden filter - when showHiddenGames is true, show ONLY hidden games
    if (showHiddenGames) {
      if (!userGame.hidden) return false;
    } else {
      if (userGame.hidden) return false;
    }

    // Platform filter - smart matching
    if (selectedPlatform !== 'All') {
      const gamePlatform = userGame.platform.toLowerCase();
      const filterPlatform = selectedPlatform.toLowerCase();

      // Special case: PC should match exactly
      if (filterPlatform === 'pc') {
        if (gamePlatform !== 'pc') return false;
      } else {
        // For other platforms, check if game platform contains the filter
        if (!gamePlatform.includes(filterPlatform)) return false;
      }
    }

    // Priority filter
    if (selectedPriority !== 'all' && userGame.priority !== selectedPriority) {
      return false;
    }

    // Search filter
    if (searchQuery && !userGame.game?.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });
}

/**
 * Sort games based on the provided sort option
 */
export function sortGames(games: UserGame[], sortBy: SortOption): UserGame[] {
  return [...games].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return (a.game?.title || '').localeCompare(b.game?.title || '');
      case 'title-desc':
        return (b.game?.title || '').localeCompare(a.game?.title || '');
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'completion-desc':
        return b.completion_percentage - a.completion_percentage;
      case 'completion-asc':
        return a.completion_percentage - b.completion_percentage;
      case 'playtime-desc':
        return b.playtime_hours - a.playtime_hours;
      case 'playtime-asc':
        return a.playtime_hours - b.playtime_hours;
      case 'priority-high':
        return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
      case 'priority-low':
        return (PRIORITY_ORDER[b.priority] ?? 1) - (PRIORITY_ORDER[a.priority] ?? 1);
      default:
        return 0;
    }
  });
}

/**
 * Filter and sort games in one operation
 */
export function filterAndSortGames(
  games: UserGame[],
  filterOptions: GameFilterOptions,
  sortBy: SortOption
): UserGame[] {
  const filtered = filterGames(games, filterOptions);
  return sortGames(filtered, sortBy);
}
