import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InstructionsModal from './InstructionsModal';

export default function MasterHardModePage({ user, accessToken, authInitialized }) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isManualInstructions, setIsManualInstructions] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [playerGuesses, setPlayerGuesses] = useState({});
  const [lockedPlayers, setLockedPlayers] = useState(new Set()); // Track locked players
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [result, setResult] = useState(null);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [solution, setSolution] = useState(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [firstTryMessage, setFirstTryMessage] = useState(null);
  const [showFirstTryMessage, setShowFirstTryMessage] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to refresh progress bars by calling backend directly
  const refreshProgressBars = async () => {
    console.log('🔄 Master puzzle completed - progress should be updated in backend');
    
    if (user && accessToken) {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/master/progress-bars`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Master progress refreshed:', data.progress_bars);
        }
      } catch (error) {
        console.error('❌ Error refreshing master progress:', error);
      }
    }
  };

  useEffect(() => {
    // Check if we should show instructions
    const skipInstructions = localStorage.getItem('skipMasterHardInstructions') === 'true';
    if (!skipInstructions) {
      setIsManualInstructions(false);
      setShowInstructions(true);
      // Don't generate puzzle yet - wait for instructions to close
    } else {
      // Skip instructions and generate puzzle immediately
      generateNewPuzzle();
    }
  }, []);

  const generateNewPuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setHasGivenUp(false);
      setSolution(null);
      setPlayerGuesses({});
      setLockedPlayers(new Set()); // Reset locked players
      setHasAttempted(false);
      setFirstTryMessage(null);
      setShowFirstTryMessage(false);
      
      // Random number of players between 4-7
      const playerCount = Math.floor(Math.random() * 4) + 4; // 4-7 players
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('🔥 Generating Master Hard puzzle...');
      
      const response = await fetch(`${apiUrl}/puzzle/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'hard',
          players: playerCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate puzzle');
      }

      const data = await response.json();
      console.log('🔥 Master Hard puzzle data received:', data);
      setPuzzle(data);
      
      // Initialize player guesses
      const initialGuesses = {};
      for (let i = 0; i < playerCount; i++) {
        initialGuesses[String.fromCharCode(65 + i)] = null; // A, B, C, D, etc.
      }
      setPlayerGuesses(initialGuesses);
    } catch (err) {
      console.error('❌ Error generating Master Hard puzzle:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstructionsClose = () => {
    setShowInstructions(false);
    // Always generate puzzle after closing instructions, regardless of how they were closed
    if (!puzzle) {
      generateNewPuzzle();
    }
  };

  const handleShowInstructions = () => {
    setIsManualInstructions(true);
    setShowInstructions(true);
  };

  // MASTER MODE KEY DIFFERENCE: Once a player is assigned, they cannot be changed
  const handlePlayerGuessChange = (player, value) => {
    // If player is already locked, prevent any changes
    if (lockedPlayers.has(player)) {
      return; // No changes allowed for locked players
    }
    
    // Set the value and immediately lock the player
    setPlayerGuesses(prev => ({
      ...prev,
      [player]: value
    }));
    
    // Lock this player so they can't be changed
    setLockedPlayers(prev => new Set(prev).add(player));
  };

  // Enhanced format statements function for complex logic modes
  const formatComplexStatements = (statementData) => {
    if (!statementData || typeof statementData !== 'object') {
      return [];
    }

    return Object.entries(statementData).map(([speaker, data]) => {
      if (typeof data === 'string') {
        return `${speaker}: ${data}`;
      }
      
      if (data.mode === 'DIRECT') {
        const claimText = data.claim ? 'Truth-Teller' : 'Liar';
        return `${speaker} says: "${data.target} is a ${claimText}."`;
      }
      
      if (data.mode === 'AND') {
        const c1Text = data.c1 ? 'Truth-Teller' : 'Liar';
        const c2Text = data.c2 ? 'Truth-Teller' : 'Liar';
        return `${speaker} says: "${data.t1} is a ${c1Text} AND ${data.t2} is a ${c2Text}."`;
      }
      
      if (data.mode === 'OR') {
        const c1Text = data.c1 ? 'Truth-Teller' : 'Liar';
        const c2Text = data.c2 ? 'Truth-Teller' : 'Liar';
        return `${speaker} says: "${data.t1} is a ${c1Text} OR ${data.t2} is a ${c2Text}."`;
      }
      
      if (data.mode === 'IF') {
        const condText = data.cond_val ? 'Truth-Teller' : 'Liar';
        const resultText = data.result_val ? 'Truth-Teller' : 'Liar';
        return `${speaker} says: "IF ${data.cond} is a ${condText}, THEN ${data.result} is a ${resultText}."`;
      }
      
      return `${speaker}: ${JSON.stringify(data)}`;
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
      setResult(null);
      setError(null);
      
      console.log('Submitting master hard mode player assignments:', playerGuesses);
      console.log('Puzzle data:', puzzle);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const requestBody = {
        mode: 'hard',
        player_assignments: playerGuesses,
        statement_data: puzzle.statement_data,
        num_truth_tellers: puzzle.num_truth_tellers || puzzle.truth_tellers_count,
        full_statement_data: puzzle.full_statement_data,
        is_first_attempt: !hasAttempted,
        is_master_mode: true // Flag to indicate this is master mode
      };
      
      console.log('Master hard mode request body:', requestBody);
      
      const response = await fetch(`${apiUrl}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to check solution');
      }

      const data = await response.json();
      console.log('Master hard mode check result:', data);
      
      if (data.valid) {
        setResult('correct');
        refreshProgressBars();
        
        if (data.first_try_message) {
          setFirstTryMessage(data.first_try_message);
          setShowFirstTryMessage(true);
          
          setTimeout(() => {
            setShowFirstTryMessage(false);
            setTimeout(() => setFirstTryMessage(null), 300);
          }, 4000);
        }
      } else {
        setResult('incorrect');
      }
      
      // Master Mode: Always show solution after submission
      await getSolution();
      
      setHasAttempted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  // New function to get solution
  const getSolution = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/puzzle/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'hard',
          statement_data: puzzle.statement_data,
          num_truth_tellers: puzzle.num_truth_tellers || puzzle.truth_tellers_count,
          full_statement_data: puzzle.full_statement_data
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSolution(data.solution);
      } else {
        console.error('Failed to get solution');
      }
    } catch (error) {
      console.error('Error getting solution:', error);
    }
  };

  const handleGiveUp = async () => {
    try {
      setHasGivenUp(true);
      setHasAttempted(true); // Lock all buttons when giving up
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/puzzle/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'hard',
          statement_data: puzzle.statement_data,
          num_truth_tellers: puzzle.num_truth_tellers || puzzle.truth_tellers_count,
          full_statement_data: puzzle.full_statement_data
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSolution(data.solution);
      } else {
        console.error('Failed to get solution');
      }
    } catch (error) {
      console.error('Error getting solution:', error);
    }
  };

  const getPlayerList = () => {
    if (!puzzle) return [];
    
    if (puzzle.full_statement_data && typeof puzzle.full_statement_data === 'object') {
      const players = new Set();
      Object.entries(puzzle.full_statement_data).forEach(([speaker, data]) => {
        players.add(speaker);
        if (data.target) players.add(data.target);
        if (data.t1) players.add(data.t1);
        if (data.t2) players.add(data.t2);
        if (data.cond) players.add(data.cond);
        if (data.result) players.add(data.result);
      });
      return Array.from(players).sort();
    }
    
    if (puzzle.statement_data && typeof puzzle.statement_data === 'object') {
      const players = new Set();
      Object.entries(puzzle.statement_data).forEach(([speaker, claim]) => {
        players.add(speaker);
        if (claim.target) {
          players.add(claim.target);
        }
      });
      return Array.from(players).sort();
    }
    
    const playerCount = puzzle.players || 4;
    return Array.from({ length: playerCount }, (_, i) => String.fromCharCode(65 + i));
  };

  // Styles (same as other Master Mode pages with orange theme)
  const appStyle = {
    minHeight: '100vh',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)', // Orange gradient for Master Mode
    textAlign: 'center',
    padding: '3rem 2rem',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const sectionStyle = {
    background: '#312e2b',
    padding: '3rem 2rem',
    minHeight: 'calc(100vh - 200px)'
  };

  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37',
    maxWidth: '1000px',
    margin: '0 auto'
  };

  const statementStyle = {
    background: '#1a1816',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    border: '1px solid #3d3a37',
    fontSize: '1rem',
    lineHeight: '1.5'
  };

  const playersGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  };

  const playerCardStyle = {
    background: '#1a1816',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #3d3a37',
    textAlign: 'center'
  };

  const playerNameStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
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
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent'
  };

  const lockedButtonStyle = {
    ...guessButtonStyle,
    opacity: 0.7,
    cursor: 'not-allowed',
    position: 'relative'
  };

  const buttonStyle = {
    background: '#ff6b35', // Orange for Master Mode
    color: '#ffffff',
    padding: '0.75rem 2rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  };

  const backButtonStyle = {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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

      {/* Master Mode First Try Message Banner */}
      {firstTryMessage && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
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
        }}>
          🔥 {firstTryMessage}
        </div>
      )}

      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={() => navigate('/app')}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Back to Dashboard
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
        
        <h1 style={titleStyle}>Master Hard Mode 🔥</h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0',
          fontWeight: '400'
        }}>
          IF/THEN Conditionals with Permanent Choices - Working Memory Mastery
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
            <p style={{color: '#b0a99f', fontSize: '1.25rem'}}>Generating master hard puzzle...</p>
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
              Master Logic Puzzle - {getPlayerList().length} Players
              {getTruthTellersCount() !== null && (
                <span style={{ color: '#b0a99f', fontSize: '1rem', fontWeight: '400' }}>
                  {' '}({getTruthTellersCount()} Truth-Tellers)
                </span>
              )}
            </h3>

            {/* Master Mode Warning */}
            <div style={{
              background: '#ff6b35',
              color: '#ffffff',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              textAlign: 'center',
              border: '2px solid #ff8c42'
            }}>
              <strong>🔒 Master Mode: </strong>
              Once you assign True/False to a player, you cannot change it! Think carefully before selecting.
            </div>

            <div style={{marginBottom: '2rem'}}>
              <h4 style={{color: '#b0a99f', marginBottom: '1rem', fontSize: '1.1rem'}}>Statements:</h4>
              {puzzle.full_statement_data ? (
                formatComplexStatements(puzzle.full_statement_data).map((statement, index) => (
                  <div key={index} style={statementStyle}>
                    {statement}
                  </div>
                ))
              ) : puzzle.statements ? (
                Array.isArray(puzzle.statements) ? (
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
                {getPlayerList().map(player => {
                  const isLocked = lockedPlayers.has(player);
                  return (
                    <div key={player} style={playerCardStyle}>
                      <div style={playerNameStyle}>
                        Player {player} {isLocked && '🔒'}
                      </div>
                      <div style={buttonGroupStyle}>
                        <button
                          style={isLocked || hasAttempted ? {
                            ...lockedButtonStyle,
                            background: playerGuesses[player] === true ? '#ff6b35' : '#3d3a37',
                            color: playerGuesses[player] === true ? '#ffffff' : '#b0a99f',
                            border: playerGuesses[player] === true ? '2px solid #ff6b35' : '2px solid #3d3a37'
                          } : {
                            ...guessButtonStyle,
                            background: playerGuesses[player] === true ? '#ff6b35' : '#3d3a37',
                            color: playerGuesses[player] === true ? '#ffffff' : '#b0a99f',
                            border: playerGuesses[player] === true ? '2px solid #ff6b35' : '2px solid #3d3a37'
                          }}
                          onClick={() => !isLocked && !hasAttempted && handlePlayerGuessChange(player, true)}
                          disabled={isLocked || hasAttempted}
                        >
                          T
                        </button>
                        <button
                          style={isLocked || hasAttempted ? {
                            ...lockedButtonStyle,
                            background: playerGuesses[player] === false ? '#cc8c14' : '#3d3a37',
                            color: playerGuesses[player] === false ? '#ffffff' : '#b0a99f',
                            border: playerGuesses[player] === false ? '2px solid #cc8c14' : '2px solid #3d3a37'
                          } : {
                            ...guessButtonStyle,
                            background: playerGuesses[player] === false ? '#cc8c14' : '#3d3a37',
                            color: playerGuesses[player] === false ? '#ffffff' : '#b0a99f',
                            border: playerGuesses[player] === false ? '2px solid #cc8c14' : '2px solid #3d3a37'
                          }}
                          onClick={() => !isLocked && !hasAttempted && handlePlayerGuessChange(player, false)}
                          disabled={isLocked || hasAttempted}
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
                <p style={{margin: 0, color: '#ffffff', fontSize: '1.25rem'}}>🔥 Master solved! Your logic is flawless!</p>
              </div>
            )}

            {result === 'incorrect' && (
              <div style={{...cardStyle, background: '#4a1e1e', border: '1px solid #dc3545', marginTop: '2rem', textAlign: 'center'}}>
                <p style={{margin: 0, color: '#ffffff', fontSize: '1.25rem'}}>❌ Incorrect - no second chances in Master Mode!</p>
              </div>
            )}

            {solution && (
              <div style={{...cardStyle, background: '#1a1816', border: '1px solid #3d3a37', marginTop: '2rem'}}>
                <h4 style={{color: '#b0a99f', marginBottom: '1rem'}}>
                  {result === 'correct' ? 'Your solution was correct! Here it is:' : 'Here\'s one valid solution:'}
                </h4>
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                  {Object.entries(solution).map(([player, value]) => (
                    <span key={player} style={{
                      background: value ? '#ff6b35' : '#cc8c14',
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
              {!hasAttempted && (
                <>
                  <button 
                    style={buttonStyle}
                    onClick={handleSubmitGuess}
                    disabled={isCheckingAnswer}
                  >
                    {isCheckingAnswer ? 'Checking...' : 'Submit Final Answer'}
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
                style={{...buttonStyle, background: '#4a90e2'}}
                onClick={generateNewPuzzle}
              >
                🎲 New Master Puzzle
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <InstructionsModal
          mode="masterHard"
          isOpen={showInstructions}
          onClose={handleInstructionsClose}
          skipKey="skipMasterHardInstructions"
          isManualOpen={isManualInstructions}
        />
      )}
    </div>
  );
} 