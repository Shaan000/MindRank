// src/services/api.js
import axios from 'axios';

// Use your backend URL; for development, this points to localhost:5000
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const matchAPI = {
  /**
   * Fetch user's match history with optional parameters
   * @param {string} accessToken - User's authentication token
   * @param {number} limit - Number of matches to fetch (default: 10)
   * @param {string} order - Order of matches: 'desc' for newest first, 'asc' for oldest first (default: 'desc')
   * @returns {Promise<Object>} Response containing matches array
   */
  async getUserMatches(accessToken, limit = 10, order = 'desc') {
    if (!accessToken) {
      throw new Error('Authentication token required');
    }

    const url = `${API_URL}/user/matches?limit=${limit}&order=${order}`;
    console.log('🔍 API: Fetching matches from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch matches`);
    }

    const data = await response.json();
    console.log('✅ API: Match data received:', data);
    
    return data;
  },

  /**
   * Refresh user's match history with cache busting
   * @param {string} accessToken - User's authentication token
   * @param {number} limit - Number of matches to fetch (default: 10)
   * @param {string} order - Order of matches: 'desc' for newest first, 'asc' for oldest first (default: 'desc')
   * @returns {Promise<Object>} Response containing matches array
   */
  async refreshUserMatches(accessToken, limit = 10, order = 'desc') {
    if (!accessToken) {
      throw new Error('Authentication token required');
    }

    // Add timestamp for cache busting
    const timestamp = Date.now();
    const url = `${API_URL}/user/matches?limit=${limit}&order=${order}&t=${timestamp}`;
    console.log('🔄 API: Refreshing matches from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to refresh matches`);
    }

    const data = await response.json();
    console.log('✅ API: Refreshed match data received:', data);
    
    return data;
  }
};

export default matchAPI;
