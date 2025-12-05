'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  searchGames as igdbSearch,
  findBestMatch,
  getGameUpdateData,
} from '@/lib/igdb';
import { hasUpdates } from '@/lib/types/igdb';

export interface Game {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[] | null;
  platforms: string[] | null;
  steam_appid: number | null;
  psn_communication_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  platform: string;
  status: string;
  priority: string;
  completion_percentage: number;
  playtime_hours: number;
  last_played_at: string | null;
  personal_rating: number | null;
  notes: string | null;
  tags: string[] | null;
  achievements_earned: number;
  achievements_total: number;
  hidden: boolean;
  created_at: string;
  updated_at: string;
  game?: Game;
}

/**
 * Get all games in the user's library
 * @param includeHidden - Whether to include hidden games (default: false)
 */
export async function getUserGames(includeHidden = false) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  let query = supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id);

  // Filter out hidden games unless explicitly requested
  if (!includeHidden) {
    query = query.eq('hidden', false);
  }

  const { data, error } = await query.order('last_played_at', { ascending: false, nullsFirst: false });

  return { data, error };
}

/**
 * Get now playing games (status = 'playing')
 * Hidden games are excluded from now playing
 */
export async function getNowPlayingGames() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'playing')
    .eq('hidden', false)
    .order('last_played_at', { ascending: false, nullsFirst: false })
    .limit(5);

  return { data, error };
}

/**
 * Add a game to user's library
 */
export async function addGameToLibrary(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const title = formData.get('title') as string;
  const platform = formData.get('platform') as string;
  const status = formData.get('status') as string;
  const priority = formData.get('priority') as string;
  const coverUrl = formData.get('coverUrl') as string;
  const description = formData.get('description') as string;
  const developer = formData.get('developer') as string;

  // First, create or find the game in the games table
  const { data: existingGame, error: searchError } = await supabase
    .from('games')
    .select('*')
    .eq('title', title)
    .single();

  let gameId = existingGame?.id;

  if (!existingGame) {
    // Create new game entry
    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert({
        title,
        description,
        cover_url: coverUrl || null,
        developer: developer || null,
        platforms: [platform],
      })
      .select()
      .single();

    if (createError) {
      return { error: createError.message };
    }

    gameId = newGame.id;
  }

  // Add to user's library
  const { error: userGameError } = await supabase.from('user_games').insert({
    user_id: user.id,
    game_id: gameId,
    platform,
    status: status || 'unplayed',
    priority: priority || 'medium',
    completion_percentage: 0,
    playtime_hours: 0,
    last_played_at: status === 'playing' ? new Date().toISOString() : null,
  });

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Update a game in user's library
 */
export async function updateUserGame(
  userGameId: string,
  updates: {
    status?: string;
    priority?: string;
    completion_percentage?: number;
    playtime_hours?: number;
    personal_rating?: number;
    notes?: string;
    hidden?: boolean;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('user_games')
    .update(updates)
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Edit a game - updates both the game info and user game entry
 */
export async function editUserGame(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const userGameId = formData.get('userGameId') as string;
  const gameId = formData.get('gameId') as string;
  const title = formData.get('title') as string;
  const platform = formData.get('platform') as string;
  const status = formData.get('status') as string;
  const priority = formData.get('priority') as string;
  const coverUrl = formData.get('coverUrl') as string;
  const description = formData.get('description') as string;
  const developer = formData.get('developer') as string;
  const playtimeHours = formData.get('playtimeHours') as string;
  const completionPercentage = formData.get('completionPercentage') as string;
  const personalRating = formData.get('personalRating') as string;
  const notes = formData.get('notes') as string;
  const hidden = formData.get('hidden') === 'true';

  // Update the game info in games table
  const { error: gameError } = await supabase
    .from('games')
    .update({
      title,
      description: description || null,
      cover_url: coverUrl || null,
      developer: developer || null,
    })
    .eq('id', gameId);

  if (gameError) {
    return { error: gameError.message };
  }

  // Update user_games entry
  const { error: userGameError } = await supabase
    .from('user_games')
    .update({
      platform,
      status,
      priority: priority || 'medium',
      playtime_hours: playtimeHours ? parseFloat(playtimeHours) : 0,
      completion_percentage: completionPercentage ? parseInt(completionPercentage) : 0,
      personal_rating: personalRating ? parseInt(personalRating) : null,
      notes: notes || null,
      hidden,
      last_played_at: status === 'playing' ? new Date().toISOString() : undefined,
    })
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a game from user's library
 */
export async function deleteUserGame(userGameId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Get user stats
 */
export async function getUserStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalGames: 0,
      hoursPlayed: 0,
      achievements: 0,
      completionRate: 0,
    };
  }

  const { data: games } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', user.id);

  if (!games) {
    return {
      totalGames: 0,
      hoursPlayed: 0,
      achievements: 0,
      completionRate: 0,
    };
  }

  const totalGames = games.length;
  const hoursPlayed = games.reduce((sum, g) => sum + (g.playtime_hours || 0), 0);
  const achievements = games.reduce((sum, g) => sum + (g.achievements_earned || 0), 0);
  const completedGames = games.filter(
    (g) => g.status === 'completed' || g.status === '100_completed'
  ).length;
  const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  return {
    totalGames,
    hoursPlayed: Math.round(hoursPlayed),
    achievements,
    completionRate,
  };
}

/**
 * Update all Steam game information from IGDB
 */
export async function updateAllSteamCovers() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
 * Update game cover art from IGDB search
 */
export async function updateGameCoverFromIGDB(gameId: string, gameTitle: string, userPlatform?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
