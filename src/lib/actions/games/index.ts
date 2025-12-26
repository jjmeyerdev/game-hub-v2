/**
 * Games actions - barrel exports
 *
 * This module provides all game-related server actions organized by functionality:
 * - types: Type definitions for Game, UserGame, etc.
 * - crud: Basic CRUD operations (getUserGames, addGameToLibrary, etc.)
 * - stats: User statistics (getUserStats)
 * - enrichment: IGDB metadata enrichment (enrichAllGamesFromIGDB, etc.)
 * - duplicates: Duplicate detection and merging
 * - platforms: Platform scanning and sync management
 */

// Types
export type {
  Game,
  UserGame,
  OwnershipStatus,
  LockedFields,
  DuplicateGroup,
  PlatformMatch,
  PlatformScanResult,
} from './types';

// CRUD operations
export {
  getUserGames,
  getNowPlayingGames,
  addGameToLibrary,
  updateUserGame,
  editUserGame,
  deleteUserGame,
} from './crud';

// Stats
export { getUserStats } from './stats';

// Enrichment (IGDB)
export {
  updateAllSteamCovers,
  enrichAllGamesFromIGDB,
  updateGameCoverFromIGDB,
  fetchIGDBMetadata,
} from './enrichment';

// Duplicate detection and merging
export {
  findDuplicateGames,
  mergeDuplicateGames,
  mergeStatsAcrossCopies,
  mergeSelectedKeepRest,
  dismissDuplicateGroup,
  getDismissedPairsCount,
  clearDismissedPairsForGames,
  clearAllDismissedDuplicates,
  // Deprecated exports (kept for backward compatibility)
  getDismissedDuplicates,
  clearDismissedDuplicate,
} from './duplicates';

// Platform scanning and sync
export {
  scanPlatformsForGame,
  addGameToLibraryWithPlatformData,
  editUserGameWithPlatformData,
  removeSyncedGames,
  getSyncedGameCounts,
} from './platforms';

// Achievements
export {
  getGameAchievements,
  type NormalizedAchievement,
  type GameAchievementsResult,
} from './achievements';
