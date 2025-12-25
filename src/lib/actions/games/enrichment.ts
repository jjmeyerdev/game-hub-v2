'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase/server';
import { findBestMatch, getGameUpdateData } from '@/lib/igdb';
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

    // Deduplicate by game_id to avoid enriching the same game multiple times
    const uniqueGames = new Map<string, typeof userGames[0]>();
    for (const userGame of userGames) {
      if (!uniqueGames.has(userGame.game_id)) {
        uniqueGames.set(userGame.game_id, userGame);
      }
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Process each unique game
    for (const userGame of uniqueGames.values()) {
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
      }
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch from IGDB',
    };
  }
}
