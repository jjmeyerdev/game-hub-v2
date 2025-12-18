'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlayerAchievements, getGameSchema } from '@/lib/steam';
import { getTrophiesForTitle } from '@/lib/psn';
import { getGameAchievements as getXboxGameAchievements } from '@/lib/xbox';
import { getValidAccessToken } from '@/lib/actions/psn/auth';
import { getValidApiKey as getXboxApiKey } from '@/lib/actions/xbox/auth';

// Normalized achievement type that works across all platforms
export interface NormalizedAchievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  iconGrayUrl?: string;
  unlocked: boolean;
  unlockDate?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'ultra_rare';
  rarityPercentage?: number;
  // PlayStation specific
  trophyType?: 'platinum' | 'gold' | 'silver' | 'bronze';
  // Xbox specific
  gamerscore?: number;
  // Hidden/secret achievement
  isHidden?: boolean;
}

export interface GameAchievementsResult {
  success: boolean;
  achievements: NormalizedAchievement[];
  platform: 'steam' | 'psn' | 'xbox' | 'unknown';
  error?: string;
}

/**
 * Calculate rarity tier based on unlock percentage
 */
function calculateRarity(percentage: number): NormalizedAchievement['rarity'] {
  if (percentage <= 5) return 'ultra_rare';
  if (percentage <= 15) return 'very_rare';
  if (percentage <= 30) return 'rare';
  if (percentage <= 50) return 'uncommon';
  return 'common';
}

/**
 * Fetch achievements for a specific game from the appropriate platform API
 */
export async function getGameAchievements(userGameId: string): Promise<GameAchievementsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, achievements: [], platform: 'unknown', error: 'Not authenticated' };
  }

  // Get user game with game details
  const { data: userGame, error: gameError } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('id', userGameId)
    .eq('user_id', user.id)
    .single();

  if (gameError || !userGame) {
    return { success: false, achievements: [], platform: 'unknown', error: 'Game not found' };
  }

  // Get user profile with platform credentials
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('steam_id, psn_account_id, xbox_xuid')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, achievements: [], platform: 'unknown', error: 'Profile not found' };
  }

  const platform = (userGame.platform || '').toLowerCase();
  const game = userGame.game;

  // Determine platform and fetch achievements
  try {
    // Steam
    if ((platform.includes('steam') || game?.steam_appid) && profile.steam_id && game?.steam_appid) {
      return await fetchSteamAchievements(profile.steam_id, game.steam_appid);
    }

    // PlayStation
    if ((platform.includes('playstation') || platform.startsWith('ps') || game?.psn_communication_id) &&
        profile.psn_account_id && game?.psn_communication_id) {
      return await fetchPsnTrophies(user.id, profile.psn_account_id, game.psn_communication_id, platform);
    }

    // Xbox (Xbox One/Series only - Xbox 360 not supported via OpenXBL)
    if ((platform.includes('xbox') || game?.xbox_title_id) &&
        profile.xbox_xuid && game?.xbox_title_id &&
        !platform.toLowerCase().includes('360')) {
      const xboxApiKey = await getXboxApiKey(user.id);
      if (xboxApiKey) {
        return await fetchXboxAchievements(xboxApiKey, profile.xbox_xuid, game.xbox_title_id);
      }
    }

    return {
      success: false,
      achievements: [],
      platform: 'unknown',
      error: 'Platform not supported or credentials missing'
    };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return {
      success: false,
      achievements: [],
      platform: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to fetch achievements'
    };
  }
}

/**
 * Fetch Steam achievements
 */
