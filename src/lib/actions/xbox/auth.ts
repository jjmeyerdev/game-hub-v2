'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMyProfile } from '@/lib/xbox/client';
import {
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
 * Get valid API key for the user
 */
export async function getValidApiKey(userId: string): Promise<string | null> {
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
