-- Migration: Fix RLS performance warnings
-- 1. Wrap auth.uid() with (select auth.uid()) to avoid per-row evaluation
-- 2. Remove duplicate xbox_tokens policies

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- GAMES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Only authenticated users can insert games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;

CREATE POLICY "Only authenticated users can insert games"
  ON public.games FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update games"
  ON public.games FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- USER_GAMES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own games" ON public.user_games;
DROP POLICY IF EXISTS "Users can insert their own games" ON public.user_games;
DROP POLICY IF EXISTS "Users can update their own games" ON public.user_games;
DROP POLICY IF EXISTS "Users can delete their own games" ON public.user_games;

CREATE POLICY "Users can view their own games"
  ON public.user_games FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own games"
  ON public.user_games FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own games"
  ON public.user_games FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own games"
  ON public.user_games FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- GAME_SESSIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.game_sessions;

CREATE POLICY "Users can view their own sessions"
  ON public.game_sessions FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own sessions"
  ON public.game_sessions FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own sessions"
  ON public.game_sessions FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- CUSTOM_LISTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.custom_lists;

CREATE POLICY "Users can view their own lists"
  ON public.custom_lists FOR SELECT
  USING (user_id = (select auth.uid()) OR is_public = true);

CREATE POLICY "Users can insert their own lists"
  ON public.custom_lists FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own lists"
  ON public.custom_lists FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own lists"
  ON public.custom_lists FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- LIST_GAMES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view games in their lists or public lists" ON public.list_games;
DROP POLICY IF EXISTS "Users can add games to their own lists" ON public.list_games;
DROP POLICY IF EXISTS "Users can remove games from their own lists" ON public.list_games;

CREATE POLICY "Users can view games in their lists or public lists"
  ON public.list_games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_lists
      WHERE custom_lists.id = list_games.list_id
      AND (custom_lists.user_id = (select auth.uid()) OR custom_lists.is_public = true)
    )
  );

CREATE POLICY "Users can add games to their own lists"
  ON public.list_games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_lists
      WHERE custom_lists.id = list_games.list_id
      AND custom_lists.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can remove games from their own lists"
  ON public.list_games FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_lists
      WHERE custom_lists.id = list_games.list_id
      AND custom_lists.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PSN_TOKENS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own PSN tokens" ON public.psn_tokens;
DROP POLICY IF EXISTS "Users can insert their own PSN tokens" ON public.psn_tokens;
DROP POLICY IF EXISTS "Users can update their own PSN tokens" ON public.psn_tokens;
DROP POLICY IF EXISTS "Users can delete their own PSN tokens" ON public.psn_tokens;

CREATE POLICY "Users can view their own PSN tokens"
  ON public.psn_tokens FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own PSN tokens"
  ON public.psn_tokens FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own PSN tokens"
  ON public.psn_tokens FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own PSN tokens"
  ON public.psn_tokens FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- XBOX_TOKENS TABLE
-- Drop ALL policies including duplicates, then create single optimized policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own Xbox tokens" ON public.xbox_tokens;
DROP POLICY IF EXISTS "Users can insert their own Xbox tokens" ON public.xbox_tokens;
DROP POLICY IF EXISTS "Users can update their own Xbox tokens" ON public.xbox_tokens;
DROP POLICY IF EXISTS "Users can delete their own Xbox tokens" ON public.xbox_tokens;
DROP POLICY IF EXISTS "Users can manage own xbox tokens" ON public.xbox_tokens;

CREATE POLICY "Users can view their own Xbox tokens"
  ON public.xbox_tokens FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own Xbox tokens"
  ON public.xbox_tokens FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own Xbox tokens"
  ON public.xbox_tokens FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own Xbox tokens"
  ON public.xbox_tokens FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- EPIC_TOKENS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own Epic tokens" ON public.epic_tokens;
DROP POLICY IF EXISTS "Users can insert their own Epic tokens" ON public.epic_tokens;
DROP POLICY IF EXISTS "Users can update their own Epic tokens" ON public.epic_tokens;
DROP POLICY IF EXISTS "Users can delete their own Epic tokens" ON public.epic_tokens;

CREATE POLICY "Users can view their own Epic tokens"
  ON public.epic_tokens FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own Epic tokens"
  ON public.epic_tokens FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own Epic tokens"
  ON public.epic_tokens FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own Epic tokens"
  ON public.epic_tokens FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- DISMISSED_DUPLICATES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own dismissed duplicates" ON public.dismissed_duplicates;
DROP POLICY IF EXISTS "Users can insert their own dismissed duplicates" ON public.dismissed_duplicates;
DROP POLICY IF EXISTS "Users can delete their own dismissed duplicates" ON public.dismissed_duplicates;

CREATE POLICY "Users can view their own dismissed duplicates"
  ON public.dismissed_duplicates FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own dismissed duplicates"
  ON public.dismissed_duplicates FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own dismissed duplicates"
  ON public.dismissed_duplicates FOR DELETE
  USING (user_id = (select auth.uid()));
