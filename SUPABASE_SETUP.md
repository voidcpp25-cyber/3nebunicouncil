# Supabase Database Setup

This document describes the database schema needed for the Inside Jokes Ranking System.

## Tables

### 1. `jokes`
Stores all official inside jokes.

```sql
CREATE TABLE jokes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_official BOOLEAN DEFAULT true
);
```

### 2. `elo_ratings`
Stores ELO ratings for each joke.

```sql
CREATE TABLE elo_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joke_id UUID REFERENCES jokes(id) ON DELETE CASCADE,
  elo_score INTEGER DEFAULT 1500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(joke_id)
);
```

### 3. `detailed_ratings`
Stores detailed 1-10 ratings for each joke.

```sql
CREATE TABLE detailed_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joke_id UUID REFERENCES jokes(id) ON DELETE CASCADE,
  funniness INTEGER CHECK (funniness >= 1 AND funniness <= 10),
  relevance INTEGER CHECK (relevance >= 1 AND relevance <= 10),
  iconicness INTEGER CHECK (iconicness >= 1 AND iconicness <= 10),
  how_lost INTEGER CHECK (how_lost >= 1 AND how_lost <= 10),
  quality INTEGER CHECK (quality >= 1 AND quality <= 10),
  oldness INTEGER CHECK (oldness >= 1 AND oldness <= 10),
  decipherability INTEGER CHECK (decipherability >= 1 AND decipherability <= 10),
  overall_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. `pending_jokes`
Stores jokes waiting for approval.

```sql
CREATE TABLE pending_jokes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by_nicky BOOLEAN DEFAULT false,
  approved_by_jess BOOLEAN DEFAULT false,
  approved_by_levi BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false
);
```

## Row Level Security (RLS)

Enable RLS on all tables and create policies as needed. For a simple setup, you can:

1. Go to Authentication > Policies in Supabase
2. Enable RLS on all tables
3. Create policies that allow:
   - SELECT: Public (or authenticated users)
   - INSERT: Public (or authenticated users)
   - UPDATE: Public (or authenticated users)
   - DELETE: Only for admins (optional)

For production, you should implement proper authentication and restrict UPDATE operations on `pending_jokes` to only allow Nicky, Jess, and Levi.

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Initial Data Import

After creating the tables, you can import the jokes from the text file using the provided utility function or by manually inserting them.

