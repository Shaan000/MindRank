'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

interface EloHistory {
  date: string;
  elo: number;
  change: number;
}

interface EloData {
  currentElo: number;
  rank: string;
  history: EloHistory[];
}

export default function EloPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [eloData, setEloData] = React.useState<EloData | null>(null);

  const supabase = React.useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  React.useEffect(() => {
    const fetchEloData = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session as Session | null;

        if (!session?.user) {
          router.push('/');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/elo`, {
          headers: {
            'Authorization': `Bearer ${session.user.id}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch ELO data');
        }

        const data = await response.json();
        setEloData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        if (err instanceof Error && err.message.includes('Authentication required')) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEloData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl mb-4">Loading ELO data...</div>
          <div className="text-gray-500">Please wait while we fetch your statistics.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-xl text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!eloData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-xl mb-4">No ELO data found</div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your ELO Rating</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Home
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {eloData.currentElo}
            </div>
            <div className="text-xl text-gray-600">
              Current Rank: {eloData.rank}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Rating History</h2>
          {eloData.history.length > 0 ? (
            <div className="space-y-4">
              {eloData.history.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded"
                >
                  <div className="text-gray-600">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="font-medium">{entry.elo}</div>
                    <div
                      className={`${
                        entry.change > 0
                          ? 'text-green-500'
                          : entry.change < 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {entry.change > 0 ? '+' : ''}{entry.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No rating history yet. Play some ranked games to see your progress!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 