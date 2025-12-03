import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IGDB API credentials (using IGDB_ prefix to match env.example)
const TWITCH_CLIENT_ID = process.env.IGDB_CLIENT_ID || process.env.TWITCH_CLIENT_ID!;
const TWITCH_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET!;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
  console.error('❌ Missing IGDB API credentials');
  console.error('Please ensure IGDB_CLIENT_ID and IGDB_CLIENT_SECRET are set in .env.local');
  console.error('(or TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET)');
  process.exit(1);
}

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  summary?: string;
  involved_companies?: Array<{
    company: {
      name: string;
    };
    developer: boolean;
  }>;
  genres?: Array<{
    name: string;
  }>;
  platforms?: Array<{
    name: string;
  }>;
}

interface Game {
  id: string;
  title: string;
  platform: string;
  cover_url: string | null;
  description: string | null;
  developer: string | null;
}

interface UserGame {
  id: string;
  game_id: string;
  platform: string;
}

// Get IGDB access token
async function getIGDBAccessToken(): Promise<string> {
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Failed to get IGDB access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Search IGDB for a game with platform context
async function searchIGDB(
  gameName: string,
  platformHint: string,
  accessToken: string
): Promise<IGDBGame | null> {
  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `
        search "${gameName}";
        fields name,cover.url,first_release_date,summary,involved_companies.company.name,involved_companies.developer,genres.name,platforms.name;
        limit 5;
      `,
    });

    if (!response.ok) {
      console.error(`Failed to search IGDB for "${gameName}"`);
      return null;
    }

    const games: IGDBGame[] = await response.json();
    
    if (games.length === 0) {
      return null;
    }

    // Try to find a game that matches the platform
    const platformMatch = games.find((game) =>
      game.platforms?.some((p) => 
        platformHint.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(platformHint.toLowerCase())
      )
    );

    // Return platform match if found, otherwise return first result
    return platformMatch || games[0];
  } catch (error) {
    console.error(`Error searching IGDB for "${gameName}":`, error);
    return null;
  }
}

// Check if game needs updating
function needsUpdate(game: Game): boolean {
  return !game.cover_url || !game.description || !game.developer;
}

// Map IGDB platform names to our platform format
function mapPlatformName(igdbPlatform: string, currentPlatform: string): string {
  // Extract base platform and console from current format (e.g., "PlayStation (PS3)")
  const match = currentPlatform.match(/^(.+?)\s*(?:\((.+)\))?$/);
  const basePlatform = match?.[1]?.trim() || currentPlatform;
  const currentConsole = match?.[2]?.trim();

  // Platform mapping
  const platformMap: Record<string, { base: string; consoles: Record<string, string> }> = {
    PlayStation: {
      base: 'PlayStation',
      consoles: {
        'PlayStation 5': 'PS5',
        'PlayStation 4': 'PS4',
        'PlayStation 3': 'PS3',
        'PlayStation 2': 'PS2',
        'PlayStation': 'PS1',
        'PS5': 'PS5',
        'PS4': 'PS4',
        'PS3': 'PS3',
        'PS2': 'PS2',
        'PS1': 'PS1',
      },
    },
    Xbox: {
      base: 'Xbox',
      consoles: {
        'Xbox Series X|S': 'Xbox Series X',
        'Xbox Series': 'Xbox Series X',
        'Xbox One': 'Xbox One',
        'Xbox 360': 'Xbox 360',
        'Xbox': 'Original Xbox',
      },
    },
    Nintendo: {
      base: 'Nintendo',
      consoles: {
        'Nintendo Switch': 'Switch',
        'Switch': 'Switch',
        'Wii U': 'Wii U',
        'Nintendo 3DS': '3DS',
        '3DS': '3DS',
      },
    },
  };

  // Check if IGDB platform matches any of our mappings
  for (const [base, config] of Object.entries(platformMap)) {
    for (const [igdbName, ourConsole] of Object.entries(config.consoles)) {
      if (igdbPlatform.toLowerCase().includes(igdbName.toLowerCase())) {
        return `${config.base} (${ourConsole})`;
      }
    }
  }

  // If we have a current console, preserve it
  if (currentConsole) {
    return currentPlatform;
  }

  // Check for PC platforms
  if (igdbPlatform.toLowerCase().includes('pc') || igdbPlatform.toLowerCase().includes('windows')) {
    return 'Steam';
  }

  // Default: keep current platform
  return currentPlatform;
}

