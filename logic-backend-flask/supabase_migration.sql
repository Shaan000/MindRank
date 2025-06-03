-- Migration to add notes column to matches table
-- Run this in your Supabase SQL editor if the column doesn't exist

-- Add notes column to matches table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'notes'
    ) THEN
        ALTER TABLE matches ADD COLUMN notes TEXT;
    END IF;
END $$; 