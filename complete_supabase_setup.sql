-- Complete Supabase setup for MindRank
-- Run this in your new Supabase project's SQL Editor

-- Create profiles table with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    email TEXT,
    elo INTEGER,
    hidden_elo INTEGER DEFAULT 750,
    placement_matches_completed INTEGER DEFAULT 0,
    is_ranked BOOLEAN DEFAULT false,
    -- Practice mode progress tracking
    easy_puzzles_solved INTEGER DEFAULT 0,
    medium_puzzles_solved INTEGER DEFAULT 0,
    hard_puzzles_solved INTEGER DEFAULT 0,
    extreme_puzzles_solved INTEGER DEFAULT 0,
    -- Master mode progress tracking (separate from practice mode)
    master_easy_puzzles_solved INTEGER DEFAULT 0,
    master_medium_puzzles_solved INTEGER DEFAULT 0,
    master_hard_puzzles_solved INTEGER DEFAULT 0,
    master_extreme_puzzles_solved INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create matches table with all required columns
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    mode TEXT NOT NULL,
    num_players INTEGER NOT NULL,
    solved BOOLEAN NOT NULL DEFAULT false,
    time_taken FLOAT,
    elo_before INTEGER,
    elo_after INTEGER,
    elo_delta INTEGER,
    is_placement_match BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile."
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile."
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for matches
CREATE POLICY "Matches are viewable by everyone."
    ON matches FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert matches."
    ON matches FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
