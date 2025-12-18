'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateSteamId, getPlayerSummary } from '@/lib/steam/client';
import { SteamPrivacyError, InvalidSteamIdError } from '@/lib/types/steam';

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
