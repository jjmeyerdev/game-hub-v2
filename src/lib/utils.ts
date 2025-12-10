import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserGame } from "@/app/actions/games"
import { type SortOption, type SyncSourceId, PRIORITY_ORDER } from "@/lib/constants/platforms"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Filter options for the game library
 */
export interface GameFilterOptions {
  showHiddenGames: boolean;
  selectedPlatforms: string[];
  selectedPriorities: string[];
  searchQuery: string;
  selectedSources: SyncSourceId[];
  selectedConsoles?: string[];
}

/**
 * Determine the sync source of a game based on its linked platform IDs
 */
export function getGameSyncSource(game: UserGame): SyncSourceId {
  if (game.game?.steam_appid) return 'steam';
  if (game.game?.psn_communication_id) return 'psn';
  if (game.game?.xbox_title_id) return 'xbox';
  if (game.game?.epic_catalog_item_id) return 'epic';
  return 'manual';
}

/**
 * Extract console name from platform string (e.g., "PlayStation (PS5)" -> "PS5")
 */
export function extractConsoleName(platform: string): string {
  const match = platform.match(/\(([^)]+)\)$/);
  return match ? match[1] : platform;
}

/**
 * Filter games based on the provided options
 */
export function filterGames(games: UserGame[], options: GameFilterOptions): UserGame[] {
  const { showHiddenGames, selectedPlatforms, selectedPriorities, searchQuery, selectedSources, selectedConsoles } = options;

  return games.filter((userGame) => {
    // Hidden filter - when showHiddenGames is true, show ONLY hidden games
    if (showHiddenGames) {
      if (!userGame.hidden) return false;
    } else {
      if (userGame.hidden) return false;
    }

    // Platform filter - smart matching (empty array = all platforms)
    if (selectedPlatforms.length > 0) {
      const gamePlatform = userGame.platform.toLowerCase();
      const matchesPlatform = selectedPlatforms.some(filterPlatform => {
        const lowerFilter = filterPlatform.toLowerCase();
        // Special case: PC should match exactly
        if (lowerFilter === 'pc') {
          return gamePlatform === 'pc';
        }
        // For other platforms, check if game platform contains the filter
        return gamePlatform.includes(lowerFilter);
      });
      if (!matchesPlatform) return false;
    }

    // Console filter - specific console matching (empty array = all consoles)
    if (selectedConsoles && selectedConsoles.length > 0) {
      const consoleName = extractConsoleName(userGame.platform);
      if (!selectedConsoles.includes(consoleName)) return false;
    }

    // Priority filter (empty array = all priorities)
    if (selectedPriorities.length > 0) {
      if (!selectedPriorities.includes(userGame.priority)) return false;
    }

    // Sync source filter (empty array = all sources)
    if (selectedSources.length > 0) {
      const gameSource = getGameSyncSource(userGame);
      if (!selectedSources.includes(gameSource)) return false;
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
      case 'release-newest': {
        // Games without release dates go to the end
        const hasDateA = Boolean(a.game?.release_date);
        const hasDateB = Boolean(b.game?.release_date);
        if (!hasDateA && !hasDateB) return 0;
        if (!hasDateA) return 1;
        if (!hasDateB) return -1;
        const dateA = new Date(a.game!.release_date!).getTime();
        const dateB = new Date(b.game!.release_date!).getTime();
        return dateB - dateA;
      }
      case 'release-oldest': {
        // Games without release dates go to the end
        const hasDateA = Boolean(a.game?.release_date);
        const hasDateB = Boolean(b.game?.release_date);
        if (!hasDateA && !hasDateB) return 0;
        if (!hasDateA) return 1;
        if (!hasDateB) return -1;
        const dateA = new Date(a.game!.release_date!).getTime();
        const dateB = new Date(b.game!.release_date!).getTime();
        return dateA - dateB;
      }
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
