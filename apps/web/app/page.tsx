'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<Session['user'] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = React.useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Check auth status on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handlePracticeClick = () => {
    router.push('/puzzle?mode=practice&players=4');
  };

  const handleRankedClick = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/puzzle?mode=ranked&players=4`,
          }
        });

        if (error) throw error;
      } else {
        router.push('/puzzle?mode=ranked&players=4');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEloClick = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/elo`,
          }
        });

        if (error) throw error;
      } else {
        router.push('/elo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MindRank</h1>
          <p className="text-lg text-gray-600">
            Test your logical reasoning skills!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handlePracticeClick}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            Practice Mode
          </button>

          <button
            onClick={handleRankedClick}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {user ? 'Play Ranked' : 'Sign in to Play Ranked'}
          </button>

          <button
            onClick={handleViewEloClick}
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {user ? 'View My ELO' : 'Sign in to View ELO'}
          </button>

          {user && (
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-4 text-center text-gray-600">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
} 