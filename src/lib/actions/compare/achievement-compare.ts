'use server';

import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/actions/psn/auth';
import { getValidApiKey } from '@/lib/actions/xbox/auth';
import { getTrophiesForTitle, getGameLibrary } from '@/lib/psn/client';
import { getTitleHistoryByXuid, getGameAchievements as getXboxGameAchievements, searchByGamertag } from '@/lib/xbox/client';
import { getPlayerAchievements, getGameSchema, getOwnedGames } from '@/lib/steam/client';
import type { ComparePlatform } from '@/lib/types/compare';

/**
 * Progress step types for UI feedback
 */
export type ComparisonStep =
  | 'initializing'
  | 'searching_friend'
  | 'loading_libraries'
  | 'finding_game'
  | 'loading_achievements'
  | 'processing'
  | 'complete'
  | 'error';

export interface ComparisonProgress {
  step: ComparisonStep;
  message: string;
  percentage: number;
}

/**
 * Step 1: Validate user and search for friend
 * Returns friend info if found, or error
 */
export async function initializeComparison(
  platform: ComparePlatform,
  friendIdentifier: string
): Promise<{
  success: boolean;
  error?: string;
  friendInfo?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  userInfo?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }

  try {
    if (platform === 'xbox') {
      const apiKey = await getValidApiKey(user.id);
      if (!apiKey) {
        return { success: false, error: 'Xbox account not connected' };
      }
      if (!profile.xbox_xuid) {
        return { success: false, error: 'Xbox XUID not found' };
      }

      const friendSearch = await searchByGamertag(friendIdentifier, apiKey);
      if (!friendSearch) {
        return { success: false, error: `Friend "${friendIdentifier}" not found` };
      }

      return {
        success: true,
        friendInfo: {
          id: friendSearch.xuid,
          username: friendSearch.gamertag,
          avatarUrl: friendSearch.gamerPicture || null,
        },
        userInfo: {
          id: profile.xbox_xuid,
          username: profile.xbox_gamertag || 'You',
          avatarUrl: profile.xbox_avatar_url || null,
        },
      };
    }

    if (platform === 'psn') {
      const accessToken = await getValidAccessToken(user.id);
      if (!accessToken) {
        return { success: false, error: 'PSN account not connected' };
      }
      if (!profile.psn_account_id) {
        return { success: false, error: 'PSN account ID not found' };
      }

      const { searchPsnUser } = await import('@/lib/psn/client');
      const friendSearch = await searchPsnUser(accessToken, friendIdentifier);
      if (!friendSearch) {
        return { success: false, error: `Friend "${friendIdentifier}" not found` };
      }

      return {
        success: true,
        friendInfo: {
          id: friendSearch.accountId,
          username: friendSearch.onlineId,
          avatarUrl: friendSearch.avatarUrl,
        },
        userInfo: {
          id: profile.psn_account_id,
          username: profile.psn_online_id || 'You',
          avatarUrl: profile.psn_avatar_url || null,
        },
      };
    }

    if (platform === 'steam') {
      if (!profile.steam_id) {
        return { success: false, error: 'Steam account not connected' };
      }

      const { getPlayerSummary, validateSteamId } = await import('@/lib/steam/client');
      let validatedFriendId: string;
      try {
        validatedFriendId = validateSteamId(friendIdentifier);
      } catch {
        return { success: false, error: 'Invalid friend Steam ID' };
      }

      const friendProfile = await getPlayerSummary(validatedFriendId);
      if (!friendProfile) {
        return { success: false, error: 'Friend not found on Steam' };
      }

      return {
        success: true,
        friendInfo: {
          id: validatedFriendId,
          username: friendProfile.personaname,
          avatarUrl: friendProfile.avatarfull || null,
        },
        userInfo: {
          id: profile.steam_id,
          username: profile.steam_persona_name || 'You',
          avatarUrl: profile.steam_avatar_url || null,
        },
      };
    }

    return { success: false, error: 'Invalid platform' };
  } catch (error) {
    console.error('Initialize comparison error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize comparison' };
  }
}

/**
 * Normalize a game title for flexible matching
 * - Removes special characters and diacritics
 * - Converts to lowercase
 * - Normalizes whitespace
 */