async function fetchSteamAchievements(steamId: string, appId: number): Promise<GameAchievementsResult> {
  // Fetch both player achievements and game schema in parallel
  const [playerAchievements, gameSchema] = await Promise.all([
    getPlayerAchievements(steamId, appId),
    getGameSchema(appId),
  ]);

  if (!playerAchievements.length) {
    return { success: true, achievements: [], platform: 'steam' };
  }

  const schemaAchievements = gameSchema?.game?.availableGameStats?.achievements || [];

  // Create a map of schema achievements for quick lookup
  const schemaMap = new Map(
    schemaAchievements.map(a => [a.name, a])
  );

  const achievements: NormalizedAchievement[] = playerAchievements.map((pa, index) => {
    const schema = schemaMap.get(pa.apiname);
    // Estimate rarity based on position (no global stats API access)
    const estimatedPercentage = schema ? (100 - (index / playerAchievements.length) * 80) : 50;

    return {
      id: pa.apiname,
      name: schema?.displayName || pa.name || pa.apiname,
      description: schema?.description || pa.description || '',
      iconUrl: schema?.icon,
      iconGrayUrl: schema?.icongray,
      unlocked: pa.achieved === 1,
      unlockDate: pa.unlocktime > 0 ? new Date(pa.unlocktime * 1000).toISOString() : undefined,
      rarity: calculateRarity(estimatedPercentage),
      rarityPercentage: estimatedPercentage,
      isHidden: schema?.hidden === 1,
    };
  });

  // Sort: unlocked first, then by unlock date (newest first), then by name
  achievements.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1;
    if (a.unlocked && b.unlocked && a.unlockDate && b.unlockDate) {
      return new Date(b.unlockDate).getTime() - new Date(a.unlockDate).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  return { success: true, achievements, platform: 'steam' };
}

/**
 * Fetch PlayStation trophies
 */
async function fetchPsnTrophies(
  userId: string,
  accountId: string,
  npCommunicationId: string,
  platform: string
): Promise<GameAchievementsResult> {
  try {
    // Get valid access token for PSN API
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return { success: false, achievements: [], platform: 'psn', error: 'PSN authentication expired' };
    }

    // Determine trophy service based on platform
    // PS4/PS5 use 'trophy2', PS3/Vita use 'trophy'
    const isLegacy = platform.toLowerCase().includes('ps3') || platform.toLowerCase().includes('vita');
    let npService: 'trophy' | 'trophy2' = isLegacy ? 'trophy' : 'trophy2';

    let trophies = await getTrophiesForTitle(accessToken, npCommunicationId, npService, accountId);

    // If no trophies found, try the other service
    if (trophies.length === 0) {
      npService = npService === 'trophy2' ? 'trophy' : 'trophy2';
      trophies = await getTrophiesForTitle(accessToken, npCommunicationId, npService, accountId);
    }

    const achievements: NormalizedAchievement[] = trophies.map(trophy => {
      const rarityPct = trophy.trophyEarnedRate ? parseFloat(trophy.trophyEarnedRate) : 50;

      return {
        id: trophy.trophyId.toString(),
        name: trophy.trophyName || 'Hidden Trophy',
        description: trophy.trophyDetail || 'This trophy is hidden.',
        iconUrl: trophy.trophyIconUrl,
        unlocked: trophy.earned || false,
        unlockDate: trophy.earnedDateTime,
        rarity: calculateRarity(rarityPct),
        rarityPercentage: rarityPct,
        trophyType: trophy.trophyType as NormalizedAchievement['trophyType'],
        isHidden: trophy.trophyHidden,
      };
    });

    // Sort: platinum first, then by trophy type, then unlocked status
    const trophyOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    achievements.sort((a, b) => {
      const aOrder = trophyOrder[a.trophyType || 'bronze'];
      const bOrder = trophyOrder[b.trophyType || 'bronze'];
      if (aOrder !== bOrder) return aOrder - bOrder;
      if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, achievements, platform: 'psn' };
  } catch (error) {
    console.error('Error fetching PSN trophies:', error);
    return { success: false, achievements: [], platform: 'psn', error: 'Failed to fetch trophies' };
  }
}

/**
 * Fetch Xbox achievements via OpenXBL (Xbox One/Series only)
 */
async function fetchXboxAchievements(
  apiKey: string,
  xuid: string,
  titleId: string
): Promise<GameAchievementsResult> {
  try {
    // Xbox client uses (xuid, titleId, apiKey) parameter order
    const xboxAchievements = await getXboxGameAchievements(xuid, titleId, apiKey);

    const achievements: NormalizedAchievement[] = xboxAchievements.map(xa => {
      const rarityPct = xa.rarity?.currentPercentage || 50;
      const unlocked = xa.progressState === 'Achieved';
      const unlockTime = xa.progression?.timeUnlocked;

      return {
        id: xa.id,
        name: xa.name,
        description: unlocked ? xa.description : (xa.lockedDescription || xa.description),
        iconUrl: xa.mediaAssets?.find(m => m.type === 'Icon')?.url,
        unlocked,
        unlockDate: unlockTime && unlockTime !== '0001-01-01T00:00:00Z' ? unlockTime : undefined,
        rarity: calculateRarity(rarityPct),
        rarityPercentage: rarityPct,
        gamerscore: xa.rewards?.find(r => r.type === 'Gamerscore')?.value
          ? parseInt(xa.rewards.find(r => r.type === 'Gamerscore')?.value || '0')
          : undefined,
        isHidden: xa.isSecret,
      };
    });

    // Sort: unlocked first, then by gamerscore (highest first)
    achievements.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1;
      return (b.gamerscore || 0) - (a.gamerscore || 0);
    });

    return { success: true, achievements, platform: 'xbox' };
  } catch (error) {
    console.error('Error fetching Xbox achievements:', error);
    return { success: false, achievements: [], platform: 'xbox', error: 'Failed to fetch achievements' };
  }
}
