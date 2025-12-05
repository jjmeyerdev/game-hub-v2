-- Migration: Add Session Tracking
-- Description: Creates game_sessions table for tracking play sessions and daily playtime summary view

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_game_id UUID REFERENCES public.user_games(id) ON DELETE CASCADE NOT NULL,

  -- Session timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,

  -- Session metadata
  status TEXT NOT NULL DEFAULT 'active',
  steam_appid INTEGER,
  platform TEXT NOT NULL DEFAULT 'Steam',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed')),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX idx_game_sessions_user_game_id ON public.game_sessions(user_game_id);
CREATE INDEX idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX idx_game_sessions_started_at ON public.game_sessions(started_at DESC);
CREATE INDEX idx_game_sessions_user_status ON public.game_sessions(user_id, status);

-- Enable Row Level Security
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.game_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_game_sessions
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create view for daily playtime summary
CREATE OR REPLACE VIEW public.daily_playtime_summary AS
SELECT
  user_id,
  DATE(started_at AT TIME ZONE 'UTC') as play_date,
  SUM(COALESCE(duration_minutes, 0)) as total_minutes,
  COUNT(*) as session_count
FROM public.game_sessions
WHERE status = 'completed'
GROUP BY user_id, DATE(started_at AT TIME ZONE 'UTC');

-- Grant select permission on view to authenticated users
GRANT SELECT ON public.daily_playtime_summary TO authenticated;

-- Add comment to table
COMMENT ON TABLE public.game_sessions IS 'Tracks individual gaming sessions with start/end times and duration';
COMMENT ON COLUMN public.game_sessions.status IS 'Session status: active (currently playing) or completed (ended)';
COMMENT ON COLUMN public.game_sessions.duration_minutes IS 'Calculated duration when session ends (ended_at - started_at)';
COMMENT ON VIEW public.daily_playtime_summary IS 'Aggregates total playtime per user per day from completed sessions';
