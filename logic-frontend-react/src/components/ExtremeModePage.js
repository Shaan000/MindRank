import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InstructionsModal from './InstructionsModal';

export default function ExtremeModePage({ user, accessToken, authInitialized }) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isManualInstructions, setIsManualInstructions] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [playerGuesses, setPlayerGuesses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [result, setResult] = useState(null);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [solution, setSolution] = useState(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [firstTryMessage, setFirstTryMessage] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const [showFirstTryMessage, setShowFirstTryMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to refresh progress bars by calling backend directly
  const refreshProgressBars = async () => {
    // For authenticated users, we could fetch updated progress here
    // For now, we'll just log that a refresh should happen
    // console.log('🔄 Puzzle completed - progress should be updated in backend');
    
    // If user is authenticated, we could fetch fresh progress data
    if (user && accessToken) {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/practice/progress-bars`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // console.log('✅ Progress refreshed:', data.progress_bars);
          // The dashboard will refresh when user returns
        }
      } catch (error) {
        // console.error('❌ Error refreshing progress:', error);
      }
    }
  };

  useEffect(() => {
    // Check if we should show instructions
    const skipInstructions = localStorage.getItem('skipExtremeInstructions') === 'true';
    if (!skipInstructions) {
      setIsManualInstructions(false);
      setShowInstructions(true);
    } else {
      generateNewPuzzle();
    }
  }, [navigate]);

  const generateNewPuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setHasGivenUp(false);
      setSolution(null);
      setPlayerGuesses({});
      setHasAttempted(false);
      setFirstTryMessage(null);
      setShowFirstTryMessage(false);
      
      // Random number of players between 4-7
      const playerCount = Math.floor(Math.random() * 4) + 4;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/puzzle/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'extreme',
          players: playerCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate puzzle');
      }

      const data = await response.json();
      // console.log('Puzzle data received:', data); // Debug log
      setPuzzle(data);
      
      // Initialize player guesses
      const initialGuesses = {};
      for (let i = 0; i < playerCount; i++) {
        initialGuesses[String.fromCharCode(65 + i)] = null;
      }
      setPlayerGuesses(initialGuesses);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstructionsClose = () => {
    setShowInstructions(false);
    // Only generate new puzzle if this was an automatic showing (first time)
    if (!isManualInstructions) {
      generateNewPuzzle();
    }
  };

  const handleShowInstructions = () => {
    setIsManualInstructions(true);
    setShowInstructions(true);
  };

  const handlePlayerGuessChange = (player, value) => {
    setPlayerGuesses(prev => ({
      ...prev,
      [player]: prev[player] === value ? null : value // Allow deselection by clicking same button
    }));
  };

  // Function to format statements from the backend data structure
  const formatStatements = (statementData) => {
    if (!statementData || typeof statementData !== 'object') {
      return [];
    }

    return Object.entries(statementData).map(([speaker, claim]) => {
      const target = claim.target;
      const truthValue = claim.truth_value;
      const claimText = truthValue ? 'Truth-Teller' : 'Liar';
      return `${speaker} says: "${target} is a ${claimText}."`;
    });
  };

  // Function to get the number of truth tellers from puzzle data
  const getTruthTellersCount = () => {
    if (puzzle.truth_tellers_count !== undefined) {
      return puzzle.truth_tellers_count;
    }
    if (puzzle.num_truth_tellers !== undefined) {
      return puzzle.num_truth_tellers;
    }
    if (puzzle.solution && typeof puzzle.solution === 'object') {
      return Object.values(puzzle.solution).filter(v => v === true).length;
    }
    return null;
  };

  const handleSubmitGuess = async () => {
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
      setResult(null); // Clear previous result
      setError(null); // Clear previous errors
      
      // Debug: Log what we're sending
      // console.log('Submitting player assignments:', playerGuesses);
      // console.log('Puzzle data:', puzzle);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Send complete puzzle data needed by backend
      const requestBody = {
        mode: 'extreme',
        player_assignments: playerGuesses,
        statement_data: puzzle.statement_data,
        num_truth_tellers: puzzle.num_truth_tellers || puzzle.truth_tellers_count,
        full_statement_data: puzzle.full_statement_data, // Include for complex modes
        is_first_attempt: !hasAttempted
      };
      
      // console.log('Request body:', requestBody);
      // console.log('API URL:', `${apiUrl}/puzzle/check`);
      
      const response = await fetch(`${apiUrl}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(requestBody)
      });

      // console.log('Response status:', response.status);
      // console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Failed to check answer';
        try {
          const responseText = await response.text();
          // console.log('Full error response text:', responseText);
          const errorData = JSON.parse(responseText);
          // console.log('Error response data:', errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // console.log('Could not parse error response:', parseError);
          // If we can't parse the response, show more details
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      // console.log('Backend response:', result); // Debug log
      
      if (result.valid) {
        setResult('correct');
        
        // Refresh progress bars if function is available (backend will handle progress tracking)
        if (refreshProgressBars) {
          // console.log('🔄 Refreshing progress bars after successful puzzle completion');
          refreshProgressBars();
        }
        
        // Check for unlock messages from backend
        if (result.unlock_message) {
          alert(result.unlock_message);
        }
        
        // Check for first-try success message from backend
        if (result.first_try_message) {
          setFirstTryMessage(result.first_try_message);
          setShowFirstTryMessage(true);
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setShowFirstTryMessage(false);
          }, 5000);
        }
      } else {
        setResult('incorrect');
        // Don't block further submissions - user can try again
      }
    } catch (err) {
      // console.error('Answer check error:', err); // Log full error for debugging
      setError(err.message || 'Failed to check answer');
    } finally {
      setIsCheckingAnswer(false);
      setHasAttempted(true);
    }
  };

  const handleGiveUp = async () => {
    try {
      setHasGivenUp(true);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Send complete puzzle data needed by backend
      const requestBody = {
        mode: 'extreme',
        statement_data: puzzle.statement_data,
        num_truth_tellers: puzzle.num_truth_tellers || puzzle.truth_tellers_count,
        full_statement_data: puzzle.full_statement_data
      };
      
      const response = await fetch(`${apiUrl}/puzzle/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to get solution');
      }

      const solutionData = await response.json();
      setSolution(solutionData.solution);
    } catch (err) {
      // console.error('Get solution error:', err); // Log full error for debugging
      setError('Failed to get solution');
    }
  };

  // Chess.com style matching the existing theme
  const appStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #8e44ad 0%, #6c3483 100%)',
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

  const statementStyle = {
    background: '#1a1816',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5',
    borderLeft: '3px solid #8e44ad',
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

  const buttonStyle = {
    background: '#8e44ad',
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

  const getPlayerList = () => {
    if (!puzzle) return [];
    return Object.keys(playerGuesses);
  };

  // First-try message banner styles
  const firstTryBannerStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: '#ffffff',
    padding: '1rem 2rem',
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: '600',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: showFirstTryMessage ? 'translateY(0)' : 'translateY(-100%)',
    opacity: showFirstTryMessage ? 1 : 0,
    transition: 'all 0.5s ease-in-out'
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

      {/* First-try success message banner */}
      {firstTryMessage && (
        <div style={firstTryBannerStyle}>
          {firstTryMessage}
        </div>
      )}

      <InstructionsModal 
        mode="extreme"
        isOpen={showInstructions}
        onClose={handleInstructionsClose}
        skipKey="skipExtremeInstructions"
        isManualOpen={isManualInstructions}
      />

      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={() => navigate('/app', { state: { showPracticeSubTiles: true } })}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Back to Modes
        </button>

        <button 
          style={{
            ...backButtonStyle,
            right: '2rem',
            left: 'auto'
          }}
          onClick={handleShowInstructions}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          📖 Instructions
        </button>
        
        <h1 style={titleStyle}>Extreme Mode</h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0',
          fontWeight: '400'
        }}>
          Advanced Logic & Self-Reference
        </p>
      </div>

      <div style={sectionStyle}>
        {error && (
          <div style={{...cardStyle, background: '#8b2635', border: '1px solid #d73a49', marginBottom: '2rem'}}>
            <p style={{margin: 0, color: '#ffffff'}}>Error: {error}</p>
          </div>
        )}

        {isLoading ? (
          <div style={{...cardStyle, textAlign: 'center'}}>
            <p style={{color: '#b0a99f', fontSize: '1.25rem'}}>Generating puzzle...</p>
          </div>
        ) : puzzle ? (
          <div style={cardStyle}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#ffffff',
              marginBottom: '1.5rem',
              fontWeight: '600',
              fontFamily: 'Georgia, serif',
              textAlign: 'center'
            }}>
              Logic Puzzle - {getPlayerList().length} Players
              {getTruthTellersCount() !== null && (
                <span style={{ color: '#b0a99f', fontSize: '1rem', fontWeight: '400' }}>
                  {' '}({getTruthTellersCount()} Truth-Tellers)
                </span>
              )}
            </h3>

            <div style={{marginBottom: '2rem'}}>
              <h4 style={{color: '#b0a99f', marginBottom: '1rem', fontSize: '1.1rem'}}>Statements:</h4>
              {puzzle.statements ? (
                typeof puzzle.statements === 'object' && !Array.isArray(puzzle.statements) ? (
                  Object.entries(puzzle.statements).map(([speaker, statementText], index) => (
                    <div key={index} style={statementStyle}>
                      {speaker} says: "{statementText}"
                    </div>
                  ))
                ) : Array.isArray(puzzle.statements) ? (
                  puzzle.statements.map((statement, index) => (
                    <div key={index} style={statementStyle}>
                      {typeof statement === 'string' ? statement : `Statement ${index + 1}: "${statement}"`}
                    </div>
                  ))
                ) : (
                  <div style={statementStyle}>
                    {typeof puzzle.statements === 'string' ? puzzle.statements : JSON.stringify(puzzle.statements)}
                  </div>
                )
              ) : puzzle.statement_data ? (
                typeof puzzle.statement_data === 'object' && !Array.isArray(puzzle.statement_data) ? (
                  formatStatements(puzzle.statement_data).map((statement, index) => (
                    <div key={index} style={statementStyle}>
                      {statement}
                    </div>
                  ))
                ) : Array.isArray(puzzle.statement_data) ? (
                  puzzle.statement_data.map((statement, index) => (
                    <div key={index} style={statementStyle}>
                      {typeof statement === 'string' ? statement : `Player ${index + 1}: "${statement}"`}
                    </div>
                  ))
                ) : (
                  <div style={statementStyle}>
                    {typeof puzzle.statement_data === 'string' ? puzzle.statement_data : JSON.stringify(puzzle.statement_data)}
                  </div>
                )
              ) : (
                <div style={statementStyle}>
                  No statements available. Puzzle data: {JSON.stringify(puzzle)}
                </div>
              )}
            </div>

            <div>
              <h4 style={{color: '#b0a99f', marginBottom: '1rem', fontSize: '1.1rem'}}>
                Assign each player as Truth-Teller (T) or Liar (F):
              </h4>
              <div style={playersGridStyle}>
                {getPlayerList().map(player => (
                  <div key={player} style={playerCardStyle}>
                    <div style={playerNameStyle}>Player {player}</div>
                    <div style={buttonGroupStyle}>
                      <button
                        style={{
                          ...guessButtonStyle,
                          background: playerGuesses[player] === true ? '#8e44ad' : '#3d3a37',
                          color: playerGuesses[player] === true ? '#ffffff' : '#b0a99f',
                          border: playerGuesses[player] === true ? '2px solid #8e44ad' : '2px solid #3d3a37'
                        }}
                        onClick={() => handlePlayerGuessChange(player, true)}
                      >
                        T
                      </button>
                      <button
                        style={{
                          ...guessButtonStyle,
                          background: playerGuesses[player] === false ? '#cc8c14' : '#3d3a37',
                          color: playerGuesses[player] === false ? '#ffffff' : '#b0a99f',
                          border: playerGuesses[player] === false ? '2px solid #cc8c14' : '2px solid #3d3a37'
                        }}
                        onClick={() => handlePlayerGuessChange(player, false)}
                      >
                        F
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result === 'correct' && (
              <div style={{...cardStyle, background: '#1e4a2a', border: '1px solid #28a745', marginTop: '2rem', textAlign: 'center'}}>
                <p style={{margin: 0, color: '#ffffff', fontSize: '1.25rem'}}>🎉 You solved it! Master level achieved!</p>
              </div>
            )}

            {result === 'incorrect' && (
              <div style={{...cardStyle, background: '#4a1e1e', border: '1px solid #dc3545', marginTop: '2rem', textAlign: 'center'}}>
                <p style={{margin: 0, color: '#ffffff', fontSize: '1.25rem'}}>❌ Incorrect, try again!</p>
              </div>
            )}

            {hasGivenUp && solution && (
              <div style={{...cardStyle, background: '#1a1816', border: '1px solid #3d3a37', marginTop: '2rem'}}>
                <h4 style={{color: '#b0a99f', marginBottom: '1rem'}}>Here's one valid solution:</h4>
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                  {Object.entries(solution).map(([player, value]) => (
                    <span key={player} style={{
                      background: value ? '#8e44ad' : '#cc8c14',
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

            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem'}}>
              {!hasGivenUp && result !== 'correct' && (
                <>
                  <button 
                    style={buttonStyle}
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
              
              <button 
                style={{...buttonStyle, background: '#769656'}}
                onClick={generateNewPuzzle}
              >
                🎲 New Puzzle
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 