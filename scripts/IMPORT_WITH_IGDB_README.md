# Import Games with IGDB Data

This script imports games from your text file and automatically fetches complete information from the IGDB API, matching all fields from the AddGameModal.

## What It Does

The script will:

1. ✅ Read games from `game_list_alphabetized.txt`
2. 🔍 Search IGDB for each game with platform context
3. 📝 Create complete game entries with:
   - Game title (from IGDB)
   - High-quality cover image
   - Description/summary
   - Developer name
   - Platform/Console (properly formatted)
4. 👤 Add games to your user library with:
   - Platform information
   - Default status: "Unplayed"
   - Completion: 0%
   - Playtime: 0 hours
5. 📊 Provide a detailed import report

## Prerequisites

### 1. Environment Variables

Make sure you have these in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret
```

### 2. User Email

**IMPORTANT:** You need to set your email in the script.

#### Option 1: Let the script auto-detect (easiest)
The script will automatically use the first user in your database.

#### Option 2: Set it manually (recommended)
1. Edit the script:
```typescript
// Change this line in scripts/import-games-with-igdb.ts
const USER_EMAIL = 'your-email@example.com';
```

2. Use the same email you used to sign up for the app

### 3. Game List File

Ensure `game_list_alphabetized.txt` is in the project root with format:
```
Game Title - Platform
```

Example:
```
Uncharted 2: Among Thieves - PlayStation 3
Halo 3 - Xbox 360
The Sims 3 - PC
```

## Usage

Run the script using:

```bash
pnpm import-with-igdb
```

Or:

```bash
npm run import-with-igdb
```

## What Gets Imported

### Games Table
- **Title**: Corrected title from IGDB
- **Cover URL**: High-quality cover art (t_cover_big)
- **Description**: Game summary from IGDB
- **Developer**: Studio/developer name

### User Games Table
- **Platform**: Properly formatted (e.g., "PlayStation (PS3)")
- **Status**: "unplayed" (default)
- **Completion**: 0%
- **Playtime**: 0 hours

## Platform Mapping

The script automatically maps platform names to match the AddGameModal format:

| From File | To Database |
|-----------|-------------|
| PlayStation 3 | PlayStation (PS3) |
| PlayStation 4 | PlayStation (PS4) |
| Xbox 360 | Xbox (Xbox 360) |
| Xbox One | Xbox (Xbox One) |
| Nintendo Switch | Nintendo (Switch) |
| PC | Steam |

## Features

### Smart IGDB Matching
- Searches IGDB with platform context
- Prefers games that match your platform
- Falls back to best match if platform not found

### Duplicate Prevention
- Checks if game already exists in database
- Checks if you already have the game on that platform
- Skips duplicates automatically

### Rate Limiting
- Respects IGDB API limits (4 requests per second)
- Automatic delays between requests
- Safe for large game lists

### Error Handling
- Continues on errors
- Imports games even if IGDB data not found
- Provides detailed error messages

## Output Example

```
🎮 Starting Game Import with IGDB Data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Getting user from email...
✅ User found: your-email@example.com
✅ User ID: abc123-def456-ghi789

🔑 Getting IGDB access token...
✅ Access token obtained

📚 Parsing game list...
✅ Found 141 games to import

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Starting import...

[1/141] Uncharted 2: Among Thieves (PlayStation 3)
   ✅ Found on IGDB: Uncharted 2: Among Thieves
   ✅ Imported successfully

[2/141] Halo 3 (Xbox 360)
   ✅ Found on IGDB: Halo 3
   ✅ Imported successfully

[3/141] The Last of Us (PlayStation 3)
   ✅ Found on IGDB: The Last of Us
   ✅ Imported successfully

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Final Results:
   ✅ Successfully imported: 135 games
   ⏭️  Already in library: 0 games
   ⚠️  Not found on IGDB: 6 games
   ❌ Failed to import: 0 games
   📚 Total processed: 141 games

💡 Tip: Games not found on IGDB were imported with basic information.
   You can update them later using the update-games script or manually edit them.

🎉 Import process complete!
```

## Troubleshooting

### "Could not determine user ID"

**Solution:**
1. Set `USER_EMAIL` in the script to your account email
2. Check that you have a user in Supabase Authentication
3. Verify the email matches exactly (case-sensitive)

### "Missing required environment variables"

**Solution:**
Make sure your `.env.local` has all required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

### "Not found on IGDB"

**Reasons:**
- Game title doesn't match IGDB's database
- Game is very obscure or not in IGDB
- Title has special characters or formatting issues

**Solution:**
- The game will still be imported with basic info
- You can manually edit it later through the dashboard
- Or run the `update-games` script after import

### "Already in library"

This means you already have this game on this platform. The script skips it to prevent duplicates.

### Rate Limit Errors

The script automatically handles rate limits. If you still encounter issues:
- Wait a few minutes and run again
- The script will skip already imported games

## Comparison with Other Import Scripts

### `import-games.ts` (Old)
- ❌ No IGDB data
- ❌ Manual entry required
- ✅ Fast

### `import-with-igdb.ts` (This Script)
- ✅ Complete IGDB data
- ✅ Cover images
- ✅ Descriptions
- ✅ Developer info
- ✅ Platform matching
- ⏱️ Slower (API calls)

### `update-games.ts`
- ✅ Updates existing games
- ❌ Doesn't import new games

## Recommended Workflow

1. **First Time Setup:**
   ```bash
   pnpm import-with-igdb
   ```
   This imports everything with IGDB data in one go.

2. **Adding More Games:**
   - Add them to `game_list_alphabetized.txt`
   - Run `pnpm import-with-igdb` again
   - Already imported games will be skipped

3. **Updating Existing Games:**
   ```bash
   pnpm update-games
   ```
   Use this to refresh data for games already in your library.

## Safety Features

- ✅ Duplicate prevention
- ✅ Non-destructive (won't overwrite existing games)
- ✅ Continues on errors
- ✅ Detailed logging
- ✅ Rate limit compliance
- ✅ Platform-aware matching

## Notes

- Import time: ~2-3 minutes for 141 games (due to API rate limits)
- Progress is shown in real-time
- You can safely interrupt (Ctrl+C) and resume later
- Already imported games will be skipped on subsequent runs
- Games without IGDB data are still imported with basic info

