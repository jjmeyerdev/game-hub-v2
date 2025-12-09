'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeAuthorizationCode,
  refreshAccessToken,
  verifyAccessToken,
  getEnrichedLibrary,
  filterGamesOnly,
} from '@/lib/epic';
import type {
  EpicSyncResult,
  EpicProfile,
} from '@/lib/types/epic';

/**
 * Link Epic Games account using authorization code
 */
export async function linkEpicAccount(authorizationCode: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeAuthorizationCode(authorizationCode);

    // Check if this Epic account is already linked to another user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('epic_account_id', tokens.account_id)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      return { error: 'This Epic Games account is already linked to another user' };
    }

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + tokens.refresh_expires * 1000).toISOString();

    // Store tokens in epic_tokens table
    const { error: tokenError } = await supabase.from('epic_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt,
      updated_at: new Date().toISOString(),
    });

    if (tokenError) {
      console.error('Failed to store Epic tokens:', tokenError);
      return { error: 'Failed to store authentication tokens' };
    }

    // Update user profile with Epic information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        epic_account_id: tokens.account_id,
        epic_display_name: tokens.displayName,
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
        epic_account_id: tokens.account_id,
        epic_display_name: tokens.displayName,
        epic_last_sync: null,
      },
    };
  } catch (error) {
    console.error('[Epic] Link account error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to link Epic Games account',
    };
  }
}

/**
 * Unlink Epic Games account from current user
 */
export async function unlinkEpicAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Delete stored tokens
    await supabase.from('epic_tokens').delete().eq('user_id', user.id);

    // Clear Epic profile data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        epic_account_id: null,
        epic_display_name: null,
        epic_last_sync: null,
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
      error: error instanceof Error ? error.message : 'Failed to unlink Epic Games account',
    };
  }
}

/**
 * Get current user's Epic Games profile information
 */
export async function getEpicProfile(): Promise<EpicProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('epic_account_id, epic_display_name, epic_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.epic_account_id) {
    return null;
  }

  return profile as EpicProfile;
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: tokens } = await supabase
    .from('epic_tokens')
    .select('access_token, refresh_token, expires_at, refresh_expires_at')
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
    // Check if refresh token is also expired
    const refreshExpiresAt = new Date(tokens.refresh_expires_at);
    if (refreshExpiresAt.getTime() < now.getTime()) {
      console.error('[Epic] Refresh token expired');
      return null;
    }

    // Token expired or expiring soon, refresh it
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);

      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
      const newRefreshExpiresAt = new Date(Date.now() + newTokens.refresh_expires * 1000).toISOString();

      await supabase
        .from('epic_tokens')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: newExpiresAt,
          refresh_expires_at: newRefreshExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return newTokens.access_token;
    } catch (error) {
      console.error('Failed to refresh Epic token:', error);
      return null;
    }
  }

  return tokens.access_token;
}

/**
 * Sync Epic Games library - Import/update games from Epic Games Store
 */
export async function syncEpicLibrary(): Promise<EpicSyncResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
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
        errors: ['Epic Games authentication expired. Please re-link your account.'],
        totalGames: 0,
      };
    }

    // Fetch enriched game library from Epic
    const { games: epicGames, missingMetadata } = await getEnrichedLibrary(accessToken);

    // Filter to only actual games (not DLC, add-ons, etc.)
    const gamesOnly = filterGamesOnly(epicGames);

    // Filter out games with gibberish titles (UUIDs, hex strings, internal IDs)
    const validGames = gamesOnly.filter(game => {
      const title = game.title;
      // Skip if title looks like a UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title)) {
        console.log(`[Epic] Skipping game with UUID title: ${title}`);
        return false;
      }
      // Skip if title is just a hex string (32+ characters of hex)
      if (/^[0-9a-f]{32,}$/i.test(title)) {
        console.log(`[Epic] Skipping game with hex string title: ${title}`);
        return false;
      }
      // Skip if title has no readable characters (all special chars/numbers)
      if (!/[a-zA-Z]{2,}/.test(title)) {
        console.log(`[Epic] Skipping game with unreadable title: ${title}`);
        return false;
      }
      return true;
    });

    const result: EpicSyncResult = {
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: [],
      totalGames: validGames.length,
    };

    // Process each game
    for (const epicGame of validGames) {
      try {
        // Use catalogItemId as unique identifier
        const catalogItemId = epicGame.catalogItemId;

        // Check if game exists in games table
        let { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('epic_catalog_item_id', catalogItemId)
          .single();

        // If game doesn't exist, create it
        if (!game) {
          const { data: newGame, error: insertError } = await supabase
            .from('games')
            .insert({
              epic_catalog_item_id: catalogItemId,
              epic_namespace: epicGame.namespace,
              title: epicGame.title,
              description: epicGame.description,
              developer: epicGame.developer,
              cover_url: epicGame.coverUrl,
              platforms: ['Epic Games'],
            })
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Failed to create game ${epicGame.title}: ${insertError.message}`);
            continue;
          }

          game = newGame;
        } else {
          // Update existing game with latest info
          await supabase
            .from('games')
            .update({
              title: epicGame.title,
              description: epicGame.description,
              developer: epicGame.developer,
              cover_url: epicGame.coverUrl,
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
          .eq('platform', 'Epic Games')
          .single();

        if (existingUserGame) {
          // Update existing entry
          const { error: updateError } = await supabase
            .from('user_games')
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUserGame.id);

          if (updateError) {
            result.errors.push(`Failed to update ${epicGame.title}: ${updateError.message}`);
          } else {
            result.gamesUpdated++;
          }
        } else {
          // Create new entry
          const { error: insertError } = await supabase.from('user_games').insert({
            user_id: user.id,
            game_id: game.id,
            platform: 'Epic Games',
            status: 'unplayed',
            achievements_earned: 0,
            achievements_total: 0,
            completion_percentage: 0,
          });

          if (insertError) {
            result.errors.push(`Failed to add ${epicGame.title}: ${insertError.message}`);
          } else {
            result.gamesAdded++;
          }
        }
      } catch (error) {
        result.errors.push(
          `Error processing ${epicGame.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update last sync timestamp
    await supabase
      .from('profiles')
      .update({
        epic_last_sync: new Date().toISOString(),
      })
      .eq('id', user.id);

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return result;
  } catch (error) {
    console.error('[Epic] Sync error:', error);
    return {
      success: false,
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: [error instanceof Error ? error.message : 'Failed to sync Epic Games library'],
      totalGames: 0,
    };
  }
}

/**
 * Refresh Epic tokens (can be called periodically)
 */
export async function refreshEpicTokens() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const accessToken = await getValidAccessToken(user.id);

  if (!accessToken) {
    return { error: 'Failed to refresh tokens. Please re-link your Epic Games account.' };
  }

  return { success: true };
}
