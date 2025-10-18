import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PracticePanel from './PracticePanel';
import RankedPanel from './RankedPanel';
import EloPanel from './EloPanel';
import UsernameModal from './UsernameModal';
import PlacementProgress from './PlacementProgress';
import { supabase } from '../supabase';

export default function ProtectedApp({ user, accessToken, authInitialized, onLogout }) {
  const [activePanel, setActivePanel] = useState(null);
  const [showPracticeSubTiles, setShowPracticeSubTiles] = useState(false);
  const [showMasterSubTiles, setShowMasterSubTiles] = useState(false);
  const [eloData, setEloData] = useState(null);
  const [eloLoading, setEloLoading] = useState(false);
  const [eloError, setEloError] = useState(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [progressBarsData, setProgressBarsData] = useState([]);
  const [progressBarsLoading, setProgressBarsLoading] = useState(false);
  const [masterProgressBarsData, setMasterProgressBarsData] = useState([]);
  const [masterProgressBarsLoading, setMasterProgressBarsLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState(null);
  const [showUnlockMessage, setShowUnlockMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Add CSS animations to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes titleGlow {
        0%, 100% { 
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(118, 150, 86, 0.3);
        }
        50% { 
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 30px rgba(118, 150, 86, 0.6), 0 0 40px rgba(118, 150, 86, 0.4);
        }
      }
      
      @keyframes floatUp {
        0% { 
          transform: translateY(0px) scale(1); 
          opacity: 0.8; 
        }
        50% { 
          transform: translateY(-10px) scale(1.05); 
          opacity: 1; 
        }
        100% { 
          transform: translateY(0px) scale(1); 
          opacity: 0.8; 
        }
      }
      
      @keyframes sparkle {
        0%, 100% { 
          opacity: 0; 
          transform: scale(0) rotate(0deg); 
        }
        50% { 
          opacity: 1; 
          transform: scale(1) rotate(180deg); 
        }
      }
      
      @keyframes headerSlideIn {
        0% { 
          transform: translateY(-100px); 
          opacity: 0; 
        }
        100% { 
          transform: translateY(0); 
          opacity: 1; 
        }
      }
      
      @keyframes pulseGlow {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(118, 150, 86, 0.3); 
        }
        50% { 
          box-shadow: 0 0 40px rgba(118, 150, 86, 0.6), 0 0 60px rgba(118, 150, 86, 0.4); 
        }
      }
      
      @keyframes subtleZoom {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      
      @keyframes iconPulse {
        0%, 100% { 
          transform: scale(1); 
        }
        50% { 
          transform: scale(1.1); 
        }
      }
      
      @keyframes iconSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      }
      
      @keyframes fireShimmer {
        0%, 100% { 
          transform: translateX(-100%); 
          opacity: 0;
        }
        50% { 
          transform: translateX(0%); 
          opacity: 1;
        }
      }
      
      @keyframes neonGreenGlow {
        0% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3);
        }
        100% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.5), 0 0 90px rgba(34, 197, 94, 0.3);
        }
      }
      
      @keyframes neonBlueGlow {
        0% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3);
        }
        100% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5), 0 0 90px rgba(59, 130, 246, 0.3);
        }
      }
      
      @keyframes neonOrangeGlow {
        0% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 146, 60, 0.3);
        }
        100% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(251, 146, 60, 0.8), 0 0 60px rgba(251, 146, 60, 0.5), 0 0 90px rgba(251, 146, 60, 0.3);
        }
      }
      
      @keyframes neonRGBGlow {
        0% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 0, 0, 0.6), 0 0 40px rgba(255, 0, 0, 0.4);
          border-color: rgba(255, 0, 0, 0.8);
        }
        16.66% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.4);
          border-color: rgba(255, 165, 0, 0.8);
        }
        33.33% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 0, 0.6), 0 0 40px rgba(255, 255, 0, 0.4);
          border-color: rgba(255, 255, 0, 0.8);
        }
        50% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 0, 0.6), 0 0 40px rgba(0, 255, 0, 0.4);
          border-color: rgba(0, 255, 0, 0.8);
        }
        66.66% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4);
          border-color: rgba(0, 255, 255, 0.8);
        }
        83.33% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(128, 0, 255, 0.6), 0 0 40px rgba(128, 0, 255, 0.4);
          border-color: rgba(128, 0, 255, 0.8);
        }
        100% { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 0, 128, 0.6), 0 0 40px rgba(255, 0, 128, 0.4);
          border-color: rgba(255, 0, 128, 0.8);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchEloData = async () => {
    if (!accessToken) {
      // console.warn('⚠️ No access token available for ELO fetching');
      setEloError('No authentication token available');
      return;
    }

    try {
      setEloLoading(true);
      setEloError(null);
      
      // console.log('🔍 Fetching ELO data with access token...');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/user/elo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // console.log('📡 ELO fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log('✅ ELO data received:', data);
        setEloData(data);
        setEloError(null);
      } else if (response.status === 401) {
        // console.error('❌ ELO fetch unauthorized - token may be expired');
        setEloError('Session expired - please refresh the page');
      } else {
        const errorText = await response.text();
        // console.error('❌ ELO fetch failed:', response.status, errorText);
        setEloError(`Failed to fetch ELO: ${response.status}`);
      }
    } catch (error) {
      // console.error('❌ Error fetching ELO:', error);
      setEloError(error.message || 'Network error while fetching ELO');
    } finally {
      setEloLoading(false);
    }
  };

  const fetchUsername = async () => {
    if (!accessToken) {
      // console.warn('⚠️ No access token available for username fetching');
      return;
    }

    try {
      // console.log('🔍 Fetching username with access token...');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // console.log('📡 Username fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log('✅ Username data received:', data);
        setCurrentUsername(data.user.username || user?.email?.split('@')[0] || 'Player');
      } else {
        // console.error('❌ Username fetch failed:', response.status);
        // Fallback to email prefix
        setCurrentUsername(user?.email?.split('@')[0] || 'Player');
      }
    } catch (error) {
      // console.error('❌ Error fetching username:', error);
      // Fallback to email prefix
      setCurrentUsername(user?.email?.split('@')[0] || 'Player');
    }
  };

  const fetchProgressBars = async () => {
    if (!accessToken) return;
    
    setProgressBarsLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/practice/progress-bars`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgressBarsData(data.progress_bars || []);
        // console.log('✅ Progress bars loaded:', data.progress_bars);
      } else {
        // console.log('⚠️ Progress bars request failed:', response.status);
        setProgressBarsData([]);
      }
    } catch (error) {
      // console.error('❌ Error fetching progress bars:', error);
      setProgressBarsData([]);
    } finally {
      setProgressBarsLoading(false);
    }
  };

  const fetchMasterProgressBars = async () => {
    if (!accessToken) return;
    
    setMasterProgressBarsLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/master/progress-bars`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMasterProgressBarsData(data.progress_bars || []);
        // console.log('✅ Master progress bars loaded:', data.progress_bars);
      } else {
        // console.log('⚠️ Master progress bars request failed:', response.status);
        setMasterProgressBarsData([]);
      }
    } catch (error) {
      // console.error('❌ Error fetching master progress bars:', error);
      setMasterProgressBarsData([]);
    } finally {
      setMasterProgressBarsLoading(false);
    }
  };

  const getProgressForMode = (mode) => {
    return progressBarsData.find(p => p.mode === mode);
  };

  const getMasterProgressForMode = (mode) => {
    return masterProgressBarsData.find(p => p.mode === mode);
  };

  const isModeUnlocked = (mode) => {
    // Use progress bars data for unlock logic if available
    if (progressBarsData.length > 0) {
      const allProgress = {};
      progressBarsData.forEach(item => {
        allProgress[item.mode] = item;
      });
      
      // console.log(`🔍 Checking unlock status for ${mode}:`, {
        progressBarsData,
        allProgress,
        easyProgress: allProgress.easy,
        easySolved: allProgress.easy?.solved
      });
      
      switch (mode) {
        case 'easy': 
          return true; // Always unlocked
        case 'medium': 
          // Medium unlocked if easy mode has >= 10 solved
          const mediumUnlocked = allProgress.easy?.solved >= 10;
          // console.log(`🔓 Medium unlock check: easy solved = ${allProgress.easy?.solved}, unlocked = ${mediumUnlocked}`);
          return mediumUnlocked;
        case 'hard': 
          // Hard unlocked if medium mode has >= 10 solved
          const hardUnlocked = allProgress.medium?.solved >= 10;
          // console.log(`🔓 Hard unlock check: medium solved = ${allProgress.medium?.solved}, unlocked = ${hardUnlocked}`);
          return hardUnlocked;
        case 'extreme': 
          // Extreme unlocked if hard mode has >= 10 solved
          const extremeUnlocked = allProgress.hard?.solved >= 10;
          // console.log(`🔓 Extreme unlock check: hard solved = ${allProgress.hard?.solved}, unlocked = ${extremeUnlocked}`);
          return extremeUnlocked;
        default: 
          return false;
      }
    }
    
    // console.log(`⚠️ No progress data available for ${mode}, falling back to localStorage`);
    // Fallback to localStorage for unauthenticated users
    if (mode === 'easy') return true;
    return localStorage.getItem(`${mode}Unlocked`) === 'true';
  };

  const isMasterModeUnlocked = (mode) => {
    // Use master progress bars data for unlock logic if available
    if (masterProgressBarsData.length > 0) {
      const allProgress = {};
      masterProgressBarsData.forEach(item => {
        allProgress[item.mode] = item;
      });
      
      // console.log(`🔍 Checking master unlock status for ${mode}:`, {
        masterProgressBarsData,
        allProgress,
        easyProgress: allProgress.easy,
        easySolved: allProgress.easy?.solved
      });
      
      switch (mode) {
        case 'easy': 
          return true; // Always unlocked
        case 'medium': 
          // Master Medium unlocked if master easy mode has >= 10 solved
          const mediumUnlocked = allProgress.easy?.solved >= 10;
          // console.log(`🔓 Master Medium unlock check: master easy solved = ${allProgress.easy?.solved}, unlocked = ${mediumUnlocked}`);
          return mediumUnlocked;
        case 'hard': 
          // Master Hard unlocked if master medium mode has >= 10 solved
          const hardUnlocked = allProgress.medium?.solved >= 10;
          // console.log(`🔓 Master Hard unlock check: master medium solved = ${allProgress.medium?.solved}, unlocked = ${hardUnlocked}`);
          return hardUnlocked;
        case 'extreme': 
          // Master Extreme unlocked if master hard mode has >= 10 solved
          const extremeUnlocked = allProgress.hard?.solved >= 10;
          // console.log(`🔓 Master Extreme unlock check: master hard solved = ${allProgress.hard?.solved}, unlocked = ${extremeUnlocked}`);
          return extremeUnlocked;
        default: 
          return false;
      }
    }
    
    // console.log(`⚠️ No master progress data available for ${mode}, falling back to localStorage`);
    // Fallback to localStorage for unauthenticated users
    if (mode === 'easy') return true;
    return localStorage.getItem(`master${mode}Unlocked`) === 'true';
  };

  useEffect(() => {
    // console.log('🔍 ProtectedApp useEffect triggered with:', {
      authInitialized,
      user: !!user,
      userEmail: user?.email,
      accessToken: !!accessToken,
      accessTokenLength: accessToken?.length
    });

    // Check if we should show practice sub-tiles based on navigation state
    if (location.state?.showPracticeSubTiles) {
      setShowPracticeSubTiles(true);
      // Clear the state after using it
      navigate('/app', { replace: true, state: {} });
    }

    // Only fetch ELO data after auth is initialized AND we have both user and accessToken
    if (authInitialized && user && accessToken) {
      // console.log('🎯 Auth initialized and token available, fetching all data in parallel...');
      
      // Run all API calls in parallel for much faster loading
      Promise.all([
        fetchEloData(),
        fetchUsername(),
        fetchProgressBars(),
        fetchMasterProgressBars()
      ]).then(() => {
        // console.log('✅ All data loaded successfully');
      }).catch((error) => {
        // console.error('❌ Error loading some data:', error);
      });
    } else if (authInitialized && !user) {
      // console.log('📱 Auth initialized but no user - user not authenticated');
      setEloError(null);
      setEloData(null);
    } else if (authInitialized && user && !accessToken) {
      // console.log('⚠️ Auth initialized and user found but no access token');
      setEloError('Authentication token missing - please try refreshing');
    } else {
      // console.log('⏳ Still waiting for auth initialization...');
    }
  }, [authInitialized, user, accessToken, location.state, navigate]);

  // Chess.com style inline styles matching the landing page
  const appStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '3rem 2rem',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const subtitleStyle = {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '1rem',
    fontWeight: '400'
  };

  const logoutButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const dashboardStyle = {
    background: '#312e2b',
    padding: '4rem 2rem'
  };

  const tilesContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  const tileStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '3rem 2rem',
    minWidth: '280px',
    flex: '1',
    maxWidth: '350px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const tileHoverStyle = {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
  };

  const tileIconStyle = {
    fontSize: '3rem',
    marginBottom: '1.5rem',
    display: 'block'
  };

  const tileTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif'
  };

  const tileDescriptionStyle = {
    fontSize: '1rem',
    color: '#b0a99f',
    lineHeight: '1.5'
  };

  // Practice sub-tiles styles
  const subTilesContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1000px',
    margin: '2rem auto 0',
    padding: '0 1rem'
  };

  const subTileStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative'
  };

  const lockedTileStyle = {
    ...subTileStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    background: '#1a1816'
  };

  const subTileIconStyle = {
    fontSize: '2rem',
    marginBottom: '1rem',
    display: 'block'
  };

  const subTileTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif'
  };

  const subTileDescriptionStyle = {
    fontSize: '0.875rem',
    color: '#b0a99f',
    lineHeight: '1.4'
  };

  const lockIconStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '1.5rem',
    color: '#666'
  };

  // Unlock message banner styles
  const unlockBannerStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    color: '#ffffff',
    padding: '1rem 2rem',
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: '600',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: showUnlockMessage ? 'translateY(0)' : 'translateY(-100%)',
    opacity: showUnlockMessage ? 1 : 0,
    transition: 'all 0.5s ease-in-out'
  };

  // Add progress bar styles
  const progressContainerStyle = {
    marginTop: '1rem',
    marginBottom: '0.5rem'
  };

  const progressBarStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 215, 0, 0.3)'
  };

  const progressFillStyle = (percentage) => ({
    height: '100%',
    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
    width: `${Math.min(percentage, 100)}%`
  });

  const progressTextStyle = {
    marginTop: '4px',
    fontSize: '12px',
    color: '#B8860B',
    fontWeight: '500',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const completedTextStyle = {
    color: '#228B22',
    fontWeight: '600'
  };

  // Helper function to render progress bar
  const renderProgressBar = (mode) => {
    const progress = getProgressForMode(mode);
    
    if (!progress || !progress.show_progress_bar) {
      return null;
    }

    return (
      <div style={{
        width: '100%',
        background: '#1a1816',
        borderRadius: '4px',
        overflow: 'hidden',
        marginTop: '1rem',
        border: '1px solid #3d3a37',
        position: 'relative',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            height: '100%',
            ...progressFillStyle(progress.percentage),
            transition: 'width 0.3s ease',
            borderRadius: '4px'
          }}
        >
        </div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          color: '#FFD700',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {progress.progress_text}
        </div>
      </div>
    );
  };

  const renderMasterProgressBar = (mode) => {
    const progress = getMasterProgressForMode(mode);
    
    if (!progress || !progress.show_progress_bar) {
      return null;
    }

    return (
      <div style={{
        width: '100%',
        background: '#1a1816',
        borderRadius: '6px',
        overflow: 'hidden',
        marginTop: '1rem',
        border: '1px solid #ff6b35',
        boxShadow: '0 0 8px rgba(255, 107, 53, 0.3)',
        position: 'relative',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            height: '100%',
            background: progress.percentage > 0 ? 
              'linear-gradient(90deg, #ff4500 0%, #ff6b35 50%, #ff8c42 100%)' : 
              'transparent',
            transition: 'width 0.3s ease',
            width: `${Math.min(progress.percentage, 100)}%`,
            borderRadius: '6px'
          }}
        >
          {progress.percentage > 0 && (
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              animation: 'fireShimmer 2s ease-in-out infinite',
              borderRadius: '6px'
            }}></div>
          )}
        </div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#ff6b35',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          zIndex: 1
        }}>
          🔥 {progress.solved}/10 Master Solves
        </div>
      </div>
    );
  };

  const backButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '0.5rem'
  };

  const getTierInfo = (elo) => {
    if (elo >= 2000) return { name: 'Grandmaster Thinker', color: '#FFD700' };
    if (elo >= 1500) return { name: 'Critical Thinker', color: '#C0C0C0' };
    if (elo >= 1000) return { name: 'Advanced Thinker', color: '#CD7F32' };
    if (elo >= 500) return { name: 'Intermediate Thinker', color: '#769656' };
    return { name: 'Beginner Thinker', color: '#b0a99f' };
  };

  const handleTileClick = (panelType) => {
    if (panelType === 'practice') {
      // Show Practice sub-tiles directly instead of PracticePanel
      setShowPracticeSubTiles(true);
      setActivePanel(null); // Don't set active panel
    } else if (panelType === 'master') {
      setShowMasterSubTiles(true);
      setActivePanel(null); // Don't set active panel
    } else {
      setActivePanel(panelType);
      setShowPracticeSubTiles(false);
      setShowMasterSubTiles(false);
    }
  };

  const handleBackToDashboard = () => {
    setActivePanel(null);
    setShowPracticeSubTiles(false);
    setShowMasterSubTiles(false);
  };

  const handleBackFromRanked = () => {
    setActivePanel(null);
    // Always refresh ELO data when returning from ranked mode since matches might have been played
    fetchEloData();
    // Also refresh progress bars in case they played practice mode
    fetchProgressBars();
  };

  const handlePracticeSubTileClick = (difficulty) => {
    // console.log(`🎯 Practice sub-tile clicked: ${difficulty}`);
    
    if (isModeUnlocked(difficulty)) {
      // console.log(`✅ ${difficulty} mode is unlocked, navigating...`);
      // Navigate to the specific practice mode page
      navigate(`/practice/${difficulty}`, {
        state: { 
          user,
          accessToken,
          authInitialized
        }
      });
    } else {
      // console.log(`🔒 ${difficulty} mode is locked`);
      
      // Get unlock requirements
      const requirements = {
        'medium': 'Solve 10 puzzles in Easy to unlock Medium.',
        'hard': 'Solve 10 puzzles in Medium to unlock Hard.',
        'extreme': 'Solve 10 puzzles in Hard to unlock Extreme.'
      };
      
      const unlockRequirement = requirements[difficulty];
      if (unlockRequirement) {
        // console.log(`📢 Showing unlock message: ${unlockRequirement}`);
        setUnlockMessage(unlockRequirement);
        setShowUnlockMessage(true);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
          setShowUnlockMessage(false);
          setTimeout(() => setUnlockMessage(null), 300); // Clear after animation
        }, 4000);
      }
    }
  };

  const handleMasterSubTileClick = (difficulty) => {
    // console.log(`🧠 Master sub-tile clicked: ${difficulty}`);
    
    if (isMasterModeUnlocked(difficulty)) {
      // console.log(`✅ Master ${difficulty} mode is unlocked, navigating...`);
      // Navigate to the specific master mode page
      navigate(`/master/${difficulty}`, {
        state: { 
          user,
          accessToken,
          authInitialized
        }
      });
    } else {
      // console.log(`🔒 Master ${difficulty} mode is locked`);
      
      // Get unlock requirements for master mode
      const requirements = {
        'medium': 'Complete 10 Master Easy puzzles to unlock Master Medium.',
        'hard': 'Complete 10 Master Medium puzzles to unlock Master Hard.',
        'extreme': 'Complete 10 Master Hard puzzles to unlock Master Extreme.'
      };
      
      const unlockRequirement = requirements[difficulty];
      if (unlockRequirement) {
        // console.log(`📢 Showing master unlock message: ${unlockRequirement}`);
        setUnlockMessage(unlockRequirement);
        setShowUnlockMessage(true);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
          setShowUnlockMessage(false);
          setTimeout(() => setUnlockMessage(null), 300); // Clear after animation
        }, 4000);
      }
    }
  };

  const getUnlockTooltip = (difficulty) => {
    const progressData = getProgressForMode(difficulty);
    if (progressData) {
      // Backend-based tooltips with progress info
      const allProgress = progressBarsData.reduce((acc, p) => {
        acc[p.mode] = p;
        return acc;
      }, {});
      
      switch (difficulty) {
        case 'medium': 
          const easyProgress = allProgress.easy;
          return easyProgress ? 
            `Easy Progress: ${easyProgress.solved}/10 first-try successes (${easyProgress.percentage.toFixed(0)}% complete)` :
            'Solve 10 Easy puzzles on first try to unlock';
        case 'hard':
          const mediumProgress = allProgress.medium;
          return mediumProgress ?
            `Medium Progress: ${mediumProgress.solved}/10 first-try successes (${mediumProgress.percentage.toFixed(0)}% complete)` :
            'Solve 10 Medium puzzles on first try to unlock';
        case 'extreme':
          const hardProgress = allProgress.hard;
          return hardProgress ?
            `Hard Progress: ${hardProgress.solved}/10 first-try successes (${hardProgress.percentage.toFixed(0)}% complete)` :
            'Solve 10 Hard puzzles on first try to unlock';
        default:
          return '';
      }
    }
    
    // Fallback to old system
    const requirements = {
      medium: 'Solve 10 Easy puzzles on first try to unlock',
      hard: 'Solve 10 Medium puzzles on first try to unlock',
      extreme: 'Solve 10 Hard puzzles on first try to unlock'
    };
    return requirements[difficulty] || '';
  };

  const getPracticeTileColor = (difficulty) => {
    const colors = {
      easy: '#769656',
      medium: '#4a90e2',
      hard: '#e67e22',
      extreme: '#8e44ad'
    };
    return colors[difficulty] || '#769656';
  };

  // Show loading until auth is properly initialized
  if (!authInitialized) {
    return (
      <div style={{
        ...appStyle,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#b0a99f'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>⚡</div>
          <div>Initializing authentication...</div>
        </div>
      </div>
    );
  }

  if (activePanel === 'ranked') {
    return <RankedPanel user={user} accessToken={accessToken} onBack={handleBackFromRanked} />;
  }

  if (activePanel === 'elo') {
    return <EloPanel user={user} eloData={eloData} onBack={handleBackToDashboard} accessToken={accessToken} />;
  }

  return (
    <div style={appStyle}>
      {/* Unlock requirement message banner */}
      {unlockMessage && (
        <div style={unlockBannerStyle}>
          🔒 {unlockMessage}
        </div>
      )}

      <div style={headerStyle}>
        <h1 style={titleStyle}>
          MindRank Dashboard
        </h1>
        <p style={subtitleStyle}>
          Welcome back, {currentUsername || user?.email?.split('@')[0] || 'Player'}!
        </p>
        <button 
          style={logoutButtonStyle}
          onClick={onLogout}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={dashboardStyle}>
        {showPracticeSubTiles ? (
          <>
            <button 
              style={backButtonStyle}
              onClick={handleBackToDashboard}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ← Back to Main Dashboard
            </button>
            
            <h2 style={{
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '3rem', 
              color: '#ffffff', 
              fontFamily: 'Georgia, serif', 
              textAlign: 'center'
            }}>
              Choose Practice Difficulty
            </h2>

            <div style={subTilesContainerStyle}>
              {/* Easy Mode - Always unlocked */}
              <div 
                style={subTileStyle}
                onClick={() => handlePracticeSubTileClick('easy')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                <span style={{...subTileIconStyle, color: getPracticeTileColor('easy')}}>🟢</span>
                <h3 style={subTileTitleStyle}>Easy</h3>
                <p style={subTileDescriptionStyle}>
                  Direct truth/lie statements. Perfect for beginners to learn the basics.
                </p>
                {renderProgressBar('easy')}
              </div>

              {/* Medium Mode */}
              <div 
                style={isModeUnlocked('medium') ? subTileStyle : lockedTileStyle}
                onClick={() => handlePracticeSubTileClick('medium')}
                onMouseEnter={(e) => {
                  if (isModeUnlocked('medium')) {
                    Object.assign(e.currentTarget.style, tileHoverStyle);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isModeUnlocked('medium')) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                title={!isModeUnlocked('medium') ? getUnlockTooltip('medium') : ''}
              >
                {!isModeUnlocked('medium') && (
                  <span style={lockIconStyle}>🔒</span>
                )}
                <span style={{...subTileIconStyle, color: getPracticeTileColor('medium')}}>🔵</span>
                <h3 style={subTileTitleStyle}>Medium</h3>
                <p style={subTileDescriptionStyle}>
                  AND/OR logic statements. More complex reasoning required.
                </p>
                {renderProgressBar('medium')}
              </div>

              {/* Hard Mode */}
              <div 
                style={isModeUnlocked('hard') ? subTileStyle : lockedTileStyle}
                onClick={() => handlePracticeSubTileClick('hard')}
                onMouseEnter={(e) => {
                  if (isModeUnlocked('hard')) {
                    Object.assign(e.currentTarget.style, tileHoverStyle);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isModeUnlocked('hard')) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                title={!isModeUnlocked('hard') ? getUnlockTooltip('hard') : ''}
              >
                {!isModeUnlocked('hard') && (
                  <span style={lockIconStyle}>🔒</span>
                )}
                <span style={{...subTileIconStyle, color: getPracticeTileColor('hard')}}>🟠</span>
                <h3 style={subTileTitleStyle}>Hard</h3>
                <p style={subTileDescriptionStyle}>
                  IF/THEN conditional logic. Advanced reasoning skills needed.
                </p>
                {renderProgressBar('hard')}
              </div>

              {/* Extreme Mode */}
              <div 
                style={isModeUnlocked('extreme') ? subTileStyle : lockedTileStyle}
                onClick={() => handlePracticeSubTileClick('extreme')}
                onMouseEnter={(e) => {
                  if (isModeUnlocked('extreme')) {
                    Object.assign(e.currentTarget.style, tileHoverStyle);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isModeUnlocked('extreme')) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                title={!isModeUnlocked('extreme') ? getUnlockTooltip('extreme') : ''}
              >
                {!isModeUnlocked('extreme') && (
                  <span style={lockIconStyle}>🔒</span>
                )}
                <span style={{...subTileIconStyle, color: getPracticeTileColor('extreme')}}>🟣</span>
                <h3 style={subTileTitleStyle}>Extreme</h3>
                <p style={subTileDescriptionStyle}>
                  Self-reference, XOR, group constraints. For logic masters only.
                </p>
                {renderProgressBar('extreme')}
              </div>
            </div>
          </>
        ) : showMasterSubTiles ? (
          <>
            <button 
              style={backButtonStyle}
              onClick={handleBackToDashboard}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ← Back to Main Dashboard
            </button>
            
            <h2 style={{
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '1.5rem',
              marginTop: '-3.5rem', 
              color: '#ffffff', 
              fontFamily: 'Georgia, serif', 
              textAlign: 'center'
            }}>
              Choose Master Difficulty 🧠
            </h2>

            <div style={subTilesContainerStyle}>
              {/* Master Easy Mode - Always unlocked */}
              <div 
                style={{
                  ...subTileStyle,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
                  border: '1px solid rgba(34, 197, 94, 0.6)',
                  animation: 'neonGreenGlow 3s ease-in-out infinite alternate'
                }}
                onClick={() => handleMasterSubTileClick('easy')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)';
                }}
              >
                <span style={{...subTileIconStyle, color: '#ff6b35'}}>🔥</span>
                <h3 style={subTileTitleStyle}>Master Easy</h3>
                <p style={subTileDescriptionStyle}>
                  No takebacks! Direct truth/lie statements with permanent selections.
                </p>
                {renderMasterProgressBar('easy')}
              </div>

              {/* Master Medium Mode */}
              <div 
                style={{
                  ...(isMasterModeUnlocked('medium') ? subTileStyle : lockedTileStyle),
                  ...(isMasterModeUnlocked('medium') ? {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgba(59, 130, 246, 0.6)',
                    animation: 'neonBlueGlow 3s ease-in-out infinite alternate'
                  } : {})
                }}
                onClick={() => handleMasterSubTileClick('medium')}
                onMouseEnter={(e) => {
                  if (isMasterModeUnlocked('medium')) {
                    Object.assign(e.currentTarget.style, tileHoverStyle);
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isMasterModeUnlocked('medium')) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)';
                  }
                }}
                title={!isMasterModeUnlocked('medium') ? 'Complete 10 Master Easy puzzles to unlock' : ''}
              >
                {!isMasterModeUnlocked('medium') && (
                  <span style={lockIconStyle}>🔒</span>
                )}
                <span style={{...subTileIconStyle, color: '#ff6b35'}}>🔥</span>
                <h3 style={subTileTitleStyle}>Master Medium</h3>
                <p style={subTileDescriptionStyle}>
                  AND/OR logic with locked choices. Pure deductive reasoning required.
                </p>
                {renderMasterProgressBar('medium')}
              </div>

              {/* Master Hard Mode */}
              <div 
                style={{
                  ...(isMasterModeUnlocked('hard') ? subTileStyle : lockedTileStyle),
                  ...(isMasterModeUnlocked('hard') ? {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 146, 60, 0.3)',
                    border: '1px solid rgba(251, 146, 60, 0.6)',
                    animation: 'neonOrangeGlow 3s ease-in-out infinite alternate'
                  } : {})
                }}
                onClick={() => handleMasterSubTileClick('hard')}
                onMouseEnter={(e) => {
                  if (isMasterModeUnlocked('hard')) {
                    Object.assign(e.currentTarget.style, tileHoverStyle);
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 30px rgba(251, 146, 60, 0.7), 0 0 60px rgba(251, 146, 60, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isMasterModeUnlocked('hard')) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 146, 60, 0.3)';
                  }
                }}
                title={!isMasterModeUnlocked('hard') ? 'Complete 10 Master Medium puzzles to unlock' : ''}
              >
                {!isMasterModeUnlocked('hard') && (
                  <span style={lockIconStyle}>🔒</span>
                )}
                <span style={{...subTileIconStyle, color: '#ff6b35'}}>🔥</span>
                <h3 style={subTileTitleStyle}>Master Hard</h3>
                <p style={subTileDescriptionStyle}>
                  IF/THEN conditionals with permanent choices. Working memory mastery.
                </p>
                {renderMasterProgressBar('hard')}
              </div>

              {/* Master Extreme Mode */}
              <div 
                style={{
                  ...(isMasterModeUnlocked('extreme') ? subTileStyle : lockedTileStyle),
                  ...(isMasterModeUnlocked('extreme') ? {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    animation: 'neonRGBGlow 4s ease-in-out infinite'
                  } : {})
                }}
                onClick={() => handleMasterSubTileClick('extreme')}
                onMouseEnter={(e) => {
                  if (isMasterModeUnlocked('extreme')) {
                    Object.assign(e.currentTarget.style, tileHoverStyle);
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 30px rgba(255, 0, 128, 0.7), 0 0 60px rgba(0, 255, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isMasterModeUnlocked('extreme')) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)';
                  }
                }}
                title={!isMasterModeUnlocked('extreme') ? 'Complete 10 Master Hard puzzles to unlock' : ''}
              >
                {!isMasterModeUnlocked('extreme') && (
                  <span style={lockIconStyle}>🔒</span>
                )}
                <span style={{...subTileIconStyle, color: '#ff6b35'}}>🔥</span>
                <h3 style={subTileTitleStyle}>Master Extreme</h3>
                <p style={subTileDescriptionStyle}>
                  Ultimate challenge: advanced logic with no safety net.
                </p>
                {renderMasterProgressBar('extreme')}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 style={{
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '3rem', 
              color: '#ffffff', 
              fontFamily: 'Georgia, serif', 
              textAlign: 'center'
            }}>
              Choose Your Game Mode
            </h2>
            
            <div style={tilesContainerStyle}>
              {/* Practice Mode Tile */}
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 0.3s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleTileClick('practice')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  e.currentTarget.style.borderColor = '#769656';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(118, 150, 86, 0.1), transparent)',
                  animation: 'subtleZoom 8s ease-in-out infinite',
                  pointerEvents: 'none'
                }}></div>
                
                <span style={{...tileIconStyle, color: '#769656', animation: 'floatUp 3s ease-in-out infinite'}}>🎯</span>
                <h3 style={tileTitleStyle}>Practice Mode</h3>
                <p style={tileDescriptionStyle}>
                  Sharpen your skills with puzzles of varying difficulty. No pressure, just pure logic.
                </p>
              </div>

              {/* Master Mode Tile */}
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 0.4s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleTileClick('master')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  e.currentTarget.style.borderColor = '#ff6b35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(255, 107, 53, 0.1), transparent)',
                  animation: 'subtleZoom 6s ease-in-out infinite',
                  pointerEvents: 'none'
                }}></div>
                
                <span style={{...tileIconStyle, color: '#ff6b35', animation: 'floatUp 4s ease-in-out infinite'}}>🧠</span>
                <h3 style={tileTitleStyle}>Master Mode</h3>
                <p style={tileDescriptionStyle}>
                  🔒 No takebacks! Permanent selections challenge your pure logical reasoning skills.
                </p>
              </div>

              {/* Ranked Mode Tile */}
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 0.5s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleTileClick('ranked')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  e.currentTarget.style.borderColor = '#4a90e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(74, 144, 226, 0.1), transparent)',
                  animation: 'shimmer 4s ease-in-out infinite 1s',
                  pointerEvents: 'none'
                }}></div>
                
                <span style={{...tileIconStyle, color: '#4a90e2', animation: 'iconPulse 2s ease-in-out infinite 0.5s'}}>🏆</span>
                <h3 style={tileTitleStyle}>Ranked Mode</h3>
                <p style={tileDescriptionStyle}>
                  Compete against others and climb the leaderboard. Your performance affects your ELO rating.
                </p>
              </div>

              {/* ELO Tile */}
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 0.7s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => eloError ? fetchEloData() : handleTileClick('elo')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  const tierColor = eloData ? getTierInfo(eloData.elo).color : '#b0a99f';
                  e.currentTarget.style.borderColor = tierColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: `linear-gradient(45deg, transparent, ${eloData ? `${getTierInfo(eloData.elo).color}20` : 'rgba(176, 169, 159, 0.1)'}, transparent)`,
                  animation: 'shimmer 3s ease-in-out infinite 2s',
                  pointerEvents: 'none'
                }}></div>
                
                <span style={{
                  ...tileIconStyle,
                  color: eloError ? '#ff9999' : eloLoading ? '#b0a99f' : eloData ? getTierInfo(eloData.elo).color : '#b0a99f',
                  animation: eloLoading ? 'iconSpin 2s linear infinite' : 'iconPulse 2s ease-in-out infinite 1s'
                }}>
                  {eloError ? '⚠️' : eloLoading ? '⏳' : '⚡'}
                </span>
                <h3 style={tileTitleStyle}>
                  {eloError ? 'ELO Failed to Load' :
                   eloLoading ? 'Loading ELO...' :
                   eloData ? (eloData.is_in_placement ? 'Unranked - No ELO' : `${getTierInfo(eloData.elo).name} - ${eloData.elo} ELO`) : 'Loading ELO...'}
                </h3>
                <p style={tileDescriptionStyle}>
                  {eloError ? `${eloError}. Click to retry.` :
                   'View your stats, progress, and compare with other players on the leaderboard.'}
                </p>
              </div>

              {/* Change Username Tile */}
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 0.9s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => setShowUsernameModal(true)}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  e.currentTarget.style.borderColor = '#769656';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(118, 150, 86, 0.1), transparent)',
                  animation: 'shimmer 4s ease-in-out infinite 2.5s',
                  pointerEvents: 'none'
                }}></div>
                
                <span style={{
                  ...tileIconStyle,
                  color: '#769656',
                  animation: 'iconPulse 2s ease-in-out infinite 1.5s'
                }}>👤</span>
                <h3 style={tileTitleStyle}>Change Username</h3>
                <p style={tileDescriptionStyle}>
                  Customize your display name. Choose how others see you in the rankings.
                </p>
              </div>

              {/* Instructions/How to Play Tile */}
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 1.1s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => navigate('/instructions')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  e.currentTarget.style.borderColor = '#9c59e8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(156, 89, 232, 0.1), transparent)',
                  animation: 'shimmer 4s ease-in-out infinite 3s',
                  pointerEvents: 'none'
                }}></div>
                
                <span style={{
                  ...tileIconStyle,
                  color: '#9c59e8',
                  animation: 'iconPulse 2s ease-in-out infinite 1.8s'
                }}>📖</span>
                <h3 style={tileTitleStyle}>How to Play</h3>
                <p style={tileDescriptionStyle}>
                  Learn the rules and strategies for all game modes. Master the art of logical deduction.
                </p>
              </div>
            </div>

            {/* ELO Display Section */}
            {eloData && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                background: 'linear-gradient(135deg, #1a1816 0%, #262421 100%)',
                borderRadius: '12px',
                border: '1px solid #3d3a37',
                marginTop: '4rem'
              }}>
                {eloData.is_in_placement ? (
                  // Unranked user in placement matches
                  <>
                    <div style={{
                      fontSize: '1.125rem',
                      color: '#b0a99f',
                      marginBottom: '0.5rem'
                    }}>
                      Your Rating Status
                    </div>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: '#9c59e8',
                      marginBottom: '0.5rem',
                      fontFamily: 'Georgia, serif'
                    }}>
                      Unranked
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#b0a99f',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Complete placement matches to get your rank!
                    </div>
                    <PlacementProgress 
                      completed={eloData.placement_matches_completed} 
                      total={eloData.placement_matches_required}
                    />
                  </>
                ) : (
                  // Ranked user with ELO
                  <>
                    <div style={{
                      fontSize: '1.125rem',
                      color: '#b0a99f',
                      marginBottom: '0.5rem'
                    }}>
                      Your Current Rating
                    </div>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: getTierInfo(eloData.elo).color,
                      marginBottom: '0.5rem',
                      fontFamily: 'Georgia, serif'
                    }}>
                      {eloData.elo}
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: getTierInfo(eloData.elo).color,
                      fontWeight: '600'
                    }}>
                      {getTierInfo(eloData.elo).name}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Leaderboard Tile - Wide format */}
            <div style={{
              maxWidth: '1200px',
              margin: '3rem auto 0',
              padding: '0 1rem'
            }}>
              <div 
                style={{
                  ...tileStyle,
                  animation: 'headerSlideIn 0.8s ease-out 0.9s both',
                  backgroundImage: 'linear-gradient(135deg, #262421 0%, #312e2b 100%)',
                  border: '1px solid #3d3a37',
                  position: 'relative',
                  overflow: 'hidden',
                  maxWidth: 'none',
                  minWidth: 'auto',
                  flex: 'none',
                  width: '100%',
                  padding: '3rem 4rem'
                }}
                onClick={() => navigate('/leaderboard')}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, tileHoverStyle);
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #312e2b 0%, #3d3a37 100%)';
                  e.currentTarget.style.borderColor = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #262421 0%, #312e2b 100%)';
                  e.currentTarget.style.borderColor = '#3d3a37';
                }}
              >
                {/* Animated background effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent)',
                  animation: 'shimmer 5s ease-in-out infinite 1.5s',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2rem'
                }}>
                  <span style={{
                    ...tileIconStyle,
                    color: '#FFD700',
                    animation: 'iconPulse 2.5s ease-in-out infinite 0.7s',
                    fontSize: '4rem'
                  }}>🏅</span>
                  
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{
                      ...tileTitleStyle,
                      fontSize: '2rem',
                      marginBottom: '0.5rem'
                    }}>Leaderboard</h3>
                    <p style={{
                      ...tileDescriptionStyle,
                      fontSize: '1.125rem',
                      maxWidth: '600px'
                    }}>
                      See how you rank against other players. Climb the leaderboard and prove your logic mastery!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <UsernameModal
          currentUsername={currentUsername}
          accessToken={accessToken}
          onClose={() => setShowUsernameModal(false)}
          onUpdate={(newUsername) => {
            setCurrentUsername(newUsername);
            setShowUsernameModal(false);
          }}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes tileAppear {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        @keyframes iconPulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.1); 
          }
        }
        
        @keyframes iconSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fireShimmer {
          0%, 100% { 
            transform: translateX(-100%); 
            opacity: 0;
          }
          50% { 
            transform: translateX(0%); 
            opacity: 1;
          }
        }
        
        @keyframes neonGreenGlow {
          0% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3);
          }
          100% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.5), 0 0 90px rgba(34, 197, 94, 0.3);
          }
        }
        
        @keyframes neonBlueGlow {
          0% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3);
          }
          100% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5), 0 0 90px rgba(59, 130, 246, 0.3);
          }
        }
        
        @keyframes neonOrangeGlow {
          0% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 146, 60, 0.3);
          }
          100% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 30px rgba(251, 146, 60, 0.8), 0 0 60px rgba(251, 146, 60, 0.5), 0 0 90px rgba(251, 146, 60, 0.3);
          }
        }
        
        @keyframes neonRGBGlow {
          0% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 0, 0, 0.6), 0 0 40px rgba(255, 0, 0, 0.4);
            border-color: rgba(255, 0, 0, 0.8);
          }
          16.66% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.4);
            border-color: rgba(255, 165, 0, 0.8);
          }
          33.33% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 0, 0.6), 0 0 40px rgba(255, 255, 0, 0.4);
            border-color: rgba(255, 255, 0, 0.8);
          }
          50% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 0, 0.6), 0 0 40px rgba(0, 255, 0, 0.4);
            border-color: rgba(0, 255, 0, 0.8);
          }
          66.66% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4);
            border-color: rgba(0, 255, 255, 0.8);
          }
          83.33% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(128, 0, 255, 0.6), 0 0 40px rgba(128, 0, 255, 0.4);
            border-color: rgba(128, 0, 255, 0.8);
          }
          100% { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 0, 128, 0.6), 0 0 40px rgba(255, 0, 128, 0.4);
            border-color: rgba(255, 0, 128, 0.8);
          }
        }
      `}</style>
    </div>
  );
} 