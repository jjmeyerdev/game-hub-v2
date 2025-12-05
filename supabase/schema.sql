-- Game Hub Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- GAMES TABLE
-- Master list of all games (from IGDB or manual entry)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  igdb_id INTEGER UNIQUE, -- IGDB game ID for syncing
  steam_appid INTEGER UNIQUE, -- Steam App ID for syncing
  psn_communication_id TEXT UNIQUE, -- PSN Communication ID for syncing
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_date DATE,
  developer TEXT,
  publisher TEXT,
  genres TEXT[], -- Array of genre names
  platforms TEXT[], -- Array of platform names
  metacritic_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (games are public for reading)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Anyone can view games"
  ON public.games FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert games"
  ON public.games FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update games"
  ON public.games FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- USER_GAMES TABLE
-- Junction table linking users to their games with personal data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  
  -- Ownership & Platform
  platform TEXT NOT NULL, -- Steam, PlayStation, Xbox, Epic, etc.
  owned BOOLEAN DEFAULT true,
  
  -- Progress Tracking
  status TEXT DEFAULT 'unplayed', -- unplayed, testing, playing, on_hold, dropped, completed, 100_completed, mastery
  priority TEXT DEFAULT 'medium', -- low, medium, high
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  playtime_hours DECIMAL(10, 2) DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  
  -- Personal Data
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 10),
  notes TEXT,
  tags TEXT[], -- User-defined tags
  
  -- Achievements
  achievements_earned INTEGER DEFAULT 0,
  achievements_total INTEGER DEFAULT 0,

  -- Visibility
  hidden BOOLEAN DEFAULT false, -- Hide game from main library view

  -- Steam-specific tracking
  steam_playtime_minutes INTEGER DEFAULT 0,
  steam_last_played TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique combination of user, game, and platform
  UNIQUE(user_id, game_id, platform)
);

-- Enable Row Level Security
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

-- User games policies
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

-- ============================================================================
-- CUSTOM LISTS TABLE
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

-- Enable Row Level Security
ALTER TABLE public.custom_lists ENABLE ROW LEVEL SECURITY;

-- Custom lists policies
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

-- Enable Row Level Security
ALTER TABLE public.list_games ENABLE ROW LEVEL SECURITY;

-- List games policies
CREATE POLICY "Users can view games in their lists or public lists"
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

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

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

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_games
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_games
  BEFORE UPDATE ON public.user_games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_custom_lists
  BEFORE UPDATE ON public.custom_lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON public.games(igdb_id);
CREATE INDEX IF NOT EXISTS idx_games_title ON public.games(title);
CREATE INDEX IF NOT EXISTS idx_games_genres ON public.games USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_games_platforms ON public.games USING GIN(platforms);

-- User games indexes
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON public.user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_game_id ON public.user_games(game_id);
CREATE INDEX IF NOT EXISTS idx_user_games_platform ON public.user_games(platform);
CREATE INDEX IF NOT EXISTS idx_user_games_status ON public.user_games(status);
CREATE INDEX IF NOT EXISTS idx_user_games_last_played ON public.user_games(last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_games_tags ON public.user_games USING GIN(tags);

-- Custom lists indexes
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON public.custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_public ON public.custom_lists(is_public) WHERE is_public = true;

-- List games indexes
CREATE INDEX IF NOT EXISTS idx_list_games_list_id ON public.list_games(list_id);
CREATE INDEX IF NOT EXISTS idx_list_games_game_id ON public.list_games(game_id);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert a sample game
-- INSERT INTO public.games (title, description, cover_url, genres, platforms)
-- VALUES (
--   'Cyberpunk 2077',
--   'An open-world, action-adventure RPG set in the megalopolis of Night City.',
--   'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ld4.jpg',
--   ARRAY['RPG', 'Action', 'Adventure'],
--   ARRAY['PC', 'PlayStation 5', 'Xbox Series X|S']
-- );

