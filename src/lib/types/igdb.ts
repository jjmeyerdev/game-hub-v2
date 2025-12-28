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

/** IGDB platform-specific release date */
export interface IGDBReleaseDate {
  platform: number;  // IGDB platform ID
  date?: number;     // Unix timestamp
  human?: string;    // Human-readable date string
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
  release_dates?: IGDBReleaseDate[];
  // Popularity fields for ranking
  total_rating?: number;        // Average of user rating and aggregated rating (0-100)
  total_rating_count?: number;  // Number of ratings
  follows?: number;             // Number of followers
}

/** Platform-specific release date (transformed) */
export interface PlatformReleaseDate {
  platformId: number;
  date: string | null;  // ISO date string (YYYY-MM-DD)
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
  releaseDate: string | null;  // First release date (global)
  releaseDates: PlatformReleaseDate[];  // Platform-specific release dates
  summary: string | null;
  genres: string[];
  platform: string;
  platforms: string[];
  developer: string | null;
  // Popularity for ranking (higher = more popular)
  popularity: number;
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
 * Calculate a popularity score from IGDB rating data
 * Combines rating count with follows for a weighted score
 */
function calculatePopularity(game: IGDBGameResult): number {
  const ratingCount = game.total_rating_count ?? 0;
  const follows = game.follows ?? 0;
  // Weight rating count heavily as it's the best indicator of a well-known game
  // Follows adds additional signal
  return ratingCount * 10 + follows;
}

/**
 * Transform IGDB game results into our internal format
 * Creates separate entries for each platform a game is available on
 */
export function transformIGDBResults(games: IGDBGameResult[]): TransformedGame[] {
  const transformedGames: TransformedGame[] = [];

  games.forEach((game) => {
    const platforms = game.platforms?.map((p) => p.name) || ['Unknown Platform'];
    const popularity = calculatePopularity(game);

    // Transform release dates array (use UTC to avoid timezone shifts)
    const releaseDates: PlatformReleaseDate[] = (game.release_dates ?? [])
      .filter((rd) => rd.date != null)
      .map((rd) => {
        if (!rd.date) return { platformId: rd.platform, date: null };
        const d = new Date(rd.date * 1000);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return { platformId: rd.platform, date: `${year}-${month}-${day}` };
      });

    platforms.forEach((platform) => {
      transformedGames.push({
        id: `${game.id}-${platform}`,
        igdbId: game.id,
        name: game.name,
        cover: game.cover?.url
          ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
          : null,
        releaseDate: game.first_release_date
          ? (() => {
              const d = new Date(game.first_release_date * 1000);
              return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
            })()
          : null,
        releaseDates,
        summary: game.summary || null,
        genres: game.genres?.map((g) => g.name) || [],
        platform,
        platforms,
        developer:
          game.involved_companies?.find((ic) => ic.developer)?.company?.name ||
          game.involved_companies?.[0]?.company?.name ||
          null,
        popularity,
      });
    });
  });

  return transformedGames;
}

/**
 * Find the best matching game result for a user's platform
 * Prioritizes exact title matches and correct platform to avoid selecting remakes/wrong versions
 */
export function selectBestMatch(
  transformedGames: TransformedGame[],
  userPlatform?: string,
  searchTitle?: string
): TransformedGame | null {
  if (transformedGames.length === 0) return null;

  // Extract base platform and console (e.g., "PlayStation (PS3)" -> "PlayStation", "PS3")
  const platformMatch = userPlatform?.match(/^(.+?)\s*(?:\((.+)\))?$/);
  const basePlatform = platformMatch?.[1]?.trim() || '';
  const userConsole = platformMatch?.[2]?.trim() || '';
  const preferredPlatforms = IGDB_PLATFORM_MAP[basePlatform] || [];

  // Legacy console platforms that indicate older games
  const legacyConsoles = ['PS3', 'PS2', 'PS1', 'PSP', 'PS Vita', 'Xbox 360', 'Xbox', 'Wii', 'Wii U', 'Nintendo DS', 'Nintendo 3DS'];
  const isLegacyConsole = legacyConsoles.includes(userConsole);

  // Normalize title for comparison
  const normalizeTitle = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]/g, '');

  const searchTitleNorm = searchTitle ? normalizeTitle(searchTitle) : null;

  // Score each result based on title match, platform, and era
  const scoredResults = transformedGames.map((result) => {
    let score = 0;
    const resultTitleNorm = normalizeTitle(result.name);

    // Exact title match (highest priority)
    if (searchTitleNorm && resultTitleNorm === searchTitleNorm) {
      score += 1000;
    }
    // Title starts with search term (e.g., searching "Marvel's Avengers" matches "Marvel's Avengers Deluxe")
    else if (searchTitleNorm && resultTitleNorm.startsWith(searchTitleNorm)) {
      const extraLength = resultTitleNorm.length - searchTitleNorm.length;
      score += 500 - extraLength * 10;
    }
    // Search term starts with result title (e.g., searching "Marvel's Avengers 2020" matches "Marvel's Avengers")
    else if (searchTitleNorm && searchTitleNorm.startsWith(resultTitleNorm)) {
      const extraLength = searchTitleNorm.length - resultTitleNorm.length;
      score += 400 - extraLength * 10;
    }
    // Search term is contained in result - but PENALIZE if there's a prefix (like "LEGO" before the search term)
    else if (searchTitleNorm && resultTitleNorm.includes(searchTitleNorm)) {
      const prefixIndex = resultTitleNorm.indexOf(searchTitleNorm);
      if (prefixIndex === 0) {
        // No prefix - this is a suffix case (acceptable)
        score += 100;
      } else {
        // Has a prefix (like "LEGO Marvel's Avengers" when searching "Marvel's Avengers")
        // This is likely a DIFFERENT game, apply heavy penalty
        score -= 200;
      }
    }

    // Check if game has the user's specific console
    const gameHasUserConsole = userConsole && result.platforms?.some((p) => {
      const pLower = p.toLowerCase();
      const consoleLower = userConsole.toLowerCase();
      return pLower.includes(consoleLower) ||
             (consoleLower === 'ps3' && pLower.includes('playstation 3')) ||
             (consoleLower === 'ps4' && pLower.includes('playstation 4')) ||
             (consoleLower === 'ps5' && pLower.includes('playstation 5')) ||
             (consoleLower === 'xbox 360' && pLower.includes('xbox 360')) ||
             (consoleLower === 'xbox one' && pLower.includes('xbox one')) ||
             (consoleLower === 'xbox series x|s' && (pLower.includes('xbox series') || pLower.includes('series x')));
    });

    // Strong bonus if game supports user's specific console
    if (gameHasUserConsole) {
      score += 500;
    }
    // Penalty if user has legacy console but game doesn't support it (likely a remake)
    else if (isLegacyConsole && userConsole) {
      score -= 300;
    }

    // Platform match bonus (base platform like PlayStation, Xbox, etc.)
    if (preferredPlatforms.length > 0) {
      const hasPlatformMatch = preferredPlatforms.some(
        (platform) =>
          result.platform?.toLowerCase().includes(platform.toLowerCase()) ||
          result.platforms?.some((p) => p.toLowerCase().includes(platform.toLowerCase()))
      );
      if (hasPlatformMatch) {
        score += 50;
      }
    }

    // Era-based scoring
    if (result.releaseDate) {
      const releaseYear = new Date(result.releaseDate).getFullYear();

      if (isLegacyConsole) {
        // For legacy consoles, prefer older release dates (penalize recent games that are likely remakes)
        if (releaseYear >= 2020) {
          score -= 200;
        } else if (releaseYear <= 2015) {
          score += 100;
        }
      } else if (!userConsole || ['PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch'].includes(userConsole)) {
        // For modern platforms or PC (no console), prefer newer games when titles match exactly
        // This handles cases like SimCity 1989 vs SimCity 2013
        if (searchTitleNorm && resultTitleNorm === searchTitleNorm) {
          // Bonus for more recent releases (normalized to 0-100 range based on year)
          const yearBonus = Math.min(100, Math.max(0, (releaseYear - 1980) * 2));
          score += yearBonus;
        }
      }
    }

    // Has cover bonus
    if (result.cover) {
      score += 10;
    }

    // Popularity bonus - helps distinguish between games with identical titles
    // Normalized to 0-200 range to act as a strong tiebreaker
    // Popular games like "Limbo" by Playdead will have much higher scores than obscure games
    const popularityBonus = Math.min(200, Math.floor(result.popularity / 100));
    score += popularityBonus;

    return { result, score };
  });

  // Sort by score descending and return the best match
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults[0]?.result ?? transformedGames[0];
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

  // Update release date if missing (use UTC to avoid timezone shifts)
  if (!existingGame.release_date && igdbGame.first_release_date) {
    const d = new Date(igdbGame.first_release_date * 1000);
    updateData.release_date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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
