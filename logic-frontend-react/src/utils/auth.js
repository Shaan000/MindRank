import { supabase } from '../supabase';

/**
 * Clear all authentication state and reload the page
 * Useful for testing the welcome page without cached sessions
 */
export const clearAuthState = async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reload the page to ensure clean state
    window.location.reload();
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

/**
 * Quick function to force sign out and return to welcome page
 */
export const forceSignOut = async () => {
  try {
    await supabase.auth.signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

/**
 * Check if user has an active session
 */
export const hasActiveSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}; 