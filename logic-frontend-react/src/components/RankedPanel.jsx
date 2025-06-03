import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function RankedPanel({ user, accessToken, onBack }) {
  const [puzzle, setPuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerGuesses, setPlayerGuesses] = useState({});
  const [isLocked, setIsLocked] = useState({}); // New state for locked players
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [result, setResult] = useState(null);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [solution, setSolution] = useState(null);
  const [eloFeedback, setEloFeedback] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [showWarning, setShowWarning] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // Current elapsed time in seconds
  const [timerInterval, setTimerInterval] = useState(null); // Timer interval reference
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false); // Leave confirmation modal
  const [warningMessage, setWarningMessage] = useState(null);
  const [showWarningMessage, setShowWarningMessage] = useState(false);

  // Chess.com style inline styles matching the landing page
  const appStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '3rem 2rem',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const backButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'absolute',
    top: '2rem',
    left: '2rem'
  };

  const sectionStyle = {
    background: '#312e2b',
    padding: '4rem 2rem'
  };

  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    margin: '2rem auto',
    maxWidth: '800px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37'
  };

  const buttonStyle = {
    background: '#769656',
    color: '#ffffff',
    padding: '1rem 2rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '2rem'
  };

  const warningStyle = {
    background: 'rgba(255, 193, 7, 0.1)',
    color: '#ffc107',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '2rem',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    textAlign: 'center',
    fontSize: '0.875rem'
  };

  const statementStyle = {
    background: '#1a1816',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5',
    borderLeft: '3px solid #769656',
    color: '#e5e0dc'
  };

  const playersGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '2rem'
  };

  const playerCardStyle = {
    background: '#1a1816',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #3d3a37',
    textAlign: 'center'
  };

  const playerNameStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#ffffff'
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center'
  };

  const guessButtonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px'
  };

  useEffect(() => {
    // Don't auto-generate puzzle anymore - wait for user to click queue button
    console.log('🎯 RankedPanel loaded, showing warning screen...');
  }, [user, accessToken]);

  // Timer effect - start when puzzle is active
  useEffect(() => {
    if (startTime && !result && !hasGivenUp) {
      // Start the timer
      const interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      setTimerInterval(interval);
      
      // Cleanup on unmount or when conditions change
      return () => {
        clearInterval(interval);
        setTimerInterval(null);
      };
    } else if (timerInterval) {
      // Stop the timer if puzzle is solved or given up
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [startTime, result, hasGivenUp]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const handleQueueForRanked = () => {
    console.log('🚀 User clicked Queue for Ranked, generating puzzle...');
    setShowWarning(false);
    setIsLoading(true);
    generateRankedPuzzle();
  };

  const resetToWarning = () => {
    setShowWarning(true);
    setPuzzle(null);
    setError(null);
    setIsLoading(false);
    setResult(null);
    setHasGivenUp(false);
    setSolution(null);
    setEloFeedback('');
    setPlayerGuesses({});
    setStartTime(null);
    setCurrentTime(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const handleBackClick = () => {
    // If there's an active puzzle (not in warning state and puzzle exists), show confirmation
    if (!showWarning && puzzle && !result && !hasGivenUp) {
      setShowLeaveConfirmation(true);
    } else {
      // Safe to go back directly
      onBack();
    }
  };

  const handleConfirmLeave = async () => {
    // Apply full ELO penalty for abandoning ranked puzzle
    if (puzzle && startTime && user && accessToken) {
      try {
        console.log('🚪 Applying ELO penalty for abandoning ranked puzzle...');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const timeTaken = (Date.now() - startTime) / 1000;
        
        const requestBody = {
          mode: 'ranked',
          player_assignments: playerGuesses,
          statement_data: puzzle.statement_data,
          num_truth_tellers: puzzle.num_truth_tellers,
          time_taken: timeTaken,
          gave_up: true, // This will trigger full penalty
          abandoned: true // Special flag for abandoning
        };
        
        console.log('📤 Sending abandonment request:', requestBody);
        
        const response = await fetch(`${apiUrl}/puzzle/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to apply ELO penalty:', response.status, errorText);
          throw new Error(`Failed to apply ELO penalty: ${response.status}`);
        }
        
        const resultData = await response.json();
        console.log('✅ ELO penalty response:', resultData);
        
        if (resultData.elo_change) {
          console.log(`📉 ELO penalty applied: ${resultData.elo_change.old_elo} → ${resultData.elo_change.new_elo} (${resultData.elo_change.change})`);
          
          // Show user the penalty was applied
          setEloFeedback(`ELO Penalty Applied: ${resultData.elo_change.old_elo} → ${resultData.elo_change.new_elo} (${resultData.elo_change.change})`);
          
          // Wait a moment for user to see the penalty feedback
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          console.warn('⚠️ No ELO change data returned from server');
        }
        
      } catch (error) {
        console.error('❌ Failed to apply ELO penalty:', error);
        alert(`Failed to apply ELO penalty: ${error.message}`);
        return; // Don't leave if penalty failed to apply
      }
    } else {
      console.log('ℹ️ No penalty applied - missing puzzle/user data');
    }
    
    setShowLeaveConfirmation(false);
    onBack();
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirmation(false);
  };

  const generateRankedPuzzle = async () => {
    if (!user || !accessToken) {
      setError('Authentication required for ranked mode');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setHasGivenUp(false);
      setSolution(null);
      setEloFeedback('');
      setPlayerGuesses({});
      setIsLocked({}); // Reset locked state
      setCurrentTime(0);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('🚀 Generating ranked puzzle...');
      
      const response = await fetch(`${apiUrl}/puzzle/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          mode: 'ranked'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Puzzle generation failed:', response.status, errorText);
        throw new Error(`Failed to generate puzzle: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Ranked puzzle generated successfully');
      
      setPuzzle(data);
      setStartTime(Date.now());
      setCurrentTime(0); // Start timer at 0
      
      // Initialize player guesses and locked state based on statements (consistent with getPlayerList)
      const initialGuesses = {};
      const initialLocked = {};
      
      if (data.statements) {
        Object.keys(data.statements).forEach(player => {
          initialGuesses[player] = null;
          initialLocked[player] = false;
        });
      } else if (data.people) {
        // Fallback to data.people if statements not available
        data.people.forEach(person => {
          initialGuesses[person] = null;
          initialLocked[person] = false;
        });
      }
      
      console.log('🔧 Initialized player guesses:', initialGuesses);
      console.log('🔧 Initialized locked state:', initialLocked);
      
      setPlayerGuesses(initialGuesses);
      setIsLocked(initialLocked);

    } catch (error) {
      console.error('❌ Error generating ranked puzzle:', error);
      setError(`Failed to generate puzzle: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerGuessChange = (player, value) => {
    console.log('🎯 Player guess change attempt:', { player, value, currentGuess: playerGuesses[player], isLocked: isLocked[player] });
    
    // Check if player is already locked
    if (isLocked[player] === true) {
      console.log('🔒 Player is locked, showing warning');
      setWarningMessage('This player assignment is locked and cannot be changed.');
      setShowWarningMessage(true);
      
      setTimeout(() => {
        setShowWarningMessage(false);
        setTimeout(() => setWarningMessage(null), 300);
      }, 3000);
      
      return;
    }

    // If player currently has no assignment, set the value and lock it
    if (playerGuesses[player] === null || playerGuesses[player] === undefined) {
      console.log('✅ Setting player assignment and locking:', { player, value });
      setPlayerGuesses(prev => ({
        ...prev,
        [player]: value
      }));
      
      setIsLocked(prev => ({
        ...prev,
        [player]: true
      }));
    } else {
      console.log('⚠️ Player already has assignment, cannot change:', { player, currentValue: playerGuesses[player] });
      // This shouldn't happen since locked players should be disabled, but just in case
      setWarningMessage('This player assignment is locked and cannot be changed.');
      setShowWarningMessage(true);
      
      setTimeout(() => {
        setShowWarningMessage(false);
        setTimeout(() => setWarningMessage(null), 300);
      }, 3000);
    }
  };

  const handleSubmitGuess = async () => {
    if (!user || !accessToken) {
      setError('Authentication required for ranked mode');
      return;
    }

    // Check if all players have guesses
    const allGuessed = Object.values(playerGuesses).every(guess => guess !== null);
    if (!allGuessed) {
      setWarningMessage('Please assign True/False to all players before submitting.');
      setShowWarningMessage(true);
      
      setTimeout(() => {
        setShowWarningMessage(false);
        setTimeout(() => setWarningMessage(null), 300);
      }, 3000);
      
      return;
    }

    try {
      setIsCheckingAnswer(true);
      setResult(null);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;
      
      const requestBody = {
        mode: 'ranked',
        player_assignments: playerGuesses,
        statement_data: puzzle.statement_data,
        num_truth_tellers: puzzle.num_truth_tellers,
        time_taken: timeTaken,
        gave_up: false
      };
      
      const response = await fetch(`${apiUrl}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to check answer';
        try {
          const responseText = await response.text();
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const resultData = await response.json();
      
      if (resultData.valid) {
        setResult('correct');
        if (resultData.elo_change) {
          const { old_elo, new_elo, change } = resultData.elo_change;
          const changeText = change > 0 ? `+${change}` : `${change}`;
          setEloFeedback(`ELO: ${old_elo} → ${new_elo} (${changeText})`);
        }
      } else {
        setResult('incorrect');
        // In ranked mode, immediately get the solution when wrong
        try {
          const solutionRequestBody = {
            mode: 'ranked',
            statement_data: puzzle.statement_data || {},
            num_truth_tellers: puzzle.num_truth_tellers,
            full_statement_data: puzzle.full_statement_data || puzzle.statement_data || {}
          };
          
          const solutionResponse = await fetch(`${apiUrl}/puzzle/solution`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(solutionRequestBody)
          });
          
          if (solutionResponse.ok) {
            const solutionData = await solutionResponse.json();
            setSolution(solutionData.solution);
          }
        } catch (solutionError) {
          console.error('Failed to get solution after incorrect answer:', solutionError);
        }
        
        if (resultData.elo_change) {
          const { old_elo, new_elo, change } = resultData.elo_change;
          const changeText = change > 0 ? `+${change}` : `${change}`;
          setEloFeedback(`ELO: ${old_elo} → ${new_elo} (${changeText})`);
        }
      }
    } catch (err) {
      console.error('Answer check error:', err);
      setError(err.message || 'Failed to check answer');
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const handleGiveUp = async () => {
    try {
      setHasGivenUp(true);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Send the data in the format that the solution endpoint expects
      const requestBody = {
        mode: 'ranked',
        statement_data: puzzle.statement_data || {},
        num_truth_tellers: puzzle.num_truth_tellers,
        full_statement_data: puzzle.full_statement_data || puzzle.statement_data || {}
      };

      // Debug log to see what we're sending
      console.log('🔍 Sending solution request:', requestBody);
      
      const response = await fetch(`${apiUrl}/puzzle/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Solution request failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: Failed to get solution`);
      }

      const solutionData = await response.json();
      setSolution(solutionData.solution);
      
      // Handle ELO penalty for giving up
      if (startTime && accessToken) {
        const timeTaken = (Date.now() - startTime) / 1000;
        try {
          const requestBody = {
            mode: 'ranked',
            player_assignments: playerGuesses,
            statement_data: puzzle.statement_data,
            num_truth_tellers: puzzle.num_truth_tellers,
            time_taken: timeTaken,
            gave_up: true
          };
          
          const response = await fetch(`${apiUrl}/puzzle/check`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
          });
          
          if (response.ok) {
            const resultData = await response.json();
            if (resultData.elo_change) {
              const { old_elo, new_elo, change } = resultData.elo_change;
              const changeText = change > 0 ? `+${change}` : `${change}`;
              setEloFeedback(`ELO: ${old_elo} → ${new_elo} (${changeText}) - Gave up penalty`);
            }
          }
        } catch (eloError) {
          console.error('Failed to update ELO for giving up:', eloError);
        }
      }
    } catch (err) {
      console.error('Get solution error:', err);
      setError('Failed to get solution');
    }
  };

  const getPlayerList = () => {
    if (!puzzle || !puzzle.statements) return [];
    return Object.keys(puzzle.statements);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={appStyle}>
      {/* Warning Message Banner */}
      {warningMessage && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
          color: '#ffffff',
          padding: '1rem 2rem',
          textAlign: 'center',
          fontSize: '1.1rem',
          fontWeight: '600',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transform: showWarningMessage ? 'translateY(0)' : 'translateY(-100%)',
          opacity: showWarningMessage ? 1 : 0,
          transition: 'all 0.3s ease-in-out'
        }}>
          ⚠️ {warningMessage}
        </div>
      )}

      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={handleBackClick}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={titleStyle}>Ranked Mode</h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0',
          fontWeight: '400'
        }}>
          Competitive Puzzle Solving
        </p>
      </div>

      <div style={sectionStyle}>
        {error && (
          <div style={{...cardStyle, background: '#8b2635', border: '1px solid #d73a49', marginBottom: '2rem'}}>
            <div style={{textAlign: 'center'}}>
              <p style={{margin: '0 0 1rem 0', color: '#ffffff', fontSize: '1.1rem'}}>⚠️ Error: {error}</p>
              <button 
                style={{
                  ...buttonStyle,
                  background: '#769656',
                  fontSize: '1rem',
                  padding: '0.75rem 1.5rem'
                }}
                onClick={resetToWarning}
                onMouseEnter={(e) => {
                  e.target.style.background = '#5d7c3f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#769656';
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div style={cardStyle}>
          {showWarning ? (
            <>
              <h3 style={{
                fontSize: '2rem',
                color: '#ffffff',
                marginBottom: '2rem',
                fontWeight: '700',
                fontFamily: 'Georgia, serif',
                textAlign: 'center'
              }}>
                ⚠️ Ranked Mode Warning
              </h3>

              <div style={{
                background: 'rgba(255, 193, 7, 0.15)',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  🏆⚡📊
                </div>
                
                <h4 style={{
                  fontSize: '1.5rem',
                  color: '#ffc107',
                  marginBottom: '1.5rem',
                  fontWeight: '600'
                }}>
                  Your ELO Rating is at Stake!
                </h4>
                
                <div style={{
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  color: '#ffffff',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>📈 Win:</strong> Gain ELO points and climb the leaderboard
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>📉 Lose:</strong> Lose ELO points and potentially drop ranks
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>⏱️ Time Matters:</strong> Faster solutions earn more points
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    <strong>🎯 Difficulty:</strong> Puzzle difficulty matches your current tier
                  </p>
                </div>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '1rem',
                  color: '#ffeb3b',
                  fontWeight: '500'
                }}>
                  Your performance will be publicly visible on the leaderboard!
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button 
                  style={{
                    ...buttonStyle,
                    background: '#769656',
                    fontSize: '1.125rem',
                    padding: '1.25rem 2.5rem',
                    fontWeight: '700'
                  }}
                  onClick={handleQueueForRanked}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#5d7c3f';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#769656';
                  }}
                >
                  🚀 Queue for Ranked
                </button>
                
                <button 
                  style={{
                    ...buttonStyle,
                    background: '#666',
                    fontSize: '1rem',
                    padding: '1.25rem 2rem'
                  }}
                  onClick={onBack}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#555';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#666';
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : !puzzle ? (
            <>
              <h3 style={{
                fontSize: '1.375rem',
                color: '#ffffff',
                marginBottom: '2rem',
                fontWeight: '600',
                fontFamily: 'Georgia, serif',
                textAlign: 'center'
              }}>
                Generating Your Ranked Challenge...
              </h3>

              {isLoading && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    animation: 'spin 2s linear infinite'
                  }}>
                    ⚡
                  </div>
                  <p style={{ color: '#b0a99f', fontSize: '1.1rem' }}>
                    Finding the perfect puzzle for your skill level...
                  </p>
                </div>
              )}

              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </>
          ) : (
            <>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#ffffff',
                marginBottom: '1.5rem',
                fontWeight: '600',
                fontFamily: 'Georgia, serif',
                textAlign: 'center'
              }}>
                Ranked Puzzle - {getPlayerList().length} Players
                {puzzle.num_truth_tellers && (
                  <span style={{ color: '#b0a99f', fontSize: '1rem', fontWeight: '400' }}>
                    {' '}({puzzle.num_truth_tellers} Truth-Tellers)
                  </span>
                )}
              </h3>

              <div style={{
                background: 'rgba(118, 150, 86, 0.1)',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '2rem',
                border: '1px solid rgba(118, 150, 86, 0.3)',
                textAlign: 'center',
                color: '#769656',
                fontSize: '0.875rem'
              }}>
                🏆 This is a ranked puzzle - your performance will affect your ELO rating
                {puzzle.user_elo && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#b0a99f' }}>
                    Current ELO: {puzzle.user_elo} | Time limit adjusted for your tier
                  </div>
                )}
              </div>

              {eloFeedback && (
                <div style={{
                  background: 'rgba(74, 144, 226, 0.1)',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  textAlign: 'center',
                  color: '#4a90e2',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {eloFeedback}
                </div>
              )}

              {/* Timer Display */}
              {startTime && puzzle.time_limit && (
                <div style={{
                  background: currentTime > puzzle.time_limit ? 'rgba(220, 53, 69, 0.1)' : 'rgba(74, 144, 226, 0.1)',
                  border: `2px solid ${currentTime > puzzle.time_limit ? '#dc3545' : '#4a90e2'}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: currentTime > puzzle.time_limit ? '#dc3545' : '#4a90e2',
                    marginBottom: '0.5rem',
                    fontFamily: 'Georgia, serif'
                  }}>
                    {formatTime(currentTime)}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: currentTime > puzzle.time_limit ? '#dc3545' : '#4a90e2',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}>
                    Target: {formatTime(puzzle.time_limit)} for full ELO
                    {puzzle.user_elo && (
                      <span style={{ 
                        display: 'block',
                        fontSize: '0.875rem',
                        color: '#b0a99f',
                        marginTop: '0.25rem',
                        fontWeight: '400'
                      }}>
                        (Time limit based on your tier)
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: currentTime > puzzle.time_limit ? '#ff9999' : '#b0a99f'
                  }}>
                    {currentTime > puzzle.time_limit ? 
                      '⚠️ Overtime! ELO penalty may apply' : 
                      currentTime > puzzle.time_limit * 0.8 ? 
                        '⏰ Time running out!' : 
                        '✅ On track for full ELO'
                    }
                  </div>
                </div>
              )}

              <div style={{marginBottom: '2rem'}}>
                <h4 style={{color: '#b0a99f', marginBottom: '1rem', fontSize: '1.1rem'}}>Statements:</h4>
                {puzzle.statements && Object.entries(puzzle.statements).map(([player, statementText], index) => (
                  <div key={index} style={statementStyle}>
                    <strong>Player {player}:</strong> "{statementText}"
                  </div>
                ))}
                
                {/* Fallback for different data formats */}
                {!puzzle.statements && puzzle.statement_data && Object.entries(puzzle.statement_data).map(([player, statement], index) => {
                  const statementText = typeof statement === 'string' 
                    ? statement 
                    : statement.target 
                      ? `${statement.target} is a ${statement.truth_value ? 'Truth-Teller' : 'Liar'}`
                      : 'Invalid statement format';
                  
                  return (
                    <div key={index} style={statementStyle}>
                      <strong>Player {player}:</strong> "{statementText}"
                    </div>
                  );
                })}
              </div>

              <div>
                <h4 style={{color: '#b0a99f', marginBottom: '1rem', fontSize: '1.1rem'}}>
                  Assign each player as Truth-Teller (T) or Liar (F):
                </h4>
                <div style={playersGridStyle}>
                  {getPlayerList().map(player => {
                    console.log('🎮 Rendering player:', { player, guess: playerGuesses[player], locked: isLocked[player], hasGivenUp, result });
                    return (
                    <div key={player} style={playerCardStyle}>
                      <div style={playerNameStyle}>Player {player}</div>
                      {isLocked[player] === true && (
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{
                            fontSize: '1.2rem',
                            color: '#ffc107',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                          }}>
                            🔒
                          </span>
                        </div>
                      )}
                      <div style={buttonGroupStyle}>
                        <button
                          style={{
                            ...guessButtonStyle,
                            background: playerGuesses[player] === true ? '#769656' : '#3d3a37',
                            color: playerGuesses[player] === true ? '#ffffff' : '#b0a99f',
                            border: playerGuesses[player] === true ? '2px solid #769656' : '2px solid #3d3a37',
                            opacity: (isLocked[player] === true) ? 0.6 : 1,
                            cursor: (hasGivenUp || result === 'correct' || (isLocked[player] === true)) ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => handlePlayerGuessChange(player, true)}
                          disabled={hasGivenUp || result === 'correct' || (isLocked[player] === true)}
                        >
                          T
                        </button>
                        <button
                          style={{
                            ...guessButtonStyle,
                            background: playerGuesses[player] === false ? '#cc8c14' : '#3d3a37',
                            color: playerGuesses[player] === false ? '#ffffff' : '#b0a99f',
                            border: playerGuesses[player] === false ? '2px solid #cc8c14' : '2px solid #3d3a37',
                            opacity: (isLocked[player] === true) ? 0.6 : 1,
                            cursor: (hasGivenUp || result === 'correct' || (isLocked[player] === true)) ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => handlePlayerGuessChange(player, false)}
                          disabled={hasGivenUp || result === 'correct' || (isLocked[player] === true)}
                        >
                          F
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {result === 'correct' && (
                <div style={{...cardStyle, background: '#1e4a2a', border: '1px solid #28a745', marginTop: '2rem', textAlign: 'center'}}>
                  <p style={{margin: 0, color: '#ffffff', fontSize: '1.25rem'}}>🎉 Excellent! You solved the ranked puzzle!</p>
                </div>
              )}

              {result === 'incorrect' && (
                <div style={{...cardStyle, background: '#4a1e1e', border: '1px solid #dc3545', marginTop: '2rem', textAlign: 'center'}}>
                  <p style={{margin: '0 0 1rem 0', color: '#ffffff', fontSize: '1.25rem'}}>❌ Incorrect Solution</p>
                  <p style={{margin: 0, color: '#ff9999', fontSize: '1rem'}}>
                    Ranked mode allows only one attempt. Here's one correct solution:
                  </p>
                </div>
              )}

              {(hasGivenUp || result === 'incorrect') && solution && (
                <div style={{...cardStyle, background: '#1a1816', border: '1px solid #3d3a37', marginTop: '2rem'}}>
                  <h4 style={{color: '#b0a99f', marginBottom: '1rem'}}>
                    {result === 'incorrect' ? 'Here\'s one correct solution:' : 'Here\'s one valid solution:'}
                  </h4>
                  <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                    {Object.entries(solution).map(([player, value]) => (
                      <span key={player} style={{
                        background: value ? '#769656' : '#cc8c14',
                        color: '#ffffff',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        {player}: {value ? 'T' : 'F'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap'}}>
                {!hasGivenUp && result !== 'correct' && result !== 'incorrect' && (
                  <>
                    <button 
                      style={{
                        ...buttonStyle,
                        opacity: isCheckingAnswer ? 0.7 : 1,
                        cursor: isCheckingAnswer ? 'not-allowed' : 'pointer'
                      }}
                      onClick={handleSubmitGuess}
                      disabled={isCheckingAnswer}
                    >
                      {isCheckingAnswer ? 'Checking...' : 'Submit Guess'}
                    </button>
                    <button 
                      style={{...buttonStyle, background: '#cc8c14'}}
                      onClick={handleGiveUp}
                    >
                      I Give Up
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showLeaveConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#312e2b',
            border: '2px solid #cc8c14',
            borderRadius: '12px',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              ⚠️
            </div>
            
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#ffffff',
              fontFamily: 'Georgia, serif'
            }}>
              Leave Ranked Puzzle?
            </h3>
            
            <div style={{
              background: 'rgba(204, 140, 20, 0.15)',
              border: '1px solid rgba(204, 140, 20, 0.3)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.6',
                marginBottom: '1rem',
                color: '#ffffff'
              }}>
                Are you sure you want to leave this ranked puzzle?
              </p>
              <p style={{
                fontSize: '1rem',
                color: '#cc8c14',
                fontWeight: '600',
                marginBottom: '0'
              }}>
                ⚡ You will receive the <strong>full ELO penalty</strong> for abandoning this puzzle!
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                style={{
                  ...buttonStyle,
                  background: '#cc8c14',
                  color: '#ffffff',
                  fontSize: '1rem',
                  padding: '1rem 2rem',
                  fontWeight: '600'
                }}
                onClick={handleConfirmLeave}
                onMouseEnter={(e) => {
                  e.target.style.background = '#b8791a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#cc8c14';
                }}
              >
                Yes, Leave (Take Penalty)
              </button>
              <button 
                style={{
                  ...buttonStyle,
                  background: '#769656',
                  color: '#ffffff',
                  fontSize: '1rem',
                  padding: '1rem 2rem',
                  fontWeight: '600'
                }}
                onClick={handleCancelLeave}
                onMouseEnter={(e) => {
                  e.target.style.background = '#5d7c3f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#769656';
                }}
              >
                Cancel (Stay)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 