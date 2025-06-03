import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LeaderboardPage({ accessToken }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError('');

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/leaderboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load leaderboard');
        }

        setEntries(data.leaderboard || []);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError(err.message || 'Error loading leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();

    // Real-time updates every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // Chess.com inspired styling matching existing theme
  const pageStyle = {
    minHeight: '100vh',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    padding: '2rem'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '2rem',
    borderRadius: '12px',
    marginBottom: '2rem'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const backButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '1rem'
  };

  const tableContainerStyle = {
    background: '#312e2b',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37',
    maxWidth: '1000px',
    margin: '0 auto'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const headerCellStyle = {
    padding: '1rem 0.75rem',
    borderBottom: '2px solid #769656',
    background: '#262421',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    textAlign: 'left'
  };

  const cellStyle = {
    padding: '0.75rem',
    borderBottom: '1px solid #3d3a37',
    fontSize: '0.95rem'
  };

  const getTierColor = (tier) => {
    const colors = {
      'Grandmaster': '#FFD700',
      'Master': '#C0C0C0', 
      'Expert': '#CD7F32',
      'Advanced': '#769656',
      'Beginner': '#b0a99f',
      // New gameplay tier names
      'Grandmaster Thinker': '#FFD700',
      'Critical Thinker': '#C0C0C0', 
      'Advanced Thinker': '#CD7F32',
      'Intermediate Thinker': '#769656',
      'Beginner Thinker': '#b0a99f'
    };
    return colors[tier] || '#b0a99f';
  };

  const renderRow = (entry, idx) => {
    const isEven = idx % 2 === 0;
    const rowStyle = {
      background: isEven ? '#262421' : '#1a1816',
      transition: 'background 0.2s ease'
    };

    return (
      <tr 
        key={entry.user_id} 
        style={rowStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3d3a37';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isEven ? '#262421' : '#1a1816';
        }}
      >
        <td style={{...cellStyle, fontWeight: '700', color: '#FFD700', width: '60px'}}>
          #{entry.rank}
        </td>
        <td style={{...cellStyle, fontWeight: '600', color: '#ffffff'}}>
          {entry.username}
        </td>
        <td style={{...cellStyle, color: getTierColor(entry.tier), fontWeight: '500', width: '140px'}}>
          {entry.tier}
        </td>
        <td style={{...cellStyle, fontWeight: '700', color: '#ffffff', textAlign: 'right', width: '100px'}}>
          {entry.elo}
        </td>
      </tr>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🏆 MindRank Leaderboard</h1>
        <p style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem'}}>
          Top 500 Logic Masters • Updated in Real-time
        </p>
      </div>

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

      <div style={tableContainerStyle}>
        {loading && (
          <div style={{textAlign: 'center', padding: '3rem', color: '#b0a99f'}}>
            <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⏳</div>
            <div style={{fontSize: '1.125rem'}}>Loading leaderboard...</div>
          </div>
        )}

        {error && (
          <div style={{textAlign: 'center', padding: '3rem', color: '#ff6b6b'}}>
            <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⚠️</div>
            <div style={{fontSize: '1.125rem'}}>{error}</div>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div style={{textAlign: 'center', padding: '3rem', color: '#b0a99f'}}>
            <div style={{fontSize: '2rem', marginBottom: '1rem'}}>📊</div>
            <div style={{fontSize: '1.125rem'}}>No players found</div>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Rank</th>
                <th style={headerCellStyle}>Username</th>
                <th style={headerCellStyle}>Tier</th>
                <th style={{...headerCellStyle, textAlign: 'right'}}>ELO</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => renderRow(entry, idx))}
            </tbody>
          </table>
        )}

        {!loading && !error && entries.length > 0 && (
          <div style={{
            textAlign: 'center', 
            marginTop: '1.5rem', 
            color: '#b0a99f', 
            fontSize: '0.875rem'
          }}>
            Showing {entries.length} players • Rankings update automatically
          </div>
        )}
      </div>
    </div>
  );
} 