function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    // Normalize unicode characters (é -> e, ö -> o, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace special characters with spaces
    .replace(/[^a-z0-9\s]/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find a game in a list by fuzzy title matching
 */
function findGameByTitle<T extends { name?: string; trophyTitleName?: string }>(
  games: T[],
  searchTitle: string,
  getTitleFn: (game: T) => string
): T | undefined {
  const normalizedSearch = normalizeGameTitle(searchTitle);

  // Try exact normalized match first
  const exactMatch = games.find(g => normalizeGameTitle(getTitleFn(g)) === normalizedSearch);
  if (exactMatch) return exactMatch;

  // Try contains match (for subtitle variations)
  const containsMatch = games.find(g => {
    const normalizedGame = normalizeGameTitle(getTitleFn(g));
    return normalizedGame.includes(normalizedSearch) || normalizedSearch.includes(normalizedGame);
  });
  if (containsMatch) return containsMatch;

  return undefined;
}

export interface ComparisonAchievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  iconGrayUrl?: string;
  // User status
  userUnlocked: boolean;
  userUnlockDate?: string;
  // Friend status
  friendUnlocked: boolean;
  friendUnlockDate?: string;
  // Rarity
  rarityPercentage?: number;
  // Platform specific
  trophyType?: 'platinum' | 'gold' | 'silver' | 'bronze';
  gamerscore?: number;
  isHidden?: boolean;
}

export interface AchievementComparisonResult {
  success: boolean;
  game: {
    title: string;
    coverUrl: string | null;
  };
  user: {
    username: string;
    avatarUrl: string | null;
    earnedCount: number;
    totalCount: number;
    progress: number;
  };
  friend: {
    username: string;
    avatarUrl: string | null;
    earnedCount: number;
    totalCount: number;
    progress: number;
  };
  achievements: ComparisonAchievement[];
  platform: ComparePlatform;
  error?: string;
}

/**
 * Get achievement comparison data for a specific game between user and friend
 */
export async function getAchievementComparison(
  platform: ComparePlatform,
  gameTitle: string,
  friendIdentifier: string
): Promise<AchievementComparisonResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResult('Not authenticated');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return createErrorResult('Profile not found');
  }

  try {
    switch (platform) {
      case 'psn':
        return await comparePsnAchievements(user.id, profile, gameTitle, friendIdentifier);
      case 'xbox':
        return await compareXboxAchievements(user.id, profile, gameTitle, friendIdentifier);
      case 'steam':
        return await compareSteamAchievements(profile, gameTitle, friendIdentifier);
      default:
        return createErrorResult('Invalid platform');
    }
  } catch (error) {
    console.error('Achievement comparison error:', error);
    return createErrorResult(error instanceof Error ? error.message : 'Failed to compare achievements');
  }
}

function createErrorResult(error: string): AchievementComparisonResult {
  return {
    success: false,
    game: { title: '', coverUrl: null },
    user: { username: '', avatarUrl: null, earnedCount: 0, totalCount: 0, progress: 0 },
    friend: { username: '', avatarUrl: null, earnedCount: 0, totalCount: 0, progress: 0 },
    achievements: [],
    platform: 'psn',
    error,
  };
}

