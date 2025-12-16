'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getMyProfile,
  getMyTitleHistory,
  getGameAchievements,
  normalizeXboxPlatform,
} from '@/lib/xbox/client';
import {
  XboxSyncResult,
  XboxDbProfile,
  XboxAPIError,
  XboxAuthError,
  XboxPrivacyError,
} from '@/lib/types/xbox';

/**
 * Link Xbox account using OpenXBL API key
 */
export async function linkXboxAccount(apiKey: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Validate API key by fetching user profile
    const xboxProfile = await getMyProfile(apiKey);

    if (!xboxProfile || !xboxProfile.xuid) {
      return { error: 'Invalid Xbox API key or could not fetch profile' };
    }

    // Check if this Xbox account is already linked to another user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('xbox_xuid', xboxProfile.xuid)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      return { error: 'This Xbox account is already linked to another user' };
    }

    // Store API key in xbox_tokens table
    const { error: tokenError } = await supabase.from('xbox_tokens').upsert({
      user_id: user.id,
      api_key: apiKey,
      updated_at: new Date().toISOString(),
    });

    if (tokenError) {
      console.error('Failed to store Xbox API key:', tokenError);
      return { error: 'Failed to store Xbox API key' };
    }

    // Update user profile with Xbox information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xbox_xuid: xboxProfile.xuid,
        xbox_gamertag: xboxProfile.gamertag,
        xbox_avatar_url: xboxProfile.gamerPicture || null,
        xbox_gamerscore: xboxProfile.gamerscore || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return {
      success: true,
      profile: {
        xbox_xuid: xboxProfile.xuid,
        xbox_gamertag: xboxProfile.gamertag,
        xbox_avatar_url: xboxProfile.gamerPicture || null,
        xbox_gamerscore: xboxProfile.gamerscore || 0,
      },
    };
  } catch (error) {
    if (error instanceof XboxAuthError) {
      return { error: 'Invalid Xbox API key. Please check your key and try again.' };
    }
    if (error instanceof XboxPrivacyError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to link Xbox account',
    };
  }
}

/**
 * Unlink Xbox account from current user
 */
export async function unlinkXboxAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Delete stored API key
    await supabase.from('xbox_tokens').delete().eq('user_id', user.id);

    // Clear Xbox profile data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xbox_xuid: null,
        xbox_gamertag: null,
        xbox_avatar_url: null,
        xbox_gamerscore: null,
        xbox_last_sync: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to unlink Xbox account',
    };
  }
}

/**
 * Get current user's Xbox profile information
 */
export async function getXboxProfile(): Promise<XboxDbProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('xbox_xuid, xbox_gamertag, xbox_avatar_url, xbox_gamerscore, xbox_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.xbox_xuid) {
    return null;
  }

  return profile as XboxDbProfile;
}

/**
 * Get valid API key for the user
 */
async function getValidApiKey(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: tokens } = await supabase
    .from('xbox_tokens')
    .select('api_key')
    .eq('user_id', userId)
    .single();

  if (!tokens) {
    return null;
  }

  return tokens.api_key;
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

    // Filter out PC-only games (Win32 only) - these are not Xbox console games
    const consoleGames = xboxGames.filter(game => {
      const devices = game.devices || [];
      // Skip if the ONLY device is Win32 (PC-only game)
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

        // Use Xbox display image as cover
        const coverUrl = xboxGame.displayImage;

        // If game doesn't exist in games table, create it
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
        // Note: For existing games, we no longer update game metadata during sync
        // This preserves any user customizations or IGDB data

        // Check if user_games entry exists by xbox_title_id first (most reliable)
        // This prevents duplicates when platform strings vary between syncs
        let { data: existingUserGame } = await supabase
          .from('user_games')
          .select('id, locked_fields, platform')
          .eq('user_id', user.id)
          .eq('xbox_title_id', titleId)
          .single();

        // Fallback: check by game_id if xbox_title_id wasn't set on older entries
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

        // Parse last played date
        const lastPlayed = xboxGame.titleHistory?.lastTimePlayed || null;

        if (existingUserGame) {
          // For existing games, only sync completion-related fields
          // Respect locked fields
          const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            xbox_title_id: titleId, // Always ensure xbox_title_id is set (identifier, not user data)
          };

          // Only sync completion/achievement data if not locked
          if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
            updateData.achievements_earned = achievementsEarned;
            updateData.achievements_total = achievementsTotal;
            updateData.completion_percentage = completionPercentage;
          }

          // Only sync last_played if not locked
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
          // Create new entry
          const { error: insertError } = await supabase.from('user_games').insert({
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
          });

          if (insertError) {
            result.errors.push(`Failed to add ${xboxGame.name}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
          }
        }

        // Count achievement syncs
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
      .update({
        xbox_last_sync: new Date().toISOString(),
      })
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

/**
 * Refresh Xbox profile data
 */
export async function refreshXboxProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const apiKey = await getValidApiKey(user.id);

    if (!apiKey) {
      return { error: 'Xbox account not linked' };
    }

    const xboxProfile = await getMyProfile(apiKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xbox_gamertag: xboxProfile.gamertag,
        xbox_avatar_url: xboxProfile.gamerPicture || null,
        xbox_gamerscore: xboxProfile.gamerscore || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return {
      success: true,
      profile: {
        xbox_gamertag: xboxProfile.gamertag,
        xbox_avatar_url: xboxProfile.gamerPicture || null,
        xbox_gamerscore: xboxProfile.gamerscore || 0,
      },
    };
  } catch (error) {
    if (error instanceof XboxAuthError) {
      return { error: 'Xbox API key is invalid. Please re-link your account.' };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to refresh Xbox profile',
    };
  }
}
