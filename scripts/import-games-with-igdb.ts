import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { readFileSync } from 'fs';

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

// IGDB API credentials
const TWITCH_CLIENT_ID = process.env.IGDB_CLIENT_ID || process.env.TWITCH_CLIENT_ID!;
const TWITCH_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET!;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
  console.error('❌ Missing IGDB API credentials');
  console.error('Please ensure IGDB_CLIENT_ID and IGDB_CLIENT_SECRET are set in .env.local');
  process.exit(1);
}

// User email - CHANGE THIS TO YOUR EMAIL
// This is the email you used to sign up for the app
const USER_EMAIL = 'testuser@mail.com';

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

interface ParsedGame {
  title: string;
  platform: string;
}

// Platform mapping to match AddGameModal format
const platformMap: Record<string, { base: string; console?: string }> = {
  'PlayStation 3': { base: 'PlayStation', console: 'PS3' },
  'PlayStation 4': { base: 'PlayStation', console: 'PS4' },
  'PlayStation 5': { base: 'PlayStation', console: 'PS5' },
  'Xbox 360': { base: 'Xbox', console: 'Xbox 360' },
  'Xbox One': { base: 'Xbox', console: 'Xbox One' },
  'Xbox Series X': { base: 'Xbox', console: 'Xbox Series X' },
  'Xbox Series S': { base: 'Xbox', console: 'Xbox Series S' },
  'Nintendo Switch': { base: 'Nintendo', console: 'Switch' },
  'PC': { base: 'Steam' },
};

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

    return platformMatch || games[0];
  } catch (error) {
    console.error(`Error searching IGDB for "${gameName}":`, error);
    return null;
  }
}

// Parse game list file
function parseGameList(filePath: string): ParsedGame[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  return lines.map((line) => {
    // Format: "Game Title - Platform"
    const match = line.match(/^(.+?)\s*-\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid line format: ${line}`);
    }

    const [, title, platform] = match;
    return {
      title: title.trim(),
      platform: platform.trim(),
    };
  });
}

// Map platform to AddGameModal format
function mapPlatform(platformName: string): string {
  const mapping = platformMap[platformName];
  if (!mapping) {
    // Default to the original platform name
    return platformName;
  }

  if (mapping.console) {
    return `${mapping.base} (${mapping.console})`;
  }

  return mapping.base;
}

// Add game to database
async function addGame(
  game: ParsedGame,
  igdbData: IGDBGame | null,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const coverUrl = igdbData?.cover?.url
    ? `https:${igdbData.cover.url.replace('t_thumb', 't_cover_big')}`
    : null;

  const developer = igdbData?.involved_companies?.find((c) => c.developer)?.company?.name || null;
  const description = igdbData?.summary || null;
  const title = igdbData?.name || game.title;

  // First, check if game already exists
  const { data: existingGame } = await supabase
    .from('games')
    .select('id')
    .eq('title', title)
    .single();

  let gameId: string;

  if (existingGame) {
    gameId = existingGame.id;
  } else {
    // Insert into games table
    const { data: newGame, error: gameError } = await supabase
      .from('games')
      .insert({
        title,
        cover_url: coverUrl,
        description,
        developer,
      })
      .select('id')
      .single();

    if (gameError || !newGame) {
      return { success: false, error: gameError?.message || 'Failed to insert game' };
    }

    gameId = newGame.id;
  }

  // Check if user already has this game
  const { data: existingUserGame } = await supabase
    .from('user_games')
    .select('id')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .eq('platform', mapPlatform(game.platform))
    .single();

  if (existingUserGame) {
    return { success: false, error: 'User already has this game on this platform' };
  }

  // Insert into user_games table
  const { error: userGameError } = await supabase
    .from('user_games')
    .insert({
      user_id: userId,
      game_id: gameId,
      platform: mapPlatform(game.platform),
      status: 'unplayed', // Default status
      completion_percentage: 0,
      playtime_hours: 0,
    });

  if (userGameError) {
    return { success: false, error: userGameError.message };
  }

  return { success: true };
}

// Get user ID from email
async function getUserIdFromEmail(email: string): Promise<string | null> {
  // First, try to get user from auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching users:', authError.message);
    return null;
  }

  const user = authData.users.find((u) => u.email === email);

  if (!user) {
    console.error(`No user found with email: ${email}`);
    return null;
  }

  return user.id;
}

// Get user ID helper
async function getUserId(): Promise<string | null> {
  if ((USER_EMAIL as string) !== 'your-email@example.com') {
    return await getUserIdFromEmail(USER_EMAIL);
  }

  // Try to get the first user from the database
  const { data: authData, error } = await supabase.auth.admin.listUsers();

  if (error || !authData || authData.users.length === 0) {
    return null;
  }

  return authData.users[0].id;
}

// Main function
async function main() {
  console.log('🎮 Starting Game Import with IGDB Data\n');
  console.log('━'.repeat(60));

  // Get user ID
  console.log('👤 Getting user from email...');
  const userId = await getUserId();

  if (!userId) {
    console.error('❌ Could not determine user ID');
    if ((USER_EMAIL as string) === 'your-email@example.com') {
      console.error('Please set USER_EMAIL in the script to your account email');
    } else {
      console.error(`No user found with email: ${USER_EMAIL}`);
      console.error('Please check that the email is correct and the user exists in Supabase');
    }
    process.exit(1);
  }

  console.log(`✅ User found: ${USER_EMAIL}`);
  console.log(`✅ User ID: ${userId}\n`);

  // Get IGDB access token
  console.log('🔑 Getting IGDB access token...');
  const accessToken = await getIGDBAccessToken();
  console.log('✅ Access token obtained\n');

  // Parse game list
  console.log('📚 Parsing game list...');
  const gameListPath = resolve(process.cwd(), 'game_list_alphabetized.txt');
  const games = parseGameList(gameListPath);
  console.log(`✅ Found ${games.length} games to import\n`);

  console.log('━'.repeat(60));
  console.log('🔄 Starting import...\n');

  let imported = 0;
  let skipped = 0;
  let notFound = 0;
  let failed = 0;

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const progress = `[${i + 1}/${games.length}]`;

    console.log(`${progress} ${game.title} (${game.platform})`);

    // Add delay to respect rate limits (4 requests per second)
    if (i > 0 && i % 4 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Search IGDB
    const igdbData = await searchIGDB(game.title, game.platform, accessToken);

    if (!igdbData) {
      console.log(`   ⚠️  Not found on IGDB - importing with basic info`);
      notFound++;
    } else {
      console.log(`   ✅ Found on IGDB: ${igdbData.name}`);
    }

    // Add to database
    const result = await addGame(game, igdbData, userId);

    if (result.success) {
      console.log(`   ✅ Imported successfully`);
      imported++;
    } else if (result.error?.includes('already has this game')) {
      console.log(`   ⏭️  Already in library`);
      skipped++;
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      failed++;
    }

    console.log('');
  }

  console.log('━'.repeat(60));
  console.log('\n📊 Final Results:');
  console.log(`   ✅ Successfully imported: ${imported} games`);
  console.log(`   ⏭️  Already in library: ${skipped} games`);
  console.log(`   ⚠️  Not found on IGDB: ${notFound} games`);
  console.log(`   ❌ Failed to import: ${failed} games`);
  console.log(`   📚 Total processed: ${games.length} games\n`);

  if (notFound > 0) {
    console.log('💡 Tip: Games not found on IGDB were imported with basic information.');
    console.log('   You can update them later using the update-games script or manually edit them.\n');
  }

  console.log('🎉 Import process complete!');
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

