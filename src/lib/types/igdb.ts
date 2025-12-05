/**
 * IGDB API Response Types
 * These types represent the raw responses from the IGDB API
 */

export interface IGDBCover {
  url: string;
}

export interface IGDBPlatform {
  name: string;
}

export interface IGDBGenre {
  name: string;
}

export interface IGDBCompany {
  name: string;
}

export interface IGDBInvolvedCompany {
  company: IGDBCompany;
  developer?: boolean;
  publisher?: boolean;
}

/** Raw IGDB API game result */
export interface IGDBGameResult {
  id: number;
  name: string;
  cover?: IGDBCover;
  summary?: string;
  first_release_date?: number;
  genres?: IGDBGenre[];
  platforms?: IGDBPlatform[];
  involved_companies?: IGDBInvolvedCompany[];
}

/**
 * Transformed game data for internal use (legacy name preserved for compatibility)
 * This is the format we use after processing IGDB results
 */
export interface IGDBGame {
  id: string;
  igdbId: number;
  name: string;
  cover: string | null;
  releaseDate: string | null;
  summary: string | null;
  genres: string[];
  platform: string;
  platforms: string[];
  developer: string | null;
}

/** Alias for clarity in new code */
export type TransformedGame = IGDBGame;

/**
 * Partial game data for update operations
 */
export interface IGDBGameUpdateData {
  cover_url?: string;
  description?: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  genres?: string[];
  updated_at: string;
}

/**
 * Platform mapping from user platform names to IGDB platform names
 */
export const IGDB_PLATFORM_MAP: Record<string, string[]> = {
  'Steam': ['PC (Microsoft Windows)', 'PC'],
  'Epic Games': ['PC (Microsoft Windows)', 'PC'],
  'GOG': ['PC (Microsoft Windows)', 'PC'],
  'Xbox Game Pass': ['PC (Microsoft Windows)', 'PC'],
  'EA App': ['PC (Microsoft Windows)', 'PC'],
  'Windows': ['PC (Microsoft Windows)', 'PC'],
  'PlayStation': ['PlayStation', 'PS5', 'PS4', 'PS3', 'PS2', 'PS1'],
  'Xbox': ['Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Xbox'],
  'Nintendo': ['Nintendo Switch', 'Wii U', 'Wii', 'Nintendo 3DS', 'Nintendo DS'],
  'Physical Copy': [],
};

/**
 * Transform IGDB game results into our internal format
 * Creates separate entries for each platform a game is available on
 */
export function transformIGDBResults(games: IGDBGameResult[]): TransformedGame[] {
  const transformedGames: TransformedGame[] = [];

  games.forEach((game) => {
    const platforms = game.platforms?.map((p) => p.name) || ['Unknown Platform'];

    platforms.forEach((platform) => {
      transformedGames.push({
        id: `${game.id}-${platform}`,
        igdbId: game.id,
        name: game.name,
        cover: game.cover?.url
          ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
          : null,
        releaseDate: game.first_release_date
          ? new Date(game.first_release_date * 1000).toISOString().split('T')[0]
          : null,
        summary: game.summary || null,
        genres: game.genres?.map((g) => g.name) || [],
        platform,
        platforms,
        developer:
          game.involved_companies?.find((ic) => ic.developer)?.company?.name ||
          game.involved_companies?.[0]?.company?.name ||
          null,
      });
    });
  });

  return transformedGames;
}

/**
 * Find the best matching game result for a user's platform
 */
export function selectBestMatch(
  transformedGames: TransformedGame[],
  userPlatform?: string
): TransformedGame | null {
  if (transformedGames.length === 0) return null;

  // Extract base platform (e.g., "PlayStation (PS3)" -> "PlayStation")
  const basePlatform = userPlatform?.split('(')[0].trim() || '';
  const preferredPlatforms = IGDB_PLATFORM_MAP[basePlatform] || [];

  let selectedResult = transformedGames[0];

  // Try to find a result matching the user's platform
  if (preferredPlatforms.length > 0) {
    const platformMatch = transformedGames.find((result) =>
      preferredPlatforms.some(
        (platform) =>
          result.platform?.toLowerCase().includes(platform.toLowerCase()) ||
          result.platforms?.some((p) => p.toLowerCase().includes(platform.toLowerCase()))
      )
    );

    if (platformMatch) {
      selectedResult = platformMatch;
    }
  }

  // Find first result with a cover if current selection has none
  if (!selectedResult?.cover) {
    const resultWithCover = transformedGames.find((result) => result.cover);
    if (resultWithCover) {
      selectedResult = resultWithCover;
    }
  }

  return selectedResult;
}

/** Game data shape for update operations */
interface ExistingGameData {
  cover_url?: string | null;
  description?: string | null;
  developer?: string | null;
  publisher?: string | null;
  release_date?: string | null;
  genres?: string[] | null;
}

/**
 * Extract update data from IGDB result for games that need metadata enrichment
 */
export function extractUpdateData(
  igdbGame: IGDBGameResult,
  existingGame: ExistingGameData
): IGDBGameUpdateData {
  const updateData: IGDBGameUpdateData = {
    updated_at: new Date().toISOString(),
  };

  // Update cover if missing or from Steam CDN
  if (!existingGame.cover_url || existingGame.cover_url.includes('steamstatic.com')) {
    if (igdbGame.cover?.url) {
      updateData.cover_url = `https:${igdbGame.cover.url.replace('t_thumb', 't_cover_big')}`;
    }
  }

  // Update description if missing
  if (!existingGame.description && igdbGame.summary) {
    updateData.description = igdbGame.summary;
  }

  // Update developer if missing
  if (!existingGame.developer) {
    const developer = igdbGame.involved_companies?.find((ic) => ic.developer)?.company?.name;
    if (developer) {
      updateData.developer = developer;
    }
  }

  // Update publisher if missing
  if (!existingGame.publisher) {
    const publisher = igdbGame.involved_companies?.find((ic) => ic.publisher)?.company?.name;
    if (publisher) {
      updateData.publisher = publisher;
    }
  }

  // Update release date if missing
  if (!existingGame.release_date && igdbGame.first_release_date) {
    updateData.release_date = new Date(igdbGame.first_release_date * 1000)
      .toISOString()
      .split('T')[0];
  }

  // Update genres if missing
  if ((!existingGame.genres || existingGame.genres.length === 0) && igdbGame.genres) {
    updateData.genres = igdbGame.genres.map((g) => g.name);
  }

  return updateData;
}

/**
 * Check if update data has meaningful changes beyond just updated_at
 */
export function hasUpdates(updateData: IGDBGameUpdateData): boolean {
  return Object.keys(updateData).length > 1;
}

/**
 * Find PC version from IGDB results
 */
export function findPCVersion(games: IGDBGameResult[]): IGDBGameResult | null {
  for (const game of games) {
    const platforms = game.platforms?.map((p) => p.name) || [];
    if (platforms.some((p) => p.toLowerCase().includes('pc') || p.toLowerCase().includes('windows'))) {
      return game;
    }
  }
  return games[0] || null;
}
