-- Add previously_owned column to user_games table
-- When true, games marked as "unowned" will still count towards stats
-- This is for games the user legitimately owned/played but no longer has access to

ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS previously_owned BOOLEAN DEFAULT false NOT NULL;

-- Add snapshot fields for manual stat tracking
-- These override synced values when set, allowing users to preserve their personal stats
-- for games they no longer own (e.g., gave PS4 to sibling but they play on same account)
ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS my_playtime_hours REAL DEFAULT NULL;

ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS my_achievements_earned INTEGER DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_games.previously_owned IS 'When true, includes unowned games in stats calculations (for games the user previously owned)';
COMMENT ON COLUMN public.user_games.my_playtime_hours IS 'Manual playtime snapshot - overrides synced playtime_hours in stats when set';
COMMENT ON COLUMN public.user_games.my_achievements_earned IS 'Manual achievement count snapshot - overrides synced achievements_earned in stats when set';

-- Create index for filtering performance
CREATE INDEX IF NOT EXISTS idx_user_games_previously_owned ON public.user_games (previously_owned) WHERE previously_owned = true;
