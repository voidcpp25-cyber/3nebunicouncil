-- Migration: Add updated_at column to detailed_ratings if it doesn't exist
-- This ensures the table has the updated_at column for tracking when ratings are modified

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'detailed_ratings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE detailed_ratings 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create a trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_detailed_ratings_updated_at ON detailed_ratings;
CREATE TRIGGER update_detailed_ratings_updated_at
    BEFORE UPDATE ON detailed_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

