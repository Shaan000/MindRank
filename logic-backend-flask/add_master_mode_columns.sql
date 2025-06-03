-- Migration to add Master Mode progress tracking columns to profiles table
-- Run this in your Supabase SQL editor

-- Add master mode progress columns to profiles table (if they don't exist)
DO $$ 
BEGIN
    -- Add master_easy_puzzles_solved column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'master_easy_puzzles_solved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN master_easy_puzzles_solved INTEGER DEFAULT 0;
        RAISE NOTICE 'Added master_easy_puzzles_solved column';
    ELSE
        RAISE NOTICE 'master_easy_puzzles_solved column already exists';
    END IF;

    -- Add master_medium_puzzles_solved column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'master_medium_puzzles_solved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN master_medium_puzzles_solved INTEGER DEFAULT 0;
        RAISE NOTICE 'Added master_medium_puzzles_solved column';
    ELSE
        RAISE NOTICE 'master_medium_puzzles_solved column already exists';
    END IF;

    -- Add master_hard_puzzles_solved column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'master_hard_puzzles_solved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN master_hard_puzzles_solved INTEGER DEFAULT 0;
        RAISE NOTICE 'Added master_hard_puzzles_solved column';
    ELSE
        RAISE NOTICE 'master_hard_puzzles_solved column already exists';
    END IF;

    -- Add master_extreme_puzzles_solved column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'master_extreme_puzzles_solved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN master_extreme_puzzles_solved INTEGER DEFAULT 0;
        RAISE NOTICE 'Added master_extreme_puzzles_solved column';
    ELSE
        RAISE NOTICE 'master_extreme_puzzles_solved column already exists';
    END IF;

    RAISE NOTICE 'Master Mode migration completed successfully!';
END $$;

-- Show the current schema for verification
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name LIKE '%master%'
ORDER BY column_name; 