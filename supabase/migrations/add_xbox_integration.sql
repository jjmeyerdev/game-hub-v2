-- Xbox Live Integration Migration
-- Adds Xbox-related fields to support Xbox Live API integration (via OpenXBL)

-- ============================================================================
-- PROFILES TABLE - Add Xbox account information
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xbox_xuid TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xbox_gamertag TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xbox_avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xbox_gamerscore INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xbox_last_sync TIMESTAMP WITH TIME ZONE;

-- Create index for faster Xbox XUID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_xbox_xuid ON public.profiles(xbox_xuid) WHERE xbox_xuid IS NOT NULL;

-- ============================================================================
-- GAMES TABLE - Add Xbox Title ID for matching
-- ============================================================================

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS xbox_title_id TEXT UNIQUE;

-- Create index for faster Xbox Title ID lookups
CREATE INDEX IF NOT EXISTS idx_games_xbox_title_id ON public.games(xbox_title_id) WHERE xbox_title_id IS NOT NULL;

-- ============================================================================
-- USER_GAMES TABLE - Add Xbox-specific tracking data
-- ============================================================================

ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS xbox_title_id TEXT;
ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS xbox_last_played TIMESTAMP WITH TIME ZONE;

-- Create index for Xbox title ID on user_games
CREATE INDEX IF NOT EXISTS idx_user_games_xbox_title_id ON public.user_games(xbox_title_id) WHERE xbox_title_id IS NOT NULL;

-- ============================================================================
-- XBOX_TOKENS TABLE - Store API keys for users
-- Note: OpenXBL uses personal API keys rather than OAuth tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.xbox_tokens (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.xbox_tokens ENABLE ROW LEVEL SECURITY;

-- Xbox tokens policies - users can only access their own tokens
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

-- Trigger for updated_at on xbox_tokens
CREATE TRIGGER set_updated_at_xbox_tokens
  BEFORE UPDATE ON public.xbox_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
