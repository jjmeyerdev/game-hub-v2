-- ============================================================================
-- Game Hub Database Schema
-- Complete schema for fresh installations
-- Run this in Supabase SQL Editor for new projects
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES TABLE
-- Extended user information beyond auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Steam integration
  steam_id TEXT UNIQUE,
  steam_persona_name TEXT,
  steam_avatar_url TEXT,
  steam_profile_url TEXT,
  steam_last_sync TIMESTAMP WITH TIME ZONE,

  -- PlayStation Network integration
  psn_account_id TEXT UNIQUE,
  psn_online_id TEXT,
  psn_avatar_url TEXT,
  psn_trophy_level INTEGER,
  psn_last_sync TIMESTAMP WITH TIME ZONE,

  -- Xbox Live integration
  xbox_xuid TEXT UNIQUE,
  xbox_gamertag TEXT,
  xbox_avatar_url TEXT,
  xbox_gamerscore INTEGER,
  xbox_last_sync TIMESTAMP WITH TIME ZONE,

  -- Epic Games integration
  epic_account_id TEXT UNIQUE,
  epic_display_name TEXT,
  epic_last_sync TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Profiles: Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_steam_id ON public.profiles(steam_id) WHERE steam_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_psn_account_id ON public.profiles(psn_account_id) WHERE psn_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_xbox_xuid ON public.profiles(xbox_xuid) WHERE xbox_xuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_epic_account_id ON public.profiles(epic_account_id) WHERE epic_account_id IS NOT NULL;

-- Profiles: Trigger
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- GAMES TABLE
-- Master list of all games (from IGDB or manual entry)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- External IDs for platform matching
  igdb_id INTEGER UNIQUE,
  steam_appid INTEGER UNIQUE,
  psn_communication_id TEXT UNIQUE,
  xbox_title_id TEXT UNIQUE,
  epic_catalog_item_id TEXT UNIQUE,
  epic_namespace TEXT,

  -- Game metadata
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_date DATE,
  developer TEXT,
  publisher TEXT,
  genres TEXT[],
  platforms TEXT[],
  metacritic_score INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Games: Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Games: Policies
CREATE POLICY "Anyone can view games"
  ON public.games FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert games"
  ON public.games FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update games"
  ON public.games FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Games: Indexes
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON public.games(igdb_id);
CREATE INDEX IF NOT EXISTS idx_games_title ON public.games(title);
CREATE INDEX IF NOT EXISTS idx_games_genres ON public.games USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_games_platforms ON public.games USING GIN(platforms);
CREATE INDEX IF NOT EXISTS idx_games_steam_appid ON public.games(steam_appid) WHERE steam_appid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_psn_communication_id ON public.games(psn_communication_id) WHERE psn_communication_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_xbox_title_id ON public.games(xbox_title_id) WHERE xbox_title_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_epic_catalog_item_id ON public.games(epic_catalog_item_id) WHERE epic_catalog_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_epic_namespace ON public.games(epic_namespace) WHERE epic_namespace IS NOT NULL;

-- Games: Trigger
CREATE TRIGGER set_updated_at_games
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- USER_GAMES TABLE
-- Junction table linking users to their games with personal data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Ownership & Platform
  platform TEXT NOT NULL,
  owned BOOLEAN DEFAULT true,
  ownership_status TEXT NOT NULL DEFAULT 'owned',
  is_physical BOOLEAN NOT NULL DEFAULT false,
  hidden BOOLEAN DEFAULT false,

  -- Progress Tracking
  status TEXT DEFAULT 'unplayed',
  priority TEXT DEFAULT 'medium',
  completion_percentage INTEGER DEFAULT 0,
  playtime_hours DECIMAL(10, 2) DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,

  -- Personal Data
  personal_rating INTEGER,
  notes TEXT,
  tags TEXT[],
  locked_fields JSONB DEFAULT '{}'::jsonb,

  -- Achievements
  achievements_earned INTEGER DEFAULT 0,
  achievements_total INTEGER DEFAULT 0,

  -- Steam-specific
  steam_appid INTEGER,
  steam_playtime_minutes INTEGER DEFAULT 0,
  steam_last_played TIMESTAMP WITH TIME ZONE,

  -- Xbox-specific
  xbox_title_id TEXT,
  xbox_last_played TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  UNIQUE(user_id, game_id, platform),
  CONSTRAINT user_games_completion_check CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  CONSTRAINT user_games_rating_check CHECK (personal_rating IS NULL OR (personal_rating >= 1 AND personal_rating <= 10)),
  CONSTRAINT user_games_ownership_status_check CHECK (ownership_status IN ('owned', 'wishlist', 'unowned'))
);

-- User Games: Enable RLS
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

