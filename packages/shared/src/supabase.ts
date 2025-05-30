import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? {
    'Authorization': `Bearer ${session.access_token}`
  } : {};
};

export const getTierInfo = (elo: number) => {
  if (elo >= 2400) return { name: 'Grandmaster', color: 'from-yellow-400 to-yellow-600', icon: '👑' };
  if (elo >= 2000) return { name: 'Master', color: 'from-purple-500 to-purple-700', icon: '🎖️' };
  if (elo >= 1600) return { name: 'Expert', color: 'from-blue-500 to-blue-700', icon: '🎯' };
  if (elo >= 1200) return { name: 'Advanced', color: 'from-green-500 to-green-700', icon: '⚡' };
  return { name: 'Beginner', color: 'from-gray-500 to-gray-700', icon: '🌱' };
}; 