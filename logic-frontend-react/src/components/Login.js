import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onLogin(session.user);
        handleRedirect();
      }
    };
    checkSession();
  }, [onLogin]);

  // Handle redirect after login
  const handleRedirect = () => {
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirectTo') || '/';
    navigate(redirectTo);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setMessage('');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${location.search}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      setMessage(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: 'auto', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f8f9fa'
    }}>
      <h2 style={{ 
        marginBottom: '2rem', 
        fontSize: '2rem',
        color: '#333',
        textAlign: 'center'
      }}>Welcome to MindRank</h2>
      
      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          hover: {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            transform: 'translateY(-1px)'
          }
        }}
      >
        <img 
          src="https://www.google.com/favicon.ico"
          alt="Google"
          style={{ width: '24px', height: '24px' }}
        />
        {loading ? 'Connecting...' : 'Continue with Google'}
      </button>

      {/* Error Message */}
      {message && (
        <div style={{
          color: '#dc3545',
          textAlign: 'center',
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '6px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Login;