-- User Games: Policies
CREATE POLICY "Users can view their own games"
  ON public.user_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games"
  ON public.user_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games"
  ON public.user_games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games"
  ON public.user_games FOR DELETE
  USING (auth.uid() = user_id);

-- User Games: Indexes
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON public.user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_game_id ON public.user_games(game_id);
CREATE INDEX IF NOT EXISTS idx_user_games_platform ON public.user_games(platform);
CREATE INDEX IF NOT EXISTS idx_user_games_status ON public.user_games(status);
CREATE INDEX IF NOT EXISTS idx_user_games_last_played ON public.user_games(last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_games_tags ON public.user_games USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_games_hidden ON public.user_games(hidden);
CREATE INDEX IF NOT EXISTS idx_user_games_user_hidden ON public.user_games(user_id, hidden);
CREATE INDEX IF NOT EXISTS idx_user_games_ownership_status ON public.user_games(ownership_status);
CREATE INDEX IF NOT EXISTS idx_user_games_is_physical ON public.user_games(is_physical) WHERE is_physical = true;
CREATE INDEX IF NOT EXISTS idx_user_games_steam_appid ON public.user_games(steam_appid);
CREATE INDEX IF NOT EXISTS idx_user_games_user_steam ON public.user_games(user_id, steam_appid);
CREATE INDEX IF NOT EXISTS idx_user_games_steam_playtime ON public.user_games(steam_playtime_minutes) WHERE steam_playtime_minutes > 0;
CREATE INDEX IF NOT EXISTS idx_user_games_xbox_title_id ON public.user_games(xbox_title_id) WHERE xbox_title_id IS NOT NULL;

-- User Games: Trigger
CREATE TRIGGER set_updated_at_user_games
  BEFORE UPDATE ON public.user_games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- User Games: Comments
COMMENT ON COLUMN public.user_games.owned IS 'DEPRECATED: Use ownership_status instead';
COMMENT ON COLUMN public.user_games.ownership_status IS 'Ownership status: owned, wishlist, or unowned';
COMMENT ON COLUMN public.user_games.is_physical IS 'Whether the user owns a physical copy';
COMMENT ON COLUMN public.user_games.steam_appid IS 'Steam App ID - cached for fast session tracking';
COMMENT ON COLUMN public.user_games.locked_fields IS 'Fields locked from being overwritten during syncs/IGDB refreshes. Keys: cover, description, developer, publisher, releaseDate, genres';

-- ============================================================================
-- GAME_SESSIONS TABLE
-- Tracks individual gaming sessions with start/end times and duration
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_game_id UUID REFERENCES public.user_games(id) ON DELETE CASCADE NOT NULL,

  -- Session timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,

  -- Session metadata
  status TEXT NOT NULL DEFAULT 'active',
  steam_appid INTEGER,
  platform TEXT NOT NULL DEFAULT 'Steam',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT game_sessions_valid_status CHECK (status IN ('active', 'completed')),
  CONSTRAINT game_sessions_valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);

-- Game Sessions: Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Game Sessions: Policies
CREATE POLICY "Users can view their own sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.game_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Game Sessions: Indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_game_id ON public.game_sessions(user_game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started_at ON public.game_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status ON public.game_sessions(user_id, status);

-- Game Sessions: Trigger
CREATE TRIGGER set_updated_at_game_sessions
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Game Sessions: Comments
COMMENT ON TABLE public.game_sessions IS 'Tracks individual gaming sessions with start/end times and duration';
COMMENT ON COLUMN public.game_sessions.status IS 'Session status: active (currently playing) or completed (ended)';
COMMENT ON COLUMN public.game_sessions.duration_minutes IS 'Calculated duration when session ends';

-- ============================================================================
-- CUSTOM_LISTS TABLE
-- User-created game collections
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom Lists: Enable RLS
ALTER TABLE public.custom_lists ENABLE ROW LEVEL SECURITY;

-- Custom Lists: Policies
CREATE POLICY "Users can view their own lists"
  ON public.custom_lists FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own lists"
  ON public.custom_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON public.custom_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON public.custom_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Custom Lists: Indexes
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON public.custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_public ON public.custom_lists(is_public) WHERE is_public = true;

-- Custom Lists: Trigger
CREATE TRIGGER set_updated_at_custom_lists
  BEFORE UPDATE ON public.custom_lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- LIST_GAMES TABLE
-- Junction table for games in custom lists
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.list_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.custom_lists(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(list_id, game_id)
);

-- List Games: Enable RLS
ALTER TABLE public.list_games ENABLE ROW LEVEL SECURITY;

-- List Games: Policies
CREATE POLICY "Users can view games in accessible lists"
  ON public.list_games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_lists
      WHERE custom_lists.id = list_games.list_id
      AND (custom_lists.user_id = auth.uid() OR custom_lists.is_public = true)
    )
  );

