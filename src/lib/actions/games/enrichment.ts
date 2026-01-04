'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase/server';
import { findBestMatch, getGameUpdateData, getPlatformReleaseDate } from '@/lib/igdb';
import { hasUpdates } from '@/lib/types/igdb';
import type { Game } from './types';

/**
 * Update all Steam game information from IGDB
 */
export async function updateAllSteamCovers() {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { error: 'Not authenticated' };
  }

  try {
    // Get all Steam games for the user
    const { data: userGames, error: fetchError } = await supabase
      .from('user_games')
      .select(`
        id,
        game_id,
        platform,
        game:games(id, title, cover_url, description, developer, publisher, release_date, genres, steam_appid)
      `)
      .eq('user_id', user.id)
      .eq('platform', 'Steam');

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (!userGames || userGames.length === 0) {
      return {
        success: true,
        message: 'No Steam games found',
        updated: 0,
        skipped: 0,
        failed: 0
      };
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Process each game using the IGDB client
    for (const userGame of userGames) {
      const game = userGame.game as unknown as Game;

      if (!game) {
        skipped++;
        continue;
      }

      try {
        // Use IGDB client to get update data
        const updateData = await getGameUpdateData(game.title, {
          cover_url: game.cover_url,
          description: game.description,
          developer: game.developer,
          publisher: game.publisher,
          release_date: game.release_date,
          genres: game.genres,
        });

        if (!updateData || !hasUpdates(updateData)) {
          skipped++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('games')
          .update(updateData)
          .eq('id', game.id);

        if (updateError) {
          failed++;
        } else {
          updated++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch {
        failed++;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');
    revalidatePath('/game/[id]', 'page');

    return {
      success: true,
      message: `Updated ${updated} games with missing info, skipped ${skipped}, failed ${failed}`,
      updated,
      skipped,
      failed,
      total: userGames.length
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update game information',
    };
  }
}

/**
 * Enrich all games in user's library with IGDB metadata
 * This updates cover art, descriptions, release dates, developers, publishers, and genres
 *
 * @param platformFilter - Optional platform to filter games (e.g., 'Steam', 'PlayStation', 'Xbox')
 * @param consoleFilter - Optional console to filter games (e.g., 'PS5', 'Xbox Series X|S')
 */
export async function enrichAllGamesFromIGDB(platformFilter?: string, consoleFilter?: string) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { error: 'Not authenticated' };
  }

  try {
    // Build query based on filters
    let query = supabase
      .from('user_games')
      .select(`
        id,
        game_id,
        platform,
        locked_fields,
        game:games(id, title, cover_url, description, developer, publisher, release_date, genres)
      `)
      .eq('user_id', user.id);

    // Apply platform filter
    if (platformFilter && consoleFilter) {
      // Exact match for platform with console (e.g., "PlayStation (PS5)")
      query = query.eq('platform', `${platformFilter} (${consoleFilter})`);
    } else if (platformFilter) {
      // Match base platform, including with or without console
      query = query.or(`platform.eq.${platformFilter},platform.like.${platformFilter} (%)`);
    }

    const { data: userGames, error: fetchError } = await query;

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (!userGames || userGames.length === 0) {
      return {
        success: true,
        message: 'No games found in library',
        updated: 0,
        skipped: 0,
        failed: 0,
        total: 0
      };
    }

    // Deduplicate by game_id, but track locked fields across all user_games for that game
    const uniqueGames = new Map<string, { userGame: typeof userGames[0]; lockedFields: Record<string, boolean> }>();
    for (const userGame of userGames) {
      const lockedFields = (userGame.locked_fields as Record<string, boolean>) || {};

      if (!uniqueGames.has(userGame.game_id)) {
        uniqueGames.set(userGame.game_id, { userGame, lockedFields });
      } else {
        // Merge locked fields - if ANY user_game has a field locked, consider it locked
        const existing = uniqueGames.get(userGame.game_id)!;
        for (const [key, value] of Object.entries(lockedFields)) {
          if (value) {
            existing.lockedFields[key] = true;
          }
        }
      }
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Process each unique game
    for (const { userGame, lockedFields } of uniqueGames.values()) {
      const game = userGame.game as unknown as Game;

      if (!game) {
        skipped++;
        continue;
      }

      // Check if all enrichable fields are locked
      const allFieldsLocked =
        lockedFields['cover'] &&
        lockedFields['description'] &&
        lockedFields['developer'] &&
        lockedFields['releaseDate'] &&
        lockedFields['genres'];

      if (allFieldsLocked) {
        skipped++;
        continue;
      }

      try {
        // Pass locked fields info to pretend existing data exists for locked fields
        // This prevents getGameUpdateData from trying to update them
        const updateData = await getGameUpdateData(game.title, {
          cover_url: lockedFields['cover'] ? 'locked' : game.cover_url,
          description: lockedFields['description'] ? 'locked' : game.description,
          developer: lockedFields['developer'] ? 'locked' : game.developer,
          publisher: game.publisher,
          release_date: lockedFields['releaseDate'] ? 'locked' : game.release_date,
          genres: lockedFields['genres'] ? ['locked'] : game.genres,
        });

        if (!updateData || !hasUpdates(updateData)) {
          skipped++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('games')
          .update(updateData)
          .eq('id', game.id);

        if (updateError) {
          failed++;
        } else {
          updated++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch {
        failed++;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');
    revalidatePath('/backlog');
    revalidatePath('/game/[id]', 'page');

    return {
      success: true,
      message: `Enriched ${updated} games from IGDB (skipped ${skipped}, failed ${failed})`,
      updated,
      skipped,
      failed,
      total: uniqueGames.size
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to enrich games from IGDB',
    };
  }
}

/**
 * Update game cover art from IGDB search
 */
export async function updateGameCoverFromIGDB(gameId: string, gameTitle: string, userPlatform?: string) {
  let supabase;
  try {
    ({ supabase } = await requireAuth());
  } catch {
    return { error: 'Not authenticated' };
  }

  try {
    // Use IGDB client to find best match
    const selectedResult = await findBestMatch(gameTitle, userPlatform);

    if (!selectedResult?.cover) {
      return { error: 'No cover art found for this game' };
    }

    // Update the game's cover URL
    const { error: updateError } = await supabase
      .from('games')
      .update({
        cover_url: selectedResult.cover,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return {
      success: true,
      coverUrl: selectedResult.cover,
      message: `Cover updated from IGDB (${selectedResult.platform})`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update cover art',
    };
  }
}

/**
 * Fetch metadata from IGDB for a game title (without saving)
 * Returns the data so user can review before applying
 */
export async function fetchIGDBMetadata(gameTitle: string, userPlatform?: string) {
  try {
    await requireAuth();
  } catch {
    return { error: 'Not authenticated' };
  }

  try {
    const result = await findBestMatch(gameTitle, userPlatform);

    if (!result) {
      return { error: 'No game found on IGDB' };
    }

    return {
      success: true,
      data: {
        title: result.name,
        coverUrl: result.cover,
        description: result.summary,
        developer: result.developer,
        releaseDate: result.releaseDate,
        genres: result.genres,
        platform: result.platform,
        releaseDates: result.releaseDates,
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch from IGDB',
    };
  }
}

/**
 * Refresh release dates for all games in user's library from IGDB
 * Updates user_games.release_date with platform-specific release dates
 *
 * @param platformFilter - Optional platform to filter games (e.g., 'Steam', 'PlayStation', 'Xbox')
 */
export async function refreshReleaseDatesFromIGDB(platformFilter?: string) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { error: 'Not authenticated' };
  }

  try {
    // Build query to fetch all user games with their game titles
    let query = supabase
      .from('user_games')
      .select(`
        id,
        game_id,
        platform,
        release_date,
        locked_fields,
        game:games(id, title, release_date)
      `)
      .eq('user_id', user.id);

    // Apply platform filter if provided
    if (platformFilter) {
      query = query.or(`platform.eq.${platformFilter},platform.like.${platformFilter} (%)`);
    }

    const { data: userGames, error: fetchError } = await query;

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (!userGames || userGames.length === 0) {
      return {
        success: true,
        message: 'No games found in library',
        updated: 0,
        skipped: 0,
        failed: 0,
        total: 0
      };
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Group games by title to minimize IGDB API calls
    const gamesByTitle = new Map<string, typeof userGames>();
    for (const userGame of userGames) {
      const game = userGame.game as unknown as Game;
      if (!game?.title) continue;

      const existing = gamesByTitle.get(game.title) ?? [];
      existing.push(userGame);
      gamesByTitle.set(game.title, existing);
    }

    // Process each unique game title
    for (const [title, games] of gamesByTitle) {
      try {
        // Find the best matching game from IGDB
        const igdbGame = await findBestMatch(title);

        if (!igdbGame) {
          skipped += games.length;
          continue;
        }

        const releaseDates = igdbGame.releaseDates ?? [];
        const fallbackDate = igdbGame.releaseDate;

        // Update each user_game with its platform-specific release date
        for (const userGame of games) {
          // Check if releaseDate is locked - skip if so
          const lockedFields = (userGame.locked_fields as Record<string, boolean>) || {};
          if (lockedFields['releaseDate']) {
            skipped++;
            continue;
          }

          // Extract console from platform (e.g., "PlayStation (PS5)" -> "PS5")
          const platformMatch = userGame.platform.match(/^(.+?)\s*(?:\((.+)\))?$/);
          const basePlatform = platformMatch?.[1] ?? userGame.platform;
          const consoleName = platformMatch?.[2];

          const platformDate = getPlatformReleaseDate(
            releaseDates,
            basePlatform,
            consoleName,
            fallbackDate
          );

          if (platformDate) {
            const { error: updateError } = await supabase
              .from('user_games')
              .update({
                release_date: platformDate,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userGame.id);

            if (updateError) {
              failed++;
            } else {
              updated++;
            }
          } else {
            skipped++;
          }
        }

        // Add a small delay to avoid IGDB rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch {
        failed += games.length;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');
    revalidatePath('/backlog');
    revalidatePath('/game/[id]', 'page');

    return {
      success: true,
      message: `Updated release dates for ${updated} games (skipped ${skipped}, failed ${failed})`,
      updated,
      skipped,
      failed,
      total: userGames.length
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to refresh release dates from IGDB',
    };
  }
}
