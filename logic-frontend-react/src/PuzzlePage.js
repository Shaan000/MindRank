// src/PuzzlePage.js
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function PuzzlePage({ user, accessToken, authInitialized }) {
  const [params] = useSearchParams();
  const mode = params.get('mode') || 'easy';
  const urlPlayers = Number(params.get('players')); // practice only
  const navigate = useNavigate();

  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState('');
  const [guessMap, setGuessMap] = useState({});
  const [solution, setSolution] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userElo, setUserElo] = useState(null);
  const [eloFeedback, setEloFeedback] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    // Only generate puzzle after auth is initialized (for both ranked and practice)
    if (!authInitialized) {
      // console.log('⏳ Waiting for auth initialization before generating puzzle...');
      return;
    }

    // For ranked mode, we need both user and accessToken
    if (mode === 'ranked' && (!user || !accessToken)) {
      // console.log('❌ Ranked mode requires authentication');
      setLoading(false);
      return;
    }

    // For practice modes, we can proceed even without authentication
    // console.log(`🎯 Auth initialized, generating ${mode} puzzle...`);
    generatePuzzle();
  }, [authInitialized, mode, user, accessToken]);

  const generatePuzzle = async () => {
    try {
      setLoading(true);
      setResult('');
      setSolution(null);
      setShowSolution(false);
      setIsPuzzleSolved(false);
      setEloFeedback('');
      setValidationMessage('');

      const requestBody = { mode, players: urlPlayers || 4 };
      const headers = {
        'Content-Type': 'application/json',
        ...(mode === 'ranked' && accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };

      // console.log(`🚀 Generating ${mode} puzzle with headers:`, Object.keys(headers));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to generate puzzle: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      // console.log('✅ Puzzle generated successfully');
      
      setPuzzle(data);
      setGuessMap(Object.fromEntries(data.people.map(p => [p, null])));
      
      if (mode === 'ranked' && data.time_limit) {
        setTimeRemaining(data.time_limit);
      }

    } catch (error) {
      // console.error('❌ Error generating puzzle:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitGuess = async () => {
    // Check if all players have been assigned a value
    const unassigned = Object.values(guessMap).filter(val => val === null).length;
    if (unassigned > 0) {
      setValidationMessage('⚠️ Please assign True/False values to all players before submitting.');
      return;
    }

    try {
      const timeTaken = (Date.now() - startTime) / 1000;

      const response = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(mode === 'ranked' && accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          mode: mode === 'ranked' ? 'ranked' : mode,
          guess: guessMap,
          statement_data: puzzle.statement_data,
          num_truth_tellers: puzzle.num_truth_tellers,
          time_taken: timeTaken,
          gave_up: false
        })
      });

      const data = await response.json();
      // console.log('📊 Check response:', data);

      if (data.valid) {
        setResult('🎉 Correct! Well done!');
        setIsPuzzleSolved(true);
        if (mode === 'ranked' && data.elo_change !== undefined) {
          setEloFeedback(`ELO: ${data.elo_change >= 0 ? '+' : ''}${data.elo_change}`);
        }
      } else {
        setResult('❌ Incorrect. Try again or give up to see the solution.');
      }

      setValidationMessage('');
    } catch (error) {
      // console.error('Error submitting guess:', error);
      setResult(`Error: ${error.message}`);
    }
  };

  const giveUp = async () => {
    try {
      const timeTaken = (Date.now() - startTime) / 1000;

      // For ranked mode, we need to submit a "gave up" request to track Elo
      if (mode === 'ranked' && user && accessToken) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            mode: 'ranked',
            guess: guessMap,
            statement_data: puzzle.statement_data,
            num_truth_tellers: puzzle.num_truth_tellers,
            time_taken: timeTaken,
            gave_up: true
          })
        });

        const { elo_change } = await response.json();
        if (elo_change !== undefined) {
          setEloFeedback(`ELO: ${elo_change >= 0 ? '+' : ''}${elo_change}`);
        }
      }

      // Get solution regardless of mode
      const solutionResponse = await fetch(`${process.env.REACT_APP_API_URL}/puzzle/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(mode === 'ranked' && accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          mode,
          statement_data: puzzle.statement_data,
          num_truth_tellers: puzzle.num_truth_tellers,
          full_statement_data: puzzle.full_statement_data || puzzle.statement_data
        })
      });

      if (!solutionResponse.ok) {
        const errorText = await solutionResponse.text();
        throw new Error(`Solution request failed: ${solutionResponse.status} ${errorText}`);
      }

      const solutionData = await solutionResponse.json();
      // console.log('✅ Solution received:', solutionData);

      setSolution(solutionData.solution);
      setShowSolution(true);
      setResult('📖 Solution revealed. Better luck next time!');

    } catch (error) {
      // console.error('❌ Error getting solution:', error);
      setResult(`Error: Failed to get solution - ${error.message}`);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading…</div>;
  if (!puzzle) return null;

  // Always use returned puzzle properties
  const truthCount = puzzle.num_truth_tellers;

  // Toggle T/F for a player; deselect if same value clicked again
  const toggleGuess = (player, val) => {
    setGuessMap(prev => ({
      ...prev,
      [player]: prev[player] === val ? null : val
    }));
    
    // Clear validation message when user makes changes
    if (validationMessage) {
      setValidationMessage('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'Georgia, serif',
      backgroundColor: '#262421',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* Header with Mode and Stats */}
      <div style={{ 
        backgroundColor: '#312e2b',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ 
          fontSize: '1.75rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#ffffff'
        }}>
          {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          flexWrap: 'wrap',
          color: '#b0a99f'
        }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Players:</span> {puzzle.num_players}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Truth Tellers:</span> {puzzle.num_truth_tellers}
          </div>
          {userElo && (
            <div>
              <span style={{ fontWeight: 'bold' }}>Your ELO:</span> {userElo}
            </div>
          )}
          {mode === 'ranked' && timeRemaining !== null && (
            <div style={{ 
              color: timeRemaining <= 30 ? '#ff6b6b' : timeRemaining <= 60 ? '#ffd93d' : '#769656',
              fontWeight: 'bold'
            }}>
              <span>Time:</span> {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        {eloFeedback && (
          <div style={{ 
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#769656',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#ffffff'
          }}>
            {eloFeedback}
          </div>
        )}
      </div>

      {/* Statements */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#ffffff'
        }}>
          Statements:
        </h3>
        {Object.entries(puzzle.statements).map(([player, statement], index) => (
          <div key={player} style={{ 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#312e2b',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            animation: `floatIn 0.8s ease-out ${index * 0.1}s both, float 6s ease-in-out infinite ${index * 0.5}s`,
            borderLeft: '3px solid #769656'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(118, 150, 86, 0.2)';
            e.currentTarget.style.borderLeftColor = '#4a90e2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            e.currentTarget.style.borderLeftColor = '#769656';
          }}
          >
            <strong style={{ color: '#769656' }}>{player}:</strong> 
            <span style={{ 
              marginLeft: '0.5rem', 
              color: '#b0a99f',
              position: 'relative'
            }}>
              {statement}
              {/* Add sparkle effect */}
              <span style={{
                position: 'absolute',
                right: '-10px',
                top: '-5px',
                color: '#4a90e2',
                fontSize: '0.8rem',
                animation: 'sparkle 2s ease-in-out infinite',
                opacity: 0.7
              }}>✨</span>
            </span>
          </div>
        ))}
        
        {/* Enhanced CSS Animations */}
        <style>{`
          @keyframes floatIn {
            from {
              opacity: 0;
              transform: translateX(-50px) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0) translateY(0);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-3px);
            }
          }
          
          @keyframes sparkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.8) rotate(0deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.2) rotate(180deg);
            }
          }
        `}</style>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <div style={{ 
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#8b4513',
          color: '#ffd93d',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          {validationMessage}
        </div>
      )}

      {/* Guesses */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#ffffff'
        }}>
          Your Guesses:
        </h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {Object.keys(guessMap).map(player => (
            <div key={player} style={{ 
              padding: '1rem',
              backgroundColor: '#312e2b',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s ease',
              animation: 'slideInUp 0.5s ease-out'
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: '#769656' }}>{player}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => toggleGuess(player, true)}
                  disabled={showSolution || isPuzzleSolved}
                  style={{
                    padding: '0.75rem 0.5rem',
                    backgroundColor: guessMap[player] === true ? '#769656' : '#4a4a4a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (showSolution || isPuzzleSolved) ? 'not-allowed' : 'pointer',
                    flex: 1,
                    opacity: (showSolution || isPuzzleSolved) ? 0.6 : 1,
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    transform: guessMap[player] === true ? 'scale(1.1)' : 'scale(1)',
                    animation: guessMap[player] === true ? 'bounce 0.6s ease-in-out' : 'none',
                    boxShadow: guessMap[player] === true ? '0 4px 8px rgba(118, 150, 86, 0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!showSolution && !isPuzzleSolved) {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 2px 8px rgba(118, 150, 86, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showSolution && !isPuzzleSolved) {
                      e.target.style.transform = guessMap[player] === true ? 'scale(1.1)' : 'scale(1)';
                      e.target.style.boxShadow = guessMap[player] === true ? '0 4px 8px rgba(118, 150, 86, 0.4)' : 'none';
                    }
                  }}
                >
                  T
                </button>
                <button
                  onClick={() => toggleGuess(player, false)}
                  disabled={showSolution || isPuzzleSolved}
                  style={{
                    padding: '0.75rem 0.5rem',
                    backgroundColor: guessMap[player] === false ? '#cc8c14' : '#4a4a4a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (showSolution || isPuzzleSolved) ? 'not-allowed' : 'pointer',
                    flex: 1,
                    opacity: (showSolution || isPuzzleSolved) ? 0.6 : 1,
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    transform: guessMap[player] === false ? 'scale(1.1)' : 'scale(1)',
                    animation: guessMap[player] === false ? 'bounce 0.6s ease-in-out' : 'none',
                    boxShadow: guessMap[player] === false ? '0 4px 8px rgba(204, 140, 20, 0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!showSolution && !isPuzzleSolved) {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 2px 8px rgba(204, 140, 20, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showSolution && !isPuzzleSolved) {
                      e.target.style.transform = guessMap[player] === false ? 'scale(1.1)' : 'scale(1)';
                      e.target.style.boxShadow = guessMap[player] === false ? '0 4px 8px rgba(204, 140, 20, 0.4)' : 'none';
                    }
                  }}
                >
                  F
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            0%, 20%, 60%, 100% {
              transform: scale(1.1) translateY(0);
            }
            40% {
              transform: scale(1.1) translateY(-8px);
            }
            80% {
              transform: scale(1.1) translateY(-4px);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </div>

      {/* Action Buttons */}
      {!showSolution && !isPuzzleSolved && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={submitGuess}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#769656',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Submit Guess
          </button>
          <button
            onClick={giveUp}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#8b4513',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Give Up
          </button>
        </div>
      )}

      {/* New Puzzle Button - Show when puzzle is solved or solution is shown */}
      {(isPuzzleSolved || showSolution) && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={generatePuzzle}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            🎲 New Puzzle
          </button>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: result.includes('✅') ? '#769656' : 
                         result.includes('⚠️') ? '#8b4513' : '#d2691e',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          {result}
        </div>
      )}

      {/* Solution Display */}
      {showSolution && solution && (
        <div style={{ 
          marginTop: '2rem',
          backgroundColor: '#312e2b',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#ffffff'
          }}>
            One Possible Solution:
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(solution).map(([player, isTrue]) => (
              <div key={player} style={{ 
                padding: '1rem',
                backgroundColor: isTrue ? '#769656' : '#d2691e',
                color: 'white',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {player}: {isTrue ? 'Truth-Teller' : 'Liar'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4a4a4a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
