-- Migration: Add overall_quality column to detailed_ratings table
-- Run this if you already have the database set up and need to add the new column

-- Add the overall_quality column as DECIMAL to support decimal values (e.g., 7.5)
ALTER TABLE detailed_ratings 
ADD COLUMN IF NOT EXISTS overall_quality DECIMAL(3,1) CHECK (overall_quality >= 1.0 AND overall_quality <= 10.0);

-- If you want to set a default value for existing rows (optional)
-- UPDATE detailed_ratings SET overall_quality = 5.0 WHERE overall_quality IS NULL;

