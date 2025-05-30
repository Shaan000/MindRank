import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import PuzzlePage from './PuzzlePage';
import EloPage from './EloPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import { supabase } from './supabase';

// Only protect "ranked" puzzles; practice always open
function ProtectedPuzzle({ user }) {
  const { search } = useLocation();
  const mode = new URLSearchParams(search).get('mode');
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'ranked' && !user) {
      navigate('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
    }
  }, [mode, user, navigate]);

  return <PuzzlePage user={user} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          // Only redirect on login page after authentication
          if (currentUser && location.pathname === '/login') {
            const params = new URLSearchParams(location.search);
            const redirectTo = params.get('redirectTo') || '/';
            navigate(redirectTo);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate, location]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Redirect to the intended destination or home
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirectTo') || '/';
    navigate(redirectTo);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading MindRank...</p>
        </div>
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
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* 🔒 FROZEN Landing page for everyone - v1.0 */}
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} />
          ) : (
            <Navigate
              to={`/login?redirectTo=${encodeURIComponent('/dashboard')}`}
              replace
            />
          )
        }
      />

      <Route
        path="/puzzle"
        element={<ProtectedPuzzle user={user} />}
      />

      <Route
        path="/elo"
        element={
          user ? (
            <EloPage user={user} />
          ) : (
            <Navigate
              to={`/login?redirectTo=${encodeURIComponent('/elo')}`}
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
