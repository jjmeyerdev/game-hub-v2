-- Add is_locked and is_not_compatible columns to user_games table
-- is_locked: Prevents sync from modifying the game's status/priority
-- is_not_compatible: Marks game as not compatible with current hardware

-- Add is_locked column
ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false NOT NULL;

-- Add is_not_compatible column
ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS is_not_compatible BOOLEAN DEFAULT false NOT NULL;

-- Add psn_played_id to games table for non-trophy PSN games
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS psn_played_id TEXT UNIQUE;

-- Add comments for documentation
COMMENT ON COLUMN public.user_games.is_locked IS 'When true, sync operations will not modify this game status or priority';
COMMENT ON COLUMN public.user_games.is_not_compatible IS 'When true, indicates game is not compatible with current hardware';
COMMENT ON COLUMN public.games.psn_played_id IS 'PSN Played Title ID for games without trophy support (from played games API)';

-- Add index for psn_played_id lookups
CREATE INDEX IF NOT EXISTS idx_games_psn_played_id ON public.games(psn_played_id) WHERE psn_played_id IS NOT NULL;
