-- Migration: Add completed_at column to user_games
-- Tracks when a game reaches 100% achievement completion

-- Add the completed_at column
ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient sorting by completion date
CREATE INDEX IF NOT EXISTS idx_user_games_completed_at
ON public.user_games(completed_at DESC)
WHERE completed_at IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_games.completed_at IS 'Timestamp when achievements_earned reached achievements_total (100% completion)';

-- Backfill completed_at for existing perfect games using updated_at as best estimate
UPDATE public.user_games
SET completed_at = updated_at
WHERE achievements_total > 0
  AND achievements_earned = achievements_total
  AND completed_at IS NULL;
