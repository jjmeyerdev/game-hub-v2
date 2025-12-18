'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase/server';
import type { Game, UserGame, DuplicateGroup } from './types';

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

// Convert Roman numerals to Arabic numbers
function romanToArabic(str: string): string {
  // First, convert Unicode Roman numeral characters to ASCII
  const unicodeRomans: Record<string, string> = {
    '\u2160': 'I', '\u2161': 'II', '\u2162': 'III', '\u2163': 'IV', '\u2164': 'V',
    '\u2165': 'VI', '\u2166': 'VII', '\u2167': 'VIII', '\u2168': 'IX', '\u2169': 'X',
    '\u216A': 'XI', '\u216B': 'XII', '\u2170': 'i', '\u2171': 'ii', '\u2172': 'iii',
    '\u2173': 'iv', '\u2174': 'v', '\u2175': 'vi', '\u2176': 'vii', '\u2177': 'viii',
    '\u2178': 'ix', '\u2179': 'x', '\u217A': 'xi', '\u217B': 'xii',
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
  ];
  for (const [pattern, arabic] of romanMap) {
    result = result.replace(pattern, arabic);
  }
  return result;
}

// Expand common gaming abbreviations
function expandAbbreviations(str: string): string {
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
    [/\bbiohazard\b/gi, 'resident evil'],
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
}

// Aggressive title normalization for comparison
function normalizeTitle(title: string): string {
  let normalized = title.toLowerCase();

  // Normalize Unicode to composed form (NFC) for consistent comparison
  normalized = normalized.normalize('NFC');

  // Remove zero-width characters and other invisible Unicode
  normalized = normalized.replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, '');

  // Normalize various Unicode spaces to regular spaces
  normalized = normalized.replace(/[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, ' ');

  // Remove trademark/copyright symbols
  normalized = normalized.replace(/[\u2122\u00ae\u00a9]/g, '');

  // Remove "the " prefix
  normalized = normalized.replace(/^the\s+/i, '');

  // Normalize punctuation to spaces
  normalized = normalized.replace(/[:\-\u2013\u2014_\.,'!?&+]/g, ' ');

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
}

// Create a super-normalized version for fuzzy matching (even more aggressive)
function superNormalize(title: string): string {
  let normalized = normalizeTitle(title);

  // Remove all numbers (for matching sequels across versions)
  const withoutNumbers = normalized.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();

  return withoutNumbers.length > 2 ? withoutNumbers : normalized;
}

// ============================================================================
// SIMILARITY FUNCTIONS
// ============================================================================

// Levenshtein distance calculation
function levenshteinDistance(a: string, b: string): number {
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
}

// Calculate similarity score (0-1) using multiple methods
function calculateSimilarity(titleA: string, titleB: string): number {
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
    scores.push(0.85);
  }

  return Math.max(...scores);
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Find duplicate games in user's library
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

  if (!userGames || userGames.length === 0) {
    return { data: [], error: null };
  }

  const duplicates: DuplicateGroup[] = [];
  const processedGameIds = new Set<string>();

  // PASS 1: Group by game_id (same underlying game record = definite duplicate)
  const gameIdGroups = new Map<string, UserGame[]>();
  for (const userGame of userGames) {
    const gameId = userGame.game_id;
    if (!gameIdGroups.has(gameId)) {
      gameIdGroups.set(gameId, []);
    }
    const group = gameIdGroups.get(gameId);
    if (group) {
      group.push(userGame as UserGame);
    }
  }

  for (const [gameId, games] of gameIdGroups) {
    if (games.length > 1) {
      const title = (games[0].game as Game)?.title || '';
      const normalizedTitle = normalizeTitle(title);

      duplicates.push({
        normalizedTitle: `gameid:${gameId}:${normalizedTitle}`,
        games,
        matchType: 'exact',
        confidence: 100,
      });
      games.forEach(g => processedGameIds.add(g.id));
    }
  }

  // PASS 2: Group remaining games by normalized title (exact title match)
  const remainingGames = (userGames as UserGame[]).filter(g => !processedGameIds.has(g.id));
  const titleGroups = new Map<string, UserGame[]>();

  for (const userGame of remainingGames) {
    const title = (userGame.game as Game)?.title || '';
    const normalized = normalizeTitle(title);

    if (!titleGroups.has(normalized)) {
      titleGroups.set(normalized, []);
    }
    const group = titleGroups.get(normalized);
    if (group) {
      group.push(userGame);
    }
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

      // Dynamic threshold based on title length
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

  // Filter out dismissed duplicates
  const filteredDuplicates = duplicates.filter(
    group => !dismissedTitles.has(group.normalizedTitle)
  );

  // Sort by confidence (highest first), then by match type, then by count
  filteredDuplicates.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    if (a.matchType !== b.matchType) {
      return a.matchType === 'exact' ? -1 : 1;
    }
    return b.games.length - a.games.length;
  });

  return { data: filteredDuplicates, error: null };
}

