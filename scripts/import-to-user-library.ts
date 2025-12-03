/**
 * Import Games to User Library Script
 * 
 * This script imports games from game_list_alphabetized.txt into a specific user's library.
 * It first ensures all games exist in the games table, then adds them to user_games.
 * 
 * Usage: npx tsx scripts/import-to-user-library.ts <user-email>
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GameEntry {
  title: string;
  platform: string;
}

/**
 * Parse the game list file
 */
function parseGameList(filePath: string): GameEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  const games: GameEntry[] = [];
  
  for (const line of lines) {
    // Trim the line to remove any trailing whitespace or carriage returns
    const cleanLine = line.trim();
    const match = cleanLine.match(/^(.+?)\s+-\s+(.+)$/);
    if (match) {
      const [, title, platform] = match;
      games.push({
        title: title.trim(),
        platform: platform.trim(),
      });
    }
  }
  
  return games;
}

/**
 * Get user ID from email
 */
async function getUserId(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.id;
}

/**
 * Get game ID from title
 */
async function getGameId(title: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('games')
    .select('id')
    .eq('title', title)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.id;
}

/**
 * Add game to user's library
 */
async function addToUserLibrary(
  userId: string,
  gameId: string,
  platform: string
): Promise<boolean> {
  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('user_games')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .eq('platform', platform)
      .maybeSingle();
    
    if (existing) {
      return true; // Already exists, skip
    }
    
    // Insert new user game
    const { error } = await supabase
      .from('user_games')
      .insert({
        user_id: userId,
        game_id: gameId,
        platform: platform,
        status: 'unplayed',
        priority: 'medium',
        completion_percentage: 0,
        playtime_hours: 0,
        owned: true,
      });
    
    if (error) {
      console.error(`   Error: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`   Unexpected error:`, error);
    return false;
  }
}

/**
 * Main import function
 */
async function importToUserLibrary() {
  console.log('🎮 Game Hub - Import to User Library Script\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get user email from command line
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.error('❌ Usage: npx tsx scripts/import-to-user-library.ts <user-email>');
    console.error('\nExample:');
    console.error('   npx tsx scripts/import-to-user-library.ts user@example.com');
    process.exit(1);
  }
  
  // Get user ID
  console.log(`👤 Looking up user: ${userEmail}`);
  const userId = await getUserId(userEmail);
  
  if (!userId) {
    console.error(`❌ User not found: ${userEmail}`);
    console.error('\nMake sure the user has signed up and their profile exists.');
    process.exit(1);
  }
  
  console.log(`   ✅ Found user ID: ${userId}\n`);
  
  // Parse game list
  const gameListPath = path.join(process.cwd(), 'game_list_alphabetized.txt');
  
  if (!fs.existsSync(gameListPath)) {
    console.error(`❌ Game list file not found: ${gameListPath}`);
    process.exit(1);
  }
  
  console.log('📖 Reading game list...');
  const gameEntries = parseGameList(gameListPath);
  console.log(`   Found ${gameEntries.length} games to import\n`);
  
  // Import games to user library
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  console.log('🔄 Adding games to user library...\n');
  
  for (let i = 0; i < gameEntries.length; i++) {
    const entry = gameEntries[i];
    
    process.stdout.write(`[${i + 1}/${gameEntries.length}] ${entry.title} (${entry.platform})... `);
    
    // Get game ID
    const gameId = await getGameId(entry.title);
    
    if (!gameId) {
      console.log('❌ Game not found in database');
      notFoundCount++;
      continue;
    }
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('user_games')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .eq('platform', entry.platform)
      .maybeSingle();
    
    if (existing) {
      console.log('⏭️  Already in library');
      skipCount++;
      continue;
    }
    
    // Add to library
    const success = await addToUserLibrary(userId, gameId, entry.platform);
    
    if (success) {
      console.log('✅ Added');
      successCount++;
    } else {
      console.log('❌ Failed');
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📊 Import Summary:');
  console.log(`   ✅ Games added: ${successCount}`);
  console.log(`   ⏭️  Already in library: ${skipCount}`);
  console.log(`   ❌ Not found in database: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📈 Total processed: ${gameEntries.length}`);
  
  if (notFoundCount > 0) {
    console.log('\n💡 Tip: Run "pnpm run import-games" first to add games to the database.');
  }
  
  console.log('\n✨ Import complete!\n');
}

// Run the import
importToUserLibrary().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

