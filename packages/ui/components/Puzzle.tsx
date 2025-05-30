import React, { useState, useEffect } from 'react';
import { PuzzleData, PuzzleGuess, PuzzleResponse } from '../types';

interface PuzzleProps {
  mode: string;
  players: number;
  onSolve?: (response: PuzzleResponse) => void;
  apiEndpoint: string;
  token?: string;
}

export const Puzzle: React.FC<PuzzleProps> = ({
  mode,
  players,
  onSolve,
  apiEndpoint,
  token
}) => {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guess, setGuess] = useState<any>(null);

  useEffect(() => {
    const generatePuzzle = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ mode, players })
        });
        
        if (!response.ok) throw new Error('Failed to generate puzzle');
        
        const data = await response.json();
        setPuzzle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generatePuzzle();
  }, [mode, players, apiEndpoint, token]);

  const handleSubmit = async (guess: any) => {
    if (!puzzle) return;

    try {
      const response = await fetch(`${apiEndpoint}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          puzzle_id: puzzle.puzzle_id,
          guess
        })
      });

      if (!response.ok) throw new Error('Failed to check solution');

      const result: PuzzleResponse = await response.json();
      onSolve?.(result);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading puzzle...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!puzzle) return <div>No puzzle available</div>;

  return (
    <div className="puzzle-container">
      {/* TODO: Implement your puzzle UI here */}
      <div className="puzzle-display">
        {/* Render puzzle data */}
      </div>
      <div className="guess-form">
        {/* Implement guess form */}
      </div>
    </div>
  );
}; 