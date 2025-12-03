/**
 * Verify Import Script
 * 
 * This script verifies that games were successfully imported into the database.
 * It provides statistics and checks for any issues.
 * 
 * Usage: npx tsx scripts/verify-import.ts [user-email]
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
  console.error('❌ Missing required environment variables');
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
 * Verify games in database
 */
async function verifyGamesImport(): Promise<void> {
  console.log('🔍 Verifying Games Import\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Parse expected games
  const gameListPath = path.join(process.cwd(), 'game_list_alphabetized.txt');
  const expectedGames = parseGameList(gameListPath);
  
  console.log(`📋 Expected games from file: ${expectedGames.length}\n`);
  
  // Get all games from database
  const { data: dbGames, error } = await supabase
    .from('games')
    .select('title, platforms, genres, developer, publisher');
  
  if (error) {
    console.error('❌ Error fetching games:', error.message);
    return;
  }
  
  console.log(`📊 Games in database: ${dbGames?.length || 0}\n`);
  
  // Check for missing games
  const missingGames: string[] = [];
  const foundGames: string[] = [];
  
  for (const expected of expectedGames) {
    const found = dbGames?.find(g => g.title === expected.title);
    if (found) {
      foundGames.push(expected.title);
    } else {
      missingGames.push(expected.title);
    }
  }
  
  console.log('✅ Import Status:');
  console.log(`   Found: ${foundGames.length}/${expectedGames.length}`);
  console.log(`   Missing: ${missingGames.length}\n`);
  
  if (missingGames.length > 0) {
    console.log('❌ Missing Games:');
    missingGames.forEach(title => console.log(`   - ${title}`));
    console.log('');
  }
  
  // Statistics
  if (dbGames && dbGames.length > 0) {
    const withGenres = dbGames.filter(g => g.genres && g.genres.length > 0).length;
    const withDeveloper = dbGames.filter(g => g.developer).length;
    const withPublisher = dbGames.filter(g => g.publisher).length;
    
    console.log('📈 Data Completeness:');
    console.log(`   Games with genres: ${withGenres}/${dbGames.length} (${Math.round(withGenres/dbGames.length*100)}%)`);
    console.log(`   Games with developer: ${withDeveloper}/${dbGames.length} (${Math.round(withDeveloper/dbGames.length*100)}%)`);
    console.log(`   Games with publisher: ${withPublisher}/${dbGames.length} (${Math.round(withPublisher/dbGames.length*100)}%)`);
    console.log('');
    
    // Platform distribution
    const platformCounts: Record<string, number> = {};
    dbGames.forEach(game => {
      if (game.platforms) {
        game.platforms.forEach((platform: string) => {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
      }
    });
    
    console.log('🎮 Platform Distribution:');
    Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([platform, count]) => {
        console.log(`   ${platform}: ${count} games`);
      });
    console.log('');
    
    // Genre distribution
    const genreCounts: Record<string, number> = {};
    dbGames.forEach(game => {
      if (game.genres) {
        game.genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    
    console.log('🎯 Top Genres:');
    Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([genre, count]) => {
        console.log(`   ${genre}: ${count} games`);
      });
    console.log('');
  }
}

/**
 * Verify user library import
 */
async function verifyUserLibraryImport(userEmail: string): Promise<void> {
  console.log(`👤 Verifying User Library: ${userEmail}\n`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get user ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single();
  
  if (profileError || !profile) {
    console.error('❌ User not found');
    return;
  }
  
  console.log(`✅ User found: ${profile.id}\n`);
  
  // Get user's games
  const { data: userGames, error: gamesError } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(title, platforms)
    `)
    .eq('user_id', profile.id);
  
  if (gamesError) {
    console.error('❌ Error fetching user games:', gamesError.message);
    return;
  }
  
  console.log(`📊 Games in user library: ${userGames?.length || 0}\n`);
  
  if (userGames && userGames.length > 0) {
    // Status distribution
    const statusCounts: Record<string, number> = {};
    userGames.forEach(ug => {
      statusCounts[ug.status] = (statusCounts[ug.status] || 0) + 1;
    });
    
    console.log('📋 Status Distribution:');
    Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} games`);
      });
    console.log('');
    
    // Platform distribution
    const platformCounts: Record<string, number> = {};
    userGames.forEach(ug => {
      platformCounts[ug.platform] = (platformCounts[ug.platform] || 0) + 1;
    });
    
    console.log('🎮 Platform Distribution:');
    Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([platform, count]) => {
        console.log(`   ${platform}: ${count} games`);
      });
    console.log('');
    
    // Statistics
    const totalPlaytime = userGames.reduce((sum, ug) => sum + (ug.playtime_hours || 0), 0);
    const avgCompletion = userGames.reduce((sum, ug) => sum + (ug.completion_percentage || 0), 0) / userGames.length;
    const withRatings = userGames.filter(ug => ug.personal_rating).length;
    
    console.log('📈 Statistics:');
    console.log(`   Total playtime: ${totalPlaytime.toFixed(1)} hours`);
    console.log(`   Average completion: ${avgCompletion.toFixed(1)}%`);
    console.log(`   Games with ratings: ${withRatings}/${userGames.length}`);
    console.log('');
  }
}

/**
 * Main verification function
 */
async function verify() {
  console.log('🎮 Game Hub - Import Verification\n');
  
  const userEmail = process.argv[2];
  
  // Always verify games import
  await verifyGamesImport();
  
  // Optionally verify user library
  if (userEmail) {
    await verifyUserLibraryImport(userEmail);
  } else {
    console.log('💡 Tip: Run with email to verify user library:');
    console.log('   npx tsx scripts/verify-import.ts user@example.com\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✨ Verification complete!\n');
}

// Run verification
verify().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

