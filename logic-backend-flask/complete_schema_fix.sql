-- COMPLETE SUPABASE DATABASE SCHEMA FIX
-- This will reset your database with all required columns
-- Copy and paste this entire script into your Supabase SQL Editor

-- Drop existing tables and recreate with proper schema
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- PROFILES TABLE - Complete schema with all columns
-- =====================================================
CREATE TABLE public.profiles (
  user_id                      TEXT         PRIMARY KEY,
  email                       TEXT,
  username                    TEXT         UNIQUE,
  elo                         INTEGER      DEFAULT NULL,  -- NULL for unranked users
  hidden_elo                  INTEGER      DEFAULT 750,   -- Hidden ELO for placement matches
  placement_matches_completed INTEGER      DEFAULT 0,
  is_ranked                   BOOLEAN      DEFAULT FALSE,
  -- Practice mode progress tracking
  easy_puzzles_solved         INTEGER      DEFAULT 0,
  medium_puzzles_solved       INTEGER      DEFAULT 0,
  hard_puzzles_solved         INTEGER      DEFAULT 0,
  extreme_puzzles_solved      INTEGER      DEFAULT 0,
  created_at                  TIMESTAMP    DEFAULT NOW(),
  updated_at                  TIMESTAMP    DEFAULT NOW()
);

-- =====================================================
-- MATCHES TABLE - Complete schema with all columns  
-- =====================================================
CREATE TABLE public.matches (
  id                    BIGSERIAL   PRIMARY KEY,
  user_id              TEXT        REFERENCES public.profiles(user_id),
  mode                 TEXT        NOT NULL,
  num_players          INTEGER,
  solved               BOOLEAN     NOT NULL,
  time_taken           INTEGER,
  elo_before           INTEGER,
  elo_after            INTEGER,
  elo_delta            INTEGER,
  is_placement_match   BOOLEAN     DEFAULT FALSE,
  notes                TEXT,
  created_at           TIMESTAMP   DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view profiles (for leaderboard)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile." 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Allow everyone to view matches (for match history/leaderboard)
CREATE POLICY "Matches are viewable by everyone." 
ON public.matches FOR SELECT 
USING (true);

-- Allow authenticated users to insert matches
CREATE POLICY "Authenticated users can insert matches." 
ON public.matches FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- =====================================================
-- SEED DATA - Create your user profile with hidden ELO
-- =====================================================
INSERT INTO public.profiles (
  user_id, 
  email, 
  username, 
  elo, 
  hidden_elo,
  placement_matches_completed, 
  is_ranked,
  easy_puzzles_solved,
  medium_puzzles_solved,
  hard_puzzles_solved,
  extreme_puzzles_solved
) VALUES (
  '03f2a2de-329d-457c-8e3c-a53b7cd16fec',
  'carrotshaan@gmail.com',
  'carrotshaan',
  NULL,  -- Start unranked
  750,   -- Default hidden ELO for intermediate difficulty
  0,     -- No placement matches completed
  FALSE, -- Not ranked yet
  0,     -- No easy puzzles solved
  0,     -- No medium puzzles solved
  0,     -- No hard puzzles solved
  0      -- No extreme puzzles solved
) ON CONFLICT (user_id) DO UPDATE SET
  placement_matches_completed = 0,
  is_ranked = FALSE,
  elo = NULL,
  hidden_elo = 750,  -- Reset hidden ELO for testing
  easy_puzzles_solved = 0,
  medium_puzzles_solved = 0,
  hard_puzzles_solved = 0,
  extreme_puzzles_solved = 0;

-- =====================================================
-- VERIFICATION - Show the final schema
-- =====================================================
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
UNION ALL
SELECT 
  'matches' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'matches'
ORDER BY table_name, column_name;

-- Success message
SELECT 'Database schema reset complete! Hidden ELO placement match system ready.' as status; 