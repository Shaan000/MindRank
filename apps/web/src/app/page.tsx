'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [playerCount, setPlayerCount] = useState(4);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/dashboard');
        return;
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Loading MindRank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-soft-lg">
            MR
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Welcome to MindRank
          </h1>
          <p className="text-lg text-gray-600">
            Sharpen your logic with bite-sized puzzles
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-6 mt-8">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 shadow-soft"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.447,1.722-1.502,3.178-2.945,4.133c-1.495,0.989-3.273,1.365-5.045,1.063c-1.772-0.302-3.355-1.262-4.344-2.757c-0.989-1.495-1.365-3.273-1.063-5.045c0.302-1.772,1.262-3.355,2.757-4.344c1.495-0.989,3.273-1.365,5.045-1.063c1.772,0.302,3.355,1.262,4.344,2.757l2.93-2.93c-1.862-2.355-4.568-3.871-7.474-4.248c-2.905-0.377-5.836,0.397-8.192,2.259c-2.355,1.862-3.871,4.568-4.248,7.474c-0.377,2.905,0.397,5.836,2.259,8.192c1.862,2.355,4.568,3.871,7.474,4.248c2.905,0.377,5.836-0.397,8.192-2.259c2.355-1.862,3.871-4.568,4.248-7.474h-5.536C13.4,12.151,12.545,12.151,12.545,12.151z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gradient-to-b from-blue-50 to-white text-sm text-gray-500">
                or try without signing in
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <label htmlFor="playerCount" className="text-sm font-medium text-gray-600">
                Number of players: {playerCount}
              </label>
              <input
                type="range"
                id="playerCount"
                min="3"
                max="6"
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <Link
              href={`/puzzle?mode=easy&players=${playerCount}`}
              className="w-full flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 shadow-soft"
            >
              Try a Sample Puzzle
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Challenge your mind with logic puzzles and compete with others.</p>
        <p>Sign in to track your progress and join ranked matches.</p>
      </div>
    </div>
  );
} 