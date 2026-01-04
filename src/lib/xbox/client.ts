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

// In-memory cache for expensive API calls
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Caches for expensive operations
const titleHistoryCache = new ApiCache<XboxTitleHistoryItem[]>();
const achievementsCache = new ApiCache<XboxAchievement[]>();
const gamertagCache = new ApiCache<XboxPlayerSummary>();

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
 * Modern gamertags can be up to 12 characters + optional #1234 suffix
 * Legacy gamertags are 1-15 characters, alphanumeric with spaces
 */
export function validateGamertag(gamertag: string): string {
  const trimmed = gamertag.trim();

  // Basic validation - not empty and reasonable length (with potential suffix)
  if (!trimmed || trimmed.length > 20) {
    throw new InvalidGamertagError(
      'Invalid gamertag. Please enter a valid Xbox gamertag.'
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
  const data = await xboxApiRequest<{ profileUsers?: Array<{ id: string; settings: Array<{ id: string; value: string }> }> }>(
    '/account',
    apiKey
  );

  // Parse the settings array into a more usable format
  const user = data.profileUsers?.[0];
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
  const data = await xboxApiRequest<{ profileUsers?: Array<{ id: string; settings: Array<{ id: string; value: string }> }> }>(
    `/account/${validXuid}`,
    apiKey
  );

  const user = data.profileUsers?.[0];
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
 * Search response person from OpenXBL
 */
interface XboxSearchPerson {
  xuid: string;
  gamertag: string;
  modernGamertag: string;
  modernGamertagSuffix: string;
  gamerScore: string;
  displayPicRaw: string;
  xboxOneRep: string;
  presenceState: string | null;
  presenceText: string | null;
  preferredColor: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
  };
  detail?: {
    accountTier: string;
  };
}

/**
 * Search for a player by gamertag (with caching)
 */
export async function searchByGamertag(
  gamertag: string,
  apiKey: string
): Promise<XboxPlayerSummary | null> {
  const validGamertag = validateGamertag(gamertag);
  const cacheKey = `gamertag:${validGamertag.toLowerCase()}`;

  // Check cache first
  const cached = gamertagCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Search endpoint returns 'people' array, not 'profileUsers'
    const data = await xboxApiRequest<{ people?: XboxSearchPerson[] }>(
      `/search/${encodeURIComponent(validGamertag)}`,
      apiKey
    );

    const person = data.people?.[0];
    if (!person) {
      return null;
    }

    const result: XboxPlayerSummary = {
      xuid: person.xuid,
      gamertag: person.modernGamertag || person.gamertag || '',
      gamerscore: parseInt(person.gamerScore || '0', 10),
      gamerPicture: person.displayPicRaw || '',
      accountTier: person.detail?.accountTier || '',
      xboxOneRep: person.xboxOneRep || '',
      preferredColor: {
        primaryColor: person.preferredColor?.primaryColor || '',
        secondaryColor: person.preferredColor?.secondaryColor || '',
        tertiaryColor: person.preferredColor?.tertiaryColor || '',
      },
      presenceState: person.presenceState || 'Offline',
      presenceText: person.presenceText || '',
      isXbox360Gamertag: false,
    };

    // Cache the result
    gamertagCache.set(cacheKey, result);
    return result;
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
 * Get title history (game library) for a player by XUID (with caching)
 */
export async function getTitleHistoryByXuid(
  xuid: string,
  apiKey: string
): Promise<XboxTitleHistoryItem[]> {
  const validXuid = validateXuid(xuid);
  const cacheKey = `titles:${validXuid}`;

  // Check cache first
  const cached = titleHistoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await xboxApiRequest<XboxTitleHistoryResponse>(
    `/player/titleHistory/${validXuid}`,
    apiKey
  );

  const titles = data.titles || [];
  titleHistoryCache.set(cacheKey, titles);
  return titles;
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
 * Get achievements for a specific game for a player (with caching and parallel fetching)
 *
 * Note: OpenXBL API provides detailed achievements for Xbox One/Series games,
 * but Xbox 360 games only have summary counts available (no individual achievement details).
 */
export async function getGameAchievements(
  xuid: string,
  titleId: string,
  apiKey: string
): Promise<XboxAchievement[]> {
  const validXuid = validateXuid(xuid);
  const cacheKey = `achievements:${validXuid}:${titleId}`;

  // Check cache first
  const cached = achievementsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Try both endpoints in parallel for faster response
  const playerEndpoint = xboxApiRequest<XboxAchievementsResponse>(
    `/achievements/player/${validXuid}/${titleId}`,
    apiKey
  ).then(data => data.achievements || []).catch(() => [] as XboxAchievement[]);

  const titleEndpoint = xboxApiRequest<{ achievements?: XboxAchievement[] }>(
    `/achievements/title/${titleId}`,
    apiKey
  ).then(data => data.achievements || []).catch(() => [] as XboxAchievement[]);

  // Wait for both and use whichever has data
  const [playerAchievements, titleAchievements] = await Promise.all([
    playerEndpoint,
    titleEndpoint,
  ]);

  // Prefer player-specific achievements (has unlock status), fallback to title schema
  const achievements = playerAchievements.length > 0 ? playerAchievements : titleAchievements;

  // Cache even empty results to avoid repeated slow lookups for Xbox 360 games
  achievementsCache.set(cacheKey, achievements);
  return achievements;
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
  // Return format: "Xbox (Console)" for proper filtering
  // Check oldest platforms first to identify original release platform
  if (devices.includes('Xbox360')) {
    return 'Xbox (Xbox 360)';
  }
  if (devices.includes('XboxOne')) {
    return 'Xbox (Xbox One)';
  }
  if (devices.includes('XboxSeriesXS') || devices.includes('Scarlett')) {
    return 'Xbox (Xbox Series X|S)';
  }
  if (devices.includes('PC')) {
    return 'PC';
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
