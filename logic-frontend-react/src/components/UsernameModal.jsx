import { useState } from 'react';

export default function UsernameModal({ currentUsername, accessToken, onClose, onUpdate }) {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (name) => {
    if (name.length < 3 || name.length > 20) {
      return 'Must be 3–20 characters.';
    }
    if (!/^[A-Za-z0-9_]+$/.test(name)) {
      return 'Only letters, numbers, and underscores allowed.';
    }
    return '';
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const validationError = validate(trimmedUsername);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/user/username`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username: trimmedUsername })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Update failed');
        return;
      }

      onUpdate(data.username);
      onClose();
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Chess.com inspired styling
  const modalBackdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid #3d3a37',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textAlign: 'center'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #3d3a37',
    background: '#1a1816',
    color: '#ffffff',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const inputFocusStyle = {
    borderColor: '#769656'
  };

  const errorStyle = {
    color: '#ff6b6b',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center'
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem'
  };

  const cancelButtonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #3d3a37',
    background: 'transparent',
    color: '#b0a99f',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const saveButtonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#769656',
    color: '#ffffff',
    fontSize: '1rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: isLoading ? 0.7 : 1
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Change Username</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => e.target.style.borderColor = '#3d3a37'}
          placeholder="Enter new username"
          style={inputStyle}
          disabled={isLoading}
          autoFocus
        />
        <div style={{ fontSize: '0.875rem', color: '#b0a99f', marginBottom: '1rem' }}>
          3-20 characters • Letters, numbers, and underscores only
        </div>
        {error && <div style={errorStyle}>{error}</div>}
        <div style={buttonContainerStyle}>
          <button 
            onClick={onClose} 
            style={cancelButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            style={saveButtonStyle}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = '#5d7c3f';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.background = '#769656';
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
} 