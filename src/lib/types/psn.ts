// PlayStation Network API Type Definitions

// ============================================================================
// PSN Library API Types (from psn-api library)
// ============================================================================

export interface PsnTrophyTitle {
  npServiceName: 'trophy' | 'trophy2';
  npCommunicationId: string;
  trophySetVersion: string;
  trophyTitleName: string;
  trophyTitleDetail?: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string; // PS5, PS4, PS3, PSVITA
  hasTrophyGroups: boolean;
  progress: number;
  hiddenFlag: boolean;
  lastUpdatedDateTime: string;
  definedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  earnedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export interface PsnTrophy {
  trophyId: number;
  trophyHidden: boolean;
  trophyType: 'bronze' | 'silver' | 'gold' | 'platinum';
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyGroupId: string;
  trophyProgressTargetValue?: number;
  trophyRewardName?: string;
  trophyRewardImageUrl?: string;
  // User-specific fields
  earned?: boolean;
  earnedDateTime?: string;
  trophyEarnedRate?: string;
  trophyRare?: number;
  progress?: string;
  progressRate?: number;
  progressedDateTime?: string;
}

export interface PsnTrophyProfileSummary {
  accountId: string;
  trophyLevel: string; // Trophy level as string from API
  progress: number;
  tier: number; // 1-10
  earnedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

// ============================================================================
// Internal Profile Types (stored in database)
// ============================================================================

export interface PsnProfile {
  psn_account_id: string;
  psn_online_id: string;
  psn_avatar_url: string | null;
  psn_trophy_level: number | null;
  psn_last_sync: string | null;
}

export interface PsnTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

// ============================================================================
// Sync Result Types
// ============================================================================

export interface PsnSyncResult {
  success: boolean;
  gamesAdded: number;
  gamesUpdated: number;
  trophiesUpdated: number;
  errors: string[];
  totalGames: number;
}

export interface PsnGameSyncResult {
  success: boolean;
  game?: {
    id: string;
    title: string;
    npCommunicationId: string;
  };
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class PsnAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PsnAPIError';
  }
}

export class PsnAuthError extends PsnAPIError {
  constructor(message = 'PSN authentication failed or token expired') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'PsnAuthError';
  }
}

export class PsnPrivacyError extends PsnAPIError {
  constructor(message = 'PSN profile or trophy data is private') {
    super(message, 'PRIVACY_ERROR', 403);
    this.name = 'PsnPrivacyError';
  }
}

export class PsnRateLimitError extends PsnAPIError {
  constructor(message = 'PSN API rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'PsnRateLimitError';
  }
}

export class InvalidNpssoError extends PsnAPIError {
  constructor(message = 'Invalid NPSSO token format') {
    super(message, 'INVALID_NPSSO', 400);
    this.name = 'InvalidNpssoError';
  }
}

// ============================================================================
// Helper Types for psn-api library
// ============================================================================

export interface AuthorizationPayload {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface UserTitlesResponse {
  trophyTitles: PsnTrophyTitle[];
  totalItemCount: number;
  nextOffset?: number;
  previousOffset?: number;
}
