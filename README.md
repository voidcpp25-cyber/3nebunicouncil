# Inside Jokes Ranking System

A web application for ranking and managing inside jokes with ELO ranking and detailed rating systems.

## Features

- **ELO Ranking**: Compare two random jokes and pick your favorite to build an ELO-based ranking
- **Detailed Ranking**: Rate jokes on multiple metrics (Funniness, Relevance, Iconic-ness, etc.)
- **Add New Jokes**: Submit new inside jokes for approval
- **Approval System**: Nicky, Jess, and Levi can approve pending jokes before they're added to the official list

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor in your Supabase dashboard
   - Run the SQL script from `supabase_schema.sql` to create all database tables
   - Get your Supabase URL and anon key from Project Settings > API

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Import initial jokes:
   - Start the dev server: `npm run dev`
   - Navigate to the "Import Jokes" tab in the app
   - Copy the content from `The Official Inside Joke List.txt`
   - Paste it into the text area and click "Import Jokes"
   - Wait for the import to complete (you'll see success/failure for each joke)

6. Run the development server:
```bash
npm run dev
```

## Rules

- You can only rank jokes you experienced or know about
- New jokes require approval from Nicky, Jess, and Levi before being added to the official list

## Ranking Metrics

- **Funniness** 😂
- **Relevance** 🏆
- **Iconic-ness** 🌟
- **How Lost It Would Have Been** 🗓️
- **Quality** 💎
- **Oldness** 🎂
- **Decipherability** 📟 (not included in overall score)

The overall score is calculated as the average of all metrics except Decipherability.
