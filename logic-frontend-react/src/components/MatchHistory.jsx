import { useState, useEffect } from 'react';
import { matchAPI } from '../services/api';

export default function MatchHistory({ accessToken, showTitle = true }) {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accessToken) {
      fetchMatches();
    }
  }, [accessToken]);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await matchAPI.getUserMatches(accessToken, 10, 'desc');
      
      // Sort by created_at descending to ensure newest first
      const sortedMatches = (data.matches || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 10); // Take only the 10 most recent
      
      // Log details about the matches for debugging
      if (sortedMatches.length > 0) {
        console.log(`📊 MatchHistory: Received ${sortedMatches.length} matches`);
        console.log('🕐 MatchHistory: Most recent match:', sortedMatches[0]?.created_at);
        console.log('🕐 MatchHistory: Oldest match:', sortedMatches[sortedMatches.length - 1]?.created_at);
      } else {
        console.log('📊 MatchHistory: No matches received');
      }
      
      setMatches(sortedMatches);
    } catch (err) {
      setError(err.message);
      console.error('❌ MatchHistory: Error fetching matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMatches = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const data = await matchAPI.refreshUserMatches(accessToken, 10, 'desc');
      
      // Sort by created_at descending to ensure newest first
      const sortedMatches = (data.matches || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 10); // Take only the 10 most recent
      
      // Log details about the matches for debugging
      if (sortedMatches.length > 0) {
        console.log(`📊 MatchHistory: Refreshed ${sortedMatches.length} matches`);
        console.log('🕐 MatchHistory: Most recent match:', sortedMatches[0]?.created_at);
        console.log('🕐 MatchHistory: Oldest match:', sortedMatches[sortedMatches.length - 1]?.created_at);
      } else {
        console.log('📊 MatchHistory: No matches received');
      }
      
      setMatches(sortedMatches);
    } catch (err) {
      setError(err.message);
      console.error('❌ MatchHistory: Error refreshing matches:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Chess.com-inspired styles
  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    margin: '2rem auto',
    maxWidth: '600px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37'
  };

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div style={{textAlign: 'center', color: '#b0a99f', padding: '2rem'}}>
          Loading match history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
          onClick={fetchMatches}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        {showTitle && (
          <h3 style={{
            fontSize: '1.375rem',
            color: '#ffffff',
            margin: '0',
            fontWeight: '600',
            fontFamily: 'Georgia, serif'
          }}>
            Recent Match History
          </h3>
        )}
        <button
          onClick={refreshMatches}
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

      {matches && matches.length > 0 ? (
        <div>
          {matches.map((match, index) => {
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
  );
} 