'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  id: string;
  email: string;
  elo: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      
      // Fetch user profile
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const getTierInfo = (elo: number) => {
    if (elo >= 2400) return { name: 'Grandmaster', color: 'from-yellow-400 to-yellow-600', icon: '👑' };
    if (elo >= 2000) return { name: 'Master', color: 'from-purple-500 to-purple-700', icon: '🎖️' };
    if (elo >= 1600) return { name: 'Expert', color: 'from-blue-500 to-blue-700', icon: '🎯' };
    if (elo >= 1200) return { name: 'Advanced', color: 'from-green-500 to-green-700', icon: '⚡' };
    return { name: 'Beginner', color: 'from-gray-500 to-gray-700', icon: '🌱' };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tierInfo = profile ? getTierInfo(profile.elo) : null;

  const tiles = [
    {
      title: 'Practice Mode',
      description: 'Train your skills without pressure',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      href: '/puzzle?mode=easy&players=4',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Ranked Mode',
      description: 'Compete and climb the leaderboard',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/puzzle?mode=ranked',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: tierInfo ? `${tierInfo.name} - ${profile?.elo} ELO` : 'View Your Stats',
      description: 'Track your progress and ranking',
      icon: (
        <div className="text-4xl">{tierInfo?.icon || '📊'}</div>
      ),
      href: '/elo',
      color: tierInfo?.color || 'from-gray-500 to-gray-600',
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'Player'}! 👋
            </h1>
            {profile && (
              <p className="text-gray-600">
                Current ELO: <span className="font-semibold">{profile.elo}</span> • 
                Tier: <span className="font-semibold">{tierInfo?.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Main Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tiles.map((tile, index) => (
            <Link
              key={index}
              href={tile.href}
              className={`
                group relative overflow-hidden rounded-2xl p-8
                bg-gradient-to-br ${tile.color}
                text-white shadow-soft-lg
                transform transition-all duration-200
                hover:scale-105 hover:shadow-xl
                focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-opacity-50
                flex flex-col items-center text-center
                min-h-[300px] justify-center
              `}
            >
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <div className="relative z-10 space-y-6">
                <div className="flex justify-center">{tile.icon}</div>
                <h3 className="text-2xl font-bold">{tile.title}</h3>
                <p className="text-sm opacity-90">{tile.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/leaderboard"
            className="flex items-center p-6 bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl mr-4">
              🏆
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Leaderboard</h4>
              <p className="text-gray-600">See how you rank against others</p>
            </div>
          </Link>
          
          <div className="flex items-center p-6 bg-white rounded-xl shadow-soft">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xl mr-4">
              📈
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Your Progress</h4>
              <p className="text-gray-600">
                {profile ? `${profile.elo} ELO • ${tierInfo?.name}` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 