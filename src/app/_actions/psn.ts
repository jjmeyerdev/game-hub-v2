'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  authenticateWithNpsso,
  refreshAccessToken,
  getTrophyProfileSummary,
  getUserProfile,
  getGameLibrary,
  getTrophiesForTitle,
  calculateTotalTrophies,
  calculateDefinedTrophies,
  normalizePsnPlatform,
  getPlayedGamesWithPlaytime,
  parseIsoDuration,
  type PsnPlayedTitle,
} from '@/lib/psn/client';
import {
  PsnSyncResult,
  PsnProfile,
  PsnAuthError,
  PsnPrivacyError,
  InvalidNpssoError,
} from '@/lib/types/psn';

/**
 * Link PSN account using NPSSO token
 */
export async function linkPsnAccount(npssoToken: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Exchange NPSSO for tokens
    const tokens = await authenticateWithNpsso(npssoToken);

    // Get user's PSN trophy summary
    const profileSummary = await getTrophyProfileSummary(tokens.accessToken);

    // Get user's PSN profile (online ID, avatar)
    const userProfile = await getUserProfile(tokens.accessToken, profileSummary.accountId);

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

    // Check if this PSN account is already linked to another user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('psn_account_id', profileSummary.accountId)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      return { error: 'This PSN account is already linked to another user' };
    }

    // Store tokens in psn_tokens table
    const { error: tokenError } = await supabase.from('psn_tokens').upsert({
      user_id: user.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    if (tokenError) {
      console.error('Failed to store PSN tokens:', tokenError);
      return { error: 'Failed to store authentication tokens' };
    }

    // Update user profile with PSN information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        psn_account_id: profileSummary.accountId,
        psn_online_id: userProfile.onlineId || null,
        psn_avatar_url: userProfile.avatarUrl || null,
        psn_trophy_level: parseInt(profileSummary.trophyLevel, 10) || null,
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
        psn_account_id: profileSummary.accountId,
        psn_online_id: userProfile.onlineId || null,
        psn_avatar_url: userProfile.avatarUrl || null,
        psn_trophy_level: parseInt(profileSummary.trophyLevel, 10) || null,
      },
    };
  } catch (error) {
    if (error instanceof InvalidNpssoError) {
      return { error: error.message };
    }
    if (error instanceof PsnAuthError) {
      return { error: error.message };
    }
    if (error instanceof PsnPrivacyError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to link PSN account',
    };
  }
}

/**
 * Unlink PSN account from current user
 */
export async function unlinkPsnAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Delete stored tokens
    await supabase.from('psn_tokens').delete().eq('user_id', user.id);

    // Clear PSN profile data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        psn_account_id: null,
        psn_online_id: null,
        psn_avatar_url: null,
        psn_trophy_level: null,
        psn_last_sync: null,
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
      error: error instanceof Error ? error.message : 'Failed to unlink PSN account',
    };
  }
}

/**
 * Get current user's PSN profile information
 */
export async function getPsnProfile(): Promise<PsnProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('psn_account_id, psn_online_id, psn_avatar_url, psn_trophy_level, psn_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.psn_account_id) {
    return null;
  }

  return profile as PsnProfile;
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: tokens } = await supabase
    .from('psn_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (!tokens) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiresAt.getTime() - now.getTime() < bufferMs) {
    // Token expired or expiring soon, refresh it
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);

      const newExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000).toISOString();

      await supabase
        .from('psn_tokens')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh PSN token:', error);
      return null;
    }
  }

  return tokens.access_token;
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
        // Use npCommunicationId as unique identifier
        const npCommId = psnGame.npCommunicationId;
        const platform = normalizePsnPlatform(psnGame.trophyTitlePlatform);

        // Check if game exists in games table
        let { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('psn_communication_id', npCommId)
          .single();

        // Use PSN trophy icon as cover (fallback to IGDB later if needed)
        const coverUrl = psnGame.trophyTitleIconUrl;

        // If game doesn't exist in games table, create it
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
        // Note: For existing games, we no longer update game metadata during sync
        // This preserves any user customizations or IGDB data

        // Check if user_games entry exists by game_id (without platform filter)
        // This prevents duplicates when platform strings vary between syncs
        // (e.g., same game showing as PS4 vs PS5 due to backward compatibility)
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

        // Parse last played date
        const lastPlayed = psnGame.lastUpdatedDateTime || null;

        // Look up playtime from played games data
        const normalizedTitle = psnGame.trophyTitleName.toLowerCase().trim();
        const playedGame = playedGamesMap.get(normalizedTitle);
        const playtimeMinutes = playedGame ? parseIsoDuration(playedGame.playDuration) : 0;
        const playtimeHours = playtimeMinutes > 0 ? Math.round((playtimeMinutes / 60) * 100) / 100 : 0;

        if (existingUserGame) {
          // For existing games, only sync completion-related fields
          // Respect locked fields
          const lockedFields = (existingUserGame.locked_fields as Record<string, boolean>) || {};

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          // Only sync completion/trophy data if not locked
          if (!lockedFields['completion_percentage'] && !lockedFields['achievements']) {
            updateData.achievements_earned = earnedTotal;
            updateData.achievements_total = definedTotal;
            updateData.completion_percentage = completionPercentage;
          }

          // Only sync last_played if not locked
          if (!lockedFields['last_played_at']) {
            updateData.last_played_at = lastPlayed;
          }

          // Sync playtime if available and not locked
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
          // Create new entry
          const { error: insertError } = await supabase.from('user_games').insert({
            user_id: user.id,
            game_id: game.id,
            platform: platform,
            status: 'unplayed',
            achievements_earned: earnedTotal,
            achievements_total: definedTotal,
            completion_percentage: completionPercentage,
            last_played_at: lastPlayed,
            playtime_hours: playtimeHours,
          });

          if (insertError) {
            result.errors.push(`Failed to add ${psnGame.trophyTitleName}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
          }
        }

        // Count trophy syncs
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
      .update({
        psn_last_sync: new Date().toISOString(),
      })
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

/**
 * Refresh PSN tokens (can be called periodically)
 */
export async function refreshPsnTokens() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const accessToken = await getValidAccessToken(user.id);

  if (!accessToken) {
    return { error: 'Failed to refresh tokens. Please re-link your PSN account.' };
  }

  return { success: true };
}
