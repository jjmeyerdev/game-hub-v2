'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getGameLibrary,
  calculateTotalTrophies,
  calculateDefinedTrophies,
  normalizePsnPlatform,
  getPlayedGamesWithPlaytime,
  parseIsoDuration,
  getTrophiesForTitle,
  type PsnPlayedTitle,
} from '@/lib/psn/client';
import {
  PsnSyncResult,
  PsnAuthError,
  PsnPrivacyError,
  type PsnTrophy,
  type PsnTrophyTitle,
} from '@/lib/types/psn';
import { getValidAccessToken } from './auth';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Calculate trophy points based on type
 * Uses standard PSN point values
 */
function getTrophyPoints(trophyType: string): number {
  switch (trophyType) {
    case 'bronze': return 15;
    case 'silver': return 30;
    case 'gold': return 90;
    case 'platinum': return 180;
    default: return 0;
  }
}

/**
 * Sync individual trophies for a game
 */
async function syncGameTrophies(
  supabase: SupabaseClient,
  userId: string,
  userGameId: string,
  accessToken: string,
  psnGame: PsnTrophyTitle
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const trophies = await getTrophiesForTitle(
      accessToken,
      psnGame.npCommunicationId,
      psnGame.npServiceName
    );

    if (trophies.length === 0) {
      return { synced: 0, errors: [] };
    }

    // Get existing achievements to preserve unlocked_by_me flags
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('platform_achievement_id, unlocked_by_me')
      .eq('user_game_id', userGameId);

    const existingMap = new Map(
      (existingAchievements || []).map(a => [a.platform_achievement_id, a.unlocked_by_me])
    );

    // Upsert each trophy
    for (const trophy of trophies) {
      const platformAchievementId = trophy.trophyId.toString();
      const existingUnlockedByMe = existingMap.get(platformAchievementId);

      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          user_game_id: userGameId,
          platform: 'psn',
          platform_achievement_id: platformAchievementId,
          name: trophy.trophyName,
          description: trophy.trophyDetail || null,
          icon_url: trophy.trophyIconUrl || null,
          achievement_type: trophy.trophyType,
          points: getTrophyPoints(trophy.trophyType),
          rarity: trophy.trophyEarnedRate ? parseFloat(trophy.trophyEarnedRate) : null,
          unlocked: trophy.earned || false,
          unlocked_at: trophy.earnedDateTime || null,
          // Preserve existing unlocked_by_me, otherwise leave null
          unlocked_by_me: existingUnlockedByMe !== undefined ? existingUnlockedByMe : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_game_id,platform_achievement_id',
        });

      if (error) {
        errors.push(`Trophy ${trophy.trophyName}: ${error.message}`);
      } else {
        synced++;
      }
    }
  } catch (error) {
    errors.push(`Failed to sync trophies: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { synced, errors };
}

/**
 * Sync PSN library - Import/update games from PSN
 */
export async function syncPsnLibrary(): Promise<PsnSyncResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      trophiesUpdated: 0,
      errors: ['Not authenticated'],
      totalGames: 0,
    };
  }

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(user.id);

    if (!accessToken) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        trophiesUpdated: 0,
        errors: ['PSN authentication expired. Please re-link your account.'],
        totalGames: 0,
      };
    }

    // Fetch game library from PSN (trophy titles)
    const psnGames = await getGameLibrary(accessToken);

    // Fetch played games with playtime data
    let playedGamesMap: Map<string, PsnPlayedTitle> = new Map();
    try {
      const playedGames = await getPlayedGamesWithPlaytime(accessToken);
      // Create a lookup map by normalized title name for matching
      for (const game of playedGames) {
        const normalizedName = game.name.toLowerCase().trim();
        playedGamesMap.set(normalizedName, game);
      }
    } catch (error) {
      // Playtime fetch failed - continue without it (optional enhancement)
      console.warn('Failed to fetch playtime data:', error);
    }

    const result: PsnSyncResult = {
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      trophiesUpdated: 0,
      errors: [],
      totalGames: psnGames.length,
    };

    // Process each game
    for (const psnGame of psnGames) {
      try {
        const npCommId = psnGame.npCommunicationId;
        const platform = normalizePsnPlatform(psnGame.trophyTitlePlatform);

        // Check if game exists in games table
        let { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('psn_communication_id', npCommId)
          .single();

        const coverUrl = psnGame.trophyTitleIconUrl;

        if (!game) {
          const { data: newGame, error: insertError } = await supabase
            .from('games')
            .insert({
              psn_communication_id: npCommId,
              title: psnGame.trophyTitleName,
              cover_url: coverUrl,
              platforms: [platform],
            })
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Failed to create game ${psnGame.trophyTitleName}: ${insertError.message}`);
            continue;
          }

          game = newGame;
        }

        // Check if user_games entry exists
        const { data: existingUserGame } = await supabase
          .from('user_games')
          .select('id, locked_fields, platform')
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .single();

        // Calculate trophy counts
        const earnedTotal = calculateTotalTrophies(psnGame.earnedTrophies);
        const definedTotal = calculateDefinedTrophies(psnGame.definedTrophies);
        const completionPercentage = psnGame.progress;
        const lastPlayed = psnGame.lastUpdatedDateTime || null;

        // Look up playtime from played games data
        const normalizedTitle = psnGame.trophyTitleName.toLowerCase().trim();
        const playedGame = playedGamesMap.get(normalizedTitle);
        const playtimeMinutes = playedGame ? parseIsoDuration(playedGame.playDuration) : 0;
        const playtimeHours = playtimeMinutes > 0 ? Math.round((playtimeMinutes / 60) * 100) / 100 : 0;

        let userGameId: string | null = null;

        if (existingUserGame) {
          userGameId = existingUserGame.id;
          const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            psn_title_id: npCommId, // Ensure PSN ID is set for existing synced games
          };

          if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
            updateData.achievements_earned = earnedTotal;
            updateData.achievements_total = definedTotal;
            updateData.completion_percentage = completionPercentage;

            // Set completed_at when reaching 100% completion
            if (earnedTotal === definedTotal && definedTotal > 0) {
              updateData.completed_at = new Date().toISOString();
            }
          }

          if (!lockedFields['last_played_at']) {
            updateData.last_played_at = lastPlayed;
          }

          if (playtimeHours > 0 && !lockedFields['playtime_hours']) {
            updateData.playtime_hours = playtimeHours;
          }

          const { error: updateError } = await supabase
            .from('user_games')
            .update(updateData)
            .eq('id', existingUserGame.id);

          if (updateError) {
            result.errors.push(`Failed to update ${psnGame.trophyTitleName}: ${updateError.message}`);
          } else {
            result.gamesUpdated++;
          }
        } else {
          const insertData: Record<string, unknown> = {
            user_id: user.id,
            game_id: game.id,
            platform: platform,
            status: 'unplayed',
            achievements_earned: earnedTotal,
            achievements_total: definedTotal,
            completion_percentage: completionPercentage,
            last_played_at: lastPlayed,
            playtime_hours: playtimeHours,
            psn_title_id: npCommId, // Store PSN ID to identify synced games
          };

          // Set completed_at when inserting a 100% completed game
          if (earnedTotal === definedTotal && definedTotal > 0) {
            insertData.completed_at = new Date().toISOString();
          }

          const { data: newUserGame, error: insertError } = await supabase
            .from('user_games')
            .insert(insertData)
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Failed to add ${psnGame.trophyTitleName}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
            userGameId = newUserGame.id;
          }
        }

        // Sync individual trophies for this game
        if (userGameId && definedTotal > 0) {
          const trophyResult = await syncGameTrophies(
            supabase,
            user.id,
            userGameId,
            accessToken,
            psnGame
          );
          if (trophyResult.errors.length > 0) {
            result.errors.push(...trophyResult.errors.slice(0, 3)); // Limit trophy errors
          }
        }

        if (earnedTotal > 0) {
          result.trophiesUpdated++;
        }
      } catch (error) {
        result.errors.push(
          `Error processing ${psnGame.trophyTitleName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({ psn_last_sync: new Date().toISOString() })
      .eq('id', user.id);

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return result;
  } catch (error) {
    if (error instanceof PsnPrivacyError) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        trophiesUpdated: 0,
        errors: [error.message],
        totalGames: 0,
      };
    }

    if (error instanceof PsnAuthError) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        trophiesUpdated: 0,
        errors: ['PSN authentication failed. Please re-link your account.'],
        totalGames: 0,
      };
    }

    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      trophiesUpdated: 0,
      errors: [error instanceof Error ? error.message : 'Failed to sync PSN library'],
      totalGames: 0,
    };
  }
}
