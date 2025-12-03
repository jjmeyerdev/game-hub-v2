/**
 * Import Games Script
 * 
 * This script reads the game_list_alphabetized.txt file and imports all games
 * into the Supabase database with enriched metadata.
 * 
 * Usage: npx tsx scripts/import-games.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase client with service role key for admin operations
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
  rawLine: string;
}

interface GameData {
  title: string;
  description: string | null;
  cover_url: string | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  platforms: string[];
}

/**
 * Platform mapping for normalization
 */
const platformMap: Record<string, string> = {
  'PlayStation 3': 'PlayStation 3',
  'Xbox 360': 'Xbox 360',
  'PC': 'PC',
  'PlayStation 4': 'PlayStation 4',
  'Xbox One': 'Xbox One',
};

/**
 * Genre mapping based on game titles (heuristic approach)
 */
const genreKeywords: Record<string, string[]> = {
  'Action': ['Call of Duty', 'Battlefield', 'Gears of War', 'Halo', 'Army of Two', 'Crysis', 'F.E.A.R.', 'Killzone', 'Resistance'],
  'Adventure': ['Assassin\'s Creed', 'Uncharted', 'Tomb Raider', 'Batman', 'Prince of Persia', 'Enslaved'],
  'RPG': ['Mass Effect', 'Fallout', 'Elder Scrolls', 'Dragon Age', 'Fable'],
  'Racing': ['Forza', 'Need for Speed', 'Burnout', 'Test Drive', 'Midnight Club', 'NASCAR'],
  'Sports': ['FIFA', 'Madden', 'NBA', 'MLB', 'UFC', 'WWE', 'Tiger Woods', 'Grand Slam Tennis', 'Top Spin', 'Fight Night'],
  'Shooter': ['Call of Duty', 'Battlefield', 'Gears of War', 'Halo', 'Killzone', 'Resistance', 'Crysis', 'F.E.A.R.', 'Medal of Honor', 'Sniper Elite', 'SOCOM'],
  'Survival Horror': ['Dead Space', 'Resident Evil', 'Dead Rising'],
  'Open World': ['Grand Theft Auto', 'Red Dead Redemption', 'Saints Row', 'Just Cause', 'Far Cry', 'Sleeping Dogs', 'L.A. Noire', 'Mafia'],
  'Stealth': ['Splinter Cell', 'Hitman', 'Assassin\'s Creed'],
  'Platformer': ['Prince of Persia'],
  'Fighting': ['UFC', 'WWE'],
  'Simulation': ['The Sims', 'Civilization'],
  'Action-Adventure': ['Batman', 'Uncharted', 'Tomb Raider', 'Assassin\'s Creed', 'Star Wars', 'Castlevania', 'Dante\'s Inferno'],
};

/**
 * Developer/Publisher mapping for known franchises
 */