/**
 * Merge duplicate games - keeps the primary and deletes the others
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

  const { data: games, error: fetchError } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', user.id)
    .in('id', gameIds);

  if (fetchError || !games || games.length === 0) {
    return { error: fetchError?.message || 'Failed to fetch games' };
  }

  // Calculate merged stats
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
    'unplayed': 0, 'on_hold': 1, 'playing': 2, 'played': 3, 'completed': 4, 'finished': 5,
  };

  const priorityOrder: Record<string, number> = {
    'low': 0, 'medium': 1, 'high': 2,
  };

  let primaryGame = games[0];
  let maxScore = 0;

  for (const game of games) {
    const score = (game.playtime_hours || 0) * 10 +
                  (game.achievements_earned || 0) * 5 +
                  (game.completion_percentage || 0);
    if (score > maxScore) {
      maxScore = score;
      primaryGame = game;
    }

    totalPlaytime += game.playtime_hours || 0;
    maxAchievementsEarned = Math.max(maxAchievementsEarned, game.achievements_earned || 0);
    maxAchievementsTotal = Math.max(maxAchievementsTotal, game.achievements_total || 0);
    maxCompletion = Math.max(maxCompletion, game.completion_percentage || 0);

    if (game.last_played_at && (!latestPlayed || new Date(game.last_played_at) > new Date(latestPlayed))) {
      latestPlayed = game.last_played_at;
    }

    if ((statusPriority[game.status] || 0) > (statusPriority[bestStatus] || 0)) {
      bestStatus = game.status;
    }

    if ((priorityOrder[game.priority] || 0) > (priorityOrder[bestPriority] || 0)) {
      bestPriority = game.priority;
    }

    if (game.notes?.trim()) {
      allNotes.push(`[${game.platform}] ${game.notes.trim()}`);
    }

    if (game.tags?.length) {
      allTags.push(...game.tags);
    }
  }

  const uniqueTags = [...new Set(allTags)].slice(0, 10);
  const combinedNotes = allNotes.length > 0 ? allNotes.join('\n\n').slice(0, 2000) : primaryGame.notes;
  const platforms = games.map(g => g.platform).join(', ');

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

  const { data: games, error: fetchError } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', user.id)
    .in('id', selectedIds);

  if (fetchError || !games || games.length === 0) {
    return { error: fetchError?.message || 'Failed to fetch games' };
  }

  // Same merge logic as mergeStatsAcrossCopies
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
    'unplayed': 0, 'on_hold': 1, 'playing': 2, 'played': 3, 'completed': 4, 'finished': 5,
  };

  const priorityOrder: Record<string, number> = {
    'low': 0, 'medium': 1, 'high': 2,
  };

  let primaryGame = games[0];
  let maxScore = 0;

  for (const game of games) {
    const score = (game.playtime_hours || 0) * 10 +
                  (game.achievements_earned || 0) * 5 +
                  (game.completion_percentage || 0);
    if (score > maxScore) {
      maxScore = score;
      primaryGame = game;
    }

    totalPlaytime += game.playtime_hours || 0;
    maxAchievementsEarned = Math.max(maxAchievementsEarned, game.achievements_earned || 0);
    maxAchievementsTotal = Math.max(maxAchievementsTotal, game.achievements_total || 0);
    maxCompletion = Math.max(maxCompletion, game.completion_percentage || 0);

    if (game.last_played_at && (!latestPlayed || new Date(game.last_played_at) > new Date(latestPlayed))) {
      latestPlayed = game.last_played_at;
    }

    if ((statusPriority[game.status] || 0) > (statusPriority[bestStatus] || 0)) {
      bestStatus = game.status;
    }

    if ((priorityOrder[game.priority] || 0) > (priorityOrder[bestPriority] || 0)) {
      bestPriority = game.priority;
    }

    if (game.notes?.trim()) {
      allNotes.push(`[${game.platform}] ${game.notes.trim()}`);
    }

    if (game.tags?.length) {
      allTags.push(...game.tags);
    }
  }

  const uniqueTags = [...new Set(allTags)].slice(0, 10);
  const combinedNotes = allNotes.length > 0 ? allNotes.join('\n\n').slice(0, 2000) : primaryGame.notes;
  const platforms = games.map(g => g.platform).join(', ');

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
 * Dismiss a duplicate group
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
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
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
 * Clear a dismissed duplicate
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
 * Clear ALL dismissed duplicates
 */
export async function clearAllDismissedDuplicates(): Promise<{ success: boolean; count: number; error: string | null }> {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return { success: false, count: 0, error: 'Not authenticated' };
  }

  try {
    const { count } = await supabase
      .from('dismissed_duplicates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { error } = await supabase
      .from('dismissed_duplicates')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: count || 0, error: null };
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
