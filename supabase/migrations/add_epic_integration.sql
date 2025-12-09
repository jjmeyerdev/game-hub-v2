-- Epic Games Integration Migration
-- Adds Epic Games Store support to Game Hub

-- ============================================================================
-- ADD EPIC COLUMNS TO PROFILES TABLE
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS epic_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS epic_display_name TEXT,
ADD COLUMN IF NOT EXISTS epic_last_sync TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- ADD EPIC COLUMNS TO GAMES TABLE
-- ============================================================================
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS epic_catalog_item_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS epic_namespace TEXT;

-- ============================================================================
-- CREATE EPIC_TOKENS TABLE
-- Stores Epic Games OAuth tokens for authenticated API access
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

-- Enable Row Level Security
ALTER TABLE public.epic_tokens ENABLE ROW LEVEL SECURITY;

-- Epic tokens policies - only users can access their own tokens
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

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_epic_account_id ON public.profiles(epic_account_id);
CREATE INDEX IF NOT EXISTS idx_games_epic_catalog_item_id ON public.games(epic_catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_games_epic_namespace ON public.games(epic_namespace);
CREATE INDEX IF NOT EXISTS idx_epic_tokens_user_id ON public.epic_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_epic_tokens_expires_at ON public.epic_tokens(expires_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER set_updated_at_epic_tokens
  BEFORE UPDATE ON public.epic_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
