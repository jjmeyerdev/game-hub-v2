import {
  type IGDBGameResult,
  type PlatformReleaseDate,
  transformIGDBResults,
  selectBestMatch,
  extractUpdateData,
  findPCVersion,
  type TransformedGame,
  type IGDBGameUpdateData,
} from '@/lib/types/igdb';
import { getIGDBPlatformIds, IGDB_PLATFORM_ID_TO_CONSOLE } from '@/lib/constants/platforms';

/**
 * IGDB API client with token caching
 * Tokens are cached for 50 days (Twitch tokens last 60 days)
 */

interface CachedToken {
  access_token: string;
  expires_at: number;
}

// Module-level cache (persists across requests in the same process)
let tokenCache: CachedToken | null = null;

/**
 * Get IGDB credentials from environment
 */
function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials not configured');
  }

  return { clientId, clientSecret };
}

/**
 * Get a valid IGDB access token, using cache if available
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 1 hour buffer)
  if (tokenCache && tokenCache.expires_at > now + 3600000) {
    return tokenCache.access_token;
  }

  const { clientId, clientSecret } = getCredentials();

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Failed to authenticate with IGDB');
  }

  const data = await response.json();

  // Cache token with expiration (50 days to be safe)
  tokenCache = {
    access_token: data.access_token,
    expires_at: now + 50 * 24 * 60 * 60 * 1000,
  };

  return data.access_token;
}

/**
 * Make an authenticated request to IGDB API
 */
async function igdbFetch<T>(endpoint: string, body: string): Promise<T> {
  const { clientId } = getCredentials();
  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/plain',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`IGDB API error: ${response.status}`);
  }

  return response.json();
}

// Common fields for all IGDB game queries
const IGDB_GAME_FIELDS = `name, cover.url, summary, first_release_date, release_dates.platform, release_dates.date, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, total_rating, total_rating_count, follows`;

/**
 * Search for games on IGDB
 * Filters out DLCs, expansions, and bundles to return only main games
 * IGDB category: 0 = main game, 1 = DLC, 2 = expansion, 3 = bundle, etc.
 */
