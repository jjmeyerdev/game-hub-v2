'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMyTitleHistory, normalizeXboxPlatform, getGameAchievements } from '@/lib/xbox/client';
import {
  XboxSyncResult,
  XboxAuthError,
  XboxPrivacyError,
  type XboxAchievement,
} from '@/lib/types/xbox';
import { getValidApiKey } from './auth';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get gamerscore value from an achievement's rewards
 */
function getGamerscoreFromRewards(rewards: XboxAchievement['rewards']): number {
  const gamerscoreReward = rewards.find(r => r.type === 'Gamerscore');
  return gamerscoreReward ? parseInt(gamerscoreReward.value, 10) || 0 : 0;
}

/**
 * Sync individual achievements for a game
 */
async function syncGameAchievements(
  supabase: SupabaseClient,
  userId: string,
  userGameId: string,
  apiKey: string,
  xuid: string,
  titleId: string
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const achievements = await getGameAchievements(apiKey, xuid, titleId);

    if (achievements.length === 0) {
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

    // Upsert each achievement
    for (const achievement of achievements) {
      const existingUnlockedByMe = existingMap.get(achievement.id);
      const isUnlocked = achievement.progressState === 'Achieved';
      const iconAsset = achievement.mediaAssets?.find(a => a.type === 'Icon');

      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          user_game_id: userGameId,
          platform: 'xbox',
          platform_achievement_id: achievement.id,
          name: achievement.name,
          description: achievement.description || null,
          icon_url: iconAsset?.url || null,
          achievement_type: 'achievement',
          points: getGamerscoreFromRewards(achievement.rewards),
          rarity: achievement.rarity?.currentPercentage || null,
          unlocked: isUnlocked,
          unlocked_at: isUnlocked ? achievement.progression?.timeUnlocked || null : null,
          // Preserve existing unlocked_by_me, otherwise leave null
          unlocked_by_me: existingUnlockedByMe !== undefined ? existingUnlockedByMe : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_game_id,platform_achievement_id',
        });

      if (error) {
        errors.push(`Achievement ${achievement.name}: ${error.message}`);
      } else {
        synced++;
      }
    }
  } catch (error) {
    errors.push(`Failed to sync achievements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { synced, errors };
}

/**
 * Sync Xbox library - Import/update games from Xbox
 */
export async function syncXboxLibrary(): Promise<XboxSyncResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      achievementsUpdated: 0,
      errors: ['Not authenticated'],
      totalGames: 0,
    };
  }

  try {
    // Get valid API key
    const apiKey = await getValidApiKey(user.id);

    if (!apiKey) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        achievementsUpdated: 0,
        errors: ['Xbox account not linked. Please link your account first.'],
        totalGames: 0,
      };
    }

    // Get user's Xbox XUID
    const { data: profile } = await supabase
      .from('profiles')
      .select('xbox_xuid')
      .eq('id', user.id)
      .single();

    if (!profile?.xbox_xuid) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        achievementsUpdated: 0,
        errors: ['Xbox account not linked'],
        totalGames: 0,
      };
    }

    // Fetch title history from Xbox
    const xboxGames = await getMyTitleHistory(apiKey);

    // Filter out PC-only games (Win32 only)
    const consoleGames = xboxGames.filter(game => {
      const devices = game.devices || [];
      if (devices.length === 1 && devices[0] === 'Win32') {
        return false;
      }
      return true;
    });

    const result: XboxSyncResult = {
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      achievementsUpdated: 0,
      errors: [],
      totalGames: consoleGames.length,
    };

    // Process each game
    for (const xboxGame of consoleGames) {
      try {
        const titleId = xboxGame.titleId;
        const platform = normalizeXboxPlatform(xboxGame.devices);

        // Check if game exists in games table
        let { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('xbox_title_id', titleId)
          .single();

        const coverUrl = xboxGame.displayImage;

        if (!game) {
          const { data: newGame, error: insertError } = await supabase
            .from('games')
            .insert({
              xbox_title_id: titleId,
              title: xboxGame.name,
              cover_url: coverUrl,
              platforms: [platform],
            })
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Failed to create game ${xboxGame.name}: ${insertError.message}`);
            continue;
          }

          game = newGame;
        }

        // Check if user_games entry exists by xbox_title_id first
        let { data: existingUserGame } = await supabase
          .from('user_games')
          .select('id, locked_fields, platform')
          .eq('user_id', user.id)
          .eq('xbox_title_id', titleId)
          .single();

        // Fallback: check by game_id
        if (!existingUserGame) {
          const { data: fallbackGame } = await supabase
            .from('user_games')
            .select('id, locked_fields, platform')
            .eq('user_id', user.id)
            .eq('game_id', game.id)
            .single();
          existingUserGame = fallbackGame;
        }

        // Achievement data from Xbox
        const achievementsEarned = xboxGame.achievement?.currentAchievements || 0;
        const achievementsTotal = xboxGame.achievement?.totalAchievements || 0;
        const completionPercentage = xboxGame.achievement?.progressPercentage || 0;
        const lastPlayed = xboxGame.titleHistory?.lastTimePlayed || null;

        let userGameId: string | null = null;

        if (existingUserGame) {
          userGameId = existingUserGame.id;
          const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            xbox_title_id: titleId,
          };

          if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
            updateData.achievements_earned = achievementsEarned;
            updateData.achievements_total = achievementsTotal;
            updateData.completion_percentage = completionPercentage;

            // Set completed_at when reaching 100% completion
            if (achievementsEarned === achievementsTotal && achievementsTotal > 0) {
              updateData.completed_at = new Date().toISOString();
            }
          }

          if (!lockedFields['last_played_at']) {
            updateData.last_played_at = lastPlayed;
            updateData.xbox_last_played = lastPlayed;
          }

          const { error: updateError } = await supabase
            .from('user_games')
            .update(updateData)
            .eq('id', existingUserGame.id);

          if (updateError) {
            result.errors.push(`Failed to update ${xboxGame.name}: ${updateError.message}`);
          } else {
            result.gamesUpdated++;
          }
        } else {
          const insertData: Record<string, unknown> = {
            user_id: user.id,
            game_id: game.id,
            platform: platform,
            status: 'unplayed',
            achievements_earned: achievementsEarned,
            achievements_total: achievementsTotal,
            completion_percentage: completionPercentage,
            last_played_at: lastPlayed,
            xbox_title_id: titleId,
            xbox_last_played: lastPlayed,
          };

          // Set completed_at when inserting a 100% completed game
          if (achievementsEarned === achievementsTotal && achievementsTotal > 0) {
            insertData.completed_at = new Date().toISOString();
          }

          const { data: newUserGame, error: insertError } = await supabase
            .from('user_games')
            .insert(insertData)
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Failed to add ${xboxGame.name}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
            userGameId = newUserGame.id;
          }
        }

        // Sync individual achievements for this game
        if (userGameId && achievementsTotal > 0 && profile.xbox_xuid) {
          const achievementResult = await syncGameAchievements(
            supabase,
            user.id,
            userGameId,
            apiKey,
            profile.xbox_xuid,
            titleId
          );
          if (achievementResult.errors.length > 0) {
            result.errors.push(...achievementResult.errors.slice(0, 3)); // Limit achievement errors
          }
        }

        if (achievementsEarned > 0) {
          result.achievementsUpdated++;
        }
      } catch (error) {
        result.errors.push(
          `Error processing ${xboxGame.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({ xbox_last_sync: new Date().toISOString() })
      .eq('id', user.id);

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return result;
  } catch (error) {
    if (error instanceof XboxPrivacyError) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        achievementsUpdated: 0,
        errors: [error.message],
        totalGames: 0,
      };
    }

    if (error instanceof XboxAuthError) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        achievementsUpdated: 0,
        errors: ['Xbox API key is invalid. Please re-link your account.'],
        totalGames: 0,
      };
    }

    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      achievementsUpdated: 0,
      errors: [error instanceof Error ? error.message : 'Failed to sync Xbox library'],
      totalGames: 0,
    };
  }
}
