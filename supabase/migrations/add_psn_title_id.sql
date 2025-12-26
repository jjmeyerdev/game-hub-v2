-- Migration: Add psn_title_id to user_games
-- Purpose: Store PSN communication ID at the user_games level to properly detect
-- which games were synced from PSN vs manually added PlayStation games.
-- This mirrors the pattern used for steam_appid and xbox_title_id.

-- Add psn_title_id column to user_games
ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS psn_title_id TEXT;

-- Add index for PSN title lookups
CREATE INDEX IF NOT EXISTS idx_user_games_psn_title_id
ON public.user_games(psn_title_id)
WHERE psn_title_id IS NOT NULL;

-- Add composite index for user + PSN title lookups
CREATE INDEX IF NOT EXISTS idx_user_games_user_psn
ON public.user_games(user_id, psn_title_id);

-- Add comment
COMMENT ON COLUMN public.user_games.psn_title_id IS 'PSN Communication ID - set during PSN sync to identify synced games';