const developerMap: Record<string, { developer: string; publisher: string }> = {
  'Call of Duty': { developer: 'Treyarch / Infinity Ward', publisher: 'Activision' },
  'Battlefield': { developer: 'DICE', publisher: 'Electronic Arts' },
  'Assassin\'s Creed': { developer: 'Ubisoft Montreal', publisher: 'Ubisoft' },
  'Halo': { developer: 'Bungie', publisher: 'Microsoft Game Studios' },
  'Gears of War': { developer: 'Epic Games', publisher: 'Microsoft Game Studios' },
  'Uncharted': { developer: 'Naughty Dog', publisher: 'Sony Computer Entertainment' },
  'Grand Theft Auto': { developer: 'Rockstar North', publisher: 'Rockstar Games' },
  'Red Dead Redemption': { developer: 'Rockstar San Diego', publisher: 'Rockstar Games' },
  'Mass Effect': { developer: 'BioWare', publisher: 'Electronic Arts' },
  'Fallout': { developer: 'Bethesda Game Studios', publisher: 'Bethesda Softworks' },
  'Elder Scrolls': { developer: 'Bethesda Game Studios', publisher: 'Bethesda Softworks' },
  'Need for Speed': { developer: 'EA Black Box / Criterion Games', publisher: 'Electronic Arts' },
  'Forza': { developer: 'Turn 10 Studios', publisher: 'Microsoft Studios' },
  'Batman': { developer: 'Rocksteady Studios', publisher: 'Warner Bros. Interactive' },
  'Dead Space': { developer: 'Visceral Games', publisher: 'Electronic Arts' },
  'Resident Evil': { developer: 'Capcom', publisher: 'Capcom' },
  'Saints Row': { developer: 'Volition', publisher: 'THQ' },
  'Far Cry': { developer: 'Ubisoft Montreal', publisher: 'Ubisoft' },
  'Splinter Cell': { developer: 'Ubisoft Montreal', publisher: 'Ubisoft' },
  'Rainbow Six': { developer: 'Ubisoft Montreal', publisher: 'Ubisoft' },
  'Ghost Recon': { developer: 'Ubisoft Paris', publisher: 'Ubisoft' },
  'The Last of Us': { developer: 'Naughty Dog', publisher: 'Sony Computer Entertainment' },
  'Killzone': { developer: 'Guerrilla Games', publisher: 'Sony Computer Entertainment' },
  'Resistance': { developer: 'Insomniac Games', publisher: 'Sony Computer Entertainment' },
  'Fable': { developer: 'Lionhead Studios', publisher: 'Microsoft Game Studios' },
  'Borderlands': { developer: 'Gearbox Software', publisher: '2K Games' },
  'Dead Rising': { developer: 'Capcom', publisher: 'Capcom' },
  'Just Cause': { developer: 'Avalanche Studios', publisher: 'Square Enix' },
  'Hitman': { developer: 'IO Interactive', publisher: 'Square Enix' },
  'Mafia': { developer: '2K Czech', publisher: '2K Games' },
  'Crysis': { developer: 'Crytek', publisher: 'Electronic Arts' },
  'Sleeping Dogs': { developer: 'United Front Games', publisher: 'Square Enix' },
  'Spec Ops': { developer: 'Yager Development', publisher: '2K Games' },
  'Yakuza': { developer: 'Sega', publisher: 'Sega' },
};

/**
 * Parse the game list file
 */
function parseGameList(filePath: string): GameEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  const games: GameEntry[] = [];
  
  for (const line of lines) {
    // Format: "Game Title - Platform"
    // Trim the line to remove any trailing whitespace or carriage returns
    const cleanLine = line.trim();
    const match = cleanLine.match(/^(.+?)\s+-\s+(.+)$/);
    if (match) {
      const [, title, platform] = match;
      games.push({
        title: title.trim(),
        platform: platform.trim(),
        rawLine: cleanLine,
      });
    }
  }
  
  return games;
}

/**
 * Detect genres based on game title
 */
function detectGenres(title: string): string[] {
  const genres = new Set<string>();
  
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        genres.add(genre);
      }
    }
  }
  
  // Default genre if none detected
  if (genres.size === 0) {
    genres.add('Action');
  }
  
  return Array.from(genres);
}

/**
 * Get developer and publisher info
 */
function getDeveloperInfo(title: string): { developer: string | null; publisher: string | null } {
  for (const [franchise, info] of Object.entries(developerMap)) {
    if (title.includes(franchise)) {
      return info;
    }
  }
  
  return { developer: null, publisher: null };
}

/**
 * Generate a description based on game title and genres
 */
function generateDescription(title: string, genres: string[]): string {
  const genreText = genres.join(', ');
  return `${title} is a ${genreText} game that delivers an immersive gaming experience with engaging gameplay and stunning visuals.`;
}

/**
 * Estimate release year based on game title patterns
 */
