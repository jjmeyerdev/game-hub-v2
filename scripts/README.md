# Game Import Scripts

This directory contains utility scripts for managing game data in the Game Hub database.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **import-games.ts** | `pnpm run import-games` | Import all games to the global database |
| **import-to-user-library.ts** | `pnpm run import-to-library <email>` | Import games to a user's personal library |
| **verify-import.ts** | `pnpm run verify-import [email]` | Verify import success and show statistics |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables (see SETUP.md)

# 3. Import games to database
pnpm run import-games

# 4. (Optional) Import to your library
pnpm run import-to-library your@email.com

# 5. Verify the import
pnpm run verify-import your@email.com
```

## Import Games Script

The `import-games.ts` script reads the `game_list_alphabetized.txt` file and imports all games into the Supabase database with enriched metadata.

### Prerequisites

1. **Environment Variables**: Create a `.env.local` file in the project root with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Service Role Key**: You need the Supabase service role key (not the anon key) for admin operations. Find it in:
   - Supabase Dashboard → Project Settings → API → `service_role` key (secret)

3. **Dependencies**: Install required packages:
   ```bash
   pnpm install
   ```

### Usage

Run the import script:

```bash
pnpm run import-games
```

Or directly with tsx:

```bash
npx tsx scripts/import-games.ts
```

### What It Does

The script performs the following operations:

1. **Parses Game List**: Reads `game_list_alphabetized.txt` and extracts:
   - Game title
   - Platform (Xbox 360, PlayStation 3, PC)

2. **Enriches Data**: For each game, it generates:
   - **Genres**: Detected based on title keywords (Action, RPG, Sports, etc.)
   - **Developer/Publisher**: Matched from known franchises
   - **Description**: Auto-generated based on title and genres
   - **Release Date**: Estimated based on platform and title
   - **Platforms**: Normalized platform names

3. **Database Operations**:
   - **New Games**: Inserts games that don't exist
   - **Existing Games**: Updates platform list (merges platforms)
   - **Deduplication**: Uses game title as unique identifier

### Data Enrichment

The script uses intelligent heuristics to fill in game metadata:

#### Genre Detection
Matches game titles against keyword patterns:
- **Action/Shooter**: Call of Duty, Battlefield, Halo, etc.
- **RPG**: Mass Effect, Fallout, Elder Scrolls, etc.
- **Racing**: Forza, Need for Speed, Burnout, etc.
- **Sports**: FIFA, Madden, NBA, MLB, etc.
- **Open World**: GTA, Red Dead Redemption, Saints Row, etc.

#### Developer/Publisher Mapping
Recognizes major franchises:
- Call of Duty → Treyarch/Infinity Ward (Activision)
- Assassin's Creed → Ubisoft Montreal (Ubisoft)
- Halo → Bungie (Microsoft Game Studios)
- Uncharted → Naughty Dog (Sony Computer Entertainment)
- And many more...

#### Platform Normalization
Maps platform names consistently:
- PlayStation 3
- Xbox 360
- PC

### Output

The script provides detailed progress information:

```
🎮 Game Hub - Import Games Script

═══════════════════════════════════════════════════════════

📖 Reading game list...
   Found 141 games to import

🔄 Importing games...

[1/141] 007: Blood Stone (PlayStation 3)... ✅ Inserted
[2/141] 007: Quantum of Solace (PlayStation 3)... ✅ Inserted
...

═══════════════════════════════════════════════════════════

📊 Import Summary:
   ✅ New games inserted: 120
   🔄 Existing games updated: 21
   ❌ Errors: 0
   📈 Total processed: 141

✨ Import complete!
```

### Database Schema

Games are inserted into the `public.games` table with the following structure:

```sql
CREATE TABLE public.games (
  id UUID PRIMARY KEY,
  igdb_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_date DATE,
  developer TEXT,
  publisher TEXT,
  genres TEXT[],
  platforms TEXT[],
  metacritic_score INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Error Handling

The script includes comprehensive error handling:
- ✅ Validates environment variables
- ✅ Checks file existence
- ✅ Handles duplicate games gracefully
- ✅ Reports individual game errors
- ✅ Continues processing on errors
- ✅ Provides detailed summary

### Future Enhancements

Potential improvements for future versions:

1. **IGDB API Integration**: Fetch real cover images, accurate release dates, and verified metadata
2. **Metacritic Scores**: Add review scores from Metacritic API
3. **Batch Processing**: Optimize database operations with batch inserts
4. **Cover Image Downloads**: Download and store cover images in Supabase Storage
5. **Manual Overrides**: Support a JSON file for manual metadata corrections
6. **Dry Run Mode**: Preview changes without committing to database

### Troubleshooting

**Error: Missing environment variables**
- Ensure `.env.local` contains all required variables
- Verify the service role key (not anon key)

**Error: Game list file not found**
- Ensure `game_list_alphabetized.txt` exists in project root
- Check file path and permissions

**Error: Database connection failed**
- Verify Supabase URL and keys are correct
- Check network connectivity
- Ensure Supabase project is active

**Games not appearing in dashboard**
- This script only populates the `games` table
- To add games to a user's library, use the dashboard UI
- Or create a separate script to populate `user_games` table

### Related Files

- `game_list_alphabetized.txt` - Source game list (141 games)
- `src/app/actions/games.ts` - Game-related server actions
- `supabase/schema.sql` - Database schema definition

