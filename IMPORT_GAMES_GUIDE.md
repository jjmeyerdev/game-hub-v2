# Game Import Guide

Quick guide to importing your game collection into Game Hub.

## Prerequisites

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   > ⚠️ **Important**: You need the `service_role` key (not the `anon` key) for the import scripts. Find it in your Supabase Dashboard → Project Settings → API.

## Two-Step Import Process

### Step 1: Import Games to Database

This adds all games from `game_list_alphabetized.txt` to the global games table:

```bash
pnpm run import-games
```

**What it does**:
- Reads all 141 games from the text file
- Enriches each game with metadata (genres, developers, descriptions)
- Inserts games into the `public.games` table
- Updates existing games with additional platforms

**Output**:
```
🎮 Game Hub - Import Games Script
📖 Reading game list...
   Found 141 games to import

🔄 Importing games...
[1/141] 007: Blood Stone (PlayStation 3)... ✅ Inserted
...

📊 Import Summary:
   ✅ New games inserted: 120
   🔄 Existing games updated: 21
   ❌ Errors: 0
```

### Step 2: Import Games to Your Library (Optional)

This adds all games to a specific user's personal library:

```bash
pnpm run import-to-library user@example.com
```

Replace `user@example.com` with your actual email address.

**What it does**:
- Looks up your user account by email
- Adds each game to your personal `user_games` table
- Sets default values (status: unplayed, priority: medium)
- Skips games already in your library

**Output**:
```
🎮 Game Hub - Import to User Library Script
👤 Looking up user: user@example.com
   ✅ Found user ID: abc-123-def

📖 Reading game list...
   Found 141 games to import

🔄 Adding games to user library...
[1/141] 007: Blood Stone (PlayStation 3)... ✅ Added
...

📊 Import Summary:
   ✅ Games added: 141
   ⏭️  Already in library: 0
   ❌ Not found in database: 0
```

## What Gets Imported

For each game in `game_list_alphabetized.txt`, the script extracts and enriches:

| Field | Description | Example |
|-------|-------------|---------|
| **Title** | Game name | "Call of Duty: Black Ops" |
| **Platform** | Gaming platform | "Xbox 360" |
| **Genres** | Auto-detected genres | ["Action", "Shooter"] |
| **Developer** | Game developer | "Treyarch" |
| **Publisher** | Game publisher | "Activision" |
| **Description** | Auto-generated | "Call of Duty: Black Ops is a Action, Shooter game..." |
| **Release Date** | Estimated date | "2010-01-01" |

## Supported Platforms

The script recognizes and normalizes these platforms:
- **Xbox 360** (88 games)
- **PlayStation 3** (52 games)
- **PC** (1 game)

## Auto-Detected Genres

The script intelligently detects genres based on game titles:

- **Action/Shooter**: Call of Duty, Battlefield, Halo, Gears of War, etc.
- **RPG**: Mass Effect, Fallout, Elder Scrolls, Fable, etc.
- **Racing**: Forza, Need for Speed, Burnout, Test Drive, etc.
- **Sports**: FIFA, Madden, NBA, MLB, UFC, WWE, etc.
- **Open World**: GTA, Red Dead Redemption, Saints Row, Just Cause, etc.
- **Adventure**: Assassin's Creed, Uncharted, Batman, etc.
- **Survival Horror**: Dead Space, Resident Evil, Dead Rising, etc.

## Known Developers/Publishers

The script recognizes major franchises and assigns correct developers:

- **Call of Duty** → Treyarch/Infinity Ward (Activision)
- **Assassin's Creed** → Ubisoft Montreal (Ubisoft)
- **Halo** → Bungie (Microsoft Game Studios)
- **Uncharted** → Naughty Dog (Sony Computer Entertainment)
- **Grand Theft Auto** → Rockstar North (Rockstar Games)
- **The Last of Us** → Naughty Dog (Sony Computer Entertainment)
- And 20+ more franchises...

## Troubleshooting

### "Missing required environment variables"

Make sure your `.env.local` file exists and contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### "User not found"

For the library import script:
1. Make sure you've signed up through the app first
2. Use the exact email address from your account
3. Check that the user exists in the `profiles` table

### "Game not found in database"

If importing to user library fails:
1. Run `pnpm run import-games` first
2. This populates the global games table
3. Then run the library import again

### Games not showing in dashboard

After running the scripts:
1. Refresh your browser
2. Log out and log back in
3. Check the Network tab for any API errors

## Manual Verification

You can verify the import in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Table Editor
3. Check the `games` table for all games
4. Check the `user_games` table for your personal library

## Next Steps

After importing:

1. **Browse your library** in the dashboard
2. **Update game status** (playing, completed, etc.)
3. **Add playtime** and completion percentage
4. **Rate games** with personal ratings
5. **Add notes** and custom tags
6. **Create custom lists** to organize your collection

## Advanced Usage

### Import only to database (no user library)

```bash
pnpm run import-games
```

This is useful if you want to:
- Populate the global game catalog
- Let users manually add games to their libraries
- Share the game database across multiple users

### Import to multiple user libraries

Run the library import for each user:

```bash
pnpm run import-to-library user1@example.com
pnpm run import-to-library user2@example.com
```

### Re-run imports safely

Both scripts are **idempotent**:
- `import-games`: Updates existing games, doesn't create duplicates
- `import-to-library`: Skips games already in your library

You can safely re-run them multiple times.

## File Structure

```
game-hub/
├── game_list_alphabetized.txt    # Source game list (141 games)
├── scripts/
│   ├── import-games.ts           # Import to global games table
│   ├── import-to-user-library.ts # Import to user's library
│   └── README.md                 # Detailed script documentation
└── IMPORT_GAMES_GUIDE.md         # This guide
```

## Need Help?

- Check `scripts/README.md` for detailed technical documentation
- Review the Supabase logs for database errors
- Inspect the console output for specific error messages
- Verify your environment variables are correct

---

**Happy Gaming! 🎮**

