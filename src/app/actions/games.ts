'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  searchGames as igdbSearch,
  findBestMatch,
  getGameUpdateData,
} from '@/lib/igdb';
import { hasUpdates } from '@/lib/types/igdb';
import { getOwnedGames, getPlayerAchievements, getGameSchema, getSteamLibraryCapsuleUrl } from '@/lib/steam';
import { getGameLibrary, refreshAccessToken, calculateTotalTrophies, calculateDefinedTrophies, normalizePsnPlatform } from '@/lib/psn';
import { getMyTitleHistory, getMyAchievements, normalizeXboxPlatform } from '@/lib/xbox/client';

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
  xbox_title_id: string | null;
  epic_catalog_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export type OwnershipStatus = 'owned' | 'wishlist' | 'unowned';

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
  owned: boolean; // Deprecated, use ownership_status
  ownership_status: OwnershipStatus;
  is_physical: boolean;
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
  const publisher = formData.get('publisher') as string;
  const releaseDate = formData.get('releaseDate') as string;
  const genresJson = formData.get('genres') as string;
  const genres: string[] = genresJson ? JSON.parse(genresJson) : [];

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
  }

  // Get ownership status from form (defaults to 'owned')
  const ownershipStatus = (formData.get('ownership_status') as OwnershipStatus) || 'owned';
  const isPhysical = formData.get('is_physical') === 'true';

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
 * Enrich all games in user's library with IGDB metadata
 * This updates cover art, descriptions, release dates, developers, publishers, and genres
 */
export async function enrichAllGamesFromIGDB() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Get all games for the user
    const { data: userGames, error: fetchError } = await supabase
      .from('user_games')
      .select(`
        id,
        game_id,
        platform,
        game:games(id, title, cover_url, description, developer, publisher, release_date, genres)
      `)
      .eq('user_id', user.id);

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
 * Duplicate game group interface
 */
export interface DuplicateGroup {
  normalizedTitle: string;
  games: UserGame[];
  matchType: 'exact' | 'similar';
  confidence: number;
}

/**
 * Find duplicate games in user's library
 * Uses exact title matching and fuzzy similarity detection
 */
export async function findDuplicateGames(): Promise<{ data: DuplicateGroup[] | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data: userGames, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  if (!userGames || userGames.length === 0) {
    return { data: [], error: null };
  }

  // Normalize title for comparison
  const normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[:\-–—]/g, ' ')
      .replace(/[''""]/g, '')
      .replace(/\s+(edition|remaster|remastered|goty|game of the year|definitive|ultimate|complete|deluxe|enhanced|hd|4k)\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Calculate similarity between two strings (Levenshtein-based)
  const calculateSimilarity = (a: string, b: string): number => {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    // Quick check for substring match
    if (longer.includes(shorter) || shorter.includes(longer)) {
      return shorter.length / longer.length + 0.3;
    }

    // Simple word overlap for gaming titles
    const wordsA = a.split(' ').filter(w => w.length > 2);
    const wordsB = b.split(' ').filter(w => w.length > 2);
    const commonWords = wordsA.filter(w => wordsB.includes(w));
    const wordSimilarity = commonWords.length / Math.max(wordsA.length, wordsB.length);

    return wordSimilarity;
  };

  // Group by normalized title (exact matches)
  const titleGroups = new Map<string, UserGame[]>();

  for (const userGame of userGames) {
    const title = (userGame.game as Game)?.title || '';
    const normalized = normalizeTitle(title);

    if (!titleGroups.has(normalized)) {
      titleGroups.set(normalized, []);
    }
    titleGroups.get(normalized)!.push(userGame as UserGame);
  }

  // Find duplicates (groups with more than 1 game)
  const duplicates: DuplicateGroup[] = [];

  // Exact matches
  for (const [normalizedTitle, games] of titleGroups) {
    if (games.length > 1) {
      duplicates.push({
        normalizedTitle,
        games,
        matchType: 'exact',
        confidence: 100,
      });
    }
  }

  // Similar title detection (cross-compare single entries)
  const singleEntries = Array.from(titleGroups.entries())
    .filter(([_, games]) => games.length === 1)
    .map(([title, games]) => ({ title, game: games[0] }));

  const usedInSimilar = new Set<string>();

  for (let i = 0; i < singleEntries.length; i++) {
    if (usedInSimilar.has(singleEntries[i].title)) continue;

    const similarGroup: UserGame[] = [singleEntries[i].game];

    for (let j = i + 1; j < singleEntries.length; j++) {
      if (usedInSimilar.has(singleEntries[j].title)) continue;

      const similarity = calculateSimilarity(singleEntries[i].title, singleEntries[j].title);

      if (similarity >= 0.7) {
        similarGroup.push(singleEntries[j].game);
        usedInSimilar.add(singleEntries[j].title);
      }
    }

    if (similarGroup.length > 1) {
      usedInSimilar.add(singleEntries[i].title);
      duplicates.push({
        normalizedTitle: singleEntries[i].title,
        games: similarGroup,
        matchType: 'similar',
        confidence: 70,
      });
    }
  }

  // Sort by confidence (exact first) then by number of duplicates
  duplicates.sort((a, b) => {
    if (a.matchType !== b.matchType) {
      return a.matchType === 'exact' ? -1 : 1;
    }
    return b.games.length - a.games.length;
  });

  return { data: duplicates, error: null };
}

