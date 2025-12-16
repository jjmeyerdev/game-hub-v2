-- Add table to store user's dismissed duplicate pairs
-- These pairs will be excluded from future duplicate scans

CREATE TABLE IF NOT EXISTS public.dismissed_duplicates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Store the normalized title that was used for grouping
  -- This allows us to match against future scans using the same normalization
  normalized_title TEXT NOT NULL,

  -- Store the game IDs that were in the dismissed group
  -- Using JSONB array to store multiple game IDs
  game_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Unique constraint: one dismissal per normalized title per user
  UNIQUE(user_id, normalized_title)
);

-- Enable RLS
ALTER TABLE public.dismissed_duplicates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own dismissed duplicates"
  ON public.dismissed_duplicates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed duplicates"
  ON public.dismissed_duplicates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed duplicates"
  ON public.dismissed_duplicates FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dismissed_duplicates_user_id
  ON public.dismissed_duplicates(user_id);

CREATE INDEX IF NOT EXISTS idx_dismissed_duplicates_normalized_title
  ON public.dismissed_duplicates(user_id, normalized_title);
