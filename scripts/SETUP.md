# Import Scripts Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

This will install the required `tsx` package for running TypeScript scripts.

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with the following content:

```env
# Supabase Configuration

# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous Key (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role Key (secret - required for import scripts)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Where to Find These Values:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Project Settings** → **API**
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal" button) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Security Warning**: The `service_role` key has admin privileges. Never commit it to version control or expose it publicly!

### 3. Run the Import

#### Option A: Import Games Only (Recommended First)

This adds all games to the global database:

```bash
pnpm run import-games
```

#### Option B: Import to Your Personal Library

First, make sure you've signed up through the app. Then run:

```bash
pnpm run import-to-library your-email@example.com
```

Replace `your-email@example.com` with your actual account email.

## What Gets Imported

The scripts will import **141 games** from `game_list_alphabetized.txt`:

- **88 Xbox 360 games**
- **52 PlayStation 3 games**
- **1 PC game**

Each game includes:
- ✅ Title
- ✅ Platform(s)
- ✅ Auto-detected genres
- ✅ Developer & publisher (for known franchises)
- ✅ Auto-generated description
- ✅ Estimated release date

## Expected Output

### Import Games Script

```
🎮 Game Hub - Import Games Script

═══════════════════════════════════════════════════════════

📖 Reading game list...
   Found 141 games to import

🔄 Importing games...

[1/141] 007: Blood Stone (PlayStation 3)... ✅ Inserted
[2/141] 007: Quantum of Solace (PlayStation 3)... ✅ Inserted
[3/141] Army of Two (Xbox 360)... ✅ Inserted
...
[141/141] Yakuza 3 (PlayStation 3)... ✅ Inserted

═══════════════════════════════════════════════════════════

📊 Import Summary:
   ✅ New games inserted: 141
   🔄 Existing games updated: 0
   ❌ Errors: 0
   📈 Total processed: 141

✨ Import complete!
```

### Import to Library Script

```
🎮 Game Hub - Import to User Library Script

═══════════════════════════════════════════════════════════

👤 Looking up user: user@example.com
   ✅ Found user ID: abc-123-def-456

📖 Reading game list...
   Found 141 games to import

🔄 Adding games to user library...

[1/141] 007: Blood Stone (PlayStation 3)... ✅ Added
[2/141] 007: Quantum of Solace (PlayStation 3)... ✅ Added
...
[141/141] Yakuza 3 (PlayStation 3)... ✅ Added

═══════════════════════════════════════════════════════════

📊 Import Summary:
   ✅ Games added: 141
   ⏭️  Already in library: 0
   ❌ Not found in database: 0
   ❌ Errors: 0
   📈 Total processed: 141

✨ Import complete!
```

## Verification

After running the scripts, verify the import:

### In Supabase Dashboard

1. Go to **Table Editor**
2. Select **games** table
3. You should see 141 games (or more if you had existing games)
4. If you ran the library import, check **user_games** table

### In the App

1. Log in to your account
2. Go to the Dashboard
3. You should see all your games listed
4. Try filtering by platform, status, etc.

## Troubleshooting

### Error: "Missing required environment variables"

**Solution**: Make sure your `.env.local` file exists and contains all three required variables.

### Error: "User not found"

**Solution**: 
1. Sign up through the app first
2. Use the exact email address from your account
3. Check that the user exists in the `profiles` table in Supabase

### Error: "Game list file not found"

**Solution**: Make sure `game_list_alphabetized.txt` exists in the project root directory.

### Error: "Database connection failed"

**Solution**:
1. Verify your Supabase URL is correct
2. Check that your service role key is correct (not the anon key)
3. Ensure your Supabase project is active and not paused

### Games imported but not showing in dashboard

**Solution**:
1. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Log out and log back in
3. Check browser console for errors
4. Verify the games exist in the database using Supabase Dashboard

### Some games failed to import

**Solution**:
1. Check the console output for specific error messages
2. The script continues on errors, so most games should still import
3. You can re-run the script safely (it skips existing games)

## Advanced Usage

### Re-running the Scripts

Both scripts are **safe to re-run**:

- **import-games.ts**: Updates existing games instead of creating duplicates
- **import-to-user-library.ts**: Skips games already in your library

### Importing for Multiple Users

Run the library import script for each user:

```bash
pnpm run import-to-library user1@example.com
pnpm run import-to-library user2@example.com
pnpm run import-to-library user3@example.com
```

### Custom Game Lists

To import a different game list:

1. Create a new text file with the same format:
   ```
   Game Title - Platform
   Another Game - Platform
   ```
2. Modify the script to point to your file
3. Run the import

### Dry Run (Preview Mode)

To preview what would be imported without making changes:

1. Comment out the database insert/update lines in the script
2. Run the script to see the parsed data
3. Uncomment and run again to actually import

## Next Steps

After successfully importing your games:

1. **Explore the Dashboard**: Browse your game library
2. **Update Game Status**: Mark games as playing, completed, etc.
3. **Track Progress**: Add playtime and completion percentage
4. **Rate Your Games**: Add personal ratings (1-10)
5. **Add Notes**: Keep track of your thoughts and memories
6. **Create Lists**: Organize games into custom collections
7. **Set Priorities**: Mark which games to play next

## Script Files

- `scripts/import-games.ts` - Import games to global database
- `scripts/import-to-user-library.ts` - Import to user's personal library
- `scripts/README.md` - Detailed technical documentation
- `scripts/SETUP.md` - This setup guide

## Support

For more information:
- See `IMPORT_GAMES_GUIDE.md` in the project root
- Check `scripts/README.md` for technical details
- Review the Supabase documentation
- Check the Next.js documentation

---

**Ready to import? Run `pnpm run import-games` to get started! 🎮**

