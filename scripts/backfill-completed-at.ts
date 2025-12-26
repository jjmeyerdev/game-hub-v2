/**
 * Backfill completed_at for existing perfect games
 *
 * This script fetches the actual last achievement unlock date from each platform's API
 * and updates the completed_at field for perfect games.
 *
 * Usage: npx tsx scripts/backfill-completed-at.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const steamApiKey = process.env.STEAM_WEB_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PerfectGame {
  id: string;
  user_id: string;
  game_id: string;
  platform: string;
  steam_appid: number | null;
  completed_at: string | null;
  game: {
    psn_communication_id: string | null;
    xbox_title_id: string | null;
    title: string;
  } | null;
}

interface Profile {
  steam_id: string | null;
  psn_account_id: string | null;
  xbox_xuid: string | null;
}

interface PsnToken {
  access_token: string;
}

interface XboxToken {
  api_key: string;
}

async function getSteamLastUnlockDate(steamId: string, appId: number): Promise<string | null> {
  if (!steamApiKey) return null;

  try {
    const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?appid=${appId}&key=${steamApiKey}&steamid=${steamId}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.playerstats?.achievements) return null;

    const achievements = data.playerstats.achievements as Array<{ achieved: number; unlocktime: number }>;
    const unlockedAchievements = achievements.filter(a => a.achieved === 1 && a.unlocktime > 0);

    if (unlockedAchievements.length === 0) return null;

    // Find the most recent unlock time
    const lastUnlock = Math.max(...unlockedAchievements.map(a => a.unlocktime));
    return new Date(lastUnlock * 1000).toISOString();
  } catch (error) {
    console.error(`  Error fetching Steam achievements for app ${appId}:`, error);
    return null;
  }
}

async function getPsnLastUnlockDate(
  accessToken: string,
  accountId: string,
  npCommunicationId: string
): Promise<string | null> {
  try {
    // Try trophy2 service first (PS4/PS5)
    let url = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies?npServiceName=trophy2`;
    let response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      // Try legacy trophy service (PS3/Vita)
      url = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies?npServiceName=trophy`;
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }

    if (!response.ok) return null;

    const data = await response.json();
    const trophies = data.trophies as Array<{ earned: boolean; earnedDateTime?: string }>;

    if (!trophies) return null;

    const earnedTrophies = trophies.filter(t => t.earned && t.earnedDateTime);
    if (earnedTrophies.length === 0) return null;

    // Find the most recent earn date
    const dates = earnedTrophies.map(t => new Date(t.earnedDateTime!).getTime());
    const lastUnlock = Math.max(...dates);
    return new Date(lastUnlock).toISOString();
  } catch (error) {
    console.error(`  Error fetching PSN trophies:`, error);
    return null;
  }
}

async function getXboxLastUnlockDate(
  apiKey: string,
  xuid: string,
  titleId: string
): Promise<string | null> {
  try {
    const url = `https://xbl.io/api/v2/achievements/player/${xuid}/title/${titleId}`;
    const response = await fetch(url, {
      headers: { 'X-Authorization': apiKey }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const achievements = data.achievements as Array<{
      progressState: string;
      progression?: { timeUnlocked?: string };
    }>;

    if (!achievements) return null;

    const unlockedAchievements = achievements.filter(
      a => a.progressState === 'Achieved' &&
           a.progression?.timeUnlocked &&
           a.progression.timeUnlocked !== '0001-01-01T00:00:00Z'
    );

    if (unlockedAchievements.length === 0) return null;

    const dates = unlockedAchievements.map(a => new Date(a.progression!.timeUnlocked!).getTime());
    const lastUnlock = Math.max(...dates);
    return new Date(lastUnlock).toISOString();
  } catch (error) {
    console.error(`  Error fetching Xbox achievements:`, error);
    return null;
  }
}

async function backfillCompletedAt() {
  console.log('🔄 Backfilling completed_at for perfect games...\n');

  // Get all perfect games that need backfilling
  const { data: perfectGames, error: fetchError } = await supabase
    .from('user_games')
    .select(`
      id,
      user_id,
      game_id,
      platform,
      steam_appid,
      completed_at,
      game:games(psn_communication_id, xbox_title_id, title)
    `)
    .gt('achievements_total', 0)
    .filter('achievements_earned', 'eq', supabase.rpc('achievements_total'));

  // Alternative query since the above won't work - fetch all and filter
  const { data: allGames, error: allError } = await supabase
    .from('user_games')
    .select(`
      id,
      user_id,
      game_id,
      platform,
      steam_appid,
      completed_at,
      achievements_earned,
      achievements_total,
      game:games(psn_communication_id, xbox_title_id, title)
    `)
    .gt('achievements_total', 0);

  if (allError || !allGames) {
    console.error('Failed to fetch games:', allError);
    process.exit(1);
  }

  // Filter to perfect games only
  const perfectGamesList = allGames.filter(
    g => g.achievements_earned === g.achievements_total
  ) as unknown as PerfectGame[];

  console.log(`Found ${perfectGamesList.length} perfect games\n`);

  // Group by user_id to batch profile lookups
  const userIds = [...new Set(perfectGamesList.map(g => g.user_id))];

  for (const userId of userIds) {
    // Get user profile with platform credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('steam_id, psn_account_id, xbox_xuid')
      .eq('id', userId)
      .single() as { data: Profile | null };

    if (!profile) continue;

    // Get PSN token if available
    const { data: psnToken } = await supabase
      .from('psn_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single() as { data: PsnToken | null };

    // Get Xbox token if available
    const { data: xboxToken } = await supabase
      .from('xbox_tokens')
      .select('api_key')
      .eq('user_id', userId)
      .single() as { data: XboxToken | null };

    const userGames = perfectGamesList.filter(g => g.user_id === userId);
    console.log(`\nProcessing ${userGames.length} games for user ${userId.slice(0, 8)}...`);

    for (const game of userGames) {
      const gameTitle = game.game?.title || 'Unknown';
      const platform = game.platform.toLowerCase();
      let completedAt: string | null = null;

      // Steam
      if (platform.includes('steam') && profile.steam_id && game.steam_appid) {
        console.log(`  [Steam] ${gameTitle}...`);
        completedAt = await getSteamLastUnlockDate(profile.steam_id, game.steam_appid);

        // Rate limit: 1 request per second for Steam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // PlayStation
      else if ((platform.includes('playstation') || platform.startsWith('ps')) &&
               profile.psn_account_id && psnToken?.access_token && game.game?.psn_communication_id) {
        console.log(`  [PSN] ${gameTitle}...`);
        completedAt = await getPsnLastUnlockDate(
          psnToken.access_token,
          profile.psn_account_id,
          game.game.psn_communication_id
        );

        // Rate limit for PSN
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      // Xbox
      else if (platform.includes('xbox') && profile.xbox_xuid && xboxToken?.api_key && game.game?.xbox_title_id) {
        console.log(`  [Xbox] ${gameTitle}...`);
        completedAt = await getXboxLastUnlockDate(
          xboxToken.api_key,
          profile.xbox_xuid,
          game.game.xbox_title_id
        );

        // Rate limit for Xbox
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`  [${game.platform}] ${gameTitle} - skipping (missing credentials or platform ID)`);
        continue;
      }

      if (completedAt) {
        const { error: updateError } = await supabase
          .from('user_games')
          .update({ completed_at: completedAt })
          .eq('id', game.id);

        if (updateError) {
          console.log(`    ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`    ✅ Set completed_at to ${completedAt.split('T')[0]}`);
        }
      } else {
        console.log(`    ⚠️  Could not determine completion date`);
      }
    }
  }

  console.log('\n✅ Backfill complete!');
}

backfillCompletedAt().catch(console.error);
