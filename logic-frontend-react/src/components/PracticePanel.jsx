import { useState, useEffect } from 'react';

export default function PracticePanel({ user, onBack }) {
  const [difficulty, setDifficulty] = useState('easy');
  const [playerCount, setPlayerCount] = useState(4);
  const [puzzle, setPuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    maxWidth: '600px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37'
  };

  const buttonStyle = {
    background: '#769656',
    color: '#ffffff',
    padding: '0.875rem 2rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    marginTop: '1rem'
  };

  const controlStyle = {
    marginBottom: '2rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '1rem',
    fontSize: '1rem',
    color: '#b0a99f',
    fontWeight: '500'
  };

  const selectStyle = {
    background: '#1a1816',
    color: '#ffffff',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #3d3a37',
    fontSize: '1rem',
    width: '100%',
    cursor: 'pointer'
  };

  const rangeStyle = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#1a1816',
    appearance: 'none',
    cursor: 'pointer'
  };

  const puzzleStyle = {
    background: '#1a1816',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '1rem',
    border: '1px solid #3d3a37'
  };

  const statementStyle = {
    color: '#e5e0dc',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: '#262421',
    borderRadius: '6px',
    border: '1px solid #3d3a37',
    fontFamily: 'Georgia, serif',
    fontSize: '1rem',
    lineHeight: '1.5'
  };

  const generatePuzzle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔍 PracticePanel: Generating ${difficulty} puzzle with ${playerCount} players`);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/puzzle/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: difficulty,
          players: playerCount
        })
      });

      console.log(`📡 PracticePanel: Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ PracticePanel: Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to generate puzzle');
      }

      const data = await response.json();
      console.log('✅ PracticePanel: Puzzle data received:', data);
      setPuzzle(data);
    } catch (err) {
      console.error('🚨 PracticePanel: Full error details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={appStyle}>
      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={titleStyle}>Practice Mode</h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0',
          fontWeight: '400'
        }}>
          Train Your Logic Skills
        </p>
      </div>

      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h3 style={{
            fontSize: '1.375rem',
            color: '#ffffff',
            marginBottom: '2rem',
            fontWeight: '600',
            fontFamily: 'Georgia, serif',
            textAlign: 'center'
          }}>
            Puzzle Configuration
          </h3>

          <div style={controlStyle}>
            <label style={labelStyle}>
              Difficulty Level
            </label>
            <select 
              style={selectStyle}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>

          <div style={controlStyle}>
            <label style={labelStyle}>
              Number of Players: {playerCount}
            </label>
            <input
              type="range"
              min="3"
              max="8"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              style={rangeStyle}
            />
          </div>

          <button 
            style={{
              ...buttonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onClick={generatePuzzle}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = '#5d7c3f';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.background = '#769656';
              }
            }}
          >
            {isLoading ? 'Generating Puzzle...' : '🎲 Generate Puzzle'}
          </button>

          {error && (
            <div style={{
              background: '#5a2d2d',
              color: '#ff9999',
              padding: '1rem',
              borderRadius: '6px',
              marginTop: '1rem',
              border: '1px solid #7c4a4a',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          {puzzle && (
            <div style={puzzleStyle}>
              <h4 style={{
                color: '#ffffff',
                marginBottom: '1.5rem',
                fontFamily: 'Georgia, serif',
                fontSize: '1.125rem',
                textAlign: 'center'
              }}>
                Generated Puzzle ({puzzle.num_players} players, {puzzle.num_truth_tellers} truth-tellers)
              </h4>

              <div style={{textAlign: 'left'}}>
                {puzzle.statements && Object.entries(puzzle.statements).map(([player, statementText], index) => (
                  <div key={index} style={statementStyle}>
                    <strong>Player {player}:</strong> "{statementText}"
                  </div>
                ))}
                
                {/* Fallback for old format */}
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

              <div style={{
                textAlign: 'center',
                marginTop: '2rem',
                color: '#b0a99f',
                fontSize: '0.875rem'
              }}>
                💡 Analyze the statements to determine who is telling the truth!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 