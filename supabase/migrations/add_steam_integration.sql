-- Steam Integration Migration
-- Adds Steam-related fields to support Steam API integration

-- ============================================================================
-- PROFILES TABLE - Add Steam account information
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_persona_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_profile_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_last_sync TIMESTAMP WITH TIME ZONE;

-- Create index for faster Steam ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_steam_id ON public.profiles(steam_id) WHERE steam_id IS NOT NULL;

-- ============================================================================
-- GAMES TABLE - Add Steam App ID for matching
-- ============================================================================

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS steam_appid INTEGER UNIQUE;

-- Create index for faster Steam App ID lookups
CREATE INDEX IF NOT EXISTS idx_games_steam_appid ON public.games(steam_appid) WHERE steam_appid IS NOT NULL;

-- ============================================================================
-- USER_GAMES TABLE - Add Steam-specific tracking data
-- ============================================================================

ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS steam_playtime_minutes INTEGER DEFAULT 0;
ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS steam_last_played TIMESTAMP WITH TIME ZONE;

-- Create index for Steam playtime queries
CREATE INDEX IF NOT EXISTS idx_user_games_steam_playtime ON public.user_games(steam_playtime_minutes) WHERE steam_playtime_minutes > 0;

