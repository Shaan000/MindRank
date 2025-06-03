import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EloPage({ user, accessToken }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user || !accessToken) {
        navigate('/login?redirectTo=/elo');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/elo`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user stats');
        }

        const data = await response.json();
        setUserStats(data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError(error.message || 'Failed to load user statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user, accessToken, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTierInfo = (tier) => {
    const tierColors = {
      'Beginner Thinker': '#8b4513',
      'Intermediate Thinker': '#769656',
      'Advanced Thinker': '#d2691e',
      'Critical Thinker': '#6b46c1',
      'Grandmaster Thinker': '#ffd93d'
    };
    
    return {
      color: tierColors[tier] || '#4a4a4a',
      description: getTierDescription(tier)
    };
  };

  const getTierDescription = (tier) => {
    const descriptions = {
      'Beginner Thinker': 'Learning the basics of logical reasoning',
      'Intermediate Thinker': 'Developing logical thinking skills',
      'Advanced Thinker': 'Strong logical reasoning abilities',
      'Critical Thinker': 'Exceptional analytical thinking',
      'Grandmaster Thinker': 'Master of logical puzzles'
    };
    
    return descriptions[tier] || 'Developing logical skills';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#262421',
        color: '#ffffff',
        fontFamily: 'Georgia, serif',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.125rem', color: '#b0a99f' }}>
            Loading your ELO statistics...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#262421',
        color: '#ffffff',
        fontFamily: 'Georgia, serif',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#d2691e',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Error Loading Stats</h2>
          <p style={{ marginBottom: '1.5rem', color: '#ffffff' }}>{error}</p>
          <button
            onClick={() => navigate('/app')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#769656',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return null;
  }

  const tierInfo = getTierInfo(userStats.tier);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#262421',
      color: '#ffffff',
      fontFamily: 'Georgia, serif',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#312e2b',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#ffffff'
        }}>
          Your ELO Rating
        </h1>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#769656',
          marginBottom: '1rem'
        }}>
          {userStats.elo}
        </div>
        <div style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: tierInfo.color,
          borderRadius: '25px',
          fontSize: '1.125rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          {userStats.tier}
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#b0a99f',
          fontStyle: 'italic'
        }}>
          {tierInfo.description}
        </div>
      </div>

      {/* Match History */}
      <div style={{
        backgroundColor: '#312e2b',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#ffffff'
        }}>
          Recent Match History
        </h2>

        {userStats.matches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#b0a99f'
          }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              No ranked matches yet
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Play some ranked puzzles to see your match history here!
            </div>
            <button
              onClick={() => navigate('/puzzle?mode=ranked')}
              style={{
                marginTop: '1.5rem',
                padding: '1rem 2rem',
                backgroundColor: '#769656',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Play Ranked Match
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {userStats.matches.map((match, index) => (
              <div
                key={match.id || index}
                style={{
                  backgroundColor: '#262421',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: `2px solid ${
                    match.solved ? '#769656' : 
                    match.notes === 'Abandoned puzzle' ? '#dc3545' : 
                    match.notes === 'Gave up' ? '#ffc107' : 
                    '#d2691e'
                  }`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto auto',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  {/* Result Icon */}
                  <div style={{
                    fontSize: '1.5rem',
                    width: '40px',
                    textAlign: 'center'
                  }}>
                    {match.solved ? '🏆' : 
                     match.notes === 'Abandoned puzzle' ? '🚪' : 
                     match.notes === 'Gave up' ? '🏳️' : 
                     '❌'}
                  </div>

                  {/* Match Details */}
                  <div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#ffffff',
                      marginBottom: '0.25rem'
                    }}>
                      {match.solved ? 'WIN' : 
                        (match.notes === 'Abandoned puzzle' ? 'LOSS (left the game)' : 
                         match.notes === 'Gave up' ? 'LOSS (gave up)' : 
                         'LOSS')
                      } • {match.mode} Mode • {match.num_players} Players
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#b0a99f'
                    }}>
                      {formatDate(match.created_at)}
                      {match.notes && match.notes !== 'Abandoned puzzle' && match.notes !== 'Gave up' && (
                        <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>
                          • {match.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    color: '#b0a99f'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>Time</div>
                    <div>{formatTime(match.time_taken)}</div>
                  </div>

                  {/* Elo Before */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    color: '#b0a99f'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>Before</div>
                    <div>{match.elo_before}</div>
                  </div>

                  {/* Elo Change */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: match.elo_delta >= 0 ? '#769656' : '#d2691e',
                    minWidth: '80px'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#b0a99f', fontWeight: 'normal' }}>
                      Change
                    </div>
                    <div>
                      {match.elo_delta >= 0 ? '+' : ''}{match.elo_delta}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ 
        marginTop: '3rem', 
        textAlign: 'center',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => navigate('/app')}
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
          ← Dashboard
        </button>
        
        {userStats.matches.length > 0 && (
          <button
            onClick={() => navigate('/puzzle?mode=ranked')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#769656',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Play Another Ranked Match
          </button>
        )}
      </div>
    </div>
  );
}
