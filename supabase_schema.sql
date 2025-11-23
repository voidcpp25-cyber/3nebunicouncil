-- Inside Jokes Ranking System - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Jokes table
CREATE TABLE IF NOT EXISTS jokes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_official BOOLEAN DEFAULT true
);

-- 2. ELO Ratings table
CREATE TABLE IF NOT EXISTS elo_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joke_id UUID REFERENCES jokes(id) ON DELETE CASCADE,
  elo_score INTEGER DEFAULT 1500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(joke_id)
);

-- 3. Detailed Ratings table
CREATE TABLE IF NOT EXISTS detailed_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joke_id UUID REFERENCES jokes(id) ON DELETE CASCADE,
  funniness DECIMAL(3,1) CHECK (funniness >= 1 AND funniness <= 10),
  relevance DECIMAL(3,1) CHECK (relevance >= 1 AND relevance <= 10),
  iconicness DECIMAL(3,1) CHECK (iconicness >= 1 AND iconicness <= 10),
  how_lost DECIMAL(3,1) CHECK (how_lost >= 1 AND how_lost <= 10),
  quality DECIMAL(3,1) CHECK (quality >= 1 AND quality <= 10),
  oldness DECIMAL(3,1) CHECK (oldness >= 1 AND oldness <= 10),
  decipherability DECIMAL(3,1) CHECK (decipherability >= 1 AND decipherability <= 10),
  overall_quality DECIMAL(3,1) CHECK (overall_quality >= 1 AND overall_quality <= 10),
  overall_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Pending Jokes table
CREATE TABLE IF NOT EXISTS pending_jokes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by_nicky BOOLEAN DEFAULT false,
  approved_by_jess BOOLEAN DEFAULT false,
  approved_by_levi BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_elo_ratings_joke_id ON elo_ratings(joke_id);
CREATE INDEX IF NOT EXISTS idx_detailed_ratings_joke_id ON detailed_ratings(joke_id);
CREATE INDEX IF NOT EXISTS idx_jokes_is_official ON jokes(is_official);
CREATE INDEX IF NOT EXISTS idx_pending_jokes_is_approved ON pending_jokes(is_approved);

-- Enable Row Level Security (RLS)
ALTER TABLE jokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE elo_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE detailed_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_jokes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- For development, you can allow all operations. For production, implement proper authentication.
-- Drop existing policies first to avoid conflicts

-- Jokes policies
DROP POLICY IF EXISTS "Allow public read access on jokes" ON jokes;
CREATE POLICY "Allow public read access on jokes" ON jokes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on jokes" ON jokes;
CREATE POLICY "Allow public insert on jokes" ON jokes
  FOR INSERT WITH CHECK (true);

-- ELO Ratings policies
DROP POLICY IF EXISTS "Allow public read access on elo_ratings" ON elo_ratings;
CREATE POLICY "Allow public read access on elo_ratings" ON elo_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on elo_ratings" ON elo_ratings;
CREATE POLICY "Allow public insert on elo_ratings" ON elo_ratings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on elo_ratings" ON elo_ratings;
CREATE POLICY "Allow public update on elo_ratings" ON elo_ratings
  FOR UPDATE USING (true);

-- Detailed Ratings policies
DROP POLICY IF EXISTS "Allow public read access on detailed_ratings" ON detailed_ratings;
CREATE POLICY "Allow public read access on detailed_ratings" ON detailed_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on detailed_ratings" ON detailed_ratings;
CREATE POLICY "Allow public insert on detailed_ratings" ON detailed_ratings
  FOR INSERT WITH CHECK (true);

-- Pending Jokes policies
DROP POLICY IF EXISTS "Allow public read access on pending_jokes" ON pending_jokes;
CREATE POLICY "Allow public read access on pending_jokes" ON pending_jokes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on pending_jokes" ON pending_jokes;
CREATE POLICY "Allow public insert on pending_jokes" ON pending_jokes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on pending_jokes" ON pending_jokes;
CREATE POLICY "Allow public update on pending_jokes" ON pending_jokes
  FOR UPDATE USING (true);

-- Note: For production, you should implement proper authentication
-- and restrict UPDATE operations on pending_jokes to only allow
-- Nicky, Jess, and Levi. You can do this by:
-- 1. Setting up authentication in Supabase
-- 2. Creating policies that check user identity
-- 3. Using service role key for admin operations

