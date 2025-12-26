'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
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
  SteamPrivacyError,
} from '@/lib/types/steam';

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

    // Also check if user is currently in-game
    const currentlyPlaying = await getCurrentlyPlayingGame(steamId);
    if (currentlyPlaying.isPlaying && currentlyPlaying.steamAppId) {
      recentlyPlayedAppIds.add(currentlyPlaying.steamAppId);
    }

    // Reset any Steam 'playing' games that are NOT in the recently played list
    if (recentlyPlayedAppIds.size > 0) {
      const { data: currentlyPlayingGames } = await supabase
        .from('user_games')
        .select('id, steam_appid')
        .eq('user_id', user.id)
        .eq('platform', 'Steam')
        .eq('status', 'playing');

      if (currentlyPlayingGames) {
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

        // Check if user_games entry exists by steam_appid first
        let { data: existingUserGame } = await supabase
          .from('user_games')
          .select('id, locked_fields')
          .eq('user_id', user.id)
          .eq('steam_appid', steamGame.appid)
          .single();

        // Fallback: check by game_id
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
        const lastPlayed = steamGame.playtime_forever > 0 ? new Date().toISOString() : null;
        const isRecentlyPlayed = recentlyPlayedAppIds.has(steamGame.appid);

        if (existingUserGame) {
          const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            steam_appid: steamGame.appid,
          };

          if (!lockedFields['playtime_hours']) {
            updateData.playtime_hours = playtimeHours;
            updateData.steam_playtime_minutes = steamGame.playtime_forever;
            updateData.steam_last_played = lastPlayed;
          }

          if (isRecentlyPlayed && !lockedFields['status']) {
            updateData.status = 'playing';
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
          const { error: insertError } = await supabase.from('user_games').insert({
            user_id: user.id,
            game_id: game.id,
            platform: 'Steam',
            status: isRecentlyPlayed ? 'playing' : 'unplayed',
            playtime_hours: playtimeHours,
            steam_playtime_minutes: steamGame.playtime_forever,
            steam_last_played: lastPlayed,
            steam_appid: steamGame.appid,
          });

          if (insertError) {
            result.errors.push(`Failed to add ${steamGame.name}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
          }
        }

        // Fetch achievements
        try {
          const achievements = await getPlayerAchievements(steamId, steamGame.appid);
          const schema = await getGameSchema(steamGame.appid);

          const schemaAchievementCount = schema?.game?.availableGameStats?.achievements?.length || 0;
          const achievementsEarned = achievements.filter((a) => a.achieved === 1).length;
          const achievementsTotal = schemaAchievementCount || achievements.length;

          const likelyPrivacyIssue = schemaAchievementCount > 0 && achievements.length === 0;

          if (likelyPrivacyIssue) {
            result.achievementsPrivate++;
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

              if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
                const updateData: Record<string, unknown> = {
                  achievements_earned: achievementsEarned,
                  achievements_total: achievementsTotal,
                };

                // Set completed_at when reaching 100% completion
                if (achievementsEarned === achievementsTotal && achievementsTotal > 0) {
                  updateData.completed_at = new Date().toISOString();
                }

                const { error: achievementUpdateError } = await supabase
                  .from('user_games')
                  .update(updateData)
                  .eq('id', userGame.id);

                if (!achievementUpdateError) {
                  result.achievementsUpdated++;
                }
              }
            }
          }
        } catch {
          // Silently skip achievement sync errors
        }
      } catch (error) {
        result.gamesSkipped++;
        result.errors.push(
          `Error processing ${steamGame.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (result.achievementsPrivate > 0) {
      result.warnings.push(
        `Achievement data couldn't be fetched for ${result.achievementsPrivate} game${result.achievementsPrivate > 1 ? 's' : ''}. ` +
        `To fix this, go to Steam → Profile → Edit Profile → Privacy Settings and set "Game details" to Public.`
      );
    }

    await supabase
      .from('profiles')
      .update({ steam_last_sync: new Date().toISOString() })
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('steam_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.steam_id) {
      return { success: false, error: 'Steam account not linked' };
    }

    const steamId = profile.steam_id;

    // Check if this game is in recently played or currently playing
    const recentlyPlayedGames = await getRecentlyPlayedGames(steamId);
    const recentlyPlayedAppIds = new Set(recentlyPlayedGames.map(g => g.appid));

    const currentlyPlaying = await getCurrentlyPlayingGame(steamId);
    if (currentlyPlaying.isPlaying && currentlyPlaying.steamAppId) {
      recentlyPlayedAppIds.add(currentlyPlaying.steamAppId);
    }

    const isRecentlyPlayed = recentlyPlayedAppIds.has(appId);

    const steamGames = await getOwnedGames(steamId);
    const steamGame = steamGames.find((g) => g.appid === appId);

    if (!steamGame) {
      return { success: false, error: 'Game not found in Steam library' };
    }

    let { data: game } = await supabase
      .from('games')
      .select('id, title')
      .eq('steam_appid', appId)
      .single();

    const coverUrl = getSteamLibraryCapsuleUrl(appId);

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
      const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        steam_appid: appId,
      };

      if (!lockedFields['playtime_hours']) {
        updateData.playtime_hours = playtimeHours;
        updateData.steam_playtime_minutes = steamGame.playtime_forever;
        updateData.steam_last_played = lastPlayed;
      }

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
      const { error: insertError } = await supabase.from('user_games').insert({
        user_id: user.id,
        game_id: game.id,
        platform: 'Steam',
        status: isRecentlyPlayed ? 'playing' : 'unplayed',
        playtime_hours: playtimeHours,
        steam_playtime_minutes: steamGame.playtime_forever,
        steam_last_played: lastPlayed,
        steam_appid: appId,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    // Sync achievements
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

          if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
            const updateData: Record<string, unknown> = {
              achievements_earned: achievementsEarned,
              achievements_total: achievementsTotal,
              completion_percentage: Math.round((achievementsEarned / achievementsTotal) * 100),
            };

            // Set completed_at when reaching 100% completion
            if (achievementsEarned === achievementsTotal && achievementsTotal > 0) {
              updateData.completed_at = new Date().toISOString();
            }

            await supabase
              .from('user_games')
              .update(updateData)
              .eq('id', userGame.id);
          }
        }
      }
    } catch {
      // Silently skip achievement errors
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
