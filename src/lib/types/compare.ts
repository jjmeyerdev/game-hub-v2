// Types for cross-platform friend comparison feature

export type ComparePlatform = 'steam' | 'psn' | 'xbox';

export interface ComparisonGame {
  title: string;
  coverUrl: string | null;
  achievementProgress: number; // percentage 0-100
  playtime: number; // hours
  platform: ComparePlatform;
  console?: string; // e.g., "PS5", "Xbox Series X|S", "PC"
}

export interface PlatformSpecificStats {
  // PSN specific
  trophyLevel?: number;
  platinumCount?: number;
  isPsPlus?: boolean;
  // Xbox specific
  gamerscore?: number;
  tier?: string;
}

export interface ComparisonStats {
  totalGames: number;
  totalAchievements: number;
  totalPlaytime: number; // hours
  completionRate: number; // percentage 0-100
  platformSpecific: PlatformSpecificStats;
}

export interface ComparisonProfile {
  platform: ComparePlatform;
  platformId: string; // Steam ID, PSN Online ID, or Xbox Gamertag for lookups
  username: string;
  avatarUrl: string | null;
  stats: ComparisonStats;
  games: ComparisonGame[];
}

export interface ComparisonResult {
  success: boolean;
  user?: ComparisonProfile;
  friend?: ComparisonProfile;
  commonGames?: Array<{
    title: string;
    coverUrl: string | null;
    userProgress: number;
    friendProgress: number;
    userPlaytime: number;
    friendPlaytime: number;
    console?: string; // e.g., "PS5", "Xbox Series X|S", "PC"
  }>;
  error?: string;
}

export interface PsnSearchResult {
  accountId: string;
  onlineId: string;
  avatarUrl: string | null;
  isPsPlus: boolean;
  isOfficiallyVerified: boolean;
}

export interface XboxSearchResult {
  xuid: string;
  gamertag: string;
  avatarUrl: string | null;
  gamerscore: number;
  tier: string;
}

export interface SteamSearchResult {
  steamId: string;
  personaName: string;
  avatarUrl: string | null;
  profileUrl: string;
}
