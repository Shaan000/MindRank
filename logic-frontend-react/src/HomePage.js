import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function HomePage() {
  const [samplePuzzle, setSamplePuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to load a cached puzzle first for instant display
    const cachedPuzzle = getCachedSamplePuzzle();
    if (cachedPuzzle) {
      setSamplePuzzle(cachedPuzzle);
    }
    
    // Always generate a fresh puzzle in the background
    generateSamplePuzzle();
    // console.log('💥 New Homepage Loaded');
  }, []);

  // Cache management functions
  const getCachedSamplePuzzle = () => {
    try {
      const cached = localStorage.getItem('samplePuzzleCache');
      if (cached) {
        const { puzzle, timestamp } = JSON.parse(cached);
        // Use cache if it's less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          return puzzle;
        }
      }
    } catch (error) {
      // console.error('Error loading cached puzzle:', error);
    }
    return null;
  };

  const setCachedSamplePuzzle = (puzzle) => {
    try {
      localStorage.setItem('samplePuzzleCache', JSON.stringify({
        puzzle,
        timestamp: Date.now()
      }));
    } catch (error) {
      // console.error('Error caching puzzle:', error);
    }
  };

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
      
      // Transform the data to ensure we have an array of statements
      const transformedData = {
        ...data,
        statement_data: Array.isArray(data.statement_data) 
          ? data.statement_data 
          : typeof data.statement_data === 'object'
            ? Object.values(data.statement_data)
            : data.statements
              ? Object.values(data.statements)
              : []
      };
      
      setSamplePuzzle(transformedData);
      // Cache the new puzzle
      setCachedSamplePuzzle(transformedData);
    } catch (error) {
      // console.error('Error generating sample puzzle:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Chess.com style inline styles
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
        <h2 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '3rem', color: '#ffffff', fontFamily: 'Georgia, serif', textAlign: 'center'}}>Try a Sample Puzzle</h2>
        
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

        <div style={cardStyle}>
          {isLoading ? (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: '#b0a99f'}}>
              Loading...
            </div>
          ) : samplePuzzle ? (
            <>
              <h3 style={{fontSize: '1.375rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif'}}>
                Sample Logic Puzzle
              </h3>
              <div style={{textAlign: 'left'}}>
                <p style={{color: '#b0a99f', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '500'}}>
                  Players: {playerCount}
                </p>
                <p style={{color: '#b0a99f', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '500'}}>
                  Truth-tellers: {samplePuzzle.num_truth_tellers}
                </p>
                <div style={{margin: '1.5rem 0'}}>
                  {samplePuzzle.statement_data.map((statement, index) => {
                    const statementText = typeof statement === 'string' 
                      ? statement 
                      : statement.target 
                        ? `${statement.target} is a ${statement.truth_value ? 'truth-teller' : 'liar'}`
                        : 'Invalid statement format';
                    
                    return (
                      <p key={index} style={statementStyle}>
                        Player {index + 1}: "{statementText}"
                      </p>
                    );
                  })}
                </div>
              </div>
              <button 
                style={buttonStyle}
                onClick={() => navigate('/login?redirectTo=/puzzle')}
              >
                🤔 Try to Solve It!
              </button>
            </>
          ) : (
            <p>Failed to load puzzle. Please try again.</p>
          )}
        </div>
      </div>

      <footer style={footerStyle}>
        <button 
          style={footerButtonStyle}
          onClick={() => navigate('/login?redirectTo=/puzzle?mode=practice')}
        >
          🎯 Practice Mode
        </button>
        <button 
          style={footerButtonStyle}
          onClick={() => navigate('/login?redirectTo=/puzzle?mode=ranked')}
        >
          🏆 Ranked Mode
        </button>
        <button 
          style={footerButtonStyle}
          onClick={() => navigate('/login?redirectTo=/elo')}
        >
          📊 Leaderboard
        </button>
      </footer>
    </div>
  );
}