function estimateReleaseDate(title: string, platform: string): string | null {
  // Extract year from title if present
  const yearMatch = title.match(/\b(20\d{2}|\d{2})\b/);
  if (yearMatch) {
    let year = yearMatch[1];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-01-01`;
  }
  
  // Platform-based estimation
  if (platform === 'Xbox 360' || platform === 'PlayStation 3') {
    // These platforms were popular 2005-2013
    return '2010-01-01';
  }
  
  return null;
}

/**
 * Enrich game data with metadata
 */
function enrichGameData(entry: GameEntry): GameData {
  const { title, platform } = entry;
  const genres = detectGenres(title);
  const { developer, publisher } = getDeveloperInfo(title);
  const description = generateDescription(title, genres);
  const release_date = estimateReleaseDate(title, platform);
  
  return {
    title,
    description,
    cover_url: null, // Could be populated with IGDB API
    release_date,
    developer,
    publisher,
    genres,
    platforms: [platformMap[platform] || platform],
  };
}

/**
 * Insert or update game in database
 */
async function upsertGame(gameData: GameData): Promise<string | null> {
  try {
    // Check if game already exists
    const { data: existingGame, error: searchError } = await supabase
      .from('games')
      .select('id, platforms')
      .eq('title', gameData.title)
      .maybeSingle();
    
    if (searchError && searchError.code !== 'PGRST116') {
      console.error(`   ❌ Error searching for game "${gameData.title}":`, searchError.message);
      return null;
    }
    
    if (existingGame) {
      // Update existing game - merge platforms
      const updatedPlatforms = Array.from(
        new Set([...(existingGame.platforms || []), ...gameData.platforms])
      );
      
      const { error: updateError } = await supabase
        .from('games')
        .update({ platforms: updatedPlatforms })
        .eq('id', existingGame.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating game "${gameData.title}":`, updateError.message);
        return null;
      }
      
      return existingGame.id;
    } else {
      // Insert new game
      const { data: newGame, error: insertError } = await supabase
        .from('games')
        .insert(gameData)
        .select('id')
        .single();
      
      if (insertError) {
        console.error(`   ❌ Error inserting game "${gameData.title}":`, insertError.message);
        return null;
      }
      
      return newGame.id;
    }
  } catch (error) {
    console.error(`   ❌ Unexpected error for game "${gameData.title}":`, error);
    return null;
  }
}

/**
 * Main import function
 */
async function importGames() {
  console.log('🎮 Game Hub - Import Games Script\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Parse game list
  const gameListPath = path.join(process.cwd(), 'game_list_alphabetized.txt');
  
  if (!fs.existsSync(gameListPath)) {
    console.error(`❌ Game list file not found: ${gameListPath}`);
    process.exit(1);
  }
  
  console.log('📖 Reading game list...');
  const gameEntries = parseGameList(gameListPath);
  console.log(`   Found ${gameEntries.length} games to import\n`);
  
  // Import games
  let successCount = 0;
  let errorCount = 0;
  let updateCount = 0;
  
  console.log('🔄 Importing games...\n');
  
  for (let i = 0; i < gameEntries.length; i++) {
    const entry = gameEntries[i];
    const gameData = enrichGameData(entry);
    
    process.stdout.write(`[${i + 1}/${gameEntries.length}] ${entry.title} (${entry.platform})... `);
    
    // Check if game exists first
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('title', gameData.title)
      .maybeSingle();
    
    const gameId = await upsertGame(gameData);
    
    if (gameId) {
      if (existingGame) {
        console.log('✅ Updated');
        updateCount++;
      } else {
        console.log('✅ Inserted');
        successCount++;
      }
    } else {
      console.log('❌ Failed');
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📊 Import Summary:');
  console.log(`   ✅ New games inserted: ${successCount}`);
  console.log(`   🔄 Existing games updated: ${updateCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📈 Total processed: ${gameEntries.length}`);
  console.log('\n✨ Import complete!\n');
}

// Run the import
importGames().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

