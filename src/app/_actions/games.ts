'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase/server';
import {
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

export type LockedFields = Record<string, boolean>;

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
  locked_fields: LockedFields | null;
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

/**
 * Get user stats
 */
export async function getUserStats() {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
 */
export async function enrichAllGamesFromIGDB() {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
 * Uses multiple detection strategies:
 * 1. Same game_id (definitively same game, different platforms)
 * 2. Exact normalized title match
 * 3. Fuzzy title similarity with Levenshtein distance
 */
export async function findDuplicateGames(): Promise<{ data: DuplicateGroup[] | null; error: string | null }> {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { data: null, error: 'Not authenticated' };
  }

  // Fetch user games and dismissed duplicates in parallel
  const [gamesResult, dismissedResult] = await Promise.all([
    supabase
      .from('user_games')
      .select(`
        *,
        game:games(*)
      `)
      .eq('user_id', user.id),
    supabase
      .from('dismissed_duplicates')
      .select('normalized_title')
      .eq('user_id', user.id),
  ]);

  if (gamesResult.error) {
    return { data: null, error: gamesResult.error.message };
  }

  // Check for dismissed duplicates error (table might not exist)
  if (dismissedResult.error) {
    console.log('[Duplicate Scanner] Warning: Could not fetch dismissed duplicates:', dismissedResult.error.message);
  }

  const userGames = gamesResult.data;
  const dismissedTitles = new Set(
    dismissedResult.data?.map(d => d.normalized_title) || []
  );

  console.log('[Duplicate Scanner] Dismissed duplicates count:', dismissedTitles.size);

  if (!userGames || userGames.length === 0) {
    return { data: [], error: null };
  }

  // ============================================================================
  // NORMALIZATION FUNCTIONS
  // ============================================================================

  // Convert Roman numerals to Arabic numbers
  const romanToArabic = (str: string): string => {
    // First, convert Unicode Roman numeral characters to ASCII
    const unicodeRomans: Record<string, string> = {
      'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V',
      'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X',
      'Ⅺ': 'XI', 'Ⅻ': 'XII', 'ⅰ': 'i', 'ⅱ': 'ii', 'ⅲ': 'iii',
      'ⅳ': 'iv', 'ⅴ': 'v', 'ⅵ': 'vi', 'ⅶ': 'vii', 'ⅷ': 'viii',
      'ⅸ': 'ix', 'ⅹ': 'x', 'ⅺ': 'xi', 'ⅻ': 'xii',
    };
    let result = str;
    for (const [unicode, ascii] of Object.entries(unicodeRomans)) {
      result = result.replace(new RegExp(unicode, 'g'), ascii);
    }

    // Handle Roman numerals at word boundaries (start, end, or surrounded by spaces)
    const romanMap: [RegExp, string][] = [
      [/\bxv\b/gi, '15'], [/\bxiv\b/gi, '14'], [/\bxiii\b/gi, '13'],
      [/\bxii\b/gi, '12'], [/\bxi\b/gi, '11'], [/\bx\b/gi, '10'],
      [/\bix\b/gi, '9'], [/\bviii\b/gi, '8'], [/\bvii\b/gi, '7'],
      [/\bvi\b/gi, '6'], [/\bv\b/gi, '5'], [/\biv\b/gi, '4'],
      [/\biii\b/gi, '3'], [/\bii\b/gi, '2'],
      // Don't convert single 'i' as it's too common in words
    ];
    for (const [pattern, arabic] of romanMap) {
      result = result.replace(pattern, arabic);
    }
    return result;
  };

  // Expand common gaming abbreviations
  const expandAbbreviations = (str: string): string => {
    const abbreviations: [RegExp, string][] = [
      [/\bgta\b/gi, 'grand theft auto'],
      [/\bcod\b/gi, 'call of duty'],
      [/\bmw\b/gi, 'modern warfare'],
      [/\bbo\b/gi, 'black ops'],
      [/\brdr\b/gi, 'red dead redemption'],
      [/\bnfs\b/gi, 'need for speed'],
      [/\bff\b/gi, 'final fantasy'],
      [/\bmgs\b/gi, 'metal gear solid'],
      [/\bdmc\b/gi, 'devil may cry'],
      [/\bre\b/gi, 'resident evil'],
      [/\bac\b/gi, 'assassins creed'],
      [/\bfar cry\b/gi, 'farcry'],
      [/\bfarcry\b/gi, 'far cry'],
      [/\bbiohazard\b/gi, 'resident evil'], // Japanese name for RE
      [/\bmk\b/gi, 'mortal kombat'],
      [/\bsf\b/gi, 'street fighter'],
      [/\btlou\b/gi, 'the last of us'],
      [/\bkh\b/gi, 'kingdom hearts'],
      [/\bdq\b/gi, 'dragon quest'],
      [/\bsmt\b/gi, 'shin megami tensei'],
      [/\bnba2k/gi, 'nba 2k'],
      [/\bwwe2k/gi, 'wwe 2k'],
    ];
    let result = str;
    for (const [pattern, expansion] of abbreviations) {
      result = result.replace(pattern, expansion);
    }
    return result;
  };

  // Aggressive title normalization for comparison
  const normalizeTitle = (title: string): string => {
    let normalized = title.toLowerCase();

    // Normalize Unicode to composed form (NFC) for consistent comparison
    normalized = normalized.normalize('NFC');

    // Remove zero-width characters and other invisible Unicode
    normalized = normalized.replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, '');

    // Normalize various Unicode spaces to regular spaces
    normalized = normalized.replace(/[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, ' ');

    // Remove trademark/copyright symbols
    normalized = normalized.replace(/[™®©]/g, '');

    // Remove "the " prefix
    normalized = normalized.replace(/^the\s+/i, '');

    // Normalize punctuation to spaces
    normalized = normalized.replace(/[:\-–—_\.,'!?&+]/g, ' ');

    // Remove quotes and apostrophes
    normalized = normalized.replace(/[''""'`]/g, '');

    // Remove parenthetical content (often platform/edition info)
    normalized = normalized.replace(/\([^)]*\)/g, ' ');
    normalized = normalized.replace(/\[[^\]]*\]/g, ' ');

    // Remove edition/version words
    normalized = normalized.replace(
      /\b(edition|remaster|remastered|remake|goty|game\s*of\s*the\s*year|definitive|ultimate|complete|deluxe|enhanced|hd|4k|anniversary|special|collectors?|premium|standard|gold|silver|platinum|digital|physical|bundle|pack|collection|trilogy|anthology|directors?\s*cut|extended|expanded|legendary|classic|original|new|super|ultra|mega|hyper|pro|plus|ex|dx|gt|vr|ar|xe|se|le|ce|episodes?\s*from\s*liberty\s*city|lost\s*and\s*damned|ballad\s*of\s*gay\s*tony)\b/gi,
      ' '
    );

    // Remove platform indicators
    normalized = normalized.replace(
      /\b(pc|ps[1-5]|playstation\s*[1-5]?|xbox|xbox\s*(one|series\s*[xs]|360)?|switch|nintendo|steam|epic|gog|origin|uplay|battlenet)\b/gi,
      ' '
    );

    // Remove year indicators (often at end of titles)
    normalized = normalized.replace(/\b(19|20)\d{2}\b/g, ' ');

    // Expand abbreviations (GTA -> Grand Theft Auto, etc.)
    normalized = expandAbbreviations(normalized);

    // Convert Roman numerals to Arabic (IV -> 4, etc.)
    normalized = romanToArabic(normalized);

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  };

  // Create a super-normalized version for fuzzy matching (even more aggressive)
  const superNormalize = (title: string): string => {
    let normalized = normalizeTitle(title);

    // Remove all numbers (for matching sequels across versions)
    // Keep this separate so we can use it optionally
    const withoutNumbers = normalized.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();

    return withoutNumbers.length > 2 ? withoutNumbers : normalized;
  };

  // ============================================================================
  // SIMILARITY FUNCTIONS
  // ============================================================================

  // Levenshtein distance calculation
  const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  // Calculate similarity score (0-1) using multiple methods
  const calculateSimilarity = (titleA: string, titleB: string): number => {
    const a = normalizeTitle(titleA);
    const b = normalizeTitle(titleB);

    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0;

    const scores: number[] = [];

    // 1. Levenshtein-based similarity
    const maxLen = Math.max(a.length, b.length);
    const distance = levenshteinDistance(a, b);
    const levenshteinSim = 1 - (distance / maxLen);
    scores.push(levenshteinSim);

    // 2. Substring containment
    if (a.includes(b)) {
      scores.push(b.length / a.length + 0.2);
    } else if (b.includes(a)) {
      scores.push(a.length / b.length + 0.2);
    }

    // 3. Word overlap (Jaccard-like)
    const wordsA = new Set(a.split(' ').filter(w => w.length > 1));
    const wordsB = new Set(b.split(' ').filter(w => w.length > 1));
    if (wordsA.size > 0 && wordsB.size > 0) {
      const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
      const union = new Set([...wordsA, ...wordsB]).size;
      const jaccardSim = intersection / union;
      // Weight word overlap higher for multi-word titles
      scores.push(jaccardSim * (1 + Math.min(wordsA.size, wordsB.size) * 0.1));
    }

    // 4. Starting word match (important for game series)
    const firstWordA = a.split(' ')[0];
    const firstWordB = b.split(' ')[0];
    if (firstWordA === firstWordB && firstWordA.length > 2) {
      scores.push(0.5 + (firstWordA.length / maxLen) * 0.3);
    }

    // 5. Super-normalized match (ignoring numbers)
    const superA = superNormalize(titleA);
    const superB = superNormalize(titleB);
    if (superA === superB && superA.length > 3) {
      scores.push(0.85); // High score for base title match
    }

    // Return the highest score
    return Math.max(...scores);
  };

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================

  const duplicates: DuplicateGroup[] = [];
  const processedGameIds = new Set<string>(); // Track which user_game IDs we've grouped

  // PASS 1: Group by game_id (same underlying game record = definite duplicate)
  const gameIdGroups = new Map<string, UserGame[]>();
  for (const userGame of userGames) {
    const gameId = userGame.game_id;
    if (!gameIdGroups.has(gameId)) {
      gameIdGroups.set(gameId, []);
    }
    gameIdGroups.get(gameId)!.push(userGame as UserGame);
  }

  console.log('[Duplicate Scanner] Pass 1 - Checking game_id groups...');
  for (const [gameId, games] of gameIdGroups) {
    if (games.length > 1) {
      const title = (games[0].game as Game)?.title || '';
      const normalizedTitle = normalizeTitle(title);

      // Debug: Log Pass 1 matches
      console.log(`[Duplicate Scanner] Pass 1 match: game_id=${gameId}, title="${title}", count=${games.length}`);
      for (const g of games) {
        console.log(`  - user_game_id: ${g.id}, platform: ${g.platform}`);
      }

      duplicates.push({
        normalizedTitle: `gameid:${gameId}:${normalizedTitle}`,
        games,
        matchType: 'exact',
        confidence: 100,
      });
      games.forEach(g => processedGameIds.add(g.id));
    }
  }
  console.log('[Duplicate Scanner] Pass 1 complete. Duplicates found:', duplicates.length);

  // PASS 2: Group remaining games by normalized title (exact title match)
  const remainingGames = (userGames as UserGame[]).filter(g => !processedGameIds.has(g.id));
  const titleGroups = new Map<string, UserGame[]>();

  // Debug: Log all remaining games and their normalized titles
  console.log('[Duplicate Scanner] Pass 2 - Remaining games to check:', remainingGames.length);
  for (const userGame of remainingGames) {
    const title = (userGame.game as Game)?.title || '';
    const normalized = normalizeTitle(title);

    // Debug: Show GTA-related games specifically
    if (title.toLowerCase().includes('grand theft') || title.toLowerCase().includes('gta')) {
      // Show character codes to identify invisible characters
      const charCodes = [...title].map(c => `${c}(${c.charCodeAt(0)})`).join('');
      console.log(`[Duplicate Scanner] GTA game found:`);
      console.log(`  Title: "${title}"`);
      console.log(`  CharCodes: ${charCodes}`);
      console.log(`  Normalized: "${normalized}"`);
      console.log(`  Platform: ${userGame.platform}, game_id: ${userGame.game_id}, user_game_id: ${userGame.id}`);
    }

    if (!titleGroups.has(normalized)) {
      titleGroups.set(normalized, []);
    }
    titleGroups.get(normalized)!.push(userGame);
  }

  for (const [normalizedTitle, games] of titleGroups) {
    if (games.length > 1) {
      duplicates.push({
        normalizedTitle,
        games,
        matchType: 'exact',
        confidence: 100,
      });
      games.forEach(g => processedGameIds.add(g.id));
    }
  }

  // PASS 3: Fuzzy matching on remaining single entries
  const singleEntries = (userGames as UserGame[])
    .filter(g => !processedGameIds.has(g.id))
    .map(g => ({
      game: g,
      title: (g.game as Game)?.title || '',
      normalized: normalizeTitle((g.game as Game)?.title || ''),
    }));

  const usedInSimilar = new Set<string>();

  for (let i = 0; i < singleEntries.length; i++) {
    const entryA = singleEntries[i];
    if (usedInSimilar.has(entryA.game.id)) continue;

    const similarGroup: UserGame[] = [entryA.game];
    let highestSimilarity = 0;

    for (let j = i + 1; j < singleEntries.length; j++) {
      const entryB = singleEntries[j];
      if (usedInSimilar.has(entryB.game.id)) continue;

      const similarity = calculateSimilarity(entryA.title, entryB.title);

      // Dynamic threshold based on title length (shorter titles need higher similarity)
      const minLength = Math.min(entryA.normalized.length, entryB.normalized.length);
      const threshold = minLength < 5 ? 0.85 : minLength < 10 ? 0.7 : 0.6;

      if (similarity >= threshold) {
        similarGroup.push(entryB.game);
        usedInSimilar.add(entryB.game.id);
        highestSimilarity = Math.max(highestSimilarity, similarity);
      }
    }

    if (similarGroup.length > 1) {
      usedInSimilar.add(entryA.game.id);
      duplicates.push({
        normalizedTitle: entryA.normalized,
        games: similarGroup,
        matchType: 'similar',
        confidence: Math.round(highestSimilarity * 100),
      });
    }
  }

  // ============================================================================
  // FILTERING AND SORTING
  // ============================================================================

  // Debug logging
  console.log('[Duplicate Scanner] Total games:', userGames.length);
  console.log('[Duplicate Scanner] Duplicate groups found (before filtering):', duplicates.length);

  // Log each duplicate group for debugging
  for (const group of duplicates) {
    console.log(`[Duplicate Scanner] Group: "${group.normalizedTitle}" (${group.matchType}, ${group.confidence}%)`);
    for (const game of group.games) {
      const gameData = game.game as Game;
      console.log(`  - "${gameData?.title}" on ${game.platform} (user_game_id: ${game.id}, game_id: ${game.game_id})`);
    }
  }

  console.log('[Duplicate Scanner] Dismissed titles:', [...dismissedTitles]);

  // Filter out dismissed duplicates
  const filteredDuplicates = duplicates.filter(
    group => !dismissedTitles.has(group.normalizedTitle)
  );

  console.log('[Duplicate Scanner] After filtering dismissed:', filteredDuplicates.length);

  // Sort by confidence (highest first), then by match type, then by count
  filteredDuplicates.sort((a, b) => {
    // Confidence descending
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    // Exact before similar
    if (a.matchType !== b.matchType) {
      return a.matchType === 'exact' ? -1 : 1;
    }
    // More duplicates first
    return b.games.length - a.games.length;
  });

  return { data: filteredDuplicates, error: null };
}

/**
 * Merge duplicate games - keeps the primary and deletes the others
 * Transfers playtime, achievements, and other stats to the primary
 */
export async function mergeDuplicateGames(primaryId: string, duplicateIds: string[]) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
 * Merge selected game entries into one while keeping unselected entries separate
 * Unlike mergeStatsAcrossCopies, this doesn't delete the unselected entries
 */
export async function mergeSelectedKeepRest(selectedIds: string[]) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { error: 'Not authenticated' };
  }

  if (selectedIds.length < 2) {
    return { error: 'Need at least 2 games to merge' };
  }

  // Fetch all selected games with their game metadata
  const { data: games, error: fetchError } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', user.id)
    .in('id', selectedIds);

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
  const allNotes: string[] = [];
  const allTags: string[] = [];

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

  // Delete only the other SELECTED entries (not all entries in the group)
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
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
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

/**
 * Dismiss a duplicate group - remember the user's choice to not show these as duplicates again
 */
export async function dismissDuplicateGroup(
  normalizedTitle: string,
  gameIds: string[]
): Promise<{ success: boolean; error: string | null }> {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Upsert the dismissed duplicate record
    const { error } = await supabase
      .from('dismissed_duplicates')
      .upsert({
        user_id: user.id,
        normalized_title: normalizedTitle,
        game_ids: gameIds,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,normalized_title',
      });

    if (error) {
      console.error('Error dismissing duplicate group:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error dismissing duplicate group:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all dismissed duplicate groups for the current user
 */
export async function getDismissedDuplicates(): Promise<{ data: string[] | null; error: string | null }> {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { data: null, error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('dismissed_duplicates')
      .select('normalized_title')
      .eq('user_id', user.id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data?.map(d => d.normalized_title) || [], error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clear a dismissed duplicate (re-enable showing it in scans)
 */
export async function clearDismissedDuplicate(normalizedTitle: string): Promise<{ success: boolean; error: string | null }> {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('dismissed_duplicates')
      .delete()
      .eq('user_id', user.id)
      .eq('normalized_title', normalizedTitle);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clear ALL dismissed duplicates (reset and re-scan everything)
 */
export async function clearAllDismissedDuplicates(): Promise<{ success: boolean; count: number; error: string | null }> {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { success: false, count: 0, error: 'Not authenticated' };
  }

  try {
    // First count how many we're deleting
    const { count } = await supabase
      .from('dismissed_duplicates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Delete all dismissed duplicates for this user
    const { error } = await supabase
      .from('dismissed_duplicates')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    console.log(`[Duplicate Scanner] Cleared ${count || 0} dismissed duplicates for user`);
    return { success: true, count: count || 0, error: null };
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