export async function searchGames(query: string, limit = 10): Promise<TransformedGame[]> {
  // Escape double quotes in query to prevent IGDB query injection
  const escapedQuery = query.replace(/"/g, '\\"');

  // Fetch more results to account for filtering
  const results = await igdbFetch<(IGDBGameResult & { category?: number })[]>(
    'games',
    `
      search "${escapedQuery}";
      fields ${IGDB_GAME_FIELDS}, category;
      limit ${limit * 3};
    `
  );

  // Filter out DLCs by category if available, or by name patterns
  // DLC/expansion indicators in the name
  const dlcPatterns = /\b(DLC|Pack|Expansion|Bundle|Season Pass|Starter Pack|Upgrade|Add-On|Addon)\b/i;
  // Edition variants - both with colon and without (e.g., "Game: Deluxe Edition" or "Game Definitive Edition")
  const editionPattern = /:?\s*(Deluxe|Ultimate|Gold|Collector|Standard|Premium|Complete|Definitive|Special|Limited|Exclusive|Digital|Earth's Mightiest|Endgame)\s*Edition/i;
  const dlcContentPattern = /:\s*[A-Z][a-zA-Z\s]+(-|–)\s*[A-Z]/; // Pattern like "Game: Character - Subtitle" which indicates DLC
  // Multi-game bundles (e.g., "Game + Other Game")
  const bundlePattern = /\s\+\s/;
  // Pinball games (typically spin-offs, not main games)
  const pinballPattern = /\bPinball\b/i;

  const mainGames = results.filter(game => {
    // Keep category 0 (main game) if available
    if (game.category === 0) return true;
    // Exclude category 1 (DLC), 2 (expansion), 3 (bundle), etc.
    if (game.category !== undefined && game.category !== 0) return false;

    // If category not available, filter by name patterns
    const name = game.name;

    // Exclude if name contains DLC/Pack/Expansion indicators
    if (dlcPatterns.test(name)) return false;

    // Exclude edition variants (Deluxe Edition, Ultimate Edition, etc.)
    if (editionPattern.test(name)) return false;

    // Exclude DLC content patterns (e.g., "Marvel's Avengers: Kate Bishop - Taking AIM")
    if (dlcContentPattern.test(name)) return false;

    // Exclude bundles
    if (bundlePattern.test(name)) return false;

    // Exclude pinball games
    if (pinballPattern.test(name)) return false;

    // Exclude games with colon followed by subtitle (likely DLC/spin-off)
    // but allow things like "Game: The Sequel" or simple subtitles
    if (name.includes(':') && name.split(':')[1]?.trim().length > 30) return false;

    return true;
  });

  // Transform and deduplicate - only keep ONE entry per unique game (by igdbId)
  // This prevents games with many platforms from dominating results
  const transformed = transformIGDBResults(mainGames);
  const seenIds = new Set<number>();
  const deduplicated = transformed.filter(game => {
    if (seenIds.has(game.igdbId)) return false;
    seenIds.add(game.igdbId);
    return true;
  });

  return deduplicated.slice(0, limit);
}

/**
 * Get a game by its IGDB ID
 */
export async function getGameById(id: number): Promise<TransformedGame | null> {
  const results = await igdbFetch<IGDBGameResult[]>(
    'games',
    `
      fields ${IGDB_GAME_FIELDS};
      where id = ${id};
      limit 1;
    `
  );

  if (results.length === 0) {
    return null;
  }

  const transformed = transformIGDBResults(results);
  return transformed[0] ?? null;
}

/**
 * Search and find the best match for a game title
 */
export async function findBestMatch(
  title: string,
  platform?: string
): Promise<TransformedGame | null> {
  const results = await searchGames(title, 10);

  if (results.length === 0) {
    return null;
  }

  return selectBestMatch(results, platform, title);
}

/**
 * Search and find the PC version of a game
 */
export async function findPCGame(title: string): Promise<IGDBGameResult | null> {
  const results = await igdbFetch<IGDBGameResult[]>(
    'games',
    `
      search "${title}";
      fields ${IGDB_GAME_FIELDS};
      limit 10;
    `
  );

  return findPCVersion(results);
}

/**
 * Get update data for a game from IGDB
 * Returns only fields that have new/updated values
 */
export async function getGameUpdateData(
  title: string,
  currentData: {
    cover_url?: string | null;
    description?: string | null;
    developer?: string | null;
    publisher?: string | null;
    release_date?: string | null;
    genres?: string[] | null;
  }
): Promise<IGDBGameUpdateData | null> {
  const igdbGame = await findPCGame(title);

  if (!igdbGame) {
    return null;
  }

  return extractUpdateData(igdbGame, currentData);
}

/**
 * Get the platform-specific release date from an array of release dates
 * @param releaseDates - Array of platform release dates from IGDB
 * @param platform - Base platform (e.g., "PlayStation", "Steam")
 * @param console - Optional specific console (e.g., "PS5", "Xbox One")
 * @param fallbackDate - Fallback date if no platform-specific date is found
 * @returns ISO date string (YYYY-MM-DD) or null
 */
export function getPlatformReleaseDate(
  releaseDates: PlatformReleaseDate[],
  platform: string,
  consoleName?: string,
  fallbackDate?: string | null
): string | null {
  if (!releaseDates || releaseDates.length === 0) {
    return fallbackDate ?? null;
  }

  // Get the IGDB platform IDs that match our platform/console
  const targetPlatformIds = getIGDBPlatformIds(platform, consoleName);

  if (targetPlatformIds.length === 0) {
    return fallbackDate ?? null;
  }

  // Find matching release dates
  const matchingDates = releaseDates.filter(
    (rd) => rd.date && targetPlatformIds.includes(rd.platformId)
  );

  if (matchingDates.length === 0) {
    return fallbackDate ?? null;
  }

  // If multiple matches (e.g., different regions), return the earliest
  const sortedDates = matchingDates
    .filter((rd) => rd.date !== null)
    .sort((a, b) => {
      const dateA = new Date(a.date!).getTime();
      const dateB = new Date(b.date!).getTime();
      return dateA - dateB;
    });

  return sortedDates[0]?.date ?? fallbackDate ?? null;
}

/**
 * Get the console name from a platform ID
 */
export function getConsoleFromPlatformId(platformId: number): string | null {
  return IGDB_PLATFORM_ID_TO_CONSOLE[platformId] ?? null;
}

// Re-export types for convenience
export type { TransformedGame, IGDBGameResult, IGDBGameUpdateData, PlatformReleaseDate };
