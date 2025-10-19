import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import PuzzlePage from './PuzzlePage';
import EloPage from './EloPage';
import ProtectedApp from './components/ProtectedApp';
import Login from './components/Login';
import Register from './components/Register';
import PracticeSignIn from './components/PracticeSignIn';
import RankedSignIn from './components/RankedSignIn';
import LeaderboardSignIn from './components/LeaderboardSignIn';
import LeaderboardPage from './components/LeaderboardPage';
import EasyModePage from './components/EasyModePage';
import MediumModePage from './components/MediumModePage';
import HardModePage from './components/HardModePage';
import ExtremeModePage from './components/ExtremeModePage';
import MasterEasyModePage from './components/MasterEasyModePage';
import MasterMediumModePage from './components/MasterMediumModePage';
import MasterHardModePage from './components/MasterHardModePage';
import MasterExtremeModePage from './components/MasterExtremeModePage';
import Instructions from './components/Instructions';
import NeuronSimPage from './NeuronSimPage';
import { supabase } from './supabase';

// Only protect "ranked" puzzles; practice always open
function ProtectedPuzzle({ user, accessToken, authInitialized }) {
  const { search } = useLocation();
  const mode = new URLSearchParams(search).get('mode');
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'ranked' && authInitialized && !user) {
      navigate('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
    }
  }, [mode, user, authInitialized, navigate]);

  return <PuzzlePage user={user} accessToken={accessToken} authInitialized={authInitialized} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // console.log('🔄 Starting auth initialization...');
      
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          // console.error('❌ Session initialization error:', error);
        } else if (session) {
          // console.log('✅ Found existing session:', session.user.email);
          // console.log('🔑 Access token available:', !!session.access_token);
          setUser(session.user);
          setAccessToken(session.access_token);
        } else {
          // console.log('📱 No existing session found');
          setUser(null);
          setAccessToken(null);
        }

        // Mark auth as initialized immediately - no artificial delay
        setAuthInitialized(true);
        setInitializing(false);
        // console.log('🎯 Auth initialization complete');

      } catch (error) {
        // console.error('💥 Critical auth initialization error:', error);
        if (mounted) {
          setAuthInitialized(true);
          setInitializing(false);
        }
      }
    };

    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('🔄 Auth state changed:', event);
      
      if (!mounted) return;

      if (session) {
        // console.log('✅ User authenticated:', session.user.email);
        // console.log('🔑 New access token:', !!session.access_token);
        setUser(session.user);
        setAccessToken(session.access_token);
        
        // Handle redirects after successful authentication
        if (location.pathname === '/') {
          navigate('/app');
        } else if (location.pathname === '/login') {
          const params = new URLSearchParams(location.search);
          const redirectTo = params.get('redirectTo') || '/app';
          navigate(redirectTo);
        }
      } else {
        // console.log('👋 User signed out');
        setUser(null);
        setAccessToken(null);
      }
    });

    // Initialize auth
    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Redirect to the intended destination or app dashboard
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirectTo') || '/app';
    navigate(redirectTo);
  };

  const handleLogout = async () => {
    try {
      // console.log('🚪 Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      // console.error('Error signing out:', error);
    }
  };

  // Show loading screen while auth is initializing
  if (initializing || !authInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #262421 0%, #1a1816 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
        <div style={{
          textAlign: 'center', 
          color: '#ffffff',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '2rem',
            color: '#769656',
            animation: 'pulse 2s infinite'
          }}>
            ⚡
          </div>
          <div style={{
            fontSize: '2rem',
            color: '#ffffff',
            marginBottom: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Georgia, serif'
          }}>
            MindRank
          </div>
          <div style={{
            fontSize: '1.125rem',
            color: '#b0a99f',
            marginBottom: '0.5rem'
          }}>
            Initializing Authentication...
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            fontStyle: 'italic'
          }}>
            {!authInitialized ? 'Connecting to Supabase...' : 'Loading application...'}
          </div>
          
          {/* Loading dots animation */}
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#769656',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.32s'
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#769656',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.16s'
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#769656',
              animation: 'bounce 1.4s infinite ease-in-out both'
            }}></div>
          </div>
        </div>
        
        {/* CSS animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/app" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* 🔒 FROZEN Landing page for everyone - v1.0 */}
      <Route path="/" element={<LandingPage />} />

      {/* New sign-in pages for footer buttons */}
      <Route path="/practice-signin" element={<PracticeSignIn />} />
      <Route path="/ranked-signin" element={<RankedSignIn />} />
      <Route path="/leaderboard-signin" element={<LeaderboardSignIn />} />

      <Route
        path="/app"
        element={
          user ? (
            <ProtectedApp 
              user={user} 
              accessToken={accessToken}
              authInitialized={authInitialized}
              onLogout={handleLogout} 
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Practice Mode Routes - No authentication required */}
      <Route path="/practice/easy" element={<EasyModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />
      <Route path="/practice/medium" element={<MediumModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />
      <Route path="/practice/hard" element={<HardModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />
      <Route path="/practice/extreme" element={<ExtremeModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />

      {/* Master Mode Routes - No authentication required but separate progress tracking */}
      <Route path="/master/easy" element={<MasterEasyModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />
      <Route path="/master/medium" element={<MasterMediumModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />
      <Route path="/master/hard" element={<MasterHardModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />
      <Route path="/master/extreme" element={<MasterExtremeModePage user={user} accessToken={accessToken} authInitialized={authInitialized} />} />

      {/* Instructions Route - Available to everyone */}
      <Route 
        path="/instructions" 
        element={<Instructions onBack={() => window.history.back()} />} 
      />

      {/* Neuron Simulation Route - Available to everyone */}
      <Route 
        path="/neuron-sim" 
        element={<NeuronSimPage />} 
      />

      <Route
        path="/puzzle"
        element={<ProtectedPuzzle user={user} accessToken={accessToken} authInitialized={authInitialized} />}
      />

      <Route
        path="/elo"
        element={
          user ? (
            <EloPage user={user} accessToken={accessToken} />
          ) : (
            <Navigate
              to={`/login?redirectTo=${encodeURIComponent('/elo')}`}
              replace
            />
          )
        }
      />

      <Route
        path="/leaderboard"
        element={
          user ? (
            <LeaderboardPage accessToken={accessToken} />
          ) : (
            <Navigate
              to={`/login?redirectTo=${encodeURIComponent('/leaderboard')}`}
              replace
            />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
