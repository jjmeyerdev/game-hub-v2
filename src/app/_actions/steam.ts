'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  validateSteamId,
  getPlayerSummary,
  getOwnedGames,
  getRecentlyPlayedGames,
  getPlayerAchievements,
  getGameSchema,
  getSteamLibraryCapsuleUrl,
  convertPlaytimeToHours,
  getCurrentlyPlayingGame,
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
      gamesSkipped: 0,
      achievementsUpdated: 0,
      achievementsPrivate: 0,
      errors: ['Not authenticated'],
      warnings: [],
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
        gamesSkipped: 0,
        achievementsUpdated: 0,
        achievementsPrivate: 0,
        errors: ['Steam account not linked'],
        warnings: [],
        totalGames: 0,
      };
    }

    const steamId = profile.steam_id;

    // Get recently played games (played in last 2 weeks) - these will be marked as 'playing'
    const recentlyPlayedGames = await getRecentlyPlayedGames(steamId);
    const recentlyPlayedAppIds = new Set(recentlyPlayedGames.map(g => g.appid));
    console.log(`[Steam Sync] Recently played games (last 2 weeks): ${recentlyPlayedGames.length} games`);
    if (recentlyPlayedGames.length > 0) {
      console.log(`[Steam Sync] Recently played: ${recentlyPlayedGames.map(g => g.name).join(', ')}`);
    }

    // Also check if user is currently in-game (this is always included)
    const currentlyPlaying = await getCurrentlyPlayingGame(steamId);
    if (currentlyPlaying.isPlaying && currentlyPlaying.steamAppId) {
      recentlyPlayedAppIds.add(currentlyPlaying.steamAppId);
      console.log(`[Steam Sync] Currently in-game: ${currentlyPlaying.gameName}`);
    }

    // Reset any Steam 'playing' games that are NOT in the recently played list
    // This handles games that haven't been played in the last 2 weeks
    if (recentlyPlayedAppIds.size > 0) {
      // Get all current 'playing' Steam games
      const { data: currentlyPlayingGames } = await supabase
        .from('user_games')
        .select('id, steam_appid')
        .eq('user_id', user.id)
        .eq('platform', 'Steam')
        .eq('status', 'playing');

      if (currentlyPlayingGames) {
        // Reset games that are no longer in recently played
        for (const game of currentlyPlayingGames) {
          if (game.steam_appid && !recentlyPlayedAppIds.has(game.steam_appid)) {
            await supabase
              .from('user_games')
              .update({ status: 'in_progress', updated_at: new Date().toISOString() })
              .eq('id', game.id);
          }
        }
      }
    } else {
      // No recently played games - reset all Steam 'playing' games to 'in_progress'
      await supabase
        .from('user_games')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('platform', 'Steam')
        .eq('status', 'playing');
    }

    // Fetch owned games from Steam
    const steamGames = await getOwnedGames(steamId);

    const result: SteamSyncResult = {
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      gamesSkipped: 0,
      achievementsUpdated: 0,
      achievementsPrivate: 0,
      errors: [],
      warnings: [],
      totalGames: steamGames.length,
    };

    console.log(`[Steam Sync] Steam API returned ${steamGames.length} games`);

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

        // If game doesn't exist in games table, create it
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
        }
        // Note: For existing games, we no longer update game metadata during sync
        // This preserves any user customizations or IGDB data

        // Check if user_games entry exists by steam_appid first (most reliable)
        // This prevents duplicates even if game_id changes
        let { data: existingUserGame } = await supabase
          .from('user_games')
          .select('id, locked_fields')
          .eq('user_id', user.id)
          .eq('steam_appid', steamGame.appid)
          .single();

        // Fallback: check by game_id if steam_appid wasn't set on older entries
        if (!existingUserGame) {
          const { data: fallbackGame } = await supabase
            .from('user_games')
            .select('id, locked_fields')
            .eq('user_id', user.id)
            .eq('game_id', game.id)
            .eq('platform', 'Steam')
            .single();
          existingUserGame = fallbackGame;
        }

        const playtimeHours = convertPlaytimeToHours(steamGame.playtime_forever);
        const lastPlayed =
          steamGame.playtime_forever > 0 ? new Date().toISOString() : null;

        // Check if this game is in the recently played list (includes currently in-game)
        const isRecentlyPlayed = recentlyPlayedAppIds.has(steamGame.appid);

        if (existingUserGame) {
          // For existing games, only sync hours and completion-related fields
          // Build update object respecting locked fields
          const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          // Only sync playtime if not locked
          if (!lockedFields['playtime_hours']) {
            updateData.playtime_hours = playtimeHours;
            updateData.steam_playtime_minutes = steamGame.playtime_forever;
            updateData.steam_last_played = lastPlayed;
          }

          // Always ensure steam_appid is set for session tracking (this is an identifier, not user data)
          updateData.steam_appid = steamGame.appid;

          // If this game was recently played, set status to 'playing' (unless status is locked)
          if (isRecentlyPlayed && !lockedFields['status']) {
            updateData.status = 'playing';
            console.log(`[Steam Sync] Setting ${steamGame.name} as playing (recently played)`);
          }

          const { error: updateError } = await supabase
            .from('user_games')
            .update(updateData)
            .eq('id', existingUserGame.id);

          if (updateError) {
            result.errors.push(`Failed to update ${steamGame.name}: ${updateError.message}`);
          } else {
            result.gamesUpdated++;
          }
        } else {
          // Create new entry - if recently played, set status to 'playing', otherwise 'unplayed'
          const { error: insertError } = await supabase.from('user_games').insert({
            user_id: user.id,
            game_id: game.id,
            platform: 'Steam',
            status: isRecentlyPlayed ? 'playing' : 'unplayed',
            playtime_hours: playtimeHours,
            steam_playtime_minutes: steamGame.playtime_forever,
            steam_last_played: lastPlayed,
            steam_appid: steamGame.appid, // Set steam_appid for session tracking
          });

          if (insertError) {
            result.errors.push(`Failed to add ${steamGame.name}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
            if (isRecentlyPlayed) {
              console.log(`[Steam Sync] Added ${steamGame.name} as playing (recently played)`);
            }
          }
        }

        // Fetch achievements for all games (don't rely on has_community_visible_stats flag)
        try {
          const achievements = await getPlayerAchievements(steamId, steamGame.appid);
          const schema = await getGameSchema(steamGame.appid);

          const schemaAchievementCount = schema?.game?.availableGameStats?.achievements?.length || 0;
          const achievementsEarned = achievements.filter((a) => a.achieved === 1).length;
          const achievementsTotal = schemaAchievementCount || achievements.length;

          // Detect likely privacy issue: game has achievements (per schema) but API returned none
          const likelyPrivacyIssue = schemaAchievementCount > 0 && achievements.length === 0;

          if (likelyPrivacyIssue) {
            result.achievementsPrivate++;
            console.warn(`[Steam Sync] Privacy issue detected for ${steamGame.name}: Game has ${schemaAchievementCount} achievements but API returned none. User's game details may be private.`);
          }

          if (achievementsTotal > 0) {
            const { data: userGame } = await supabase
              .from('user_games')
              .select('id, locked_fields')
              .eq('user_id', user.id)
              .eq('game_id', game.id)
              .eq('platform', 'Steam')
              .single();

            if (userGame) {
              const lockedFields = (userGame.locked_fields as Record<string, boolean>) || {};

              // Only update achievements if not locked (completion-related fields)
              if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
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
          }
        } catch (error) {
          console.error(`[Steam Sync] Achievement error for ${steamGame.name}:`, error);
          // Silently skip achievement sync errors - not all games have achievements
        }
      } catch (error) {
        result.gamesSkipped++;
        result.errors.push(
          `Error processing ${steamGame.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Log sync summary
    console.log(`[Steam Sync] Summary: Added ${result.gamesAdded}, Updated ${result.gamesUpdated}, Skipped ${result.gamesSkipped}, Achievements ${result.achievementsUpdated}`);

    // Add privacy warning if achievements couldn't be fetched for some games
    if (result.achievementsPrivate > 0) {
      result.warnings.push(
        `Achievement data couldn't be fetched for ${result.achievementsPrivate} game${result.achievementsPrivate > 1 ? 's' : ''}. ` +
        `To fix this, go to Steam → Profile → Edit Profile → Privacy Settings and set "Game details" to Public.`
      );
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
        gamesSkipped: 0,
        achievementsUpdated: 0,
        achievementsPrivate: 0,
        errors: [error.message],
        warnings: ['Make sure your Steam profile AND game details are set to Public in Steam privacy settings.'],
        totalGames: 0,
      };
    }

    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      gamesSkipped: 0,
      achievementsUpdated: 0,
      achievementsPrivate: 0,
      errors: [error instanceof Error ? error.message : 'Failed to sync Steam library'],
      warnings: [],
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

    // Check if this game is in recently played (last 2 weeks) or currently playing
    const recentlyPlayedGames = await getRecentlyPlayedGames(steamId);
    const recentlyPlayedAppIds = new Set(recentlyPlayedGames.map(g => g.appid));

    // Also check if currently in-game
    const currentlyPlaying = await getCurrentlyPlayingGame(steamId);
    if (currentlyPlaying.isPlaying && currentlyPlaying.steamAppId) {
      recentlyPlayedAppIds.add(currentlyPlaying.steamAppId);
    }

    const isRecentlyPlayed = recentlyPlayedAppIds.has(appId);

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

    // If game doesn't exist in games table, create it
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
    }
    // Note: For existing games, we no longer update game metadata during sync
    // This preserves any user customizations or IGDB data

    // Update or create user_games entry
    const playtimeHours = convertPlaytimeToHours(steamGame.playtime_forever);
    const lastPlayed = steamGame.playtime_forever > 0 ? new Date().toISOString() : null;

    const { data: existingUserGame } = await supabase
      .from('user_games')
      .select('id, locked_fields')
      .eq('user_id', user.id)
      .eq('game_id', game.id)
      .eq('platform', 'Steam')
      .single();

    if (existingUserGame) {
      // For existing games, only sync hours and completion-related fields
      // Respect locked fields
      const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        steam_appid: appId, // Always ensure steam_appid is set for session tracking
      };

      // Only sync playtime if not locked
      if (!lockedFields['playtime_hours']) {
        updateData.playtime_hours = playtimeHours;
        updateData.steam_playtime_minutes = steamGame.playtime_forever;
        updateData.steam_last_played = lastPlayed;
      }

      // If this game was recently played, set status to 'playing' (unless status is locked)
      if (isRecentlyPlayed && !lockedFields['status']) {
        updateData.status = 'playing';
      }

      const { error: updateError } = await supabase
        .from('user_games')
        .update(updateData)
        .eq('id', existingUserGame.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Create new entry - if recently played, set status to 'playing', otherwise 'unplayed'
      const { error: insertError } = await supabase.from('user_games').insert({
        user_id: user.id,
        game_id: game.id,
        platform: 'Steam',
        status: isRecentlyPlayed ? 'playing' : 'unplayed',
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
          .select('id, locked_fields')
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .eq('platform', 'Steam')
          .single();

        if (userGame) {
          const lockedFields = (userGame.locked_fields as Record<string, boolean>) || {};

          // Only update achievements if not locked
          if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
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

