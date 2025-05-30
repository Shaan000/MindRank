export interface User {
  id: string;
  email: string;
  elo: number;
  tier: string;
  created_at: string;
  updated_at: string;
}

export interface PuzzleData {
  puzzle_id: string;
  mode: 'easy' | 'medium' | 'hard' | 'ranked';
  num_players: number;
  num_truth_tellers: number;
  statements: Record<string, string>;
  statement_data: Record<string, StatementDetails>;
  user_elo?: number;
}

export interface StatementDetails {
  mode: 'DIRECT' | 'AND' | 'OR' | 'IF';
  target?: string;
  claim?: boolean;
  t1?: string;
  t2?: string;
  c1?: boolean;
  c2?: boolean;
  cond?: string;
  cond_val?: boolean;
  result?: string;
  result_val?: boolean;
}

export interface PuzzleGuess {
  [player: string]: boolean;
}

export interface PuzzleResponse {
  valid: boolean;
  elo_change?: {
    old_elo: number;
    new_elo: number;
    change: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  email: string;
  elo: number;
  tier: string;
  rank: number;
}

export interface Match {
  id: string;
  user_id: string;
  mode: string;
  success: boolean;
  time_taken: number;
  elo_before: number;
  elo_after: number;
  elo_change: number;
  created_at: string;
}

export type PuzzleMode = 'easy' | 'medium' | 'hard' | 'ranked';

export interface ApiError {
  error: string;
  code?: number;
} 