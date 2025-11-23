-- Comprehensive migration script to fix detailed_ratings table
-- This ensures all columns are properly set up with DECIMAL types and updated_at exists

-- 1. Add overall_quality column if it doesn't exist (as DECIMAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'detailed_ratings' 
        AND column_name = 'overall_quality'
    ) THEN
        ALTER TABLE detailed_ratings 
        ADD COLUMN overall_quality DECIMAL(3,1) CHECK (overall_quality >= 1.0 AND overall_quality <= 10.0);
    END IF;
END $$;

-- 2. Convert overall_quality from INTEGER to DECIMAL if it exists as INTEGER
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'detailed_ratings' 
        AND column_name = 'overall_quality'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE detailed_ratings 
        ALTER COLUMN overall_quality TYPE DECIMAL(3,1);
    END IF;
END $$;

-- 3. Add updated_at column if it doesn't exist
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

-- 4. Ensure all rating columns are DECIMAL(3,1) for decimal support
ALTER TABLE detailed_ratings 
    ALTER COLUMN funniness TYPE DECIMAL(3,1),
    ALTER COLUMN relevance TYPE DECIMAL(3,1),
    ALTER COLUMN iconicness TYPE DECIMAL(3,1),
    ALTER COLUMN how_lost TYPE DECIMAL(3,1),
    ALTER COLUMN quality TYPE DECIMAL(3,1),
    ALTER COLUMN oldness TYPE DECIMAL(3,1),
    ALTER COLUMN decipherability TYPE DECIMAL(3,1),
    ALTER COLUMN overall_quality TYPE DECIMAL(3,1);

-- 5. Create/update trigger to automatically update updated_at on row updates
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

