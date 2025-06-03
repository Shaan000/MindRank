-- Migration to add placement match system columns to profiles table
-- Run this in your Supabase SQL editor

-- Add placement match columns to profiles table (if they don't exist)
DO $$ 
BEGIN
    -- Add placement_matches_completed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'placement_matches_completed'
    ) THEN
        ALTER TABLE profiles ADD COLUMN placement_matches_completed INTEGER DEFAULT 0;
        RAISE NOTICE 'Added placement_matches_completed column';
    ELSE
        RAISE NOTICE 'placement_matches_completed column already exists';
    END IF;

    -- Add is_ranked column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_ranked'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_ranked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_ranked column';
    ELSE
        RAISE NOTICE 'is_ranked column already exists';
    END IF;

    -- Add username column (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column';
    ELSE
        RAISE NOTICE 'username column already exists';
    END IF;

    -- Add elo_before and elo_after columns to matches table for proper tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'elo_before'
    ) THEN
        ALTER TABLE matches ADD COLUMN elo_before INTEGER;
        RAISE NOTICE 'Added elo_before column to matches';
    ELSE
        RAISE NOTICE 'elo_before column already exists in matches';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'elo_after'
    ) THEN
        ALTER TABLE matches ADD COLUMN elo_after INTEGER;
        RAISE NOTICE 'Added elo_after column to matches';
    ELSE
        RAISE NOTICE 'elo_after column already exists in matches';
    END IF;

    -- Add is_placement_match column to matches table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'is_placement_match'
    ) THEN
        ALTER TABLE matches ADD COLUMN is_placement_match BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_placement_match column to matches';
    ELSE
        RAISE NOTICE 'is_placement_match column already exists in matches';
    END IF;

    -- Update existing users to be ranked (if they have ELO > 0)
    UPDATE profiles 
    SET is_ranked = TRUE 
    WHERE elo IS NOT NULL AND elo > 0 AND is_ranked = FALSE;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Set usernames for existing users who don't have one
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Show the current schema for verification
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'matches')
ORDER BY table_name, column_name; 