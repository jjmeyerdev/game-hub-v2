'use server';

import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/actions/psn/auth';
import { getValidApiKey } from '@/lib/actions/xbox/auth';
import {
  searchPsnUser,
  getGameLibrary,
  getTrophyProfileSummary,
  calculateTotalTrophies,
  getPlayedGamesWithPlaytime,
  parseIsoDuration,
  getUserProfile,
  type PsnPlayedTitle,
} from '@/lib/psn/client';
import {
  searchByGamertag,
  getTitleHistoryByXuid,
  getMyProfile,
  normalizeXboxPlatform,
} from '@/lib/xbox/client';
import {
  validateSteamId,
  getPlayerSummary,
  getOwnedGames,
  getPlayerAchievements,
  getGameSchema,
  getSteamHeaderUrl,
  convertPlaytimeToHours,
} from '@/lib/steam/client';
import { InvalidSteamIdError, SteamPrivacyError } from '@/lib/types/steam';
import type {
  ComparisonResult,
  ComparisonProfile,
  ComparisonGame,
  ComparisonStats,
  PsnSearchResult,
  XboxSearchResult,
  SteamSearchResult,
  ComparePlatform,
} from '@/lib/types/compare';

/**
 * Search for a PSN user by username
 */
export async function searchPsnUserAction(username: string): Promise<{
  success: boolean;
  user?: PsnSearchResult;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) {
    return { success: false, error: 'PSN account not connected. Please link your PSN account first.' };
  }

  try {
    const result = await searchPsnUser(accessToken, username);
    if (!result) {
      return { success: false, error: `No PSN user found with username "${username}"` };
    }

    return {
      success: true,
      user: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search PSN user',
    };
  }
}

/**
 * Search for an Xbox user by gamertag
 */
