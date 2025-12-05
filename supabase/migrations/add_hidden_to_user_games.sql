-- Add hidden field to user_games table
-- This allows users to hide games from their main library view (e.g., private Steam games)

ALTER TABLE public.user_games
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Create index for filtering hidden games efficiently
CREATE INDEX IF NOT EXISTS idx_user_games_hidden ON public.user_games(hidden);

-- Compound index for common query pattern (user's visible games)
CREATE INDEX IF NOT EXISTS idx_user_games_user_hidden ON public.user_games(user_id, hidden);
