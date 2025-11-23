export interface Joke {
  id: string;
  text: string;
  created_at: string;
  is_official: boolean;
}

export interface EloRating {
  id: string;
  joke_id: string;
  elo_score: number;
  updated_at: string;
}

export interface DetailedRating {
  id: string;
  joke_id: string;
  funniness: number;
  relevance: number;
  iconicness: number;
  how_lost: number;
  quality: number;
  oldness: number;
  decipherability: number;
  overall_quality: number; // User-rated overall quality (1-10)
  overall_score: number; // Calculated from all except decipherability and overall_quality
  created_at: string;
}

export interface PendingJoke {
  id: string;
  text: string;
  submitted_by: string;
  created_at: string;
  approved_by_nicky: boolean;
  approved_by_jess: boolean;
  approved_by_levi: boolean;
  is_approved: boolean; // True when all 3 have approved
}

export interface Approval {
  id: string;
  pending_joke_id: string;
  approver: 'nicky' | 'jess' | 'levi';
  approved: boolean;
  created_at: string;
}

