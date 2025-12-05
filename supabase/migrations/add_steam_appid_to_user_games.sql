-- Add steam_appid to user_games table for session tracking
-- This allows us to quickly match Steam's currently playing game to user's library

ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS steam_appid INTEGER;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_games_steam_appid
ON public.user_games(steam_appid);

-- Create composite index for user + steam_appid lookups
CREATE INDEX IF NOT EXISTS idx_user_games_user_steam
ON public.user_games(user_id, steam_appid);

-- Update existing records to populate steam_appid from games table
UPDATE public.user_games ug
SET steam_appid = g.steam_appid
FROM public.games g
WHERE ug.game_id = g.id
AND g.steam_appid IS NOT NULL
AND ug.steam_appid IS NULL;

COMMENT ON COLUMN public.user_games.steam_appid IS 'Steam App ID - cached from games table for fast session tracking lookups';
