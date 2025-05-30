import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [eloData, setEloData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEloData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login?redirectTo=/dashboard');
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/elo`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch ELO data');
        }

        const data = await response.json();
        setEloData(data);
      } catch (error) {
        console.error('Error fetching ELO:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEloData();
  }, [navigate]);

  const getTierInfo = (elo) => {
    if (elo >= 2400) return { name: 'Grandmaster', color: 'from-yellow-400 to-yellow-600' };
    if (elo >= 2000) return { name: 'Master', color: 'from-purple-500 to-purple-700' };
    if (elo >= 1600) return { name: 'Expert', color: 'from-blue-500 to-blue-700' };
    if (elo >= 1200) return { name: 'Advanced', color: 'from-green-500 to-green-700' };
    return { name: 'Beginner', color: 'from-gray-500 to-gray-700' };
  };

  const tiles = [
    {
      title: 'Practice Mode',
      description: 'Train your skills without pressure',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: () => navigate('/puzzle?mode=easy&players=4'),
      color: 'from-green-500 to-green-600',
      always: true
    },
    {
      title: 'Ranked Mode',
      description: 'Compete and climb the leaderboard',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      onClick: () => navigate('/puzzle?mode=ranked'),
      color: 'from-blue-500 to-blue-600',
      requiresAuth: true
    },
    {
      title: eloData ? `${getTierInfo(eloData.elo).name} - ${eloData.elo} ELO` : 'Loading...',
      description: 'View your stats and progress',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      onClick: () => navigate('/elo'),
      color: eloData ? getTierInfo(eloData.elo).color : 'from-gray-500 to-gray-600',
      requiresAuth: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Welcome, {user?.email?.split('@')[0] || 'Player'}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tiles.map((tile, index) => (
            ((tile.always || !tile.requiresAuth) || (tile.requiresAuth && user)) && (
              <button
                key={index}
                onClick={tile.onClick}
                className={`
                  relative overflow-hidden rounded-2xl p-8
                  bg-gradient-to-br ${tile.color}
                  text-white shadow-lg
                  transform transition-all duration-200
                  hover:scale-105 hover:shadow-xl
                  focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-opacity-50
                  flex flex-col items-center text-center
                  min-h-[300px]
                `}
              >
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-200" />
                <div className="mb-6">{tile.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{tile.title}</h3>
                <p className="text-sm opacity-90">{tile.description}</p>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
} 