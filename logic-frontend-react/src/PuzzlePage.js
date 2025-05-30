// src/PuzzlePage.js
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function PuzzlePage({ user }) {
  const [params]   = useSearchParams();
  const mode       = params.get('mode') || 'easy';
  const urlPlayers = Number(params.get('players')); // practice only
  const navigate   = useNavigate();

  const [puzzle, setPuzzle]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [result, setResult]           = useState('');
  const [guessMap, setGuessMap]       = useState({});
  const [solution, setSolution]       = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [startTime] = useState(Date.now());

  // Fetch puzzle on mount
  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        // For ranked mode, ensure user is authenticated
        if (mode === 'ranked' && !user) {
          navigate('/login?redirectTo=/puzzle?mode=ranked');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            mode,
            players: urlPlayers || 4
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch puzzle');
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setPuzzle(data);
        // init guesses
        const init = {};
        Object.keys(data.statements).forEach(p => (init[p] = null));
        setGuessMap(init);
      } catch (error) {
        setResult(`❌ ${error.message || 'Failed to load puzzle'}`);
        if (error.message.includes('Authentication required')) {
          navigate('/login?redirectTo=/puzzle?mode=ranked');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [mode, urlPlayers, user, navigate]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading…</div>;
  if (!puzzle) return null;

  // Always use returned puzzle properties
  const truthCount  = puzzle.num_truth_tellers;

  // Toggle T/F for a player; deselect if same value clicked again
  const toggleGuess = (player, val) => {
    setGuessMap(prev => ({
      ...prev,
      [player]: prev[player] === val ? null : val
    }));
  };

  const submitGuess = async () => {
    // Check if all players have been assigned a value
    if (Object.values(guessMap).some(val => val === null)) {
      setResult('❌ Please assign True/False to all players');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          mode,
          guess: guessMap,
          statement_data: puzzle.statement_data,
          num_truth_tellers: truthCount,
          time_taken: (Date.now() - startTime) / 1000 // Convert to seconds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check solution');
      }

      const { valid, elo_change } = await response.json();
      
      if (valid) {
        let message = '✅ Correct!';
        if (elo_change) {
          const changeText = elo_change.change > 0 ? `+${elo_change.change}` : elo_change.change;
          message += ` ELO: ${elo_change.old_elo} → ${elo_change.new_elo} (${changeText})`;
        }
        setResult(message);
        setShowSolution(true);
        setSolution(guessMap);
      } else {
        setResult('❌ Incorrect, try again!');
      }
    } catch (error) {
      setResult(`❌ ${error.message || 'Submission error'}`);
      if (error.message.includes('Authentication required')) {
        navigate('/login?redirectTo=/puzzle?mode=ranked');
      }
    }
  };

  const giveUp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Log the request details (for debugging)
      console.log('Sending request to:', `${process.env.REACT_APP_API_URL}/puzzle/solution`);
      console.log('Request body:', {
        mode,
        statement_data: puzzle.statement_data,
        num_truth_tellers: puzzle.num_truth_tellers
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          mode,
          statement_data: puzzle.statement_data,
          num_truth_tellers: puzzle.num_truth_tellers
        })
      });

      // Log the response status and headers (for debugging)
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(e => ({ error: 'Failed to parse error response' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!data.solution) {
        throw new Error('No solution received from server');
      }

      setShowSolution(true);
      setResult("You gave up — here's one valid solution:");
      setSolution(data.solution);
    } catch (error) {
      console.error('Error getting solution:', error);
      setResult(`Error: ${error.message || 'Failed to get solution'}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header with Mode and Truth Teller Count */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#1a202c'
        }}>
          {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </h2>
        <div style={{ display: 'flex', gap: '2rem', color: '#4a5568' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Players:</span> {puzzle.num_players}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Truth Tellers:</span> {puzzle.num_truth_tellers}
          </div>
          {puzzle.user_elo && (
            <div>
              <span style={{ fontWeight: 'bold' }}>Your ELO:</span> {puzzle.user_elo}
            </div>
          )}
        </div>
      </div>

      {/* Statements */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d3748'
        }}>
          Statements:
        </h3>
        {Object.entries(puzzle.statements).map(([player, statement]) => (
          <div key={player} style={{ 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <strong>{player}:</strong> {statement}
          </div>
        ))}
      </div>

      {/* Guesses */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d3748'
        }}>
          Your Guesses:
        </h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {Object.keys(guessMap).map(player => (
            <div key={player} style={{ 
              padding: '1rem',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>{player}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => toggleGuess(player, true)}
                  disabled={showSolution}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: guessMap[player] === true ? '#28a745' : '#e9ecef',
                    color: guessMap[player] === true ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: showSolution ? 'not-allowed' : 'pointer',
                    flex: 1,
                    opacity: showSolution ? 0.7 : 1
                  }}
                >
                  Truth Teller
                </button>
                <button
                  onClick={() => toggleGuess(player, false)}
                  disabled={showSolution}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: guessMap[player] === false ? '#dc3545' : '#e9ecef',
                    color: guessMap[player] === false ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: showSolution ? 'not-allowed' : 'pointer',
                    flex: 1,
                    opacity: showSolution ? 0.7 : 1
                  }}
                >
                  Liar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Display */}
      {showSolution && solution && (
        <div style={{ 
          marginTop: '2rem',
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Solution
            {result.includes('✅') && (
              <svg 
                viewBox="0 0 20 20" 
                style={{ 
                  width: '1.25rem', 
                  height: '1.25rem',
                  fill: '#28a745'
                }}
              >
                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
              </svg>
            )}
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(solution).map(([player, isTrue]) => (
              <div key={player} style={{ 
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <strong>{player}</strong>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  backgroundColor: isTrue ? '#28a745' : '#dc3545',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {isTrue ? 'Truth Teller' : 'Liar'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={submitGuess}
          disabled={showSolution}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: showSolution ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: showSolution ? 0.5 : 1
          }}
        >
          Submit Answer
        </button>
        <button
          onClick={giveUp}
          disabled={showSolution}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: showSolution ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: showSolution ? 0.5 : 1
          }}
        >
          Give Up
        </button>
      </div>

      {/* Result Message */}
      {result && !showSolution && (
        <div style={{
          padding: '1rem',
          backgroundColor: result.includes('✅') ? '#d4edda' : '#f8d7da',
          color: result.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          {result}
        </div>
      )}
    </div>
  );
}
