'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  validateSteamId,
  getPlayerSummary,
  getOwnedGames,
  getPlayerAchievements,
  getGameSchema,
  getSteamLibraryCapsuleUrl,
  convertPlaytimeToHours,
} from '@/lib/steam/client';
import {
  SteamSyncResult,
  SteamGameSyncResult,
  SteamProfile,
  SteamPrivacyError,
  InvalidSteamIdError,
} from '@/lib/types/steam';

/**
 * Link Steam account to current user (manual Steam ID entry)
 */
export async function linkSteamAccount(steamIdOrUrl: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Validate and extract Steam ID
    const steamId = validateSteamId(steamIdOrUrl);

    // Fetch Steam profile to verify it exists
    const steamProfile = await getPlayerSummary(steamId);

    if (!steamProfile) {
      return { error: 'Steam profile not found' };
    }

    // Check if this Steam ID is already linked to another account
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('steam_id', steamId)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      return { error: 'This Steam account is already linked to another user' };
    }

    // Update user profile with Steam information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        steam_id: steamId,
        steam_persona_name: steamProfile.personaname,
        steam_avatar_url: steamProfile.avatarfull,
        steam_profile_url: steamProfile.profileurl,
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
        steam_id: steamId,
        steam_persona_name: steamProfile.personaname,
        steam_avatar_url: steamProfile.avatarfull,
        steam_profile_url: steamProfile.profileurl,
      },
    };
  } catch (error) {
    if (error instanceof InvalidSteamIdError) {
      return { error: error.message };
    }
    if (error instanceof SteamPrivacyError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to link Steam account',
    };
  }
}

/**
 * Unlink Steam account from current user
 */
export async function unlinkSteamAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        steam_id: null,
        steam_persona_name: null,
        steam_avatar_url: null,
        steam_profile_url: null,
        steam_last_sync: null,
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
      error: error instanceof Error ? error.message : 'Failed to unlink Steam account',
    };
  }
}

/**
 * Get current user's Steam profile information
 */
export async function getSteamProfile(): Promise<SteamProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('steam_id, steam_persona_name, steam_avatar_url, steam_profile_url, steam_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.steam_id) {
    return null;
  }

  return profile as SteamProfile;
}

/**
 * Sync Steam library - Import/update games from Steam
 */
