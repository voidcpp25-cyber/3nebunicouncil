-- Migration: Change detailed_ratings to support decimal values
-- Run this if you already have the database set up

-- Drop existing constraints
ALTER TABLE detailed_ratings 
  DROP CONSTRAINT IF EXISTS detailed_ratings_funniness_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_relevance_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_iconicness_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_how_lost_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_quality_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_oldness_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_decipherability_check,
  DROP CONSTRAINT IF EXISTS detailed_ratings_overall_quality_check;

-- Change columns to DECIMAL
ALTER TABLE detailed_ratings 
  ALTER COLUMN funniness TYPE DECIMAL(3,1),
  ALTER COLUMN relevance TYPE DECIMAL(3,1),
  ALTER COLUMN iconicness TYPE DECIMAL(3,1),
  ALTER COLUMN how_lost TYPE DECIMAL(3,1),
  ALTER COLUMN quality TYPE DECIMAL(3,1),
  ALTER COLUMN oldness TYPE DECIMAL(3,1),
  ALTER COLUMN decipherability TYPE DECIMAL(3,1),
  ALTER COLUMN overall_quality TYPE DECIMAL(3,1);

-- Add new constraints for decimal range
ALTER TABLE detailed_ratings 
  ADD CONSTRAINT detailed_ratings_funniness_check CHECK (funniness >= 1 AND funniness <= 10),
  ADD CONSTRAINT detailed_ratings_relevance_check CHECK (relevance >= 1 AND relevance <= 10),
  ADD CONSTRAINT detailed_ratings_iconicness_check CHECK (iconicness >= 1 AND iconicness <= 10),
  ADD CONSTRAINT detailed_ratings_how_lost_check CHECK (how_lost >= 1 AND how_lost <= 10),
  ADD CONSTRAINT detailed_ratings_quality_check CHECK (quality >= 1 AND quality <= 10),
  ADD CONSTRAINT detailed_ratings_oldness_check CHECK (oldness >= 1 AND oldness <= 10),
  ADD CONSTRAINT detailed_ratings_decipherability_check CHECK (decipherability >= 1 AND decipherability <= 10),
  ADD CONSTRAINT detailed_ratings_overall_quality_check CHECK (overall_quality >= 1 AND overall_quality <= 10);

