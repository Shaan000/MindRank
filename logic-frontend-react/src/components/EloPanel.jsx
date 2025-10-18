import { useState, useEffect } from 'react';

export default function EloPanel({ user, eloData: initialEloData, onBack, accessToken }) {
  const [eloData, setEloData] = useState(initialEloData);
  const [isLoading, setIsLoading] = useState(!initialEloData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [matchPage, setMatchPage] = useState(0); // For pagination (0 = first page)

  const MATCHES_PER_PAGE = 5;

  useEffect(() => {
    if (!initialEloData) {
      fetchEloData();
    }
  }, [initialEloData]);

  const fetchEloData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!accessToken) {
        setError('Authentication token not available');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // console.log('🔍 EloPanel: Fetching ELO data from:', `${apiUrl}/user/elo`);
      
      const response = await fetch(`${apiUrl}/user/elo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch ELO data');
      }

      const data = await response.json();
      // console.log('✅ EloPanel: ELO data received:', data);
      setEloData(data);
      // Reset to first page to show most recent matches
      setMatchPage(0);
    } catch (err) {
      setError(err.message);
      // console.error('❌ EloPanel: Error fetching ELO:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEloData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      if (!accessToken) {
        setError('Authentication token not available');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Add timestamp for cache busting
      const timestamp = Date.now();
      // console.log('🔄 EloPanel: Refreshing ELO data from:', `${apiUrl}/user/elo?t=${timestamp}`);
      
      const response = await fetch(`${apiUrl}/user/elo?t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to refresh ELO data');
      }

      const data = await response.json();
      // console.log('✅ EloPanel: Refreshed ELO data received:', data);
      
      // Log details about the matches for debugging
      if (data.matches && data.matches.length > 0) {
        // console.log(`📊 EloPanel: Received ${data.matches.length} matches`);
        // console.log('🕐 EloPanel: Most recent match:', data.matches[0]?.created_at);
        // console.log('🕐 EloPanel: Oldest match:', data.matches[data.matches.length - 1]?.created_at);
      } else {
        // console.log('📊 EloPanel: No matches received');
      }
      
      setEloData(data);
      // Reset to first page to show most recent matches
      setMatchPage(0);
    } catch (err) {
      setError(err.message);
      // console.error('❌ EloPanel: Error refreshing ELO:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const getTierInfo = (elo) => {
    if (elo >= 2000) return { 
      name: 'Grandmaster Thinker', 
      color: '#FFD700',
      description: 'Elite puzzle solver - you are among the best!'
    };
    if (elo >= 1500) return { 
      name: 'Critical Thinker', 
      color: '#C0C0C0',
      description: 'Exceptional logical reasoning skills'
    };
    if (elo >= 1000) return { 
      name: 'Advanced Thinker', 
      color: '#CD7F32',
      description: 'Advanced puzzle solving abilities'
    };
    if (elo >= 500) return { 
      name: 'Intermediate Thinker', 
      color: '#769656',
      description: 'Strong logical thinking'
    };
    return { 
      name: 'Beginner Thinker', 
      color: '#b0a99f',
      description: 'Building foundational logic skills'
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div style={appStyle}>
        <div style={headerStyle}>
          <button style={backButtonStyle} onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h1 style={titleStyle}>ELO Rating</h1>
        </div>
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{textAlign: 'center', color: '#b0a99f', padding: '2rem'}}>
              Loading your ELO data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={appStyle}>
        <div style={headerStyle}>
          <button style={backButtonStyle} onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h1 style={titleStyle}>ELO Rating</h1>
        </div>
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{
              background: '#5a2d2d',
              color: '#ff9999',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #7c4a4a',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
            <button 
              style={{
                background: '#769656',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '1rem',
                width: '100%'
              }}
              onClick={fetchEloData}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tierInfo = eloData ? getTierInfo(eloData.elo) : null;

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
        
        <h1 style={titleStyle}>Your ELO Rating</h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0',
          fontWeight: '400'
        }}>
          Performance Statistics
        </p>
      </div>

      <div style={sectionStyle}>
        {eloData && (
          <>
            {/* Main ELO Card */}
            <div style={{
              ...cardStyle,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #262421 0%, #1a1816 100%)',
              border: `2px solid ${tierInfo.color}`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px ${tierInfo.color}20`
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                color: tierInfo.color
              }}>
                ⚡
              </div>
              
              <h2 style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: tierInfo.color,
                marginBottom: '0.5rem',
                fontFamily: 'Georgia, serif',
                textShadow: `0 2px 4px ${tierInfo.color}40`
              }}>
                {eloData.elo}
              </h2>
              
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: tierInfo.color,
                marginBottom: '1rem',
                fontFamily: 'Georgia, serif'
              }}>
                {tierInfo.name}
              </h3>
              
              <p style={{
                color: '#b0a99f',
                fontSize: '1rem',
                marginBottom: '2rem'
              }}>
                {tierInfo.description}
              </p>

              {/* Progress to next tier */}
              {eloData.elo < 2000 && (
                (() => {
                  // Calculate progress to next tier based on current tier
                  let currentMin, nextThreshold, progressPercent, pointsNeeded;
                  
                  if (eloData.elo >= 1500) {
                    // Critical Thinker -> Grandmaster Thinker
                    currentMin = 1500;
                    nextThreshold = 2000;
                  } else if (eloData.elo >= 1000) {
                    // Advanced Thinker -> Critical Thinker
                    currentMin = 1000;
                    nextThreshold = 1500;
                  } else if (eloData.elo >= 500) {
                    // Intermediate Thinker -> Advanced Thinker
                    currentMin = 500;
                    nextThreshold = 1000;
                  } else {
                    // Beginner Thinker -> Intermediate Thinker
                    currentMin = 0;
                    nextThreshold = 500;
                  }
                  
                  progressPercent = ((eloData.elo - currentMin) / (nextThreshold - currentMin)) * 100;
                  pointsNeeded = nextThreshold - eloData.elo;
                  
                  return (
                    <div style={{
                      background: '#1a1816',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #3d3a37'
                    }}>
                      <p style={{
                        color: '#b0a99f',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        Progress to next tier:
                      </p>
                      <div style={{
                        background: '#312e2b',
                        height: '8px',
                        borderRadius: '4px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: tierInfo.color,
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <p style={{
                        color: '#b0a99f',
                        fontSize: '0.75rem',
                        marginTop: '0.5rem',
                        marginBottom: '0'
                      }}>
                        {pointsNeeded} points to next tier
                      </p>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Match History */}
            <div style={cardStyle}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.375rem',
                  color: '#ffffff',
                  margin: '0',
                  fontWeight: '600',
                  fontFamily: 'Georgia, serif'
                }}>
                  Recent Match History
                </h3>
                <button
                  onClick={refreshEloData}
                  disabled={isRefreshing}
                  style={{
                    background: isRefreshing ? '#5d7c3f' : '#769656',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: isRefreshing ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isRefreshing) {
                      e.target.style.background = '#5d7c3f';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRefreshing) {
                      e.target.style.background = '#769656';
                    }
                  }}
                >
                  {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
                </button>
              </div>

              {eloData.matches && eloData.matches.length > 0 ? (
                <div>
                  {/* Match entries for current page */}
                  {eloData.matches
                    .slice(matchPage * MATCHES_PER_PAGE, (matchPage + 1) * MATCHES_PER_PAGE)
                    .map((match, index) => {
                      const date = new Date(match.created_at);
                      const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      const isWin = match.solved;
                      const eloChange = match.elo_after - match.elo_before;
                      const timeInSeconds = match.time_taken;
                      const minutes = Math.floor(timeInSeconds / 60);
                      const seconds = timeInSeconds % 60;
                      const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

                      return (
                        <div key={match.id || index} style={{
                          padding: '1.25rem',
                          marginBottom: '1rem',
                          background: '#1a1816',
                          borderRadius: '8px',
                          border: `2px solid ${
                            isWin ? '#769656' : 
                            match.notes === 'Abandoned puzzle' ? '#dc3545' : 
                            match.notes === 'Gave up' ? '#ffc107' : 
                            '#d2691e'
                          }`,
                          position: 'relative'
                        }}>
                          {/* Header row */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <span style={{
                                fontSize: '1.5rem'
                              }}>
                                {isWin ? '🏆' : 
                                 match.notes === 'Abandoned puzzle' ? '🚪' : 
                                 match.notes === 'Gave up' ? '🏳️' : 
                                 '💔'}
                              </span>
                              <div>
                                <div style={{
                                  color: isWin ? '#90ee90' : 
                                         match.notes === 'Abandoned puzzle' ? '#ff6b6b' : 
                                         match.notes === 'Gave up' ? '#ffd93d' : 
                                         '#ff9999',
                                  fontWeight: '600',
                                  fontSize: '1rem'
                                }}>
                                  {isWin ? 'WIN' : 
                                    (match.notes === 'Abandoned puzzle' ? 'LOSS (left the game)' : 
                                     match.notes === 'Gave up' ? 'LOSS (gave up)' : 
                                     'LOSS')
                                  }
                                </div>
                                <div style={{
                                  color: '#b0a99f',
                                  fontSize: '0.875rem'
                                }}>
                                  {match.mode || 'Ranked'} • {match.num_players} players
                                </div>
                              </div>
                            </div>
                            
                            <div style={{
                              textAlign: 'right'
                            }}>
                              <div style={{
                                color: eloChange >= 0 ? '#90ee90' : '#ff9999',
                                fontWeight: '700',
                                fontSize: '1.125rem'
                              }}>
                                {eloChange >= 0 ? '+' : ''}{eloChange}
                              </div>
                              <div style={{
                                color: '#b0a99f',
                                fontSize: '0.75rem'
                              }}>
                                {match.elo_before} → {match.elo_after}
                              </div>
                            </div>
                          </div>

                          {/* Details row */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #3d3a37'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <span style={{ fontSize: '0.875rem' }}>⏱️</span>
                                <span style={{
                                  color: '#ffffff',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}>
                                  {timeDisplay}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{
                              textAlign: 'right'
                            }}>
                              <div style={{
                                color: '#b0a99f',
                                fontSize: '0.875rem'
                              }}>
                                {formattedDate}
                              </div>
                              <div style={{
                                color: '#666',
                                fontSize: '0.75rem'
                              }}>
                                {formattedTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Pagination controls */}
                  {eloData.matches.length > MATCHES_PER_PAGE && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1.5rem',
                      padding: '1rem',
                      background: '#262421',
                      borderRadius: '8px',
                      border: '1px solid #3d3a37'
                    }}>
                      <div style={{
                        color: '#b0a99f',
                        fontSize: '0.875rem'
                      }}>
                        Showing {matchPage * MATCHES_PER_PAGE + 1}-{Math.min((matchPage + 1) * MATCHES_PER_PAGE, eloData.matches.length)} of {eloData.matches.length} matches
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => setMatchPage(Math.max(0, matchPage - 1))}
                          disabled={matchPage === 0}
                          style={{
                            background: matchPage === 0 ? '#1a1816' : '#769656',
                            color: matchPage === 0 ? '#666' : '#ffffff',
                            border: '1px solid #3d3a37',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            cursor: matchPage === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (matchPage !== 0) {
                              e.target.style.background = '#5d7c3f';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (matchPage !== 0) {
                              e.target.style.background = '#769656';
                            }
                          }}
                        >
                          ← Previous
                        </button>
                        
                        <button
                          onClick={() => setMatchPage(Math.min(Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1, matchPage + 1))}
                          disabled={matchPage >= Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1}
                          style={{
                            background: matchPage >= Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1 ? '#1a1816' : '#769656',
                            color: matchPage >= Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1 ? '#666' : '#ffffff',
                            border: '1px solid #3d3a37',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            cursor: matchPage >= Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (matchPage < Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1) {
                              e.target.style.background = '#5d7c3f';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (matchPage < Math.ceil(eloData.matches.length / MATCHES_PER_PAGE) - 1) {
                              e.target.style.background = '#769656';
                            }
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#b0a99f',
                  padding: '2rem',
                  fontSize: '0.875rem'
                }}>
                  <p>🎯 No ranked matches played yet!</p>
                  <p>Play some ranked puzzles to see your match history here.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 