// Update game in database
async function updateGame(gameId: string, igdbData: IGDBGame, currentPlatform: string): Promise<boolean> {
  const coverUrl = igdbData.cover?.url
    ? `https:${igdbData.cover.url.replace('t_thumb', 't_cover_big')}`
    : null;

  const developer = igdbData.involved_companies?.find((c) => c.developer)?.company?.name || null;

  const { error } = await supabase
    .from('games')
    .update({
      title: igdbData.name,
      cover_url: coverUrl,
      description: igdbData.summary || null,
      developer: developer,
    })
    .eq('id', gameId);

  if (error) {
    console.error(`Failed to update game ${gameId}:`, error.message);
    return false;
  }

  return true;
}

// Update user_games platform if needed
async function updateUserGamesPlatform(
  gameId: string,
  igdbData: IGDBGame,
  currentPlatform: string
): Promise<void> {
  // Get the best matching platform from IGDB
  const igdbPlatform = igdbData.platforms?.[0]?.name;
  if (!igdbPlatform) {
    return;
  }

  const newPlatform = mapPlatformName(igdbPlatform, currentPlatform);

  // Only update if platform changed
  if (newPlatform !== currentPlatform) {
    const { error } = await supabase
      .from('user_games')
      .update({ platform: newPlatform })
      .eq('game_id', gameId);

    if (error) {
      console.error(`Failed to update platform for game ${gameId}:`, error.message);
    } else {
      console.log(`   📝 Platform updated: ${currentPlatform} → ${newPlatform}`);
    }
  }
}

// Main function
async function main() {
  console.log('🎮 Starting IGDB Game Update Script\n');
  console.log('━'.repeat(60));

  // Get IGDB access token
  console.log('🔑 Getting IGDB access token...');
  const accessToken = await getIGDBAccessToken();
  console.log('✅ Access token obtained\n');

  // Fetch all games with their user_games platform information
  console.log('📚 Fetching games from database...');
  const { data: userGames, error } = await supabase
    .from('user_games')
    .select(`
      id,
      game_id,
      platform,
      games (
        id,
        title,
        cover_url,
        description,
        developer
      )
    `)
    .order('games(title)');

  if (error) {
    console.error('❌ Failed to fetch games:', error.message);
    process.exit(1);
  }

  if (!userGames || userGames.length === 0) {
    console.log('ℹ️  No games found in database');
    process.exit(0);
  }

  // Transform the data to match our Game interface
  const games: Game[] = userGames
    .filter((ug: any) => ug.games) // Filter out any null games
    .map((ug: any) => ({
      id: ug.games.id,
      title: ug.games.title,
      platform: ug.platform,
      cover_url: ug.games.cover_url,
      description: ug.games.description,
      developer: ug.games.developer,
    }));

  console.log(`✅ Found ${games.length} games\n`);
  console.log('━'.repeat(60));

  // Filter games that need updating
  const gamesToUpdate = games.filter(needsUpdate);
  const gamesComplete = games.length - gamesToUpdate.length;

  console.log(`📊 Status:`);
  console.log(`   ✓ Complete: ${gamesComplete} games`);
  console.log(`   ⚠ Need update: ${gamesToUpdate.length} games\n`);

  if (gamesToUpdate.length === 0) {
    console.log('🎉 All games are up to date!');
    process.exit(0);
  }

  console.log('━'.repeat(60));
  console.log('🔄 Starting updates...\n');

  let updated = 0;
  let failed = 0;
  let notFound = 0;

  for (let i = 0; i < gamesToUpdate.length; i++) {
    const game = gamesToUpdate[i];
    const progress = `[${i + 1}/${gamesToUpdate.length}]`;

    console.log(`${progress} Processing: ${game.title}`);
    console.log(`   Platform: ${game.platform}`);

    // Add delay to respect rate limits (4 requests per second)
    if (i > 0 && i % 4 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Search IGDB with platform context
    const igdbData = await searchIGDB(game.title, game.platform, accessToken);

    if (!igdbData) {
      console.log(`   ⚠️  Not found on IGDB`);
      notFound++;
      continue;
    }

    // Update game data
    const success = await updateGame(game.id, igdbData, game.platform);

    if (success) {
      // Update platform/console in user_games if needed
      await updateUserGamesPlatform(game.id, igdbData, game.platform);
      
      console.log(`   ✅ Updated successfully`);
      updated++;
    } else {
      console.log(`   ❌ Failed to update`);
      failed++;
    }

    console.log('');
  }

  console.log('━'.repeat(60));
  console.log('\n📊 Final Results:');
  console.log(`   ✅ Successfully updated: ${updated} games`);
  console.log(`   ⚠️  Not found on IGDB: ${notFound} games`);
  console.log(`   ❌ Failed to update: ${failed} games`);
  console.log(`   📚 Total processed: ${gamesToUpdate.length} games\n`);

  if (notFound > 0) {
    console.log('💡 Tip: Games not found on IGDB may need manual entry or have different titles.');
  }

  console.log('\n🎉 Update process complete!');
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

