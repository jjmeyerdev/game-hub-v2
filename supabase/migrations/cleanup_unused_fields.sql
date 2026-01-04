-- ============================================================================
-- Migration: Cleanup Unused Fields & Fix Function Security
--
-- Changes:
-- 1. Remove deprecated user_games.owned column (replaced by ownership_status)
-- 2. Remove unused games.metacritic_score column
-- 3. Fix function search_path security for handle_updated_at()
-- 4. Fix function search_path security for handle_new_user()
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove deprecated columns
-- ============================================================================

-- Remove the deprecated 'owned' column from user_games
-- This was replaced by 'ownership_status' which has more granular values
ALTER TABLE public.user_games DROP COLUMN IF EXISTS owned;

-- Remove unused 'metacritic_score' column from games
-- This was never implemented in the application
ALTER TABLE public.games DROP COLUMN IF EXISTS metacritic_score;

-- ============================================================================
-- STEP 2: Fix function security (add search_path = '')
-- Per security best practices, set search_path to empty string to prevent
-- search path injection attacks and ensure fully qualified names are used.
-- ============================================================================

-- Recreate handle_updated_at with proper search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Recreate handle_new_user with proper search_path
-- Note: This function needs SECURITY DEFINER to insert into profiles
-- when triggered from auth.users (which the user doesn't have direct access to)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: Add comments documenting the changes
-- ============================================================================

COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function to automatically update updated_at timestamp. Has empty search_path for security.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile when user signs up. Uses SECURITY DEFINER with empty search_path.';
