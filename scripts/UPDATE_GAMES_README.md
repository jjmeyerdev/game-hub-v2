# Update Games from IGDB Script

This script automatically updates all games in your database with missing or incomplete data from the IGDB API.

## What It Does

The script will:

1. ✅ Fetch all games from your Supabase database
2. 🔍 Identify games with missing data (cover image, description, or developer)
3. 🔎 Search IGDB API for each game that needs updating (with platform context)
4. 📝 Update the database with:
   - Game title (corrected if needed)
   - Cover image URL (high-quality)
   - Description/summary
   - Developer name
   - Platform/Console information (corrected if needed)
5. 📊 Provide a detailed report of updates

## Prerequisites

Make sure you have the following in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

## Usage

Run the script using:

```bash
pnpm update-games
```

Or:

```bash
npm run update-games
```

## What Gets Updated

The script only updates games that are missing one or more of the following fields:

- **Cover URL**: High-quality game cover art
- **Description**: Game summary/description
- **Developer**: Developer/studio name
- **Platform/Console**: Corrects platform information based on IGDB data

Games that already have all this information will be skipped.

### Platform/Console Updates

The script intelligently maps IGDB platform names to your database format:

- **PlayStation**: Maps to `PlayStation (PS5)`, `PlayStation (PS4)`, `PlayStation (PS3)`, etc.
- **Xbox**: Maps to `Xbox (Xbox Series X)`, `Xbox (Xbox One)`, `Xbox (Xbox 360)`, etc.
- **Nintendo**: Maps to `Nintendo (Switch)`, `Nintendo (3DS)`, `Nintendo (Wii U)`, etc.
- **PC**: Maps to `Steam` or `Epic` based on context

The script uses the platform information from your database to find the best match on IGDB, ensuring accurate results.

## Rate Limiting

The script respects IGDB API rate limits by:

- Processing games sequentially
- Adding delays between requests (4 requests per second max)
- Handling errors gracefully

## Output Example

```
🎮 Starting IGDB Game Update Script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Getting IGDB access token...
✅ Access token obtained

📚 Fetching games from database...
✅ Found 141 games

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Status:
   ✓ Complete: 45 games
   ⚠ Need update: 96 games

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Starting updates...

[1/96] Processing: Uncharted 2: Among Thieves
   Platform: PlayStation (PS3)
   ✅ Updated successfully

[2/96] Processing: The Last of Us
   Platform: PlayStation (PS3)
   📝 Platform updated: PlayStation (PS3) → PlayStation (PS4)
   ✅ Updated successfully

[3/96] Processing: God of War
   Platform: PlayStation (PS4)
   ✅ Updated successfully

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Final Results:
   ✅ Successfully updated: 89 games
   ⚠️  Not found on IGDB: 5 games
   ❌ Failed to update: 2 games
   📚 Total processed: 96 games

💡 Tip: Games not found on IGDB may need manual entry or have different titles.

🎉 Update process complete!
```

## Troubleshooting

### "Missing required environment variables"

Make sure your `.env.local` file contains all required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

### "Failed to get IGDB access token"

Check that your Twitch API credentials are correct. You can get them from:
https://dev.twitch.tv/console/apps

### "Not found on IGDB"

Some games may not be found because:
- The title in your database doesn't match IGDB's title
- The game is very obscure or not in IGDB's database
- The title has special characters or formatting issues

You can manually edit these games using the Edit Game modal in the dashboard.

### Rate Limit Errors

If you encounter rate limit errors, the script will automatically handle them. If issues persist, you can:
- Wait a few minutes and run the script again
- The script will only process games that still need updates

## Safety Features

- ✅ Only updates games with missing data (doesn't overwrite complete data)
- ✅ Uses service role key for database access (bypasses RLS)
- ✅ Respects API rate limits
- ✅ Provides detailed logging
- ✅ Handles errors gracefully
- ✅ Non-destructive (only adds/updates, never deletes)

## Notes

- The script may take several minutes to complete depending on how many games need updating
- Progress is shown in real-time
- You can safely interrupt the script (Ctrl+C) and run it again later
- Already updated games will be skipped on subsequent runs