export async function searchXboxUserAction(gamertag: string): Promise<{
  success: boolean;
  user?: XboxSearchResult;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const apiKey = await getValidApiKey(user.id);
  if (!apiKey) {
    return { success: false, error: 'Xbox account not connected. Please link your Xbox account first.' };
  }

  try {
    const result = await searchByGamertag(gamertag, apiKey);
    if (!result) {
      return { success: false, error: `No Xbox user found with gamertag "${gamertag}"` };
    }

    return {
      success: true,
      user: {
        xuid: result.xuid,
        gamertag: result.gamertag,
        avatarUrl: result.gamerPicture || null,
        gamerscore: result.gamerscore,
        tier: result.accountTier || 'Unknown',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search Xbox user',
    };
  }
}

/**
 * Search for a Steam user by Steam ID
 */
export async function searchSteamUserAction(steamIdOrUrl: string): Promise<{
  success: boolean;
  user?: SteamSearchResult;
  error?: string;
}> {
  try {
    // Validate and extract Steam ID
    const steamId = validateSteamId(steamIdOrUrl);

    // Fetch Steam profile
    const steamProfile = await getPlayerSummary(steamId);
    if (!steamProfile) {
      return { success: false, error: `No Steam user found with ID "${steamIdOrUrl}"` };
    }

    return {
      success: true,
      user: {
        steamId: steamProfile.steamid,
        personaName: steamProfile.personaname,
        avatarUrl: steamProfile.avatarfull || null,
        profileUrl: steamProfile.profileurl,
      },
    };
  } catch (error) {
    if (error instanceof InvalidSteamIdError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search Steam user',
    };
  }
}

/**
 * Get current user's comparison data for a specific platform
 */
export async function getCurrentUserComparisonData(
  platform: ComparePlatform
): Promise<{ success: boolean; profile?: ComparisonProfile; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Build platform filter
    let platformFilter: string;
    if (platform === 'psn') {
      platformFilter = 'PlayStation%';
    } else if (platform === 'xbox') {
      platformFilter = 'Xbox%';
    } else {
      platformFilter = 'Steam';
    }

    // Get user's games for this platform from database
    const { data: userGames } = await supabase
      .from('user_games')
      .select(`
        id,
        platform,
        achievements_earned,
        achievements_total,
        completion_percentage,
        playtime_hours,
        game:games(id, title, cover_url)
      `)
      .eq('user_id', user.id)
      .like('platform', platformFilter);

    const games: ComparisonGame[] = [];
    let totalAchievements = 0;
    let totalPlaytime = 0;
    let totalCompletionSum = 0;

    if (userGames) {
      for (const ug of userGames) {
        const game = ug.game as unknown as { id: string; title: string; cover_url: string | null };
        if (game) {
          games.push({
            title: game.title,
            coverUrl: game.cover_url,
            achievementProgress: ug.completion_percentage || 0,
            playtime: ug.playtime_hours || 0,
            platform,
          });
          totalAchievements += ug.achievements_earned || 0;
          totalPlaytime += ug.playtime_hours || 0;
          totalCompletionSum += ug.completion_percentage || 0;
        }
      }
    }

    const stats: ComparisonStats = {
      totalGames: games.length,
      totalAchievements,
      totalPlaytime: Math.round(totalPlaytime * 10) / 10,
      completionRate: games.length > 0 ? Math.round(totalCompletionSum / games.length) : 0,
      platformSpecific: {},
    };

    // Add platform-specific stats
    if (platform === 'psn') {
      let isPsPlus: boolean | undefined;

      // Fetch PS Plus status from PSN API using account ID (more reliable than search)
      if (profile.psn_account_id) {
        try {
          const accessToken = await getValidAccessToken(user.id);
          if (accessToken) {
            const psnProfile = await getUserProfile(accessToken, profile.psn_account_id);
            isPsPlus = psnProfile.isPlus;
          }
        } catch {
          // Ignore errors fetching PS Plus status
        }
      }

      stats.platformSpecific = {
        trophyLevel: profile.psn_trophy_level || undefined,
        isPsPlus,
      };
    } else if (platform === 'xbox') {
      let tier: string | undefined;

      // Fetch Xbox tier from API
      if (profile.xbox_xuid) {
        try {
          const apiKey = await getValidApiKey(user.id);
          if (apiKey) {
            const xboxProfile = await getMyProfile(apiKey);
            tier = xboxProfile.accountTier || undefined;
          }
        } catch {
          // Ignore errors fetching tier
        }
      }

      stats.platformSpecific = {
        gamerscore: profile.xbox_gamerscore || undefined,
        tier,
      };
    }

    // Get username and platformId based on platform
    let username = 'You';
    let avatarUrl: string | null = null;
    let platformId = '';

    if (platform === 'psn') {
      username = profile.psn_online_id || 'You';
      avatarUrl = profile.psn_avatar_url;
      platformId = profile.psn_online_id || '';
    } else if (platform === 'xbox') {
      username = profile.xbox_gamertag || 'You';
      avatarUrl = profile.xbox_avatar_url;
      platformId = profile.xbox_gamertag || '';
    } else {
      username = profile.steam_persona_name || 'You';
      avatarUrl = profile.steam_avatar_url;
      platformId = profile.steam_id || '';
    }

    return {
      success: true,
      profile: {
        platform,
        platformId,
        username,
        avatarUrl,
        stats,
        games,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user data',
    };
  }
}

/**
 * Compare with a PSN user
 */
export async function comparePsnProfile(username: string): Promise<ComparisonResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) {
    return { success: false, error: 'PSN account not connected. Please link your PSN account first.' };
  }

  // Get current user's PSN ID to check for self-comparison
  const { data: profile } = await supabase
    .from('profiles')
    .select('psn_online_id')
    .eq('id', user.id)
    .single();

  try {
    // Search for the friend
    const friendResult = await searchPsnUser(accessToken, username);
    if (!friendResult) {
      return { success: false, error: `No PSN user found with username "${username}"` };
    }

    // Check if comparing with self
    if (profile?.psn_online_id && friendResult.onlineId.toLowerCase() === profile.psn_online_id.toLowerCase()) {
      return {
        success: false,
        error: "You can't compare with yourself! Try searching for a friend's PSN profile instead."
      };
    }

    // Get current user's data
    const currentUserResult = await getCurrentUserComparisonData('psn');
    if (!currentUserResult.success || !currentUserResult.profile) {
      return { success: false, error: currentUserResult.error || 'Failed to get your PSN data' };
    }

    // Get friend's trophy profile summary
    let friendTrophyLevel: number | undefined;
    try {
      const trophySummary = await getTrophyProfileSummary(accessToken, friendResult.accountId);
      friendTrophyLevel = parseInt(trophySummary.trophyLevel, 10) || undefined;
    } catch {
      // Friend's trophy summary may be private
    }

    // Get friend's game library (trophy titles)
    let friendGames: ComparisonGame[] = [];
    let friendTotalAchievements = 0;
    let friendTotalPlaytime = 0;
    let friendCompletionSum = 0;

    try {
      const psnGames = await getGameLibrary(accessToken, friendResult.accountId);

      // Try to get playtime data
      let playedGamesMap: Map<string, PsnPlayedTitle> = new Map();
      try {
        const playedGames = await getPlayedGamesWithPlaytime(accessToken, friendResult.accountId);
        for (const game of playedGames) {
          const normalizedName = game.name.toLowerCase().trim();
          playedGamesMap.set(normalizedName, game);
        }
      } catch {
        // Playtime may not be available
      }

      for (const psnGame of psnGames) {
        const earnedTotal = calculateTotalTrophies(psnGame.earnedTrophies);
        const normalizedTitle = psnGame.trophyTitleName.toLowerCase().trim();
        const playedGame = playedGamesMap.get(normalizedTitle);
        const playtimeMinutes = playedGame ? parseIsoDuration(playedGame.playDuration) : 0;
        const playtimeHours = playtimeMinutes > 0 ? Math.round((playtimeMinutes / 60) * 100) / 100 : 0;

        friendGames.push({
          title: psnGame.trophyTitleName,
          coverUrl: psnGame.trophyTitleIconUrl || null,
          achievementProgress: psnGame.progress || 0,
          playtime: playtimeHours,
          platform: 'psn',
          console: psnGame.trophyTitlePlatform || 'PlayStation',
        });

        friendTotalAchievements += earnedTotal;
        friendTotalPlaytime += playtimeHours;
        friendCompletionSum += psnGame.progress || 0;
      }
    } catch (error) {
      // Friend's library may be private
      return {
        success: false,
        error: "This user's game library is private or could not be accessed.",
      };
    }

    const friendStats: ComparisonStats = {
      totalGames: friendGames.length,
      totalAchievements: friendTotalAchievements,
      totalPlaytime: Math.round(friendTotalPlaytime * 10) / 10,
      completionRate: friendGames.length > 0 ? Math.round(friendCompletionSum / friendGames.length) : 0,
      platformSpecific: {
        trophyLevel: friendTrophyLevel,
        isPsPlus: friendResult.isPsPlus,
      },
    };

    const friendProfile: ComparisonProfile = {
      platform: 'psn',
      platformId: friendResult.onlineId,
      username: friendResult.onlineId,
      avatarUrl: friendResult.avatarUrl,
      stats: friendStats,
      games: friendGames,
    };

    // Calculate common games
    const userGameTitles = new Map(
      currentUserResult.profile.games.map(g => [g.title.toLowerCase(), g])
    );
    const commonGames = friendGames
      .filter(fg => userGameTitles.has(fg.title.toLowerCase()))
      .map(fg => {
        const userGame = userGameTitles.get(fg.title.toLowerCase());
        return {
          title: fg.title,
          coverUrl: fg.coverUrl,
          userProgress: userGame?.achievementProgress || 0,
          friendProgress: fg.achievementProgress,
          userPlaytime: userGame?.playtime || 0,
          friendPlaytime: fg.playtime,
          console: fg.console || userGame?.console,
        };
      })
      .sort((a, b) => b.userProgress - a.userProgress);

    return {
      success: true,
      user: currentUserResult.profile,
      friend: friendProfile,
      commonGames,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare PSN profiles',
    };
  }
}

