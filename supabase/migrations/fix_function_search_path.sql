-- Migration: Fix function search_path security warnings
-- Sets search_path to empty string to prevent SQL injection via search_path manipulation

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
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

-- Drop legacy function if it exists (update_updated_at_column)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
