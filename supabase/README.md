# Supabase Database Setup

This directory contains the database schema and setup instructions for Game Hub.

## Quick Setup

1. **Go to your Supabase project dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `ronrqkynooryaggvsfcr`

2. **Run the schema**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy and paste the contents of `schema.sql`
   - Click "Run" or press `Cmd/Ctrl + Enter`

3. **Verify the setup**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `profiles`
     - `games`
     - `user_games`
     - `custom_lists`
     - `list_games`

## Database Schema Overview

### Tables

#### `profiles`
Extended user information beyond the default auth.users table.
- Links to auth.users via UUID
- Stores display name, avatar, etc.
- Automatically created when a user signs up (via trigger)

#### `games`
Master list of all games (from IGDB API or manual entry).
- Stores game metadata (title, description, cover art, etc.)
- Can be linked to IGDB via `igdb_id`
- Publicly readable by all authenticated users

#### `user_games`
Junction table linking users to their game library.
- Tracks ownership, platform, progress, playtime
- Stores personal data: ratings, notes, tags
- Includes backlog status and priority
- Each user can own the same game on multiple platforms

#### `custom_lists`
User-created game collections (e.g., "Games to finish in 2025").
- Can be public or private
- Users can share lists with friends

#### `list_games`
Junction table for games in custom lists.
- Links lists to games with sort order

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Users can only see and modify their own data
- Games table is publicly readable
- Public lists can be viewed by anyone

### Automatic Features

1. **Auto-create profile on signup**: When a user signs up via Supabase Auth, a profile is automatically created in the `profiles` table.

2. **Auto-update timestamps**: `updated_at` fields are automatically updated on every row modification.

3. **Indexes**: Performance indexes are created on commonly queried fields.

## Testing the Database

After running the schema, test the connection:

```bash
# In your terminal
pnpm dev

# Then visit in your browser
http://localhost:3000/api/test-db
```

You should see a success message indicating the database is connected.

## Next Steps

1. Sign up for a new account at `/signup`
2. Check the `profiles` table in Supabase - you should see your new profile
3. Start building features that interact with the database!

## Common Operations

### View all profiles
```sql
SELECT * FROM public.profiles;
```

### View a user's game library
```sql
SELECT 
  g.title,
  ug.platform,
  ug.status,
  ug.completion_percentage,
  ug.playtime_hours
FROM public.user_games ug
JOIN public.games g ON g.id = ug.game_id
WHERE ug.user_id = 'YOUR_USER_ID';
```

### Add a game to your library
```sql
-- First, insert the game (if it doesn't exist)
INSERT INTO public.games (title, genres, platforms)
VALUES ('Elden Ring', ARRAY['RPG', 'Action'], ARRAY['PC', 'PlayStation', 'Xbox'])
RETURNING id;

-- Then, add it to your library
INSERT INTO public.user_games (user_id, game_id, platform, status)
VALUES ('YOUR_USER_ID', 'GAME_ID', 'Steam', 'playing');
```

