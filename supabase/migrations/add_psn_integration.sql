-- PlayStation Network Integration Migration
-- Adds PSN-related fields to support PSN API integration

-- ============================================================================
-- PROFILES TABLE - Add PSN account information
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psn_account_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psn_online_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psn_avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psn_trophy_level INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psn_last_sync TIMESTAMP WITH TIME ZONE;

-- Create index for faster PSN account ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_psn_account_id ON public.profiles(psn_account_id) WHERE psn_account_id IS NOT NULL;

-- ============================================================================
-- GAMES TABLE - Add PSN Communication ID for matching
-- ============================================================================

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS psn_communication_id TEXT UNIQUE;

-- Create index for faster PSN Communication ID lookups
CREATE INDEX IF NOT EXISTS idx_games_psn_communication_id ON public.games(psn_communication_id) WHERE psn_communication_id IS NOT NULL;

-- ============================================================================
-- PSN_TOKENS TABLE - Store encrypted access/refresh tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.psn_tokens (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.psn_tokens ENABLE ROW LEVEL SECURITY;

-- PSN tokens policies - users can only access their own tokens
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

-- Trigger for updated_at on psn_tokens
CREATE TRIGGER set_updated_at_psn_tokens
  BEFORE UPDATE ON public.psn_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