/**
 * Compare with an Xbox user
 */
export async function compareXboxProfile(gamertag: string): Promise<ComparisonResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const apiKey = await getValidApiKey(user.id);
  if (!apiKey) {
    return { success: false, error: 'Xbox account not connected. Please link your Xbox account first.' };
  }

  // Get current user's Xbox gamertag to check for self-comparison
  const { data: profile } = await supabase
    .from('profiles')
    .select('xbox_gamertag')
    .eq('id', user.id)
    .single();

  try {
    // Search for the friend
    const friendResult = await searchByGamertag(gamertag, apiKey);
    if (!friendResult) {
      return {
        success: false,
        error: `No Xbox user found with gamertag "${gamertag}". Make sure you're entering the exact gamertag (case-insensitive). If they have a suffix like #1234, try without it first.`
      };
    }

    // Check if comparing with self
    if (profile?.xbox_gamertag && friendResult.gamertag.toLowerCase() === profile.xbox_gamertag.toLowerCase()) {
      return {
        success: false,
        error: "You can't compare with yourself! Try searching for a friend's Xbox profile instead."
      };
    }

    // Get current user's data
    const currentUserResult = await getCurrentUserComparisonData('xbox');
    if (!currentUserResult.success || !currentUserResult.profile) {
      return { success: false, error: currentUserResult.error || 'Failed to get your Xbox data' };
    }

    // Get friend's game library
    let friendGames: ComparisonGame[] = [];
    let friendTotalAchievements = 0;
    let friendTotalPlaytime = 0;
    let friendCompletionSum = 0;

    try {
      const xboxGames = await getTitleHistoryByXuid(friendResult.xuid, apiKey);

      // Filter out PC-only games
      const consoleGames = xboxGames.filter(game => {
        const devices = game.devices || [];
        return !(devices.length === 1 && devices[0] === 'Win32');
      });

      for (const xboxGame of consoleGames) {
        const achievementsEarned = xboxGame.achievement?.currentAchievements || 0;
        const completionPercentage = xboxGame.achievement?.progressPercentage || 0;

        // Use the same normalization as the library sync
        const devices = xboxGame.devices || [];
        const normalizedPlatform = normalizeXboxPlatform(devices);
        // Extract console name from "Xbox (Xbox One)" format
        const consoleMatch = normalizedPlatform.match(/\(([^)]+)\)/);
        const consoleName = consoleMatch ? consoleMatch[1] : normalizedPlatform;

        friendGames.push({
          title: xboxGame.name,
          coverUrl: xboxGame.displayImage || null,
          achievementProgress: completionPercentage,
          playtime: 0, // Xbox API doesn't provide playtime in title history
          platform: 'xbox',
          console: consoleName,
        });

        friendTotalAchievements += achievementsEarned;
        friendCompletionSum += completionPercentage;
      }
    } catch (error) {
      // Friend's library may be private
      return {
        success: false,
        error: "This user's game library is private or could not be accessed.",
      };
    }

    const friendStats: ComparisonStats = {
      totalGames: friendGames.length,
      totalAchievements: friendTotalAchievements,
      totalPlaytime: friendTotalPlaytime, // Xbox doesn't provide this
      completionRate: friendGames.length > 0 ? Math.round(friendCompletionSum / friendGames.length) : 0,
      platformSpecific: {
        gamerscore: friendResult.gamerscore,
        tier: friendResult.accountTier || undefined,
      },
    };

    const friendProfile: ComparisonProfile = {
      platform: 'xbox',
      platformId: friendResult.gamertag,
      username: friendResult.gamertag,
      avatarUrl: friendResult.gamerPicture || null,
      stats: friendStats,
      games: friendGames,
    };

    // Calculate common games
    const userGameTitles = new Map(
      currentUserResult.profile.games.map(g => [g.title.toLowerCase(), g])
    );
    const commonGames = friendGames
      .filter(fg => userGameTitles.has(fg.title.toLowerCase()))
      .map(fg => {
        const userGame = userGameTitles.get(fg.title.toLowerCase());
        return {
          title: fg.title,
          coverUrl: fg.coverUrl,
          userProgress: userGame?.achievementProgress || 0,
          friendProgress: fg.achievementProgress,
          userPlaytime: userGame?.playtime || 0,
          friendPlaytime: fg.playtime,
          console: fg.console || userGame?.console,
        };
      })
      .sort((a, b) => b.userProgress - a.userProgress);

    return {
      success: true,
      user: currentUserResult.profile,
      friend: friendProfile,
      commonGames,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare Xbox profiles',
    };
  }
}

