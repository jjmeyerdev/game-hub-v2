-- Add UPDATE policy for games table
-- This allows authenticated users to update game information

CREATE POLICY "Authenticated users can update games"
  ON public.games FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

