// Xbox Live API Client (via OpenXBL)
import {
  XboxProfile,
  XboxTitleHistoryItem,
  XboxTitleHistoryResponse,
  XboxAchievement,
  XboxAchievementsResponse,
  XboxPlayerSummary,
  XboxAPIError,
  XboxAuthError,
  XboxPrivacyError,
  XboxRateLimitError,
  InvalidXuidError,
  InvalidGamertagError,
} from '@/lib/types/xbox';

const OPENXBL_API_BASE = 'https://xbl.io/api/v2';

// Rate limiting: Conservative limit for OpenXBL
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

class RateLimiter {
  private requests: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < RATE_LIMIT_WINDOW);
    return this.requests.length < RATE_LIMIT_MAX_REQUESTS;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;
    const oldestRequest = this.requests[0];
    return RATE_LIMIT_WINDOW - (Date.now() - oldestRequest);
  }
}

const rateLimiter = new RateLimiter();

/**
 * Validate XUID format
 * XUID is a 16-digit number
 */
export function validateXuid(xuid: string): string {
  const trimmed = xuid.trim();

  // XUID is typically 16 digits
  if (!/^\d{15,17}$/.test(trimmed)) {
    throw new InvalidXuidError(
      'Invalid XUID format. Please provide a valid 16-digit Xbox User ID.'
    );
  }

  return trimmed;
}

/**
 * Validate gamertag format
 * Gamertags are 1-15 characters, alphanumeric with spaces
 */
export function validateGamertag(gamertag: string): string {
  const trimmed = gamertag.trim();

  // Gamertag rules: 1-15 chars, alphanumeric, spaces allowed (but not at start/end)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9 ]{0,13}[a-zA-Z0-9]?$/.test(trimmed) || trimmed.length > 15) {
    throw new InvalidGamertagError(
      'Invalid gamertag format. Gamertags are 1-15 characters, letters, numbers, and spaces.'
    );
  }

  return trimmed;
}

/**
 * Check rate limit before making a request
 */
