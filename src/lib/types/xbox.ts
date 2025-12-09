// Xbox Live API Type Definitions (via OpenXBL)

// ============================================================================
// OpenXBL API Response Types
// ============================================================================

export interface XboxProfile {
  xuid: string;
  gamertag: string;
  gamerscore: number;
  avatar: string;
  tier: string;
  reputation: string;
  colour: {
    primaryColour: string;
    secondaryColour: string;
    tertiaryColour: string;
  };
  realname?: string;
  bio?: string;
  location?: string;
  tenure?: string;
  watermarks?: string[];
  isXbox360Gamertag?: boolean;
}

export interface XboxProfileResponse {
  profileUsers: Array<{
    id: string;
    hostId: string;
    settings: Array<{
      id: string;
      value: string;
    }>;
    isSponsoredUser: boolean;
  }>;
}

export interface XboxTitleHistoryItem {
  titleId: string;
  name: string;
  displayImage: string;
  modernTitleId?: string;
  isBundle: boolean;
  achievement: {
    currentAchievements: number;
    totalAchievements: number;
    currentGamerscore: number;
    totalGamerscore: number;
    progressPercentage: number;
  };
  titleHistory: {
    lastTimePlayed: string;
    visible: boolean;
    canHide: boolean;
  };
  titleType: string;
  detail?: {
    description?: string;
    releaseDate?: string;
    publisher?: string;
    developer?: string;
  };
  images?: {
    poster?: string;
    boxArt?: string;
    titleImage?: string;
  };
  devices: string[];
}

export interface XboxTitleHistoryResponse {
  titles: XboxTitleHistoryItem[];
  pagingInfo: {
    continuationToken: string | null;
    totalRecords: number;
  };
}

export interface XboxAchievement {
  id: string;
  serviceConfigId: string;
  name: string;
  titleAssociations: Array<{
    name: string;
    id: number;
  }>;
  progressState: 'Achieved' | 'NotStarted' | 'InProgress';
  progression: {
    requirements: Array<{
      id: string;
      current: string | null;
      target: string;
    }>;
    timeUnlocked: string;
  };
  mediaAssets: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  platforms: string[];
  isSecret: boolean;
  description: string;
  lockedDescription: string;
  productId: string;
  achievementType: string;
  participationType: string;
  rewards: Array<{
    name: string | null;
    description: string | null;
    value: string;
    type: string;
    mediaAsset: {
      name: string;
      type: string;
      url: string;
    } | null;
    valueType: string;
  }>;
  estimatedTime: string;
  deeplink: string;
  isRevoked: boolean;
  rarity?: {
    currentCategory: string;
    currentPercentage: number;
  };
}

export interface XboxAchievementsResponse {
  achievements: XboxAchievement[];
  pagingInfo: {
    continuationToken: string | null;
    totalRecords: number;
  };
}

export interface XboxPlayerSummary {
  xuid: string;
  gamertag: string;
  gamerscore: number;
  gamerPicture: string;
  accountTier: string;
  xboxOneRep: string;
  preferredColor: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
  };
  presenceState: string;
  presenceText: string;
  presenceDevices?: Array<{
    type: string;
    titles: Array<{
      id: string;
      name: string;
      placement: string;
      state: string;
    }>;
  }>;
  isXbox360Gamertag: boolean;
}

// ============================================================================
// Internal Profile Types (stored in database)
// ============================================================================

export interface XboxDbProfile {
  xbox_xuid: string;
  xbox_gamertag: string;
  xbox_avatar_url: string | null;
  xbox_gamerscore: number | null;
  xbox_last_sync: string | null;
}

// ============================================================================
// Sync Result Types
// ============================================================================

export interface XboxSyncResult {
  success: boolean;
  gamesAdded: number;
  gamesUpdated: number;
  achievementsUpdated: number;
  errors: string[];
  totalGames: number;
}

export interface XboxGameSyncResult {
  success: boolean;
  game?: {
    id: string;
    title: string;
    titleId: string;
  };
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class XboxAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'XboxAPIError';
  }
}

export class XboxAuthError extends XboxAPIError {
  constructor(message = 'Xbox authentication failed or API key invalid') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'XboxAuthError';
  }
}

export class XboxPrivacyError extends XboxAPIError {
  constructor(message = 'Xbox profile or game data is private') {
    super(message, 'PRIVACY_ERROR', 403);
    this.name = 'XboxPrivacyError';
  }
}

export class XboxRateLimitError extends XboxAPIError {
  constructor(message = 'Xbox API rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'XboxRateLimitError';
  }
}

export class InvalidXuidError extends XboxAPIError {
  constructor(message = 'Invalid Xbox User ID (XUID) format') {
    super(message, 'INVALID_XUID', 400);
    this.name = 'InvalidXuidError';
  }
}

export class InvalidGamertagError extends XboxAPIError {
  constructor(message = 'Invalid gamertag format') {
    super(message, 'INVALID_GAMERTAG', 400);
    this.name = 'InvalidGamertagError';
  }
}
