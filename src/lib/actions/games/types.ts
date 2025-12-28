/**
 * Game types and interfaces
 */

export interface Game {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[] | null;
  platforms: string[] | null;
  steam_appid: number | null;
  psn_communication_id: string | null;
  xbox_title_id: string | null;
  epic_catalog_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export type OwnershipStatus = 'owned' | 'wishlist' | 'unowned';

export type LockedFields = Record<string, boolean>;

export interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  platform: string;
  status: string;
  priority: string;
  completion_percentage: number;
  playtime_hours: number;
  last_played_at: string | null;
  personal_rating: number | null;
  notes: string | null;
  tags: string[] | null;
  locked_fields: LockedFields | null;
  achievements_earned: number;
  achievements_total: number;
  completed_at: string | null;
  hidden: boolean;
  owned: boolean; // Deprecated, use ownership_status
  ownership_status: OwnershipStatus;
  is_physical: boolean;
  previously_owned: boolean;
  my_playtime_hours: number | null; // Manual snapshot for previously owned games
  my_achievements_earned: number | null; // Manual snapshot for previously owned games
  release_date: string | null; // Platform-specific release date
  created_at: string;
  updated_at: string;
  game?: Game;
}

/**
 * Duplicate game group interface
 */
export interface DuplicateGroup {
  normalizedTitle: string;
  games: UserGame[];
  matchType: 'exact' | 'similar';
  confidence: number;
}

/**
 * Platform match result from scanning connected accounts
 */
export interface PlatformMatch {
  platform: 'steam' | 'psn' | 'xbox';
  platformLabel: string;
  gameTitle: string;
  platformId: string | number; // steam_appid, psn_communication_id, xbox_title_id
  coverUrl: string | null;
  playtimeHours: number;
  lastPlayed: string | null;
  achievementsEarned: number;
  achievementsTotal: number;
  completionPercentage: number;
  platformString: string; // e.g., "Steam", "PS5", "Xbox"
  confidence: number; // 0-100 match confidence
}

export interface PlatformScanResult {
  steamConnected: boolean;
  psnConnected: boolean;
  xboxConnected: boolean;
  matches: PlatformMatch[];
  scannedPlatforms: string[];
  error: string | null;
}

/**
 * Achievement/Trophy types
 */
export type AchievementPlatform = 'psn' | 'xbox' | 'steam';

export type TrophyType = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface UserAchievement {
  id: string;
  user_id: string;
  user_game_id: string;
  platform: AchievementPlatform;
  platform_achievement_id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  icon_url_locked: string | null;
  achievement_type: TrophyType | 'achievement' | null;
  points: number | null; // gamerscore for Xbox, calculated for PSN
  rarity: number | null; // percentage 0-100
  unlocked: boolean;
  unlocked_at: string | null;
  unlocked_by_me: boolean | null; // null = use unlocked, true/false = override
  created_at: string;
  updated_at: string;
}

/**
 * Achievement stats for a game
 */
export interface GameAchievementStats {
  total: number;
  unlocked: number;
  unlockedByMe: number; // considering unlocked_by_me overrides
  totalPoints: number;
  earnedPoints: number;
  earnedPointsByMe: number;
}
