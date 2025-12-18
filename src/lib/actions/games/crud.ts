'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase/server';
import type { Game, OwnershipStatus, LockedFields } from './types';

/**
 * Get all games in the user's library
 * @param includeHidden - Whether to include hidden games (default: false)
 */
export async function getUserGames(includeHidden = false) {
  try {
    const { user, supabase } = await requireAuth();

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

    return { data, error: error?.message ?? null };
  } catch {
    return { data: null, error: 'Not authenticated' };
  }
}

/**
 * Get now playing games (status = 'playing')
 * Includes hidden games (shown with blur effect in UI)
 */
export async function getNowPlayingGames() {
  try {
    const { user, supabase } = await requireAuth();

    const { data, error } = await supabase
      .from('user_games')
      .select(`
        *,
        game:games(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'playing')
      .order('last_played_at', { ascending: false, nullsFirst: false })
      .limit(5);

    return { data, error: error?.message ?? null };
  } catch {
    return { data: null, error: 'Not authenticated' };
  }
}

/**
 * Add a game to user's library
 */
export async function addGameToLibrary(formData: FormData) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { error: 'Not authenticated' };
  }

  const title = formData.get('title') as string;
  const platform = formData.get('platform') as string;
  const status = formData.get('status') as string;
  const priority = formData.get('priority') as string;
  const coverUrl = formData.get('coverUrl') as string;
  const description = formData.get('description') as string;
  const developer = formData.get('developer') as string;
  const publisher = formData.get('publisher') as string;
  const releaseDate = formData.get('releaseDate') as string;
  const genresJson = formData.get('genres') as string;
  const genres: string[] = genresJson ? JSON.parse(genresJson) : [];

  // First, create or find the game in the games table
  const { data: existingGame } = await supabase
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
        description: description || null,
        cover_url: coverUrl || null,
        developer: developer || null,
        publisher: publisher || null,
        release_date: releaseDate || null,
        genres: genres.length > 0 ? genres : null,
        platforms: [platform],
      })
      .select()
      .single();

    if (createError) {
      return { error: createError.message };
    }

    gameId = newGame.id;
  } else {
    // Update existing game with new metadata if provided
    const updateData: Record<string, unknown> = {};
    if (description) updateData.description = description;
    if (coverUrl) updateData.cover_url = coverUrl;
    if (developer) updateData.developer = developer;
    if (publisher) updateData.publisher = publisher;
    if (releaseDate) updateData.release_date = releaseDate;
    if (genres.length > 0) updateData.genres = genres;

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('games')
        .update(updateData)
        .eq('id', existingGame.id);
    }
  }

  // Get ownership status from form (defaults to 'owned')
  const ownershipStatus = (formData.get('ownership_status') as OwnershipStatus) || 'owned';
  const isPhysical = formData.get('is_physical') === 'true';
  const isHidden = formData.get('hidden') === 'true';
  const tagsJson = formData.get('tags') as string;
  const tags: string[] = tagsJson ? JSON.parse(tagsJson) : [];

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
    ownership_status: ownershipStatus,
    is_physical: isPhysical,
    hidden: isHidden,
    tags: tags.length > 0 ? tags : null,
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
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
  const publisher = formData.get('publisher') as string;
  const releaseDate = formData.get('releaseDate') as string;
  const genresJson = formData.get('genres') as string;
  const genres: string[] = genresJson ? JSON.parse(genresJson) : [];
  const playtimeHours = formData.get('playtimeHours') as string;
  const completionPercentage = formData.get('completionPercentage') as string;
  const personalRating = formData.get('personalRating') as string;
  const notes = formData.get('notes') as string;
  const hidden = formData.get('hidden') === 'true';
  const ownershipStatus = (formData.get('ownership_status') as OwnershipStatus) || 'owned';
  const isPhysical = formData.get('is_physical') === 'true';
  const tagsJson = formData.get('tags') as string;
  const tags: string[] = tagsJson ? JSON.parse(tagsJson) : [];
  const lockedFieldsJson = formData.get('lockedFields') as string;
  const lockedFields: LockedFields = lockedFieldsJson ? JSON.parse(lockedFieldsJson) : {};

  // Update the game info in games table
  const { error: gameError } = await supabase
    .from('games')
    .update({
      title,
      description: description || null,
      cover_url: coverUrl || null,
      developer: developer || null,
      publisher: publisher || null,
      release_date: releaseDate || null,
      genres: genres.length > 0 ? genres : null,
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
      tags: tags.length > 0 ? tags : null,
      locked_fields: Object.keys(lockedFields).length > 0 ? lockedFields : null,
      hidden,
      ownership_status: ownershipStatus,
      is_physical: isPhysical,
      last_played_at: status === 'playing' ? new Date().toISOString() : undefined,
    })
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/library');
  return { success: true };
}

/**
 * Delete a game from user's library
 */
export async function deleteUserGame(userGameId: string) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
