'use server';

import {
  type IGDBGameResult,
  transformIGDBResults,
  selectBestMatch,
  extractUpdateData,
  findPCVersion,
  type TransformedGame,
  type IGDBGameUpdateData,
} from '@/lib/types/igdb';

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

/**
 * Search for games on IGDB
 */
export async function searchGames(query: string, limit = 10): Promise<TransformedGame[]> {
  const results = await igdbFetch<IGDBGameResult[]>(
    'games',
    `
      search "${query}";
      fields name, cover.url, summary, first_release_date, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
      limit ${limit};
    `
  );

  return transformIGDBResults(results);
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

  return selectBestMatch(results, platform);
}

/**
 * Search and find the PC version of a game
 */
export async function findPCGame(title: string): Promise<IGDBGameResult | null> {
  const results = await igdbFetch<IGDBGameResult[]>(
    'games',
    `
      search "${title}";
      fields name, cover.url, summary, first_release_date, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
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

// Re-export types for convenience
export type { TransformedGame, IGDBGameResult, IGDBGameUpdateData };