/**
 * Merge duplicate games - keeps the primary and deletes the others
 * Transfers playtime, achievements, and other stats to the primary
 */
export async function mergeDuplicateGames(primaryId: string, duplicateIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Fetch all games to merge stats
  const { data: games, error: fetchError } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', user.id)
    .in('id', [primaryId, ...duplicateIds]);

  if (fetchError || !games) {
    return { error: fetchError?.message || 'Failed to fetch games' };
  }

  const primary = games.find(g => g.id === primaryId);
  const duplicates = games.filter(g => g.id !== primaryId);

  if (!primary) {
    return { error: 'Primary game not found' };
  }

  // Merge stats: sum playtime, max achievements, keep highest completion
  let totalPlaytime = primary.playtime_hours || 0;
  let maxAchievementsEarned = primary.achievements_earned || 0;
  let maxAchievementsTotal = primary.achievements_total || 0;
  let maxCompletion = primary.completion_percentage || 0;
  let latestPlayed = primary.last_played_at;

  for (const dup of duplicates) {
    totalPlaytime += dup.playtime_hours || 0;
    maxAchievementsEarned = Math.max(maxAchievementsEarned, dup.achievements_earned || 0);
    maxAchievementsTotal = Math.max(maxAchievementsTotal, dup.achievements_total || 0);
    maxCompletion = Math.max(maxCompletion, dup.completion_percentage || 0);
    if (dup.last_played_at && (!latestPlayed || new Date(dup.last_played_at) > new Date(latestPlayed))) {
      latestPlayed = dup.last_played_at;
    }
  }

  // Update primary with merged stats
  const { error: updateError } = await supabase
    .from('user_games')
    .update({
      playtime_hours: totalPlaytime,
      achievements_earned: maxAchievementsEarned,
      achievements_total: maxAchievementsTotal,
      completion_percentage: maxCompletion,
      last_played_at: latestPlayed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', primaryId)
    .eq('user_id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Delete duplicates
  const { error: deleteError } = await supabase
    .from('user_games')
    .delete()
    .eq('user_id', user.id)
    .in('id', duplicateIds);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath('/dashboard');
  return { success: true, merged: duplicateIds.length };
}

/**
 * Merge all game copies into a single entry
 * Combines stats and keeps the entry with the most data, deletes the rest
 */
export async function mergeStatsAcrossCopies(gameIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (gameIds.length < 2) {
    return { error: 'Need at least 2 games to merge' };
  }

  // Fetch all games with their game metadata
  const { data: games, error: fetchError } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', user.id)
    .in('id', gameIds);

  if (fetchError || !games || games.length === 0) {
    return { error: fetchError?.message || 'Failed to fetch games' };
  }

  // Calculate merged stats: sum playtime, max achievements, keep highest completion
  let totalPlaytime = 0;
  let maxAchievementsEarned = 0;
  let maxAchievementsTotal = 0;
  let maxCompletion = 0;
  let latestPlayed: string | null = null;
  let bestStatus = 'unplayed';
  let bestPriority = 'medium';
  let allNotes: string[] = [];
  let allTags: string[] = [];

  const statusPriority: Record<string, number> = {
    'unplayed': 0,
    'on_hold': 1,
    'playing': 2,
    'played': 3,
    'completed': 4,
    '100_completed': 5,
  };

  const priorityOrder: Record<string, number> = {
    'low': 0,
    'medium': 1,
    'high': 2,
  };

  // Pick the primary entry: prefer the one with most playtime, then most achievements
  let primaryGame = games[0];
  let maxScore = 0;

  for (const game of games) {
    // Calculate a "richness" score to pick the best entry to keep
    const score = (game.playtime_hours || 0) * 10 +
                  (game.achievements_earned || 0) * 5 +
                  (game.completion_percentage || 0);
    if (score > maxScore) {
      maxScore = score;
      primaryGame = game;
    }

    // Aggregate stats
    totalPlaytime += game.playtime_hours || 0;
    maxAchievementsEarned = Math.max(maxAchievementsEarned, game.achievements_earned || 0);
    maxAchievementsTotal = Math.max(maxAchievementsTotal, game.achievements_total || 0);
    maxCompletion = Math.max(maxCompletion, game.completion_percentage || 0);

    if (game.last_played_at && (!latestPlayed || new Date(game.last_played_at) > new Date(latestPlayed))) {
      latestPlayed = game.last_played_at;
    }

    // Keep the "best" status (most progressed)
    if ((statusPriority[game.status] || 0) > (statusPriority[bestStatus] || 0)) {
      bestStatus = game.status;
    }

    // Keep highest priority
    if ((priorityOrder[game.priority] || 0) > (priorityOrder[bestPriority] || 0)) {
      bestPriority = game.priority;
    }

    // Collect notes (with platform context)
    if (game.notes?.trim()) {
      allNotes.push(`[${game.platform}] ${game.notes.trim()}`);
    }

    // Collect all unique tags
    if (game.tags?.length) {
      allTags.push(...game.tags);
    }
  }

  // Deduplicate tags
  const uniqueTags = [...new Set(allTags)].slice(0, 10);

  // Combine notes (limit length)
  const combinedNotes = allNotes.length > 0 ? allNotes.join('\n\n').slice(0, 2000) : primaryGame.notes;

  // Combine platforms into a note about merged sources
  const platforms = games.map(g => g.platform).join(', ');

  // Update the primary entry with merged stats
  const { error: updateError } = await supabase
    .from('user_games')
    .update({
      playtime_hours: totalPlaytime,
      achievements_earned: maxAchievementsEarned,
      achievements_total: maxAchievementsTotal,
      completion_percentage: maxCompletion,
      last_played_at: latestPlayed,
      status: bestStatus,
      priority: bestPriority,
      notes: combinedNotes || `Merged from: ${platforms}`,
      tags: uniqueTags.length > 0 ? uniqueTags : primaryGame.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', primaryGame.id)
    .eq('user_id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Delete all other entries
  const toDeleteIds = games.filter(g => g.id !== primaryGame.id).map(g => g.id);

  if (toDeleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('user_games')
      .delete()
      .eq('user_id', user.id)
      .in('id', toDeleteIds);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/library');
  return { success: true, merged: games.length, kept: primaryGame.platform };
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

/**
 * Fetch metadata from IGDB for a game title (without saving)
 * Returns the data so user can review before applying
 */
export async function fetchIGDBMetadata(gameTitle: string, userPlatform?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

/**
 * Platform match result from scanning connected accounts
 */
export interface PlatformMatch {
  platform: 'steam' | 'psn' | 'xbox';
  platformLabel: string;
  gameTitle: string;
  platformId: string | number; // steam_appid, psn_communication_id, xbox_title_id
  coverUrl: string | null;
  playtimeHours: number;
  lastPlayed: string | null;
  achievementsEarned: number;
  achievementsTotal: number;
  completionPercentage: number;
  platformString: string; // e.g., "Steam", "PS5", "Xbox"
  confidence: number; // 0-100 match confidence
}

export interface PlatformScanResult {
  steamConnected: boolean;
  psnConnected: boolean;
  xboxConnected: boolean;
  matches: PlatformMatch[];
  scannedPlatforms: string[];
  error: string | null;
}

/**
 * Normalize a game title for comparison
 */
function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/[''""'".,:!?]/g, '')
    .replace(/\s+(edition|remaster|remastered|goty|game of the year|definitive|ultimate|complete|deluxe|enhanced|hd|4k|remake)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '')
    .trim();
}

/**
 * Calculate similarity between two normalized titles
 */
function calculateTitleSimilarity(a: string, b: string): number {
  if (a === b) return 100;

  // Check for exact substring match
  if (a.includes(b) || b.includes(a)) {
    const shorter = a.length < b.length ? a : b;
    const longer = a.length >= b.length ? a : b;
    return Math.round((shorter.length / longer.length) * 90 + 10);
  }

  // Word-based comparison
  const wordsA = a.split(' ').filter(w => w.length > 1);
  const wordsB = b.split(' ').filter(w => w.length > 1);

  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const commonWords = wordsA.filter(w => wordsB.some(wb => wb === w || wb.includes(w) || w.includes(wb)));
  const matchRatio = commonWords.length / Math.max(wordsA.length, wordsB.length);

  return Math.round(matchRatio * 100);
}

/**
 * Scan connected platform accounts for a game by title
 * Returns matching games with playtime, achievements, and platform IDs
 */
export async function scanPlatformsForGame(gameTitle: string): Promise<PlatformScanResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      steamConnected: false,
      psnConnected: false,
      xboxConnected: false,
      matches: [],
      scannedPlatforms: [],
      error: 'Not authenticated',
    };
  }

  // Get user's profile to check connected platforms
  const { data: profile } = await supabase
    .from('profiles')
    .select('steam_id, psn_account_id, xbox_xuid')
    .eq('id', user.id)
    .single();

  const steamConnected = !!profile?.steam_id;
  const psnConnected = !!profile?.psn_account_id;
  const xboxConnected = !!profile?.xbox_xuid;

  const matches: PlatformMatch[] = [];
  const scannedPlatforms: string[] = [];
  const normalizedSearchTitle = normalizeGameTitle(gameTitle);

  // Scan Steam library
  if (steamConnected && profile?.steam_id) {
    scannedPlatforms.push('Steam');
    try {
      const steamGames = await getOwnedGames(profile.steam_id);

      for (const steamGame of steamGames) {
        const normalizedSteamTitle = normalizeGameTitle(steamGame.name);
        const similarity = calculateTitleSimilarity(normalizedSearchTitle, normalizedSteamTitle);

        if (similarity >= 70) {
          // Get achievements for this game
          let achievementsEarned = 0;
          let achievementsTotal = 0;

          try {
            const [achievements, schema] = await Promise.all([
              getPlayerAchievements(profile.steam_id, steamGame.appid),
              getGameSchema(steamGame.appid),
            ]);

            achievementsEarned = achievements.filter(a => a.achieved === 1).length;
            achievementsTotal = schema?.game?.availableGameStats?.achievements?.length || 0;
          } catch {
            // Achievements may not be available for all games
          }

          const playtimeHours = steamGame.playtime_forever ? steamGame.playtime_forever / 60 : 0;
          const completionPercentage = achievementsTotal > 0
            ? Math.round((achievementsEarned / achievementsTotal) * 100)
            : 0;

          matches.push({
            platform: 'steam',
            platformLabel: 'Steam',
            gameTitle: steamGame.name,
            platformId: steamGame.appid,
            coverUrl: getSteamLibraryCapsuleUrl(steamGame.appid),
            playtimeHours: Math.round(playtimeHours * 10) / 10,
            lastPlayed: steamGame.rtime_last_played
              ? new Date(steamGame.rtime_last_played * 1000).toISOString()
              : null,
            achievementsEarned,
            achievementsTotal,
            completionPercentage,
            platformString: 'Steam',
            confidence: similarity,
          });
        }
      }
    } catch (error) {
      console.error('[Platform Scan] Steam error:', error);
    }
  }

  // Scan PSN library
  if (psnConnected && profile?.psn_account_id) {
    scannedPlatforms.push('PlayStation');
    try {
      // Get PSN access token
      const { data: tokenData } = await supabase
        .from('psn_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .single();

      if (tokenData) {
        let accessToken = tokenData.access_token;

        // Check if token needs refresh
        const expiresAt = new Date(tokenData.expires_at);
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

        if (expiresAt < fiveMinutesFromNow && tokenData.refresh_token) {
          try {
            const refreshed = await refreshAccessToken(tokenData.refresh_token);
            accessToken = refreshed.accessToken;

            // Update stored token
            await supabase
              .from('psn_tokens')
              .update({
                access_token: refreshed.accessToken,
                refresh_token: refreshed.refreshToken,
                expires_at: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
              })
              .eq('user_id', user.id);
          } catch {
            // If refresh fails, try with existing token
          }
        }

        const psnGames = await getGameLibrary(accessToken, profile.psn_account_id);

        for (const psnGame of psnGames) {
          const normalizedPsnTitle = normalizeGameTitle(psnGame.trophyTitleName);
          const similarity = calculateTitleSimilarity(normalizedSearchTitle, normalizedPsnTitle);

          if (similarity >= 70) {
            const achievementsEarned = calculateTotalTrophies(psnGame.earnedTrophies);
            const achievementsTotal = calculateDefinedTrophies(psnGame.definedTrophies);
            const platform = normalizePsnPlatform(psnGame.trophyTitlePlatform);

            matches.push({
              platform: 'psn',
              platformLabel: 'PlayStation',
              gameTitle: psnGame.trophyTitleName,
              platformId: psnGame.npCommunicationId,
              coverUrl: psnGame.trophyTitleIconUrl || null,
              playtimeHours: 0, // PSN doesn't provide playtime
              lastPlayed: psnGame.lastUpdatedDateTime || null,
              achievementsEarned,
              achievementsTotal,
              completionPercentage: psnGame.progress || 0,
              platformString: platform,
              confidence: similarity,
            });
          }
        }
      }
    } catch (error) {
      console.error('[Platform Scan] PSN error:', error);
    }
  }

  // Scan Xbox library (using both titleHistory AND achievements for comprehensive coverage)
  if (xboxConnected && profile?.xbox_xuid) {
    scannedPlatforms.push('Xbox');
    try {
      // Get Xbox API key from tokens table
      const { data: xboxTokens } = await supabase
        .from('xbox_tokens')
        .select('api_key')
        .eq('user_id', user.id)
        .single();

      if (xboxTokens?.api_key) {
        // Track which games we've already added to avoid duplicates
        const addedXboxTitleIds = new Set<string>();

        // First, scan titleHistory (primary source)
        try {
          const xboxGames = await getMyTitleHistory(xboxTokens.api_key);

          for (const xboxGame of xboxGames) {
            const normalizedXboxTitle = normalizeGameTitle(xboxGame.name);
            const similarity = calculateTitleSimilarity(normalizedSearchTitle, normalizedXboxTitle);

            if (similarity >= 70) {
              const achievementsEarned = xboxGame.achievement?.currentAchievements || 0;
              const achievementsTotal = xboxGame.achievement?.totalAchievements || 0;
              const completionPercentage = xboxGame.achievement?.progressPercentage || 0;
              const platform = normalizeXboxPlatform(xboxGame.devices);

              addedXboxTitleIds.add(xboxGame.titleId);
              matches.push({
                platform: 'xbox',
                platformLabel: 'Xbox',
                gameTitle: xboxGame.name,
                platformId: xboxGame.titleId,
                coverUrl: xboxGame.displayImage || null,
                playtimeHours: 0, // Xbox API doesn't provide playtime directly
                lastPlayed: xboxGame.titleHistory?.lastTimePlayed || null,
                achievementsEarned,
                achievementsTotal,
                completionPercentage,
                platformString: platform,
                confidence: similarity,
              });
            }
          }
        } catch (titleHistoryError) {
          console.error('[Platform Scan] Xbox titleHistory error:', titleHistoryError);
        }

        // Second, scan achievements endpoint (catches games titleHistory might miss)
        // This includes Xbox 360 games and other games with achievements
        try {
          const allAchievements = await getMyAchievements(xboxTokens.api_key);

          // Group achievements by game title
          const achievementsByGame = new Map<string, {
            titleId: string;
            gameName: string;
            earned: number;
            total: number;
            platforms: string[];
          }>();

          for (const achievement of allAchievements) {
            if (achievement.titleAssociations && achievement.titleAssociations.length > 0) {
              const titleInfo = achievement.titleAssociations[0];
              const titleIdStr = titleInfo.id.toString();

              // Skip if we already have this game from titleHistory
              if (addedXboxTitleIds.has(titleIdStr)) continue;

              const existing = achievementsByGame.get(titleIdStr);
              if (existing) {
                existing.total++;
                if (achievement.progressState === 'Achieved') {
                  existing.earned++;
                }
                // Merge platforms
                if (achievement.platforms) {
                  for (const p of achievement.platforms) {
                    if (!existing.platforms.includes(p)) {
                      existing.platforms.push(p);
                    }
                  }
                }
              } else {
                achievementsByGame.set(titleIdStr, {
                  titleId: titleIdStr,
                  gameName: titleInfo.name,
                  earned: achievement.progressState === 'Achieved' ? 1 : 0,
                  total: 1,
                  platforms: achievement.platforms || [],
                });
              }
            }
          }

          // Check each game from achievements against search title
          for (const [titleId, gameData] of achievementsByGame) {
            const normalizedXboxTitle = normalizeGameTitle(gameData.gameName);
            const similarity = calculateTitleSimilarity(normalizedSearchTitle, normalizedXboxTitle);

            if (similarity >= 70) {
              const completionPercentage = gameData.total > 0
                ? Math.round((gameData.earned / gameData.total) * 100)
                : 0;
              const platform = normalizeXboxPlatform(gameData.platforms);

              matches.push({
                platform: 'xbox',
                platformLabel: 'Xbox',
                gameTitle: gameData.gameName,
                platformId: titleId,
                coverUrl: null, // Achievements endpoint doesn't include cover images
                playtimeHours: 0,
                lastPlayed: null,
                achievementsEarned: gameData.earned,
                achievementsTotal: gameData.total,
                completionPercentage,
                platformString: platform,
                confidence: similarity,
              });
            }
          }
        } catch (achievementsError) {
          console.error('[Platform Scan] Xbox achievements error:', achievementsError);
        }
      }
    } catch (error) {
      console.error('[Platform Scan] Xbox error:', error);
    }
  }

  // Sort matches by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  return {
    steamConnected,
    psnConnected,
    xboxConnected,
    matches,
    scannedPlatforms,
    error: null,
  };
}

/**
 * Add a game to user's library with optional platform enrichment data
 */
export async function addGameToLibraryWithPlatformData(
  formData: FormData,
  platformMatch?: PlatformMatch | null
) {
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

  // Determine platform-specific IDs and use enriched cover if available
  let steamAppid: number | null = null;
  let psnCommunicationId: string | null = null;
  let xboxTitleId: string | null = null;
  let finalCoverUrl = coverUrl || null;
  let playtimeHours = 0;
  let lastPlayedAt: string | null = null;
  let achievementsEarned = 0;
  let achievementsTotal = 0;
  let completionPercentage = 0;
  let finalPlatform = platform;

  if (platformMatch) {
    // Use platform-specific data
    if (platformMatch.platform === 'steam') {
      steamAppid = platformMatch.platformId as number;
    } else if (platformMatch.platform === 'psn') {
      psnCommunicationId = platformMatch.platformId as string;
    } else if (platformMatch.platform === 'xbox') {
      xboxTitleId = platformMatch.platformId as string;
    }

    // Use platform cover if no IGDB cover was selected
    if (!finalCoverUrl && platformMatch.coverUrl) {
      finalCoverUrl = platformMatch.coverUrl;
    }

    // Use platform data
    playtimeHours = platformMatch.playtimeHours;
    lastPlayedAt = platformMatch.lastPlayed;
    achievementsEarned = platformMatch.achievementsEarned;
    achievementsTotal = platformMatch.achievementsTotal;
    completionPercentage = platformMatch.completionPercentage;
    finalPlatform = platformMatch.platformString;
  }

  // First, create or find the game in the games table
  const { data: existingGame } = await supabase
    .from('games')
    .select('*')
    .eq('title', title)
    .single();

  let gameId = existingGame?.id;

  if (!existingGame) {
    // Create new game entry with platform IDs
    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert({
        title,
        description,
        cover_url: finalCoverUrl,
        developer: developer || null,
        platforms: [finalPlatform],
        steam_appid: steamAppid,
        psn_communication_id: psnCommunicationId,
        xbox_title_id: xboxTitleId,
      })
      .select()
      .single();

    if (createError) {
      return { error: createError.message };
    }

    gameId = newGame.id;
  } else {
    // Update existing game with platform IDs if not already set
    const updates: Record<string, unknown> = {};
    if (steamAppid && !existingGame.steam_appid) updates.steam_appid = steamAppid;
    if (psnCommunicationId && !existingGame.psn_communication_id) updates.psn_communication_id = psnCommunicationId;
    if (xboxTitleId && !existingGame.xbox_title_id) updates.xbox_title_id = xboxTitleId;

    if (Object.keys(updates).length > 0) {
      await supabase.from('games').update(updates).eq('id', gameId);
    }
  }

  // Determine status based on playtime
  let finalStatus = status || 'unplayed';
  if (!status && playtimeHours > 0) {
    finalStatus = 'playing';
  }

  // Add to user's library with enriched data
  const { error: userGameError } = await supabase.from('user_games').insert({
    user_id: user.id,
    game_id: gameId,
    platform: finalPlatform,
    status: finalStatus,
    priority: priority || 'medium',
    completion_percentage: completionPercentage,
    playtime_hours: playtimeHours,
    last_played_at: lastPlayedAt || (finalStatus === 'playing' ? new Date().toISOString() : null),
    achievements_earned: achievementsEarned,
    achievements_total: achievementsTotal,
  });

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/library');
  return { success: true };
}

/**
 * Edit a game with optional platform enrichment data
 * Updates both the game info and user game entry, with platform linking
 */
export async function editUserGameWithPlatformData(
  formData: FormData,
  platformMatch?: PlatformMatch | null
) {
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
  const playtimeHoursForm = formData.get('playtimeHours') as string;
  const completionPercentageForm = formData.get('completionPercentage') as string;
  const personalRating = formData.get('personalRating') as string;
  const notes = formData.get('notes') as string;
  const hidden = formData.get('hidden') === 'true';
  const ownershipStatus = (formData.get('ownership_status') as OwnershipStatus) || 'owned';
  const isPhysical = formData.get('is_physical') === 'true';

  // Determine platform-specific IDs from match
  let steamAppid: number | null = null;
  let psnCommunicationId: string | null = null;
  let xboxTitleId: string | null = null;
  let finalCoverUrl = coverUrl || null;
  let finalPlatform = platform;

  // Values that can be enriched from platform match
  let playtimeHours = playtimeHoursForm ? parseFloat(playtimeHoursForm) : 0;
  let completionPercentage = completionPercentageForm ? parseInt(completionPercentageForm) : 0;
  let achievementsEarned = 0;
  let achievementsTotal = 0;
  let lastPlayedAt: string | null = null;

  if (platformMatch) {
    // Use platform-specific data
    if (platformMatch.platform === 'steam') {
      steamAppid = platformMatch.platformId as number;
    } else if (platformMatch.platform === 'psn') {
      psnCommunicationId = platformMatch.platformId as string;
    } else if (platformMatch.platform === 'xbox') {
      xboxTitleId = platformMatch.platformId as string;
    }

    // Use platform cover if no cover was set
    if (!finalCoverUrl && platformMatch.coverUrl) {
      finalCoverUrl = platformMatch.coverUrl;
    }

    // Use platform data if form values are empty/zero
    if (playtimeHours === 0 && platformMatch.playtimeHours > 0) {
      playtimeHours = platformMatch.playtimeHours;
    }
    if (completionPercentage === 0 && platformMatch.completionPercentage > 0) {
      completionPercentage = platformMatch.completionPercentage;
    }
    achievementsEarned = platformMatch.achievementsEarned;
    achievementsTotal = platformMatch.achievementsTotal;
    lastPlayedAt = platformMatch.lastPlayed;
    finalPlatform = platformMatch.platformString;
  }

  // Update the game info in games table (including platform IDs)
  const gameUpdates: Record<string, unknown> = {
    title,
    description: description || null,
    cover_url: finalCoverUrl,
    developer: developer || null,
  };

  // Add platform IDs if we have them
  if (steamAppid) gameUpdates.steam_appid = steamAppid;
  if (psnCommunicationId) gameUpdates.psn_communication_id = psnCommunicationId;
  if (xboxTitleId) gameUpdates.xbox_title_id = xboxTitleId;

  const { error: gameError } = await supabase
    .from('games')
    .update(gameUpdates)
    .eq('id', gameId);

  if (gameError) {
    return { error: gameError.message };
  }

  // Update user_games entry with enriched data
  const userGameUpdates: Record<string, unknown> = {
    platform: finalPlatform,
    status,
    priority: priority || 'medium',
    playtime_hours: playtimeHours,
    completion_percentage: completionPercentage,
    personal_rating: personalRating ? parseInt(personalRating) : null,
    notes: notes || null,
    hidden,
    ownership_status: ownershipStatus,
    is_physical: isPhysical,
  };

  // Add achievements if we got them from platform
  if (achievementsEarned > 0 || achievementsTotal > 0) {
    userGameUpdates.achievements_earned = achievementsEarned;
    userGameUpdates.achievements_total = achievementsTotal;
  }

  // Update last_played_at if provided from platform or if status is playing
  if (lastPlayedAt) {
    userGameUpdates.last_played_at = lastPlayedAt;
  } else if (status === 'playing') {
    userGameUpdates.last_played_at = new Date().toISOString();
  }

  const { error: userGameError } = await supabase
    .from('user_games')
    .update(userGameUpdates)
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/library');
  revalidatePath('/game/[id]', 'page');
  return { success: true };
}

/**
 * Remove all synced games from a specific platform
 */
export async function removeSyncedGames(platform: 'steam' | 'psn' | 'xbox' | 'epic' | 'all') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Fetch all user games with their game data (simple query without complex filters)
    const { data: userGames, error: fetchError } = await supabase
      .from('user_games')
      .select('id, game:games(steam_appid, psn_communication_id, xbox_title_id, epic_catalog_item_id)')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching user games:', fetchError);
      return { error: fetchError.message };
    }

    if (!userGames || userGames.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Filter games in JavaScript based on platform
    const idsToDelete: string[] = [];

    for (const ug of userGames) {
      const game = ug.game as unknown as { steam_appid: number | null; psn_communication_id: string | null; xbox_title_id: string | null; epic_catalog_item_id: string | null } | null;

      if (!game) continue;

      if (platform === 'all') {
        // Delete if has any platform ID
        if (game.steam_appid || game.psn_communication_id || game.xbox_title_id || game.epic_catalog_item_id) {
          idsToDelete.push(ug.id);
        }
      } else if (platform === 'steam' && game.steam_appid) {
        idsToDelete.push(ug.id);
      } else if (platform === 'psn' && game.psn_communication_id) {
        idsToDelete.push(ug.id);
      } else if (platform === 'xbox' && game.xbox_title_id) {
        idsToDelete.push(ug.id);
      } else if (platform === 'epic' && game.epic_catalog_item_id) {
        idsToDelete.push(ug.id);
      }
    }

    if (idsToDelete.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Delete in batches to avoid query size limits
    const BATCH_SIZE = 100;
    let totalDeleted = 0;

    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase
        .from('user_games')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
        // Continue with remaining batches even if one fails
      } else {
        totalDeleted += batch.length;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    console.error('Error removing synced games:', error);
    return { error: error instanceof Error ? error.message : 'Failed to remove synced games' };
  }
}

/**
 * Get counts of synced games by platform
 */
export async function getSyncedGameCounts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { steam: 0, psn: 0, xbox: 0, epic: 0, total: 0 };
  }

  try {
    // Get all user games with their game data
    const { data: userGames } = await supabase
      .from('user_games')
      .select('game:games(steam_appid, psn_communication_id, xbox_title_id, epic_catalog_item_id)')
      .eq('user_id', user.id);

    let steam = 0;
    let psn = 0;
    let xbox = 0;
    let epic = 0;

    if (userGames) {
      for (const ug of userGames) {
        const game = ug.game as unknown as { steam_appid: number | null; psn_communication_id: string | null; xbox_title_id: string | null; epic_catalog_item_id: string | null } | null;
        if (game?.steam_appid) steam++;
        if (game?.psn_communication_id) psn++;
        if (game?.xbox_title_id) xbox++;
        if (game?.epic_catalog_item_id) epic++;
      }
    }

    // Total is unique synced games (a game could be linked to multiple platforms)
    const total = userGames?.filter(ug => {
      const game = ug.game as unknown as { steam_appid: number | null; psn_communication_id: string | null; xbox_title_id: string | null; epic_catalog_item_id: string | null } | null;
      return game?.steam_appid || game?.psn_communication_id || game?.xbox_title_id || game?.epic_catalog_item_id;
    }).length || 0;

    return { steam, psn, xbox, epic, total };
  } catch (error) {
    console.error('Error getting synced game counts:', error);
    return { steam: 0, psn: 0, xbox: 0, epic: 0, total: 0 };
  }
}
