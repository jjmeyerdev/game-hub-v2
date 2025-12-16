// Steam API Type Definitions

export interface SteamPlayer {
    steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
  avatarhash: string;
  personastate: number;
  realname?: string;
  timecreated?: number;
  loccountrycode?: string;
  gameid?: string; // Steam App ID when user is in-game
  gameextrainfo?: string; // Game name when user is in-game
  }
  
  export interface SteamGame {
    appid: number;
    name: string;
    playtime_forever: number;
    playtime_2weeks?: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
    img_icon_url: string;
    img_logo_url: string;
    has_community_visible_stats?: boolean;
  has_leaderboards?: boolean;
  rtime_last_played?: number;
  }
  
  export interface SteamAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
    name?: string;
    description?: string;
  }

export interface SteamGameSchema {
  gameName: string;
  gameVersion: string;
  availableGameStats: {
    achievements?: Array<{
      name: string;
      defaultvalue: number;
      displayName: string;
      hidden: number;
      description: string;
      icon: string;
      icongray: string;
    }>;
  };
}

// API Response Types
export interface GetPlayerSummariesResponse {
  response: {
    players: SteamPlayer[];
  };
}

export interface GetOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface GetRecentlyPlayedGamesResponse {
  response: {
    total_count: number;
    games: SteamGame[];
  };
}

export interface GetPlayerAchievementsResponse {
  playerstats: {
    steamID: string;
    gameName: string;
    achievements?: SteamAchievement[];
    success: boolean;
    error?: string;
  };
}

export interface GetSchemaForGameResponse {
  game: SteamGameSchema;
}

// Sync Result Types
export interface SteamSyncResult {
  success: boolean;
  gamesAdded: number;
  gamesUpdated: number;
  gamesSkipped: number; // Games that failed to sync
  achievementsUpdated: number;
  achievementsPrivate: number; // Games where achievements couldn't be fetched (likely privacy issue)
  errors: string[];
  warnings: string[]; // Non-fatal issues like privacy warnings
  totalGames: number; // Total games returned by Steam API
}

export interface SteamGameSyncResult {
  success: boolean;
  game?: {
    id: string;
    title: string;
    appid: number;
  };
  error?: string;
}

// Profile Types
export interface SteamProfile {
  steam_id: string;
  steam_persona_name: string;
  steam_avatar_url: string;
  steam_profile_url: string;
  steam_last_sync: string | null;
}

// Error Types
export class SteamAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SteamAPIError';
  }
}

export class SteamPrivacyError extends SteamAPIError {
  constructor(message = 'Steam profile or game details are private') {
    super(message, 'PRIVACY_ERROR', 403);
    this.name = 'SteamPrivacyError';
  }
}

export class SteamRateLimitError extends SteamAPIError {
  constructor(message = 'Steam API rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'SteamRateLimitError';
  }
}

export class InvalidSteamIdError extends SteamAPIError {
  constructor(message = 'Invalid Steam ID format') {
    super(message, 'INVALID_STEAM_ID', 400);
    this.name = 'InvalidSteamIdError';
  }
}

// Session Tracking Types
export interface CurrentlyPlaying {
  isPlaying: boolean;
  steamAppId: number | null;
  gameName: string | null;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_id: string;
  user_game_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: 'active' | 'completed';
  steam_appid: number | null;
  platform: string;
  created_at: string;
  updated_at: string;
  game?: {
    title: string;
    cover_url: string | null;
  };
}