function checkRateLimit(): void {
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    throw new XboxRateLimitError(
      `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
    );
  }
}

/**
 * Make a request to OpenXBL API with rate limiting and error handling
 */
async function xboxApiRequest<T>(endpoint: string, apiKey: string): Promise<T> {
  checkRateLimit();

  if (!apiKey) {
    throw new XboxAPIError('Xbox API key not configured', 'NO_API_KEY', 500);
  }

  try {
    rateLimiter.recordRequest();

    const response = await fetch(`${OPENXBL_API_BASE}${endpoint}`, {
      headers: {
        'x-authorization': apiKey,
        'Accept': 'application/json',
        'Accept-Language': 'en-US',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new XboxAuthError('Invalid or expired Xbox API key');
      }
      if (response.status === 403) {
        throw new XboxPrivacyError();
      }
      if (response.status === 429) {
        throw new XboxRateLimitError();
      }
      throw new XboxAPIError(
        `Xbox API request failed: ${response.statusText}`,
        'API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof XboxAPIError) {
      throw error;
    }
    throw new XboxAPIError(
      `Failed to fetch from Xbox API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Get current user's profile (requires user's own API key)
 */
export async function getMyProfile(apiKey: string): Promise<XboxPlayerSummary> {
  const data = await xboxApiRequest<{ profileUsers: Array<{ id: string; settings: Array<{ id: string; value: string }> }> }>(
    '/account',
    apiKey
  );

  // Parse the settings array into a more usable format
  const user = data.profileUsers[0];
  if (!user) {
    throw new XboxAPIError('No profile data returned', 'NO_DATA', 404);
  }

  const settings = user.settings.reduce((acc, setting) => {
    acc[setting.id] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    xuid: user.id,
    gamertag: settings['Gamertag'] || settings['GameDisplayName'] || '',
    gamerscore: parseInt(settings['Gamerscore'] || '0', 10),
    gamerPicture: settings['GameDisplayPicRaw'] || settings['PublicGamerpic'] || '',
    accountTier: settings['AccountTier'] || '',
    xboxOneRep: settings['XboxOneRep'] || '',
    preferredColor: {
      primaryColor: settings['PreferredColor']?.split('|')[0] || '',
      secondaryColor: settings['PreferredColor']?.split('|')[1] || '',
      tertiaryColor: settings['PreferredColor']?.split('|')[2] || '',
    },
    presenceState: settings['PresenceState'] || 'Offline',
    presenceText: settings['PresenceText'] || '',
    isXbox360Gamertag: settings['Gamertag'] !== settings['GameDisplayName'],
  };
}

/**
 * Get a player's profile by XUID
 */
export async function getProfileByXuid(
  xuid: string,
  apiKey: string
): Promise<XboxPlayerSummary> {
  const validXuid = validateXuid(xuid);
  const data = await xboxApiRequest<{ profileUsers: Array<{ id: string; settings: Array<{ id: string; value: string }> }> }>(
    `/account/${validXuid}`,
    apiKey
  );

  const user = data.profileUsers[0];
  if (!user) {
    throw new XboxAPIError('Player not found', 'NOT_FOUND', 404);
  }

  const settings = user.settings.reduce((acc, setting) => {
    acc[setting.id] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    xuid: user.id,
    gamertag: settings['Gamertag'] || settings['GameDisplayName'] || '',
    gamerscore: parseInt(settings['Gamerscore'] || '0', 10),
    gamerPicture: settings['GameDisplayPicRaw'] || settings['PublicGamerpic'] || '',
    accountTier: settings['AccountTier'] || '',
    xboxOneRep: settings['XboxOneRep'] || '',
    preferredColor: {
      primaryColor: settings['PreferredColor']?.split('|')[0] || '',
      secondaryColor: settings['PreferredColor']?.split('|')[1] || '',
      tertiaryColor: settings['PreferredColor']?.split('|')[2] || '',
    },
    presenceState: settings['PresenceState'] || 'Offline',
    presenceText: settings['PresenceText'] || '',
    isXbox360Gamertag: settings['Gamertag'] !== settings['GameDisplayName'],
  };
}

/**
 * Search for a player by gamertag
 */
export async function searchByGamertag(
  gamertag: string,
  apiKey: string
): Promise<XboxPlayerSummary | null> {
  const validGamertag = validateGamertag(gamertag);

  try {
    const data = await xboxApiRequest<{ profileUsers: Array<{ id: string; settings: Array<{ id: string; value: string }> }> }>(
      `/search/${encodeURIComponent(validGamertag)}`,
      apiKey
    );

    const user = data.profileUsers[0];
    if (!user) {
      return null;
    }

    const settings = user.settings.reduce((acc, setting) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      xuid: user.id,
      gamertag: settings['Gamertag'] || settings['GameDisplayName'] || '',
      gamerscore: parseInt(settings['Gamerscore'] || '0', 10),
      gamerPicture: settings['GameDisplayPicRaw'] || settings['PublicGamerpic'] || '',
      accountTier: settings['AccountTier'] || '',
      xboxOneRep: settings['XboxOneRep'] || '',
      preferredColor: {
        primaryColor: settings['PreferredColor']?.split('|')[0] || '',
        secondaryColor: settings['PreferredColor']?.split('|')[1] || '',
        tertiaryColor: settings['PreferredColor']?.split('|')[2] || '',
      },
      presenceState: settings['PresenceState'] || 'Offline',
      presenceText: settings['PresenceText'] || '',
      isXbox360Gamertag: settings['Gamertag'] !== settings['GameDisplayName'],
    };
  } catch (error) {
    if (error instanceof XboxAPIError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get title history (game library) for current user
 */
export async function getMyTitleHistory(apiKey: string): Promise<XboxTitleHistoryItem[]> {
  const data = await xboxApiRequest<XboxTitleHistoryResponse>(
    '/player/titleHistory',
    apiKey
  );

  return data.titles || [];
}

/**
 * Get title history (game library) for a player by XUID
 */
export async function getTitleHistoryByXuid(
  xuid: string,
  apiKey: string
): Promise<XboxTitleHistoryItem[]> {
  const validXuid = validateXuid(xuid);
  const data = await xboxApiRequest<XboxTitleHistoryResponse>(
    `/player/titleHistory/${validXuid}`,
    apiKey
  );

  return data.titles || [];
}

/**
 * Get achievements for current user
 */
export async function getMyAchievements(apiKey: string): Promise<XboxAchievement[]> {
  const data = await xboxApiRequest<XboxAchievementsResponse>(
    '/achievements',
    apiKey
  );

  return data.achievements || [];
}

/**
 * Get achievements for a player by XUID
 */
export async function getAchievementsByXuid(
  xuid: string,
  apiKey: string
): Promise<XboxAchievement[]> {
  const validXuid = validateXuid(xuid);
  const data = await xboxApiRequest<XboxAchievementsResponse>(
    `/achievements/player/${validXuid}`,
    apiKey
  );

  return data.achievements || [];
}

/**
 * Get achievements for a specific game for a player
 */
export async function getGameAchievements(
  xuid: string,
  titleId: string,
  apiKey: string
): Promise<XboxAchievement[]> {
  const validXuid = validateXuid(xuid);
  const data = await xboxApiRequest<XboxAchievementsResponse>(
    `/achievements/player/${validXuid}/${titleId}`,
    apiKey
  );

  return data.achievements || [];
}

/**
 * Get Xbox Store URL for a game
 */
export function getXboxStoreUrl(titleId: string): string {
  return `https://www.xbox.com/games/store/${titleId}`;
}

/**
 * Normalize Xbox platform string
 * Prioritizes original platform (oldest first) to correctly identify
 * backward-compatible games (e.g., Xbox 360 games playable on Xbox One)
 */
export function normalizeXboxPlatform(devices: string[]): string {
  // Check oldest platforms first to identify original release platform
  if (devices.includes('Xbox360')) {
    return 'Xbox 360';
  }
  if (devices.includes('XboxOne')) {
    return 'Xbox One';
  }
  if (devices.includes('XboxSeriesXS') || devices.includes('Scarlett')) {
    return 'Xbox Series X|S';
  }
  if (devices.includes('PC')) {
    return 'PC (Xbox)';
  }
  return 'Xbox';
}

/**
 * Check if rate limiter allows requests
 */
export function canMakeXboxRequest(): boolean {
  return rateLimiter.canMakeRequest();
}

/**
 * Get wait time before next request is allowed
 */
export function getXboxRateLimitWaitTime(): number {
  return rateLimiter.getWaitTime();
}
