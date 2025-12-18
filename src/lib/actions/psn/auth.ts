'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  authenticateWithNpsso,
  refreshAccessToken,
  getTrophyProfileSummary,
  getUserProfile,
} from '@/lib/psn/client';
import {
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
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
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
