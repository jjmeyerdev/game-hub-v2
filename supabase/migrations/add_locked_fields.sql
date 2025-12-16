-- Add locked_fields column to user_games table
-- Stores which metadata fields should not be overwritten during syncs/IGDB refreshes
-- Format: JSONB object with field names as keys and boolean values
-- Example: {"cover": true, "description": true, "developer": false}

ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS locked_fields JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.user_games.locked_fields IS 'Fields locked from being overwritten during syncs/IGDB refreshes. Keys: cover, description, developer, publisher, releaseDate, genres';
