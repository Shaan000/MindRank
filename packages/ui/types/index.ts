export interface Profile {
  user_id: string;
  elo: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  mode: 'practice' | 'ranked';
  num_players: number;
  solved: boolean;
  time_taken: number | null;
  elo_delta: number | null;
  created_at: string;
}

export interface PuzzleData {
  puzzle_id: string;
  mode: string;
  players: number;
  puzzle: any; // Replace with your puzzle type
}

export interface PuzzleGuess {
  puzzle_id: string;
  guess: any; // Replace with your guess type
}

export interface PuzzleResponse {
  valid: boolean;
  solution: any; // Replace with your solution type
  elo_delta?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
} 