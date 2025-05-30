import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function EloPage() {
  const [eloData, setEloData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEloData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login?redirectTo=/elo');
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/elo`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch ELO data');
        }

        const data = await response.json();
        setEloData(data);
      } catch (error) {
        setError(error.message || 'Failed to load ELO data');
        if (error.message.includes('Authentication required')) {
          navigate('/login?redirectTo=/elo');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEloData();
  }, [navigate]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading…</div>;
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: 50,
        color: '#dc3545'
      }}>
        {error}
      </div>
    );
  }

  if (!eloData) {
    return <div style={{ textAlign: 'center', marginTop: 50 }}>No ELO data available</div>;
  }

  // Choose background by tier
  let bgImage = '';
  switch (eloData.rank) {
    case 'Beginner Thinker':
      bgImage = '/images/happy-brain.png';
      break;
    case 'Intermediate Thinker':
      bgImage = '/images/sweaty-weights-brain.png';
      break;
    case 'Advanced Thinker':
      bgImage = '/images/gear-brain.png';
      break;
    default:  // Critical Thinker
      bgImage = '/images/crown-brain.png';
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${process.env.PUBLIC_URL}${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '2rem',
          color: '#333'
        }}>
          Your Logic Ranking
        </h1>

        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div style={{ 
            fontSize: '4rem',
            fontWeight: 'bold',
            color: '#007bff',
            marginBottom: '0.5rem'
          }}>
            {eloData.currentElo}
          </div>
          <div style={{ 
            fontSize: '1.5rem',
            color: '#6c757d'
          }}>
            {eloData.rank}
          </div>
        </div>

        {eloData.history && eloData.history.length > 0 && (
          <div>
            <h2 style={{ 
              marginBottom: '1rem',
              color: '#495057'
            }}>
              Recent Matches
            </h2>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {eloData.history.map((match, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ color: '#6c757d' }}>
                    {new Date(match.date).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {match.elo}
                    </span>
                    <span style={{
                      color: match.change > 0 ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {match.change > 0 ? '+' : ''}{match.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ 
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