CREATE POLICY "Users can add games to their own lists"
  ON public.list_games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_lists
      WHERE custom_lists.id = list_games.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove games from their own lists"
  ON public.list_games FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_lists
      WHERE custom_lists.id = list_games.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

-- List Games: Indexes
CREATE INDEX IF NOT EXISTS idx_list_games_list_id ON public.list_games(list_id);
CREATE INDEX IF NOT EXISTS idx_list_games_game_id ON public.list_games(game_id);

-- ============================================================================
-- PSN_TOKENS TABLE
-- Stores PlayStation Network OAuth tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.psn_tokens (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PSN Tokens: Enable RLS
ALTER TABLE public.psn_tokens ENABLE ROW LEVEL SECURITY;

-- PSN Tokens: Policies
CREATE POLICY "Users can view their own PSN tokens"
  ON public.psn_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PSN tokens"
  ON public.psn_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PSN tokens"
  ON public.psn_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PSN tokens"
  ON public.psn_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- PSN Tokens: Trigger
CREATE TRIGGER set_updated_at_psn_tokens
  BEFORE UPDATE ON public.psn_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- XBOX_TOKENS TABLE
-- Stores Xbox Live API keys (OpenXBL uses API keys, not OAuth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.xbox_tokens (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Xbox Tokens: Enable RLS
ALTER TABLE public.xbox_tokens ENABLE ROW LEVEL SECURITY;

-- Xbox Tokens: Policies
CREATE POLICY "Users can view their own Xbox tokens"
  ON public.xbox_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Xbox tokens"
  ON public.xbox_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Xbox tokens"
  ON public.xbox_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Xbox tokens"
  ON public.xbox_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Xbox Tokens: Trigger
CREATE TRIGGER set_updated_at_xbox_tokens
  BEFORE UPDATE ON public.xbox_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- EPIC_TOKENS TABLE
-- Stores Epic Games OAuth tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.epic_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Epic Tokens: Enable RLS
ALTER TABLE public.epic_tokens ENABLE ROW LEVEL SECURITY;

-- Epic Tokens: Policies
CREATE POLICY "Users can view their own Epic tokens"
  ON public.epic_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Epic tokens"
  ON public.epic_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Epic tokens"
  ON public.epic_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Epic tokens"
  ON public.epic_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Epic Tokens: Indexes
CREATE INDEX IF NOT EXISTS idx_epic_tokens_user_id ON public.epic_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_epic_tokens_expires_at ON public.epic_tokens(expires_at);

-- Epic Tokens: Trigger
CREATE TRIGGER set_updated_at_epic_tokens
  BEFORE UPDATE ON public.epic_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- DISMISSED_DUPLICATES TABLE
-- Stores user's dismissed duplicate pairs to exclude from future scans
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dismissed_duplicates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Store the normalized title that was used for grouping
  -- This allows us to match against future scans using the same normalization
  normalized_title TEXT NOT NULL,

  -- Store the game IDs that were in the dismissed group
  -- Using JSONB array to store multiple game IDs
  game_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Unique constraint: one dismissal per normalized title per user
  UNIQUE(user_id, normalized_title)
);

-- Dismissed Duplicates: Enable RLS
ALTER TABLE public.dismissed_duplicates ENABLE ROW LEVEL SECURITY;

-- Dismissed Duplicates: Policies
CREATE POLICY "Users can view their own dismissed duplicates"
  ON public.dismissed_duplicates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed duplicates"
  ON public.dismissed_duplicates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed duplicates"
  ON public.dismissed_duplicates FOR DELETE
  USING (auth.uid() = user_id);

-- Dismissed Duplicates: Indexes
CREATE INDEX IF NOT EXISTS idx_dismissed_duplicates_user_id
  ON public.dismissed_duplicates(user_id);

CREATE INDEX IF NOT EXISTS idx_dismissed_duplicates_normalized_title
  ON public.dismissed_duplicates(user_id, normalized_title);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Daily playtime summary view (security invoker to respect RLS)
CREATE OR REPLACE VIEW public.daily_playtime_summary
WITH (security_invoker = true) AS
SELECT
  user_id,
  DATE(started_at AT TIME ZONE 'UTC') as play_date,
  SUM(COALESCE(duration_minutes, 0)) as total_minutes,
  COUNT(*) as session_count
FROM public.game_sessions
WHERE status = 'completed'
GROUP BY user_id, DATE(started_at AT TIME ZONE 'UTC');

COMMENT ON VIEW public.daily_playtime_summary IS 'Aggregates total playtime per user per day from completed sessions';

-- Grant permissions on view
GRANT SELECT ON public.daily_playtime_summary TO authenticated;

-- ============================================================================
-- AUTH TRIGGER
-- Creates profile when user signs up
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
