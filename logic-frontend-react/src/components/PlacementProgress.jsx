import React from 'react';

export default function PlacementProgress({ completed, total, onClose }) {
  // Chess.com style colors
  const containerStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    border: '1px solid #5d7c3f',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const progressContainerStyle = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  };

  const matchBoxStyle = (isCompleted) => ({
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '4px',
    border: '2px solid #ffffff',
    backgroundColor: isCompleted ? '#4ade80' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: isCompleted ? '#ffffff' : '#ffffff',
    transition: 'all 0.2s ease'
  });

  const closeButtonStyle = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  };

  const infoStyle = {
    fontSize: '0.9rem',
    opacity: 0.9,
    marginTop: '0.5rem'
  };

  if (completed >= total) {
    return null; // Don't show after placement is complete
  }

  return (
    <div style={containerStyle}>
      {onClose && (
        <button 
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
        >
          ×
        </button>
      )}
      
      <div style={titleStyle}>
        🎯 Placement Matches
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          ({completed}/{total})
        </span>
      </div>
      
      <div style={progressContainerStyle}>
        {[...Array(total)].map((_, index) => {
          const isCompleted = index < completed;
          return (
            <div key={index} style={matchBoxStyle(isCompleted)}>
              {isCompleted ? '✓' : index + 1}
            </div>
          );
        })}
      </div>
      
      <div style={infoStyle}>
        {completed === 0 
          ? "Complete 5 placement matches to get your rank!"
          : `${total - completed} more match${total - completed !== 1 ? 'es' : ''} to get ranked!`
        }
      </div>
    </div>
  );
} 