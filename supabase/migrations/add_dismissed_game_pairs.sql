-- ============================================================================
-- Migration: Switch to Pair-Based Duplicate Dismissals
--
-- Replaces the normalized_title-based approach with a more robust pair-based
-- system that:
-- 1. Self-cleans via CASCADE when games are deleted
-- 2. Is immune to normalization algorithm changes
-- 3. Precisely tracks which specific pairs are dismissed
-- 4. Automatically surfaces groups when new games are added
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the new dismissed_game_pairs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dismissed_game_pairs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- The two games that form a dismissed pair
  -- We always store the smaller UUID in game_id_a for consistency
  game_id_a UUID REFERENCES public.user_games(id) ON DELETE CASCADE NOT NULL,
  game_id_b UUID REFERENCES public.user_games(id) ON DELETE CASCADE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure we can't create duplicate pairs (order matters, so we normalize)
  UNIQUE(user_id, game_id_a, game_id_b),

  -- Ensure game_id_a < game_id_b (normalized ordering)
  CONSTRAINT game_pair_ordering CHECK (game_id_a < game_id_b)
);

-- Add comment explaining the table
COMMENT ON TABLE public.dismissed_game_pairs IS
  'Stores pairs of games that the user has confirmed are NOT duplicates. '
  'When both games in a pair exist, that pair is excluded from duplicate detection. '
  'Self-cleans via CASCADE when either game is deleted.';

COMMENT ON COLUMN public.dismissed_game_pairs.game_id_a IS
  'First game in the pair (always the smaller UUID for consistent ordering)';

COMMENT ON COLUMN public.dismissed_game_pairs.game_id_b IS
  'Second game in the pair (always the larger UUID for consistent ordering)';

-- ============================================================================
-- STEP 2: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.dismissed_game_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissed pairs"
  ON public.dismissed_game_pairs FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own dismissed pairs"
  ON public.dismissed_game_pairs FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own dismissed pairs"
  ON public.dismissed_game_pairs FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 3: Create indexes for efficient lookups
-- ============================================================================

-- Index for looking up all pairs for a user
CREATE INDEX IF NOT EXISTS idx_dismissed_game_pairs_user_id
  ON public.dismissed_game_pairs(user_id);

-- Index for checking if a specific game is part of any dismissed pair
CREATE INDEX IF NOT EXISTS idx_dismissed_game_pairs_game_a
  ON public.dismissed_game_pairs(user_id, game_id_a);

CREATE INDEX IF NOT EXISTS idx_dismissed_game_pairs_game_b
  ON public.dismissed_game_pairs(user_id, game_id_b);

-- Composite index for efficient pair lookups
CREATE INDEX IF NOT EXISTS idx_dismissed_game_pairs_lookup
  ON public.dismissed_game_pairs(user_id, game_id_a, game_id_b);

-- ============================================================================
-- STEP 4: Create helper function for inserting pairs with normalized order
-- ============================================================================

CREATE OR REPLACE FUNCTION public.dismiss_game_pair(
  p_user_id UUID,
  p_game_id_1 UUID,
  p_game_id_2 UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_game_a UUID;
  v_game_b UUID;
BEGIN
  -- Normalize the order: smaller UUID goes first
  IF p_game_id_1 < p_game_id_2 THEN
    v_game_a := p_game_id_1;
    v_game_b := p_game_id_2;
  ELSE
    v_game_a := p_game_id_2;
    v_game_b := p_game_id_1;
  END IF;

  -- Insert the pair (ignore conflicts for idempotency)
  INSERT INTO public.dismissed_game_pairs (user_id, game_id_a, game_id_b)
  VALUES (p_user_id, v_game_a, v_game_b)
  ON CONFLICT (user_id, game_id_a, game_id_b) DO NOTHING;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.dismiss_game_pair IS
  'Inserts a dismissed game pair with normalized ordering. Idempotent - safe to call multiple times.';

-- ============================================================================
-- STEP 5: Create function to check if all pairs in a group are dismissed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.are_all_pairs_dismissed(
  p_user_id UUID,
  p_game_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_total_pairs INTEGER;
  v_dismissed_pairs INTEGER;
  v_game_a UUID;
  v_game_b UUID;
BEGIN
  -- Calculate total number of pairs needed: n*(n-1)/2
  v_total_pairs := (array_length(p_game_ids, 1) * (array_length(p_game_ids, 1) - 1)) / 2;

  IF v_total_pairs = 0 THEN
    RETURN TRUE;
  END IF;

  -- Count how many pairs are actually dismissed
  SELECT COUNT(*) INTO v_dismissed_pairs
  FROM public.dismissed_game_pairs dgp
  WHERE dgp.user_id = p_user_id
    AND dgp.game_id_a = ANY(p_game_ids)
    AND dgp.game_id_b = ANY(p_game_ids);

  RETURN v_dismissed_pairs >= v_total_pairs;
END;
$$;

COMMENT ON FUNCTION public.are_all_pairs_dismissed IS
  'Checks if all possible pairs within a group of games are dismissed.';

-- ============================================================================
-- NOTE: The old dismissed_duplicates table is kept for now but deprecated.
-- It can be dropped in a future migration after confirming the new system works.
-- ============================================================================