export async function syncSteamLibrary(): Promise<SteamSyncResult> {
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
    // Get user's Steam ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('steam_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.steam_id) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        achievementsUpdated: 0,
        errors: ['Steam account not linked'],
        totalGames: 0,
      };
    }

    const steamId = profile.steam_id;

    // Fetch owned games from Steam
    const steamGames = await getOwnedGames(steamId);

    const result: SteamSyncResult = {
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      achievementsUpdated: 0,
      errors: [],
      totalGames: steamGames.length,
    };

    // Process each game
    for (const steamGame of steamGames) {
      try {
        // Check if game exists in games table
        let { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('steam_appid', steamGame.appid)
          .single();

        const coverUrl = getSteamLibraryCapsuleUrl(steamGame.appid);

        // If game doesn't exist, create it
        if (!game) {
          const { data: newGame, error: insertError } = await supabase
            .from('games')
            .insert({
              steam_appid: steamGame.appid,
              title: steamGame.name,
              cover_url: coverUrl,
              platforms: ['Steam'],
            })
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Failed to create game ${steamGame.name}: ${insertError.message}`);
            continue;
          }

          game = newGame;
        } else {
          // Game exists - update title and cover from Steam to override any IGDB data
          await supabase
            .from('games')
            .update({
              title: steamGame.name,
              cover_url: coverUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', game.id);
        }

        // Check if user_games entry exists
        const { data: existingUserGame } = await supabase
          .from('user_games')
          .select('id')
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .eq('platform', 'Steam')
          .single();

        const playtimeHours = convertPlaytimeToHours(steamGame.playtime_forever);
        const lastPlayed =
          steamGame.playtime_forever > 0 ? new Date().toISOString() : null;

        if (existingUserGame) {
          // Update existing entry
          const { error: updateError } = await supabase
            .from('user_games')
            .update({
              playtime_hours: playtimeHours,
              steam_playtime_minutes: steamGame.playtime_forever,
              steam_last_played: lastPlayed,
              steam_appid: steamGame.appid, // Ensure steam_appid is set for session tracking
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUserGame.id);

          if (updateError) {
            result.errors.push(`Failed to update ${steamGame.name}: ${updateError.message}`);
          } else {
            result.gamesUpdated++;
          }
        } else {
          // Create new entry
          const { error: insertError } = await supabase.from('user_games').insert({
            user_id: user.id,
            game_id: game.id,
            platform: 'Steam',
            status: 'unplayed',
            playtime_hours: playtimeHours,
            steam_playtime_minutes: steamGame.playtime_forever,
            steam_last_played: lastPlayed,
            steam_appid: steamGame.appid, // Set steam_appid for session tracking
          });

          if (insertError) {
            result.errors.push(`Failed to add ${steamGame.name}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
          }
        }

        // Fetch achievements for all games (don't rely on has_community_visible_stats flag)
        try {
          const achievements = await getPlayerAchievements(steamId, steamGame.appid);
          const schema = await getGameSchema(steamGame.appid);

          const achievementsEarned = achievements.filter((a) => a.achieved === 1).length;
          const achievementsTotal =
            schema?.game?.availableGameStats?.achievements?.length || achievements.length;

          if (achievementsTotal > 0) {
            const { data: userGame } = await supabase
              .from('user_games')
              .select('id')
              .eq('user_id', user.id)
              .eq('game_id', game.id)
              .eq('platform', 'Steam')
              .single();

            if (userGame) {
              const { error: achievementUpdateError } = await supabase
                .from('user_games')
                .update({
                  achievements_earned: achievementsEarned,
                  achievements_total: achievementsTotal,
                })
                .eq('id', userGame.id);

              if (achievementUpdateError) {
                console.error(`[Steam Sync] Failed to update achievements for ${steamGame.name}:`, achievementUpdateError);
              } else {
                result.achievementsUpdated++;
              }
            }
          }
        } catch (error) {
          console.error(`[Steam Sync] Achievement error for ${steamGame.name}:`, error);
          // Silently skip achievement sync errors - not all games have achievements
        }
      } catch (error) {
        result.errors.push(
          `Error processing ${steamGame.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({
        steam_last_sync: new Date().toISOString(),
      })
      .eq('id', user.id);

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return result;
  } catch (error) {
    if (error instanceof SteamPrivacyError) {
      return {
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        achievementsUpdated: 0,
        errors: [error.message],
        totalGames: 0,
      };
    }

    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      achievementsUpdated: 0,
      errors: [error instanceof Error ? error.message : 'Failed to sync Steam library'],
      totalGames: 0,
    };
  }
}

/**
 * Sync a single Steam game
 */
export async function syncSteamGame(appId: number): Promise<SteamGameSyncResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get user's Steam ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('steam_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.steam_id) {
      return { success: false, error: 'Steam account not linked' };
    }

    const steamId = profile.steam_id;

    // Fetch owned games to find this specific game
    const steamGames = await getOwnedGames(steamId);
    const steamGame = steamGames.find((g) => g.appid === appId);

    if (!steamGame) {
      return { success: false, error: 'Game not found in Steam library' };
    }

    // Check if game exists in games table
    let { data: game } = await supabase
      .from('games')
      .select('id, title')
      .eq('steam_appid', appId)
      .single();

    const coverUrl = getSteamLibraryCapsuleUrl(appId);

    // If game doesn't exist, create it
    if (!game) {
      const { data: newGame, error: insertError } = await supabase
        .from('games')
        .insert({
          steam_appid: appId,
          title: steamGame.name,
          cover_url: coverUrl,
          platforms: ['Steam'],
        })
        .select('id, title')
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      game = newGame;
    } else {
      // Game exists - update title and cover from Steam to override any IGDB data
      const { data: updatedGame } = await supabase
        .from('games')
        .update({
          title: steamGame.name,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', game.id)
        .select('id, title')
        .single();

      if (updatedGame) {
        game = updatedGame;
      }
    }

    // Update or create user_games entry
    const playtimeHours = convertPlaytimeToHours(steamGame.playtime_forever);
    const lastPlayed = steamGame.playtime_forever > 0 ? new Date().toISOString() : null;

    const { data: existingUserGame } = await supabase
      .from('user_games')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', game.id)
      .eq('platform', 'Steam')
      .single();

    if (existingUserGame) {
      const { error: updateError } = await supabase
        .from('user_games')
        .update({
          playtime_hours: playtimeHours,
          steam_playtime_minutes: steamGame.playtime_forever,
          steam_last_played: lastPlayed,
          steam_appid: appId, // Ensure steam_appid is set for session tracking
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUserGame.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabase.from('user_games').insert({
        user_id: user.id,
        game_id: game.id,
        platform: 'Steam',
        status: 'unplayed',
        playtime_hours: playtimeHours,
        steam_playtime_minutes: steamGame.playtime_forever,
        steam_last_played: lastPlayed,
        steam_appid: appId, // Set steam_appid for session tracking
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    // Sync achievements for all games (don't rely on has_community_visible_stats flag)
    try {
      const achievements = await getPlayerAchievements(steamId, appId);
      const schema = await getGameSchema(appId);

      const achievementsEarned = achievements.filter((a) => a.achieved === 1).length;
      const achievementsTotal =
        schema?.game?.availableGameStats?.achievements?.length || achievements.length;

      if (achievementsTotal > 0) {
        const { data: userGame } = await supabase
          .from('user_games')
          .select('id')
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .eq('platform', 'Steam')
          .single();

        if (userGame) {
          await supabase
            .from('user_games')
            .update({
              achievements_earned: achievementsEarned,
              achievements_total: achievementsTotal,
              completion_percentage: Math.round((achievementsEarned / achievementsTotal) * 100),
            })
            .eq('id', userGame.id);
        }
      }
    } catch (error) {
      // Silently skip achievement errors - not all games have achievements
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return {
      success: true,
      game: {
        id: game.id,
        title: game.title,
        appid: appId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync game',
    };
  }
}

