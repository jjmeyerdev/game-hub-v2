'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMyTitleHistory, normalizeXboxPlatform } from '@/lib/xbox/client';
import {
  XboxSyncResult,
  XboxAuthError,
  XboxPrivacyError,
} from '@/lib/types/xbox';
import { getValidApiKey } from './auth';

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

        if (existingUserGame) {
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

          const { error: insertError } = await supabase.from('user_games').insert(insertData);

          if (insertError) {
            result.errors.push(`Failed to add ${xboxGame.name}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
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
