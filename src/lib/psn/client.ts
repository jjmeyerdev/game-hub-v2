// PlayStation Network API Client
// Uses the psn-api library for authentication and data fetching

import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  exchangeRefreshTokenForAuthTokens,
  getUserTitles,
  getUserTrophyProfileSummary,
  getUserTrophiesEarnedForTitle,
  getTitleTrophies,
  getProfileFromAccountId,
  getUserPlayedGames,
  type AuthorizationPayload,
  type TrophyTitle,
  type UserTrophiesEarnedForTitleResponse,
  type UserPlayedGamesResponse,
} from 'psn-api';

import {
  PsnAPIError,
  PsnAuthError,
  PsnPrivacyError,
  PsnRateLimitError,
  InvalidNpssoError,
  type PsnTrophyTitle,
  type PsnTrophy,
  type PsnTrophyProfileSummary,
  type AuthorizationPayload as InternalAuthPayload,
} from '@/lib/types/psn';

// Rate limiting: Conservative limit for PSN (undocumented)
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
 * Validate NPSSO token format
 * NPSSO tokens are 64 character alphanumeric strings
 */
export function validateNpsso(npsso: string): string {
  const trimmed = npsso.trim();

  // NPSSO tokens are typically 64 characters
  if (!/^[a-zA-Z0-9]{60,70}$/.test(trimmed)) {
    throw new InvalidNpssoError(
      'Invalid NPSSO token format. Please ensure you copied the full token from the ssocookie page.'
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
    throw new PsnRateLimitError(
      `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
    );
  }
}

/**
 * Exchange NPSSO token for access and refresh tokens
 */
export async function authenticateWithNpsso(npsso: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const validNpsso = validateNpsso(npsso);
  checkRateLimit();

  try {
    rateLimiter.recordRequest();

    // Step 1: Exchange NPSSO for access code
    const accessCode = await exchangeNpssoForCode(validNpsso);

    rateLimiter.recordRequest();

    // Step 2: Exchange access code for tokens
    const authorization = await exchangeCodeForAccessToken(accessCode);

    return {
      accessToken: authorization.accessToken,
      refreshToken: authorization.refreshToken,
      expiresIn: authorization.expiresIn,
    };
  } catch (error) {
    if (error instanceof PsnAPIError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for common auth errors
    if (message.includes('invalid_grant') || message.includes('expired')) {
      throw new PsnAuthError('NPSSO token has expired. Please get a new token from playstation.com.');
    }

    throw new PsnAuthError(`Failed to authenticate with PSN: ${message}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  checkRateLimit();

  try {
    rateLimiter.recordRequest();

    const authorization = await exchangeRefreshTokenForAuthTokens(refreshToken);

    return {
      accessToken: authorization.accessToken,
      refreshToken: authorization.refreshToken,
      expiresIn: authorization.expiresIn,
    };
  } catch (error) {
    if (error instanceof PsnAPIError) {
      throw error;
    }

    throw new PsnAuthError(
      'Failed to refresh PSN tokens. Please re-authenticate with a new NPSSO token.'
    );
  }
}

/**
 * Get user's profile (online ID, avatar, etc.)
 */
export async function getUserProfile(
  accessToken: string,
  accountId: string
): Promise<{ onlineId: string; avatarUrl: string | null }> {
  checkRateLimit();

  try {
    rateLimiter.recordRequest();

    const auth: AuthorizationPayload = { accessToken };
    const profile = await getProfileFromAccountId(auth, accountId);

    // Get the largest avatar URL available
    const avatarUrl = profile.avatars?.length > 0
      ? profile.avatars.sort((a, b) => {
          const sizeOrder: Record<string, number> = { xl: 4, l: 3, m: 2, s: 1 };
          return (sizeOrder[b.size] || 0) - (sizeOrder[a.size] || 0);
        })[0].url
      : null;

    return {
      onlineId: profile.onlineId,
      avatarUrl,
    };
  } catch (error) {
    if (error instanceof PsnAPIError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get PSN profile:', message);

    // Return empty values if profile fetch fails (privacy settings, etc.)
    return { onlineId: '', avatarUrl: null };
  }
}

/**
 * Get user's trophy profile summary (level, trophy counts)
 */
export async function getTrophyProfileSummary(
  accessToken: string,
  accountId: string = 'me'
): Promise<PsnTrophyProfileSummary> {
  checkRateLimit();

  try {
    rateLimiter.recordRequest();

    const auth: AuthorizationPayload = { accessToken };
    const summary = await getUserTrophyProfileSummary(auth, accountId);

    return {
      accountId: summary.accountId,
      trophyLevel: summary.trophyLevel, // String from API
      progress: summary.progress,
      tier: summary.tier,
      earnedTrophies: summary.earnedTrophies,
    };
  } catch (error) {
    if (error instanceof PsnAPIError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('401') || message.includes('unauthorized')) {
      throw new PsnAuthError();
    }
    if (message.includes('403') || message.includes('forbidden')) {
      throw new PsnPrivacyError();
    }

    throw new PsnAPIError(`Failed to get trophy profile: ${message}`);
  }
}

/**
 * Get user's game library (trophy titles)
 */
export async function getGameLibrary(
  accessToken: string,
  accountId: string = 'me',
  limit: number = 800
): Promise<PsnTrophyTitle[]> {
  checkRateLimit();

  try {
    rateLimiter.recordRequest();

    const auth: AuthorizationPayload = { accessToken };
    const response = await getUserTitles(auth, accountId, { limit });

    return response.trophyTitles.map((title: TrophyTitle) => ({
      npServiceName: title.npServiceName as 'trophy' | 'trophy2',
      npCommunicationId: title.npCommunicationId,
      trophySetVersion: title.trophySetVersion,
      trophyTitleName: title.trophyTitleName,
      trophyTitleDetail: title.trophyTitleDetail,
      trophyTitleIconUrl: title.trophyTitleIconUrl,
      trophyTitlePlatform: title.trophyTitlePlatform,
      hasTrophyGroups: title.hasTrophyGroups,
      progress: title.progress,
      hiddenFlag: title.hiddenFlag,
      lastUpdatedDateTime: title.lastUpdatedDateTime,
      definedTrophies: title.definedTrophies,
      earnedTrophies: title.earnedTrophies,
    }));
  } catch (error) {
    if (error instanceof PsnAPIError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('401') || message.includes('unauthorized')) {
      throw new PsnAuthError();
    }
    if (message.includes('403') || message.includes('forbidden')) {
      throw new PsnPrivacyError('Unable to fetch games. Please ensure your PSN profile is public.');
    }

    throw new PsnAPIError(`Failed to fetch PSN library: ${message}`);
  }
}

/**
 * Get trophies for a specific title with full details (names, descriptions, icons)
 * Fetches both trophy definitions and user's earned status, then merges them
 */
export async function getTrophiesForTitle(
  accessToken: string,
  npCommunicationId: string,
  npServiceName: 'trophy' | 'trophy2' = 'trophy',
  accountId: string = 'me'
): Promise<PsnTrophy[]> {
  const auth: AuthorizationPayload = { accessToken };

  try {
    // Fetch trophy definitions (names, descriptions, icons) and user progress in parallel
    checkRateLimit();
    rateLimiter.recordRequest();

    const [definitionsResponse, earnedResponse] = await Promise.all([
      getTitleTrophies(auth, npCommunicationId, 'all', { npServiceName }),
      getUserTrophiesEarnedForTitle(auth, accountId, npCommunicationId, 'all', { npServiceName }),
    ]);

    rateLimiter.recordRequest(); // Count both requests

    // Create a map of earned trophies for quick lookup
    const earnedMap = new Map(
      (earnedResponse.trophies || []).map((t) => [t.trophyId, t])
    );

    // Merge definitions with earned status
    return (definitionsResponse.trophies || []).map((trophy) => {
      const earned = earnedMap.get(trophy.trophyId);

      return {
        trophyId: trophy.trophyId,
        trophyHidden: trophy.trophyHidden,
        trophyType: trophy.trophyType as 'bronze' | 'silver' | 'gold' | 'platinum',
        trophyName: trophy.trophyName || 'Hidden Trophy',
        trophyDetail: trophy.trophyDetail || '',
        trophyIconUrl: trophy.trophyIconUrl || '',
        trophyGroupId: trophy.trophyGroupId || 'default',
        earned: earned?.earned || false,
        earnedDateTime: earned?.earnedDateTime,
        trophyEarnedRate: earned?.trophyEarnedRate,
        trophyRare: earned?.trophyRare,
      };
    });
  } catch (error) {
    // Silently fail - not all games have accessible trophy data
    console.error('Failed to fetch trophies for title:', npCommunicationId, error);
    return [];
  }
}

/**
 * Build PlayStation Store URL for a game
 * Note: npCommunicationId doesn't directly map to store URLs,
 * so we search by game name instead
 */
export function getPsnStoreSearchUrl(gameName: string): string {
  const encoded = encodeURIComponent(gameName);
  return `https://store.playstation.com/search/${encoded}`;
}

/**
 * Get high-quality cover image URL from PSN
 * Uses the trophy icon URL and attempts to get larger versions
 */
export function getPsnCoverUrl(iconUrl: string): string {
  // PSN trophy icons are typically small, return as-is
  // For better covers, we'll fall back to IGDB
  return iconUrl;
}

/**
 * Calculate total trophies from earned trophy counts
 */
export function calculateTotalTrophies(earnedTrophies: {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}): number {
  return (
    earnedTrophies.bronze +
    earnedTrophies.silver +
    earnedTrophies.gold +
    earnedTrophies.platinum
  );
}

/**
 * Calculate total defined trophies from trophy counts
 */
export function calculateDefinedTrophies(definedTrophies: {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}): number {
  return (
    definedTrophies.bronze +
    definedTrophies.silver +
    definedTrophies.gold +
    definedTrophies.platinum
  );
}

/**
 * Determine PlayStation platform from trophy title platform string
 */
export function normalizePsnPlatform(platform: string): string {
  const normalized = platform.toUpperCase();

  if (normalized.includes('PS5')) return 'PS5';
  if (normalized.includes('PS4')) return 'PS4';
  if (normalized.includes('PS3')) return 'PS3';
  if (normalized.includes('VITA')) return 'PS Vita';

  return 'PlayStation';
}

/**
 * Check if rate limiter allows requests
 */
export function canMakePsnRequest(): boolean {
  return rateLimiter.canMakeRequest();
}

/**
 * Get wait time before next request is allowed
 */
export function getPsnRateLimitWaitTime(): number {
  return rateLimiter.getWaitTime();
}

/**
 * Parse ISO 8601 duration string to minutes
 * Format: PT228H56M33S = 228 hours, 56 minutes, 33 seconds
 */
export function parseIsoDuration(duration: string): number {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  // Return total minutes (rounded)
  return hours * 60 + minutes + Math.round(seconds / 60);
}

/**
 * Title from getUserPlayedGames response
 */
export interface PsnPlayedTitle {
  titleId: string;
  name: string;
  imageUrl: string;
  category: string;
  playCount: number;
  firstPlayedDateTime: string;
  lastPlayedDateTime: string;
  playDuration: string; // ISO 8601 duration (e.g., "PT228H56M33S")
}

/**
 * Get user's played games with playtime information
 * This is a separate endpoint from trophy titles that includes play duration
 * Note: This API has a max limit of 200 per request, so we paginate to get all games
 */
export async function getPlayedGamesWithPlaytime(
  accessToken: string,
  accountId: string = 'me'
): Promise<PsnPlayedTitle[]> {
  const auth: AuthorizationPayload = { accessToken };
  const allTitles: PsnPlayedTitle[] = [];
  const pageLimit = 200; // API max limit
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      checkRateLimit();
      rateLimiter.recordRequest();

      const response: UserPlayedGamesResponse = await getUserPlayedGames(auth, accountId, {
        limit: pageLimit,
        offset,
      });

      const titles = response.titles.map((title) => ({
        titleId: title.titleId,
        name: title.name,
        imageUrl: title.imageUrl,
        category: title.category,
        playCount: title.playCount,
        firstPlayedDateTime: title.firstPlayedDateTime,
        lastPlayedDateTime: title.lastPlayedDateTime,
        playDuration: title.playDuration,
      }));

      allTitles.push(...titles);

      // Check if we have more pages
      if (titles.length < pageLimit || allTitles.length >= response.totalItemCount) {
        hasMore = false;
      } else {
        offset += pageLimit;
      }
    }

    return allTitles;
  } catch (error) {
    if (error instanceof PsnAPIError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('401') || message.includes('unauthorized')) {
      throw new PsnAuthError();
    }
    if (message.includes('403') || message.includes('forbidden')) {
      throw new PsnPrivacyError('Unable to fetch played games. Please ensure your PSN profile is public.');
    }

    // Return empty array on error - playtime is optional enhancement
    console.error('Failed to fetch played games:', message);
    return [];
  }
}
