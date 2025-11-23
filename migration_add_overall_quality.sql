-- Migration: Add overall_quality column to detailed_ratings table
-- Run this if you already have the database set up and need to add the new column

-- Add the overall_quality column
ALTER TABLE detailed_ratings 
ADD COLUMN IF NOT EXISTS overall_quality INTEGER CHECK (overall_quality >= 1 AND overall_quality <= 10);

-- If you want to set a default value for existing rows (optional)
-- UPDATE detailed_ratings SET overall_quality = 5 WHERE overall_quality IS NULL;

