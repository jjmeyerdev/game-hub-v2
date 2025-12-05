// Steam Web API Client
import {
  GetPlayerSummariesResponse,
  GetOwnedGamesResponse,
  GetPlayerAchievementsResponse,
  GetSchemaForGameResponse,
  SteamPlayer,
  SteamGame,
  SteamAchievement,
  SteamAPIError,
  SteamPrivacyError,
  SteamRateLimitError,
  InvalidSteamIdError,
  CurrentlyPlaying,
} from '@/lib/types/steam';

const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_STORE_API_BASE = 'https://store.steampowered.com/api';

// Rate limiting: 200 requests per 5 minutes
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes in ms
const RATE_LIMIT_MAX_REQUESTS = 200;

class RateLimiter {
  private requests: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the window
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
 * Validate and extract Steam ID from various formats
 * Supports:
 * - Steam ID64 (76561198XXXXXXXXX)
 * - Steam profile URLs (https://steamcommunity.com/id/username)
 * - Steam profile URLs (https://steamcommunity.com/profiles/76561198XXXXXXXXX)
 */
export function validateSteamId(input: string): string {
  const trimmed = input.trim();

  // Check if it's already a valid Steam ID64 (17 digits starting with 7656119)
  if (/^7656119\d{10}$/.test(trimmed)) {
    return trimmed;
  }

  // Extract from profile URL with Steam ID
  const profileIdMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/);
  if (profileIdMatch && /^7656119\d{10}$/.test(profileIdMatch[1])) {
    return profileIdMatch[1];
  }

  // Extract from custom URL (we can't convert this to Steam ID without an API call)
  const customUrlMatch = trimmed.match(/steamcommunity\.com\/id\/([^\/]+)/);
  if (customUrlMatch) {
    throw new InvalidSteamIdError(
      'Custom Steam URLs are not supported. Please use your Steam ID64 or profile URL with ID.'
    );
  }

  throw new InvalidSteamIdError(
    'Invalid Steam ID format. Please provide a Steam ID64 or profile URL.'
  );
}

/**
 * Make a request to Steam API with rate limiting and error handling
 */
async function steamApiRequest<T>(url: string): Promise<T> {
  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    throw new SteamRateLimitError(
      `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
    );
  }

  const apiKey = process.env.STEAM_WEB_API_KEY;
  if (!apiKey) {
    throw new SteamAPIError('Steam API key not configured', 'NO_API_KEY', 500);
  }

  try {
    rateLimiter.recordRequest();

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new SteamRateLimitError();
      }
      if (response.status === 403) {
        throw new SteamPrivacyError();
      }
      throw new SteamAPIError(
        `Steam API request failed: ${response.statusText}`,
        'API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof SteamAPIError) {
      throw error;
    }
    throw new SteamAPIError(
      `Failed to fetch from Steam API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Get player summary (profile information)
 */
export async function getPlayerSummary(steamId: string): Promise<SteamPlayer | null> {
  const validSteamId = validateSteamId(steamId);
  const apiKey = process.env.STEAM_WEB_API_KEY;

  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${validSteamId}`;
  const data = await steamApiRequest<GetPlayerSummariesResponse>(url);

  if (!data.response.players || data.response.players.length === 0) {
    return null;
  }

  return data.response.players[0];
}

/**
 * Get currently playing game from player summary
 * Uses GetPlayerSummaries which returns gameid and gameextrainfo if in-game
 */
export async function getCurrentlyPlayingGame(steamId: string): Promise<CurrentlyPlaying> {
  const player = await getPlayerSummary(steamId);

  if (!player) {
    return { isPlaying: false, steamAppId: null, gameName: null };
  }

  // Steam returns gameid and gameextrainfo when user is in-game
  const isPlaying = !!player.gameid;
  const steamAppId = player.gameid ? parseInt(player.gameid) : null;
  const gameName = player.gameextrainfo || null;

  return { isPlaying, steamAppId, gameName };
}

/**
 * Get owned games for a Steam user
 * Note: User's profile and game details must be public
 */
export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  const validSteamId = validateSteamId(steamId);
  const apiKey = process.env.STEAM_WEB_API_KEY;

  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${validSteamId}&include_appinfo=1&include_played_free_games=1`;

  try {
    const data = await steamApiRequest<GetOwnedGamesResponse>(url);

    if (!data.response.games) {
      // Empty response usually means private profile
      throw new SteamPrivacyError(
        'Unable to fetch games. Please ensure your Steam profile and game details are set to public.'
      );
    }

    return data.response.games;
  } catch (error) {
    if (error instanceof SteamAPIError) {
      throw error;
    }
    throw new SteamPrivacyError();
  }
}

/**
 * Get player achievements for a specific game
 */
export async function getPlayerAchievements(
  steamId: string,
  appId: number
): Promise<SteamAchievement[]> {
  const validSteamId = validateSteamId(steamId);
  const apiKey = process.env.STEAM_WEB_API_KEY;

  if (!apiKey) {
    console.error('[Steam] No API key configured');
    return [];
  }

  const url = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&steamid=${validSteamId}&appid=${appId}`;

  try {
    // Direct fetch without caching to get fresh achievement data
    rateLimiter.recordRequest();

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // Don't cache achievement data
    });

    if (!response.ok) {
      return [];
    }

    const data: GetPlayerAchievementsResponse = await response.json();

    if (!data.playerstats?.success) {
      // Game might not have achievements or profile is private
      return [];
    }

    return data.playerstats.achievements || [];
  } catch {
    // Silently fail for achievement fetching - not all games have achievements
    return [];
  }
}

/**
 * Get game schema (including total achievement count)
 */
export async function getGameSchema(appId: number): Promise<GetSchemaForGameResponse | null> {
  const apiKey = process.env.STEAM_WEB_API_KEY;

  if (!apiKey) {
    return null;
  }

  const url = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appId}`;

  try {
    rateLimiter.recordRequest();

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 86400 }, // Schema doesn't change often, cache for 24 hours
    });

    if (!response.ok) {
      return null;
    }

    const data: GetSchemaForGameResponse = await response.json();
    return data;
  } catch (error) {
    // Silently fail - not all games have schemas
    return null;
  }
}

/**
 * Get game details from Steam Store API
 * This doesn't require authentication and provides additional game info
 */
export async function getGameDetails(appId: number): Promise<any> {
  const url = `${STEAM_STORE_API_BASE}/appdetails?appids=${appId}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[appId]?.data || null;
  } catch (error) {
    return null;
  }
}

/**
 * Build Steam store URL for a game
 */
export function getSteamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`;
}

/**
 * Build Steam CDN URL for game icon
 */
export function getSteamIconUrl(appId: number, iconHash: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

/**
 * Build Steam CDN URL for game logo
 */
export function getSteamLogoUrl(appId: number, logoHash: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${logoHash}.jpg`;
}

/**
 * Build Steam CDN URL for game header image (460x215 - landscape)
 */
export function getSteamHeaderUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

/**
 * Build Steam CDN URL for library capsule image (600x900 - portrait, better for cards)
 */
export function getSteamLibraryCapsuleUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
}

/**
 * Build Steam CDN URL for library hero image (alternative portrait)
 */
export function getSteamLibraryHeroUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`;
}

/**
 * Convert Steam playtime (minutes) to hours with decimal
 */
export function convertPlaytimeToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

/**
 * Check if rate limiter allows requests
 */
export function canMakeSteamRequest(): boolean {
  return rateLimiter.canMakeRequest();
}

/**
 * Get wait time before next request is allowed
 */
export function getSteamRateLimitWaitTime(): number {
  return rateLimiter.getWaitTime();
}

