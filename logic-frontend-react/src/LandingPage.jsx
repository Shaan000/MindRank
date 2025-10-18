// 🔒 FROZEN LANDING PAGE v1.0 - DO NOT MODIFY
// This component is protected by snapshot tests and Git tags
// Any changes will fail the build - modify only with extreme caution

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function LandingPage() {
  const [samplePuzzle, setSamplePuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [isSolving, setIsSolving] = useState(false);
  const [playerGuesses, setPlayerGuesses] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [solution, setSolution] = useState(null);
  const [hasSolvedOnce, setHasSolvedOnce] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    generateSamplePuzzle();
    // console.log('💥 New Landing Page Loaded - v1.0');
  }, []);

  const generateSamplePuzzle = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/puzzle/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'easy',
          players: playerCount
        })
      });

      if (!response.ok) throw new Error('Failed to generate puzzle');
      const data = await response.json();
      // console.log('Puzzle data:', data);
      
      // Keep statement_data as object to preserve alphabetical keys (A, B, C, etc.)
      setSamplePuzzle(data);
      // Reset solving state when generating new puzzle
      setIsSolving(false);
      setPlayerGuesses({});
      setIsSubmitted(false);
      setSubmissionResult(null);
      setHasGivenUp(false);
      setSolution(null);
      setFeedbackMessage('');
    } catch (error) {
      // console.error('Error generating sample puzzle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSolving = () => {
    setIsSolving(true);
    // Initialize player guesses
    if (samplePuzzle && samplePuzzle.statement_data) {
      const initialGuesses = {};
      const players = Object.keys(samplePuzzle.statement_data);
      players.forEach(player => {
        initialGuesses[player] = null; // null means no selection
      });
      setPlayerGuesses(initialGuesses);
    }
  };

  const handlePlayerGuess = (player, isTrue) => {
    setPlayerGuesses(prev => ({
      ...prev,
      [player]: prev[player] === isTrue ? null : isTrue // Toggle or deselect
    }));
    
    // Clear any validation messages when user changes selections
    if (feedbackMessage && !submissionResult) {
      setFeedbackMessage('');
      setSubmissionResult(null);
    }
  };

  const handleSubmitGuess = async () => {
    // Check if all players have values selected
    const hasAllValues = Object.values(playerGuesses).every(guess => guess !== null);
    
    if (!hasAllValues) {
      setFeedbackMessage('Please select Truth-Teller (T) or Liar (F) for all players before submitting.');
      return;
    }

    try {
      setIsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/puzzle/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'easy',
          statement_data: samplePuzzle.statement_data,
          guess: playerGuesses,
          num_truth_tellers: samplePuzzle.num_truth_tellers
        })
      });

      if (!response.ok) throw new Error('Failed to check solution');
      const result = await response.json();
      
      setSubmissionResult(result);
      
      // Only freeze the puzzle if the answer is correct
      if (result.valid) {
        setIsSubmitted(true);
        setHasSolvedOnce(true);
        setFeedbackMessage('Correct! Well done!');
      } else {
        // For incorrect answers, allow retrying - don't set isSubmitted or hasSolvedOnce
        setFeedbackMessage('Incorrect. Try again or give up to see the solution.');
      }
    } catch (error) {
      // console.error('Error checking solution:', error);
      setFeedbackMessage('Error checking solution. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiveUp = () => {
    setHasGivenUp(true);
    setHasSolvedOnce(true);
    setSolution(samplePuzzle.solution);
    setFeedbackMessage('Solution revealed below.');
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });
      if (error) throw error;
    } catch (error) {
      // console.error('Error signing in with Google:', error);
      alert('Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chess.com style inline styles - FROZEN v1.0
  const homepageStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const heroStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '6rem 2rem',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '3.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const subtitleStyle = {
    fontSize: '1.25rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '3rem',
    fontWeight: '400'
  };

  const googleButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    background: '#ffffff',
    color: '#262421',
    padding: '0.875rem 2rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
    maxWidth: '600px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 0, 0.3)',
    border: '1px solid #00ff00'
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

  const buttonStyle = {
    background: '#cc8c14',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '2rem',
    width: '100%'
  };

  const footerStyle = {
    background: '#1a1816',
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem',
    borderTop: '1px solid #3d3a37',
    gap: '1rem'
  };

  const footerButtonStyle = {
    padding: '1rem 1.5rem',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: '#b0a99f',
    background: 'transparent',
    borderRadius: '6px'
  };

  // New styles for sample-solve UI
  const playerRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: '#1a1816',
    borderRadius: '8px'
  };

  const playerTileStyle = {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#769656',
    color: 'white',
    fontWeight: '700',
    fontSize: '1.25rem',
    borderRadius: '6px',
    fontFamily: 'Georgia, serif'
  };

  const toggleButtonStyle = (isActive, isTrue) => ({
    padding: '0.5rem 1rem',
    border: '1px solid #3d3a37',
    borderRadius: '6px',
    background: isActive ? (isTrue ? '#769656' : '#cc4125') : '#2a2824',
    color: isActive ? 'white' : '#b0a99f',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '40px',
    transition: 'all 0.2s ease',
    fontFamily: 'Georgia, serif'
  });

  const submitButtonStyle = {
    background: '#cc8c14',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    marginRight: '1rem',
    fontFamily: 'Georgia, serif'
  };

  const giveUpButtonStyle = {
    background: 'transparent',
    color: '#b0a99f',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '2px solid #3d3a37',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif'
  };

  const feedbackStyle = {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center',
    fontWeight: '600',
    background: submissionResult?.valid ? '#2d5a2d' : (submissionResult === null ? '#5a4a2d' : '#5a2d2d'),
    color: submissionResult?.valid ? '#90ee90' : (submissionResult === null ? '#ffc107' : '#ff9999'),
    border: `1px solid ${submissionResult?.valid ? '#4a7c4a' : (submissionResult === null ? '#7c6a4a' : '#7c4a4a')}`
  };

  const solutionCardStyle = {
    background: '#1a1816',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '1rem',
    border: '1px solid #3d3a37'
  };

  return (
    <div style={homepageStyle}>
      <div style={heroStyle}>
        <h1 style={titleStyle}>Welcome to MindRank</h1>
        <p style={subtitleStyle}>Master the Art of Logic Puzzles</p>
        
        <button 
          style={googleButtonStyle}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google"
            style={{width: '20px', height: '20px'}}
          />
          Continue with Google
        </button>
      </div>

      <div style={sectionStyle}>
        <h2 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '3rem', color: '#ffffff', fontFamily: 'Georgia, serif', textAlign: 'center'}}>Try a Sample Puzzle — Find One Logically Possible Solution</h2>
        
        {!hasSolvedOnce && !isSolving && (
          <>
            <div style={{margin: '2rem auto', textAlign: 'center', maxWidth: '400px'}}>
              <label style={{display: 'block', marginBottom: '1rem', fontSize: '1rem', color: '#b0a99f', fontWeight: '500'}}>
                Number of Players: {playerCount}
              </label>
              <input
                type="range"
                min="3"
                max="8"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                style={{width: '100%', height: '6px', borderRadius: '3px', background: '#1a1816'}}
              />
            </div>

            <div style={{textAlign: 'center'}}>
              <button 
                style={{...buttonStyle, background: '#769656', width: 'auto'}}
                onClick={generateSamplePuzzle}
                disabled={isLoading}
              >
                🎲 Generate New Puzzle
              </button>
            </div>
          </>
        )}

        <div style={cardStyle}>
          {isLoading ? (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: '#b0a99f'}}>
              Loading...
            </div>
          ) : samplePuzzle ? (
            <>
              <h3 style={{fontSize: '1.375rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif'}}>
                Puzzle ({samplePuzzle.num_players} players, {samplePuzzle.num_truth_tellers} truth-tellers)
              </h3>

              {feedbackMessage && (
                <div style={feedbackStyle}>
                  {submissionResult?.valid ? '✅' : (submissionResult === null ? '⚠️' : (feedbackMessage.includes('Error') ? '⚠️' : '❌'))} {feedbackMessage}
                </div>
              )}

              <div style={{textAlign: 'left'}}>
                <div style={{margin: '1.5rem 0'}}>
                  {samplePuzzle.statement_data && Object.entries(samplePuzzle.statement_data).map(([player, statement], index) => {
                    const statementText = typeof statement === 'string' 
                      ? statement 
                      : statement.target 
                        ? `${statement.target} is a ${statement.truth_value ? 'Truth-Teller' : 'Liar'}`
                        : 'Invalid statement format';
                    
                    return (
                      <p key={index} style={statementStyle}>
                        Player {player}: "{statementText}"
                      </p>
                    );
                  })}
                </div>
              </div>

              {!isSolving && !hasSolvedOnce && (
                <button 
                  style={buttonStyle}
                  onClick={handleStartSolving}
                >
                  Try to Solve It!
                </button>
              )}

              {isSolving && (
                <>
                  <div style={{marginTop: '2rem'}}>
                    <h4 style={{color: '#ffffff', marginBottom: '1rem', fontFamily: 'Georgia, serif', fontSize: '1.125rem'}}>
                      Make your guesses:
                    </h4>
                    {Object.keys(samplePuzzle.statement_data).map(player => (
                      <div key={player} style={playerRowStyle}>
                        <div style={playerTileStyle}>{player}</div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button
                            style={toggleButtonStyle(playerGuesses[player] === true, true)}
                            onClick={() => handlePlayerGuess(player, true)}
                            disabled={isSubmitted || hasGivenUp}
                          >
                            T
                          </button>
                          <button
                            style={toggleButtonStyle(playerGuesses[player] === false, false)}
                            onClick={() => handlePlayerGuess(player, false)}
                            disabled={isSubmitted || hasGivenUp}
                          >
                            F
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isSubmitted && !hasGivenUp && (
                    <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'center'}}>
                      <button 
                        style={submitButtonStyle}
                        onClick={handleSubmitGuess}
                        disabled={isLoading}
                      >
                        Submit Guess
                      </button>
                      <button 
                        style={giveUpButtonStyle}
                        onClick={handleGiveUp}
                      >
                        I Give Up
                      </button>
                    </div>
                  )}
                </>
              )}

              {hasGivenUp && solution && (
                <div style={solutionCardStyle}>
                  <h4 style={{color: '#ffffff', marginBottom: '1rem', fontFamily: 'Georgia, serif', fontSize: '1.125rem'}}>
                    One Possible Solution:
                  </h4>
                  {Object.entries(solution).map(([player, isTruthTeller]) => (
                    <p key={player} style={{color: '#e5e0dc', marginBottom: '0.5rem', fontFamily: 'Georgia, serif'}}>
                      {player} is a {isTruthTeller ? 'Truth-Teller' : 'Liar'}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>Failed to load puzzle. Please try again.</p>
          )}
        </div>
      </div>

      <footer style={footerStyle}>
        <button 
          style={footerButtonStyle}
          onClick={() => navigate('/practice-signin')}
        >
          🎯 Practice Mode
        </button>
        <button 
          style={footerButtonStyle}
          onClick={() => navigate('/ranked-signin')}
        >
          🏆 Ranked Mode
        </button>
        <button 
          style={footerButtonStyle}
          onClick={() => navigate('/leaderboard-signin')}
        >
          📊 Leaderboard
        </button>
      </footer>
    </div>
  );
} 