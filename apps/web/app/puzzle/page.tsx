'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

interface PuzzleData {
  id: string;
  mode: string;
  statements: Record<string, string>;
  players: string[];
  user_elo?: number;
  max_time?: number;
}

interface EloChange {
  old_elo: number;
  new_elo: number;
  change: number;
}

export default function PuzzlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'practice';
  const players = searchParams?.get('players') || '4';
  
  const [puzzle, setPuzzle] = React.useState<PuzzleData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userGuesses, setUserGuesses] = React.useState<Record<string, boolean>>({});
  const [startTime] = React.useState<number>(Date.now());
  const [submitting, setSubmitting] = React.useState(false);
  
  const supabase = React.useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Fetch puzzle on mount
  React.useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session as Session | null;
        
        // For ranked mode, ensure user is authenticated
        if (mode === 'ranked' && !session?.user) {
          router.push('/');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puzzle/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.user ? { 'Authorization': `Bearer ${session.user.id}` } : {})
          },
          body: JSON.stringify({
            mode,
            players: parseInt(players),
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch puzzle');
        }

        const puzzleData = await response.json();
        setPuzzle(puzzleData);
        
        // Initialize guesses only if we have players
        if (puzzleData.players && Array.isArray(puzzleData.players)) {
          const initialGuesses: Record<string, boolean> = {};
          puzzleData.players.forEach((player: string) => {
            initialGuesses[player] = false;
          });
          setUserGuesses(initialGuesses);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        if (err instanceof Error && err.message.includes('Authentication required')) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [mode, players, router, supabase]);

  const handleGuessChange = (player: string) => {
    setUserGuesses(prev => ({
      ...prev,
      [player]: !prev[player]
    }));
  };

  const handleSubmit = async () => {
    if (!puzzle) return;
    
    try {
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session as Session | null;
      
      const timeTaken = (Date.now() - startTime) / 1000; // Convert to seconds
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.user ? { 'Authorization': `Bearer ${session.user.id}` } : {})
        },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          guesses: userGuesses,
          mode,
          num_players: puzzle.players.length,
          time_taken: timeTaken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check solution');
      }

      const result = await response.json();
      
      if (result.valid) {
        let message = 'Correct! Well done!';
        if (result.elo_change) {
          const change = result.elo_change as EloChange;
          const changeText = change.change > 0 ? `+${change.change}` : change.change;
          message += `\nELO Rating: ${change.old_elo} → ${change.new_elo} (${changeText})`;
        }
        alert(message);
        router.push('/');
      } else {
        alert('Incorrect. Try again!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (err instanceof Error && err.message.includes('Authentication required')) {
        router.push('/');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl mb-4">Loading puzzle...</div>
          <div className="text-gray-500">Please wait while we prepare your challenge.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-xl text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!puzzle || !puzzle.players || !puzzle.statements) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-xl mb-4">No puzzle found</div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Puzzle
          </h1>
          {puzzle.user_elo && (
            <div className="text-lg">
              Current ELO: <span className="font-bold">{puzzle.user_elo}</span>
            </div>
          )}
        </div>
        
        {puzzle.max_time && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">
              ⚠️ You have {puzzle.max_time} seconds to solve this puzzle for full ELO points.
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Statements:</h2>
          {Object.entries(puzzle.statements).map(([player, statement]) => (
            <div key={player} className="mb-4 p-4 bg-gray-50 rounded">
              <strong className="text-blue-600">{player}:</strong> {statement}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Guesses:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {puzzle.players.map((player: string) => (
              <div key={player} className="flex items-center space-x-4">
                <span className="font-medium">{player}:</span>
                <button
                  onClick={() => handleGuessChange(player)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded transition-colors ${
                    userGuesses[player]
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  } disabled:opacity-50`}
                >
                  {userGuesses[player] ? 'Truth-teller' : 'Liar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => router.push('/')}
            disabled={submitting}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Back to Home
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Checking...' : 'Submit Solution'}
          </button>
        </div>
      </div>
    </div>
  );
} 