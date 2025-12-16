'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase/server';
import { getOwnedGames, getPlayerAchievements, getGameSchema, getSteamLibraryCapsuleUrl } from '@/lib/steam';
import { getGameLibrary, refreshAccessToken, calculateTotalTrophies, calculateDefinedTrophies, normalizePsnPlatform } from '@/lib/psn';
import { getMyTitleHistory, getMyAchievements, normalizeXboxPlatform } from '@/lib/xbox/client';
import type { Game, OwnershipStatus, PlatformMatch, PlatformScanResult } from './types';

/**
 * Normalize a game title for comparison
 */
function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:\-\u2013\u2014]/g, ' ')
    .replace(/[''\u201c\u201d'".,:!?]/g, '')
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
      const { data: tokenData } = await supabase
        .from('psn_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .single();

      if (tokenData) {
        let accessToken = tokenData.access_token;

        const expiresAt = new Date(tokenData.expires_at);
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

        if (expiresAt < fiveMinutesFromNow && tokenData.refresh_token) {
          try {
            const refreshed = await refreshAccessToken(tokenData.refresh_token);
            accessToken = refreshed.accessToken;

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
              playtimeHours: 0,
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

  // Scan Xbox library
  if (xboxConnected && profile?.xbox_xuid) {
    scannedPlatforms.push('Xbox');
    try {
      const { data: xboxTokens } = await supabase
        .from('xbox_tokens')
        .select('api_key')
        .eq('user_id', user.id)
        .single();

      if (xboxTokens?.api_key) {
        const addedXboxTitleIds = new Set<string>();

        // Scan titleHistory (primary source)
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
                playtimeHours: 0,
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

        // Scan achievements endpoint (catches games titleHistory might miss)
        try {
          const allAchievements = await getMyAchievements(xboxTokens.api_key);

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

              if (addedXboxTitleIds.has(titleIdStr)) continue;

              const existing = achievementsByGame.get(titleIdStr);
              if (existing) {
                existing.total++;
                if (achievement.progressState === 'Achieved') {
                  existing.earned++;
                }
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
                coverUrl: null,
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
    if (platformMatch.platform === 'steam') {
      steamAppid = platformMatch.platformId as number;
    } else if (platformMatch.platform === 'psn') {
      psnCommunicationId = platformMatch.platformId as string;
    } else if (platformMatch.platform === 'xbox') {
      xboxTitleId = platformMatch.platformId as string;
    }

    if (!finalCoverUrl && platformMatch.coverUrl) {
      finalCoverUrl = platformMatch.coverUrl;
    }

    playtimeHours = platformMatch.playtimeHours;
    lastPlayedAt = platformMatch.lastPlayed;
    achievementsEarned = platformMatch.achievementsEarned;
    achievementsTotal = platformMatch.achievementsTotal;
    completionPercentage = platformMatch.completionPercentage;
    finalPlatform = platformMatch.platformString;
  }

  const { data: existingGame } = await supabase
    .from('games')
    .select('*')
    .eq('title', title)
    .single();

  let gameId = existingGame?.id;

  if (!existingGame) {
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
    const updates: Record<string, unknown> = {};
    if (steamAppid && !existingGame.steam_appid) updates.steam_appid = steamAppid;
    if (psnCommunicationId && !existingGame.psn_communication_id) updates.psn_communication_id = psnCommunicationId;
    if (xboxTitleId && !existingGame.xbox_title_id) updates.xbox_title_id = xboxTitleId;

    if (Object.keys(updates).length > 0) {
      await supabase.from('games').update(updates).eq('id', gameId);
    }
  }

  let finalStatus = status || 'unplayed';
  if (!status && playtimeHours > 0) {
    finalStatus = 'playing';
  }

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

  let steamAppid: number | null = null;
  let psnCommunicationId: string | null = null;
  let xboxTitleId: string | null = null;
  let finalCoverUrl = coverUrl || null;
  let finalPlatform = platform;

  let playtimeHours = playtimeHoursForm ? parseFloat(playtimeHoursForm) : 0;
  let completionPercentage = completionPercentageForm ? parseInt(completionPercentageForm) : 0;
  let achievementsEarned = 0;
  let achievementsTotal = 0;
  let lastPlayedAt: string | null = null;

  if (platformMatch) {
    if (platformMatch.platform === 'steam') {
      steamAppid = platformMatch.platformId as number;
    } else if (platformMatch.platform === 'psn') {
      psnCommunicationId = platformMatch.platformId as string;
    } else if (platformMatch.platform === 'xbox') {
      xboxTitleId = platformMatch.platformId as string;
    }

    if (!finalCoverUrl && platformMatch.coverUrl) {
      finalCoverUrl = platformMatch.coverUrl;
    }

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

  const gameUpdates: Record<string, unknown> = {
    title,
    description: description || null,
    cover_url: finalCoverUrl,
    developer: developer || null,
  };

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

  if (achievementsEarned > 0 || achievementsTotal > 0) {
    userGameUpdates.achievements_earned = achievementsEarned;
    userGameUpdates.achievements_total = achievementsTotal;
  }

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
    const { data: userGames, error: fetchError } = await supabase
      .from('user_games')
      .select('id, game:games(steam_appid, psn_communication_id, xbox_title_id, epic_catalog_item_id)')
      .eq('user_id', user.id);

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (!userGames || userGames.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const idsToDelete: string[] = [];

    for (const ug of userGames) {
      const game = ug.game as unknown as Game | null;

      if (!game) continue;

      if (platform === 'all') {
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

    const BATCH_SIZE = 100;
    let totalDeleted = 0;

    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase
        .from('user_games')
        .delete()
        .in('id', batch);

      if (!deleteError) {
        totalDeleted += batch.length;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
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
        const game = ug.game as unknown as Game | null;
        if (game?.steam_appid) steam++;
        if (game?.psn_communication_id) psn++;
        if (game?.xbox_title_id) xbox++;
        if (game?.epic_catalog_item_id) epic++;
      }
    }

    const total = userGames?.filter(ug => {
      const game = ug.game as unknown as Game | null;
      return game?.steam_appid || game?.psn_communication_id || game?.xbox_title_id || game?.epic_catalog_item_id;
    }).length || 0;

    return { steam, psn, xbox, epic, total };
  } catch (error) {
    console.error('Error getting synced game counts:', error);
    return { steam: 0, psn: 0, xbox: 0, epic: 0, total: 0 };
  }
}
