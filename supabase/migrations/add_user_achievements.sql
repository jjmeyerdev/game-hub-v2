-- Individual achievement/trophy tracking table
-- Stores each achievement with its unlock status and personal ownership flag

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_game_id UUID REFERENCES public.user_games(id) ON DELETE CASCADE NOT NULL,

  -- Platform identifiers
  platform TEXT NOT NULL, -- 'psn', 'xbox', 'steam'
  platform_achievement_id TEXT NOT NULL, -- trophy ID, achievement ID, etc.

  -- Achievement info
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  icon_url_locked TEXT, -- Some platforms have different locked icons

  -- Trophy/achievement type and value
  achievement_type TEXT, -- 'bronze', 'silver', 'gold', 'platinum' for PSN; 'achievement' for Xbox
  points INTEGER, -- gamerscore for Xbox, calculated points for PSN (bronze=15, silver=30, gold=90, platinum=180)
  rarity REAL, -- percentage of players who earned this (0-100)

  -- Unlock status from platform sync
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,

  -- Personal ownership flag
  -- NULL = use synced unlock status
  -- TRUE = I unlocked this (even if platform shows unlocked by someone else)
  -- FALSE = I did NOT unlock this (someone else using my account did)
  unlocked_by_me BOOLEAN DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Unique constraint: one achievement per game per user
  CONSTRAINT user_achievements_unique UNIQUE(user_game_id, platform_achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.user_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_game_id ON public.user_achievements(user_game_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_platform ON public.user_achievements(platform);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON public.user_achievements(unlocked) WHERE unlocked = true;
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_by_me ON public.user_achievements(unlocked_by_me) WHERE unlocked_by_me IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_user_achievements
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.user_achievements IS 'Individual achievement/trophy tracking with personal ownership flags';
COMMENT ON COLUMN public.user_achievements.unlocked_by_me IS 'Personal ownership: NULL=use synced status, TRUE=I unlocked this, FALSE=someone else did';
COMMENT ON COLUMN public.user_achievements.points IS 'Achievement value: gamerscore for Xbox, calculated points for PSN trophies';
