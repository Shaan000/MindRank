import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function RankedSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chess.com professional green-black theme
  const pageStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '4rem 2rem',
    position: 'relative'
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

  const titleStyle = {
    fontSize: '3.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const subtitleStyle = {
    fontSize: '1.5rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '3rem',
    fontWeight: '400'
  };

  const mainContentStyle = {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#312e2b',
    padding: '4rem 2rem'
  };

  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37',
    textAlign: 'center'
  };

  const iconStyle = {
    fontSize: '4rem',
    marginBottom: '2rem',
    color: '#4a90e2'
  };

  const descriptionStyle = {
    fontSize: '1.125rem',
    color: '#b0a99f',
    marginBottom: '3rem',
    lineHeight: '1.6'
  };

  const warningStyle = {
    background: 'rgba(255, 193, 7, 0.1)',
    color: '#ffc107',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '2rem',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    fontSize: '0.875rem',
    lineHeight: '1.4'
  };

  const googleButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    background: '#ffffff',
    color: '#262421',
    padding: '1rem 2.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    width: '100%'
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Back to Home
        </button>
        
        <h1 style={titleStyle}>Ranked Mode</h1>
        <p style={subtitleStyle}>Competitive Puzzle Solving</p>
      </div>

      <div style={mainContentStyle}>
        <div style={cardStyle}>
          <div style={iconStyle}>🏆</div>
          
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '1rem',
            fontFamily: 'Georgia, serif'
          }}>
            Sign In to Compete
          </h2>
          
          <p style={descriptionStyle}>
            Sign in with Google to access Ranked Mode and compete against other players. 
            Your performance will be tracked and your ELO rating will change based on your puzzle-solving skills.
          </p>

          <div style={warningStyle}>
            ⚠️ <strong>Ranked Mode Notice:</strong> Your puzzle performance will affect your ELO rating and leaderboard position. 
            Make sure you're ready for the challenge!
          </div>

          <button 
            style={{
              ...googleButtonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }
            }}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google"
              style={{width: '24px', height: '24px'}}
            />
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
} 