/**
 * Compare with a Steam user
 */
export async function compareSteamProfile(steamIdOrUrl: string): Promise<ComparisonResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if current user has Steam linked
  const { data: profile } = await supabase
    .from('profiles')
    .select('steam_id, steam_persona_name, steam_avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile?.steam_id) {
    return { success: false, error: 'Steam account not connected. Please link your Steam account first.' };
  }

  try {
    // Validate and get friend's Steam ID
    let friendSteamId: string;
    try {
      friendSteamId = validateSteamId(steamIdOrUrl);
    } catch (error) {
      if (error instanceof InvalidSteamIdError) {
        return { success: false, error: error.message };
      }
      throw error;
    }

    // Check if comparing with self
    if (friendSteamId === profile.steam_id) {
      return {
        success: false,
        error: "You can't compare with yourself! Try searching for a friend's Steam profile instead."
      };
    }

    // Get friend's profile
    const friendProfile = await getPlayerSummary(friendSteamId);
    if (!friendProfile) {
      return { success: false, error: `No Steam user found with ID "${steamIdOrUrl}"` };
    }

    // Get current user's data
    const currentUserResult = await getCurrentUserComparisonData('steam');
    if (!currentUserResult.success || !currentUserResult.profile) {
      return { success: false, error: currentUserResult.error || 'Failed to get your Steam data' };
    }

    // Get friend's game library
    let friendGames: ComparisonGame[] = [];
    let friendTotalAchievements = 0;
    let friendTotalPlaytime = 0;
    let friendCompletionSum = 0;
    let gamesWithAchievements = 0;

    try {
      const steamGames = await getOwnedGames(friendSteamId);

      // Process games - limit achievement fetching to avoid rate limits
      // Only fetch achievements for games with visible stats (max 20 to avoid rate limits)
      const gamesWithStats = steamGames
        .filter(g => g.has_community_visible_stats)
        .slice(0, 20);

      // Create a map for quick lookup of achievement data
      const achievementDataMap = new Map<number, { earned: number; total: number; percentage: number }>();

      // Fetch achievement data for top games (in parallel batches of 5)
      for (let i = 0; i < gamesWithStats.length; i += 5) {
        const batch = gamesWithStats.slice(i, i + 5);
        const results = await Promise.all(
          batch.map(async (game) => {
            try {
              const [achievements, schema] = await Promise.all([
                getPlayerAchievements(friendSteamId, game.appid),
                getGameSchema(game.appid),
              ]);

              const totalAchievements = schema?.game?.availableGameStats?.achievements?.length || 0;
              const earnedAchievements = achievements.filter(a => a.achieved === 1).length;
              const percentage = totalAchievements > 0
                ? Math.round((earnedAchievements / totalAchievements) * 100)
                : 0;

              return {
                appid: game.appid,
                earned: earnedAchievements,
                total: totalAchievements,
                percentage,
              };
            } catch {
              return null;
            }
          })
        );

        for (const result of results) {
          if (result && result.total > 0) {
            achievementDataMap.set(result.appid, result);
          }
        }

        // Small delay between batches to respect rate limits
        if (i + 5 < gamesWithStats.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Build friend games list
      for (const steamGame of steamGames) {
        const playtimeHours = convertPlaytimeToHours(steamGame.playtime_forever);
        const achievementData = achievementDataMap.get(steamGame.appid);

        friendGames.push({
          title: steamGame.name,
          coverUrl: getSteamHeaderUrl(steamGame.appid),
          achievementProgress: achievementData?.percentage || 0,
          playtime: playtimeHours,
          platform: 'steam',
          console: 'PC',
        });

        if (achievementData) {
          friendTotalAchievements += achievementData.earned;
          friendCompletionSum += achievementData.percentage;
          gamesWithAchievements++;
        }
        friendTotalPlaytime += playtimeHours;
      }
    } catch (error) {
      if (error instanceof SteamPrivacyError) {
        return {
          success: false,
          error: "This user's game library is private. They need to set their game details to public.",
        };
      }
      return {
        success: false,
        error: "Failed to fetch user's game library.",
      };
    }

    const friendStats: ComparisonStats = {
      totalGames: friendGames.length,
      totalAchievements: friendTotalAchievements,
      totalPlaytime: Math.round(friendTotalPlaytime * 10) / 10,
      completionRate: gamesWithAchievements > 0 ? Math.round(friendCompletionSum / gamesWithAchievements) : 0,
      platformSpecific: {},
    };

    const friendComparisonProfile: ComparisonProfile = {
      platform: 'steam',
      platformId: friendSteamId,
      username: friendProfile.personaname,
      avatarUrl: friendProfile.avatarfull || null,
      stats: friendStats,
      games: friendGames,
    };

    // Calculate common games
    const userGameTitles = new Map(
      currentUserResult.profile.games.map(g => [g.title.toLowerCase(), g])
    );
    const commonGames = friendGames
      .filter(fg => userGameTitles.has(fg.title.toLowerCase()))
      .map(fg => {
        const userGame = userGameTitles.get(fg.title.toLowerCase());
        return {
          title: fg.title,
          coverUrl: fg.coverUrl,
          userProgress: userGame?.achievementProgress || 0,
          friendProgress: fg.achievementProgress,
          userPlaytime: userGame?.playtime || 0,
          friendPlaytime: fg.playtime,
          console: fg.console || userGame?.console,
        };
      })
      .sort((a, b) => b.userProgress - a.userProgress);

    return {
      success: true,
      user: currentUserResult.profile,
      friend: friendComparisonProfile,
      commonGames,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare Steam profiles',
    };
  }
}

/**
 * Unified comparison function - routes to the appropriate platform handler
 */
export async function compareProfile(
  platform: ComparePlatform,
  identifier: string
): Promise<ComparisonResult> {
  switch (platform) {
    case 'psn':
      return comparePsnProfile(identifier);
    case 'xbox':
      return compareXboxProfile(identifier);
    case 'steam':
      return compareSteamProfile(identifier);
    default:
      return { success: false, error: 'Invalid platform' };
  }
}