async function comparePsnAchievements(
  userId: string,
  profile: { psn_account_id?: string; psn_online_id?: string; psn_avatar_url?: string },
  gameTitle: string,
  friendOnlineId: string
): Promise<AchievementComparisonResult> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return createErrorResult('PSN account not connected');
  }

  if (!profile.psn_account_id) {
    return createErrorResult('PSN account ID not found');
  }

  // Search for friend to get their account ID
  const { searchPsnUser } = await import('@/lib/psn/client');
  const friendSearch = await searchPsnUser(accessToken, friendOnlineId);
  if (!friendSearch) {
    return createErrorResult(`Friend "${friendOnlineId}" not found`);
  }

  // Get both users' game libraries to find the communication ID
  const [userGames, friendGames] = await Promise.all([
    getGameLibrary(accessToken, profile.psn_account_id),
    getGameLibrary(accessToken, friendSearch.accountId),
  ]);

  // Find the game in both libraries using fuzzy matching
  const userGame = findGameByTitle(userGames, gameTitle, g => g.trophyTitleName);
  const friendGame = findGameByTitle(friendGames, gameTitle, g => g.trophyTitleName);

  if (!userGame && !friendGame) {
    return createErrorResult(`Game "${gameTitle}" not found in either library`);
  }

  const gameInfo = userGame || friendGame!;
  const npCommunicationId = gameInfo.npCommunicationId;
  const npServiceName = gameInfo.npServiceName as 'trophy' | 'trophy2' || 'trophy2';

  // Fetch trophies for both users
  const [userTrophies, friendTrophies] = await Promise.all([
    userGame ? getTrophiesForTitle(accessToken, npCommunicationId, npServiceName, profile.psn_account_id) : [],
    friendGame ? getTrophiesForTitle(accessToken, npCommunicationId, npServiceName, friendSearch.accountId) : [],
  ]);

  // Build trophy map from friend's data
  const friendTrophyMap = new Map(
    friendTrophies.map(t => [t.trophyId, t])
  );

  // Merge achievements
  const sourceTrophies = userTrophies.length > 0 ? userTrophies : friendTrophies;
  const achievements: ComparisonAchievement[] = sourceTrophies.map(trophy => {
    const friendTrophy = friendTrophyMap.get(trophy.trophyId);

    return {
      id: trophy.trophyId.toString(),
      name: trophy.trophyName || 'Hidden Trophy',
      description: trophy.trophyDetail || '',
      iconUrl: trophy.trophyIconUrl,
      userUnlocked: userTrophies.find(t => t.trophyId === trophy.trophyId)?.earned || false,
      userUnlockDate: userTrophies.find(t => t.trophyId === trophy.trophyId)?.earnedDateTime,
      friendUnlocked: friendTrophy?.earned || false,
      friendUnlockDate: friendTrophy?.earnedDateTime,
      rarityPercentage: trophy.trophyEarnedRate ? parseFloat(trophy.trophyEarnedRate) : undefined,
      trophyType: trophy.trophyType as ComparisonAchievement['trophyType'],
      isHidden: trophy.trophyHidden,
    };
  });

  // Sort by trophy type, then by name
  const trophyOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  achievements.sort((a, b) => {
    const aOrder = trophyOrder[a.trophyType || 'bronze'];
    const bOrder = trophyOrder[b.trophyType || 'bronze'];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  const userEarned = achievements.filter(a => a.userUnlocked).length;
  const friendEarned = achievements.filter(a => a.friendUnlocked).length;

  return {
    success: true,
    game: {
      title: gameInfo.trophyTitleName,
      coverUrl: gameInfo.trophyTitleIconUrl || null,
    },
    user: {
      username: profile.psn_online_id || 'You',
      avatarUrl: profile.psn_avatar_url || null,
      earnedCount: userEarned,
      totalCount: achievements.length,
      progress: achievements.length > 0 ? Math.round((userEarned / achievements.length) * 100) : 0,
    },
    friend: {
      username: friendSearch.onlineId,
      avatarUrl: friendSearch.avatarUrl,
      earnedCount: friendEarned,
      totalCount: achievements.length,
      progress: achievements.length > 0 ? Math.round((friendEarned / achievements.length) * 100) : 0,
    },
    achievements,
    platform: 'psn',
  };
}

async function compareXboxAchievements(
  userId: string,
  profile: { xbox_xuid?: string; xbox_gamertag?: string; xbox_avatar_url?: string },
  gameTitle: string,
  friendGamertag: string
): Promise<AchievementComparisonResult> {
  const apiKey = await getValidApiKey(userId);
  if (!apiKey) {
    return createErrorResult('Xbox account not connected');
  }

  if (!profile.xbox_xuid) {
    return createErrorResult('Xbox XUID not found');
  }

  // Search for friend
  const { searchByGamertag } = await import('@/lib/xbox/client');
  const friendSearch = await searchByGamertag(friendGamertag, apiKey);
  if (!friendSearch) {
    return createErrorResult(`Friend "${friendGamertag}" not found`);
  }

  // Get both users' game libraries to find title ID
  const [userGames, friendGames] = await Promise.all([
    getTitleHistoryByXuid(profile.xbox_xuid, apiKey),
    getTitleHistoryByXuid(friendSearch.xuid, apiKey),
  ]);

  // Find the game using fuzzy matching
  const userGame = findGameByTitle(userGames, gameTitle, g => g.name);
  const friendGame = findGameByTitle(friendGames, gameTitle, g => g.name);

  if (!userGame && !friendGame) {
    return createErrorResult(`Game "${gameTitle}" not found in either library`);
  }

  const gameInfo = userGame || friendGame!;
  const titleId = gameInfo.titleId;

  // Fetch achievements for both users
  const [userAchievements, friendAchievements] = await Promise.all([
    userGame ? getXboxGameAchievements(profile.xbox_xuid, titleId, apiKey) : [],
    friendGame ? getXboxGameAchievements(friendSearch.xuid, titleId, apiKey) : [],
  ]);

  // Xbox 360 games don't have detailed achievement data through OpenXBL
  // Check if we got any achievements - if not, it might be an Xbox 360 title
  if (userAchievements.length === 0 && friendAchievements.length === 0) {
    // Check if the game has achievement data in the title history
    const userAchCount = userGame?.achievement?.currentAchievements || 0;
    const friendAchCount = friendGame?.achievement?.currentAchievements || 0;
    const totalAch = userGame?.achievement?.totalAchievements || friendGame?.achievement?.totalAchievements || 0;

    if (totalAch > 0) {
      // This is an Xbox 360 game - we have counts but no details
      return {
        success: true,
        game: {
          title: gameInfo.name,
          coverUrl: gameInfo.displayImage || null,
        },
        user: {
          username: profile.xbox_gamertag || 'You',
          avatarUrl: profile.xbox_avatar_url || null,
          earnedCount: userAchCount,
          totalCount: totalAch,
          progress: totalAch > 0 ? Math.round((userAchCount / totalAch) * 100) : 0,
        },
        friend: {
          username: friendSearch.gamertag,
          avatarUrl: friendSearch.gamerPicture || null,
          earnedCount: friendAchCount,
          totalCount: totalAch,
          progress: totalAch > 0 ? Math.round((friendAchCount / totalAch) * 100) : 0,
        },
        achievements: [], // Empty - no detailed data available
        platform: 'xbox',
        error: 'Achievement details are not available for Xbox 360 games. Only total counts are shown.',
      };
    }

    return createErrorResult('No achievement data available for this game');
  }

  // Build friend achievement map
  const friendAchievementMap = new Map(
    friendAchievements.map(a => [a.id, a])
  );

  // Merge achievements
  const sourceAchievements = userAchievements.length > 0 ? userAchievements : friendAchievements;
  const achievements: ComparisonAchievement[] = sourceAchievements.map(xa => {
    const friendXa = friendAchievementMap.get(xa.id);
    const userUnlocked = userAchievements.find(a => a.id === xa.id)?.progressState === 'Achieved';
    const friendUnlocked = friendXa?.progressState === 'Achieved';

    return {
      id: xa.id,
      name: xa.name,
      description: xa.description,
      iconUrl: xa.mediaAssets?.find(m => m.type === 'Icon')?.url,
      userUnlocked,
      userUnlockDate: userUnlocked ? userAchievements.find(a => a.id === xa.id)?.progression?.timeUnlocked : undefined,
      friendUnlocked,
      friendUnlockDate: friendUnlocked ? friendXa?.progression?.timeUnlocked : undefined,
      rarityPercentage: xa.rarity?.currentPercentage,
      gamerscore: xa.rewards?.find(r => r.type === 'Gamerscore')?.value
        ? parseInt(xa.rewards.find(r => r.type === 'Gamerscore')?.value || '0')
        : undefined,
      isHidden: xa.isSecret,
    };
  });

  // Sort by gamerscore
  achievements.sort((a, b) => (b.gamerscore || 0) - (a.gamerscore || 0));

  const userEarned = achievements.filter(a => a.userUnlocked).length;
  const friendEarned = achievements.filter(a => a.friendUnlocked).length;

  return {
    success: true,
    game: {
      title: gameInfo.name,
      coverUrl: gameInfo.displayImage || null,
    },
    user: {
      username: profile.xbox_gamertag || 'You',
      avatarUrl: profile.xbox_avatar_url || null,
      earnedCount: userEarned,
      totalCount: achievements.length,
      progress: achievements.length > 0 ? Math.round((userEarned / achievements.length) * 100) : 0,
    },
    friend: {
      username: friendSearch.gamertag,
      avatarUrl: friendSearch.gamerPicture || null,
      earnedCount: friendEarned,
      totalCount: achievements.length,
      progress: achievements.length > 0 ? Math.round((friendEarned / achievements.length) * 100) : 0,
    },
    achievements,
    platform: 'xbox',
  };
}

async function compareSteamAchievements(
  profile: { steam_id?: string; steam_persona_name?: string; steam_avatar_url?: string },
  gameTitle: string,
  friendSteamId: string
): Promise<AchievementComparisonResult> {
  if (!profile.steam_id) {
    return createErrorResult('Steam account not connected');
  }

  // Get friend's profile
  const { getPlayerSummary, validateSteamId } = await import('@/lib/steam/client');

  let validatedFriendId: string;
  try {
    validatedFriendId = validateSteamId(friendSteamId);
  } catch {
    return createErrorResult('Invalid friend Steam ID');
  }

  const friendProfile = await getPlayerSummary(validatedFriendId);
  if (!friendProfile) {
    return createErrorResult('Friend not found on Steam');
  }

  // Get both users' games to find the appId
  const [userGames, friendGames] = await Promise.all([
    getOwnedGames(profile.steam_id),
    getOwnedGames(validatedFriendId),
  ]);

  // Find the game using fuzzy matching
  const userGame = findGameByTitle(userGames, gameTitle, g => g.name);
  const friendGame = findGameByTitle(friendGames, gameTitle, g => g.name);

  if (!userGame && !friendGame) {
    return createErrorResult(`Game "${gameTitle}" not found in either library`);
  }

  const gameInfo = userGame || friendGame!;
  const appId = gameInfo.appid;

  // Get game schema and both users' achievements
  const [gameSchema, userAchievements, friendAchievements] = await Promise.all([
    getGameSchema(appId),
    userGame ? getPlayerAchievements(profile.steam_id, appId) : [],
    friendGame ? getPlayerAchievements(validatedFriendId, appId) : [],
  ]);

  const schemaAchievements = gameSchema?.game?.availableGameStats?.achievements || [];

  if (schemaAchievements.length === 0) {
    return createErrorResult('This game has no achievements');
  }

  // Build achievement maps
  const userAchievementMap = new Map(userAchievements.map(a => [a.apiname, a]));
  const friendAchievementMap = new Map(friendAchievements.map(a => [a.apiname, a]));

  const achievements: ComparisonAchievement[] = schemaAchievements.map((schema, index) => {
    const userAch = userAchievementMap.get(schema.name);
    const friendAch = friendAchievementMap.get(schema.name);
    // Estimate rarity
    const estimatedPercentage = 100 - (index / schemaAchievements.length) * 80;

    return {
      id: schema.name,
      name: schema.displayName || schema.name,
      description: schema.description || '',
      iconUrl: schema.icon,
      iconGrayUrl: schema.icongray,
      userUnlocked: userAch?.achieved === 1,
      userUnlockDate: userAch?.unlocktime ? new Date(userAch.unlocktime * 1000).toISOString() : undefined,
      friendUnlocked: friendAch?.achieved === 1,
      friendUnlockDate: friendAch?.unlocktime ? new Date(friendAch.unlocktime * 1000).toISOString() : undefined,
      rarityPercentage: estimatedPercentage,
      isHidden: schema.hidden === 1,
    };
  });

  const userEarned = achievements.filter(a => a.userUnlocked).length;
  const friendEarned = achievements.filter(a => a.friendUnlocked).length;

  const { getSteamHeaderUrl } = await import('@/lib/steam/client');

  return {
    success: true,
    game: {
      title: gameInfo.name,
      coverUrl: getSteamHeaderUrl(appId),
    },
    user: {
      username: profile.steam_persona_name || 'You',
      avatarUrl: profile.steam_avatar_url || null,
      earnedCount: userEarned,
      totalCount: achievements.length,
      progress: achievements.length > 0 ? Math.round((userEarned / achievements.length) * 100) : 0,
    },
    friend: {
      username: friendProfile.personaname,
      avatarUrl: friendProfile.avatarfull || null,
      earnedCount: friendEarned,
      totalCount: achievements.length,
      progress: achievements.length > 0 ? Math.round((friendEarned / achievements.length) * 100) : 0,
    },
    achievements,
    platform: 'steam',
  };
}
