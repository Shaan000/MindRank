import React from 'react';

const IndividualNeuronStates = ({ neurons, membranePotentials, currentMode }) => {
  const containerStyle = {
    background: '#1a1816',
    border: 'none',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    boxShadow: '0 0 8px rgba(74, 222, 128, 0.6), 0 0 16px rgba(74, 222, 128, 0.3)',
    position: 'relative'
  };

  const titleStyle = {
    color: '#ffffff',
    fontSize: window.innerWidth < 768 ? '1rem' : '1.2rem',
    fontWeight: 'bold',
    marginBottom: window.innerWidth < 768 ? '0.5rem' : '1rem',
    textAlign: 'center'
  };

  const neuronContainerStyle = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : window.innerWidth < 1024 ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
    gridTemplateRows: window.innerWidth < 768 ? 'repeat(auto-fit, 1fr)' : 'repeat(3, 1fr)',
    gap: window.innerWidth < 768 ? '1rem' : '1.5rem',
    padding: window.innerWidth < 768 ? '0.5rem' : '1rem',
    minHeight: window.innerWidth < 768 ? 'auto' : '400px',
    alignItems: 'center',
    justifyItems: 'center'
  };

  const neuronStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const neuronCircleStyle = (neuron) => {
    // Determine colors based on neuron type
    let backgroundColor = '#4ade80'; // Default green for input
    let shadowColor = 'rgba(74, 222, 128, 0.8)';
    let shadowColorOuter = 'rgba(74, 222, 128, 0.4)';
    
    if (neuron.type === 'Excitatory') {
      backgroundColor = '#ff8c00'; // Orange
      shadowColor = 'rgba(255, 140, 0, 0.8)';
      shadowColorOuter = 'rgba(255, 140, 0, 0.4)';
    } else if (neuron.type === 'Inhibitory') {
      backgroundColor = '#ff6b6b'; // Red
      shadowColor = 'rgba(255, 107, 107, 0.8)';
      shadowColorOuter = 'rgba(255, 107, 107, 0.4)';
    } else if (neuron.type === 'Output') {
      backgroundColor = '#ffd700'; // Golden
      shadowColor = 'rgba(255, 215, 0, 0.8)';
      shadowColorOuter = 'rgba(255, 215, 0, 0.4)';
    }
    
    return {
      width: window.innerWidth < 768 ? '50px' : '60px',
      height: window.innerWidth < 768 ? '50px' : '60px',
      borderRadius: '50%',
      background: backgroundColor,
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: window.innerWidth < 768 ? '0.7rem' : '0.9rem',
      fontWeight: 'bold',
      boxShadow: `0 0 6px ${shadowColor}, 0 0 12px ${shadowColorOuter}`,
      position: 'relative'
    };
  };

  const neuronLabelStyle = {
    color: '#4ade80',
    fontSize: window.innerWidth < 768 ? '0.6rem' : '0.8rem',
    textAlign: 'center',
    lineHeight: '1.2'
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Individual Neuron States</h3>
      <div style={neuronContainerStyle}>
        {(() => {
          // Organize neurons in a logical grid layout
          const inputNeurons = neurons.filter(n => n.type === 'Input');
          const hiddenNeurons = neurons.filter(n => n.type === 'Excitatory' || n.type === 'Inhibitory');
          const outputNeurons = neurons.filter(n => n.type === 'Output');
          
          // Arrange in grid: Input row, Hidden rows, Output row
          const organizedNeurons = [
            ...inputNeurons, // I1-I6 (6 neurons)
            ...hiddenNeurons.slice(0, 6), // H1-H6 (6 neurons)
            ...hiddenNeurons.slice(6), // H7-H10 (4 neurons)
            ...outputNeurons // Out (1 neuron)
          ];
          
          return organizedNeurons.map((neuron, index) => {
          const potential = membranePotentials[neuron.id] || -65.0;
          
          // Check if this neuron is active for the current pattern
          let isActive = true;
          if (currentMode === 'A') {
            // Pattern A: I1, I3, I5 are active
            isActive = neuron.id === 'I1' || neuron.id === 'I3' || neuron.id === 'I5' || 
                      neuron.type !== 'Input';
          } else if (currentMode === 'B') {
            // Pattern B: I2, I4, I6 are active
            isActive = neuron.id === 'I2' || neuron.id === 'I4' || neuron.id === 'I6' || 
                      neuron.type !== 'Input';
          } else if (currentMode === 'Alzheimer') {
            // Alzheimer: All neurons are active but with degradation
            isActive = true;
          }
          
          // Style for inactive neurons
          const inactiveStyle = {
            opacity: 0.3,
            filter: 'grayscale(100%)'
          };
          
          return (
            <div key={neuron.id} style={{...neuronStyle, ...(!isActive ? inactiveStyle : {})}}>
              <div style={neuronCircleStyle(neuron)}>
                <div>{neuron.label}</div>
              </div>
              <div style={neuronLabelStyle}>
                <div>{neuron.name}</div>
                <div>{neuron.type}</div>
                <div>{potential.toFixed(1)}mV</div>
                {!isActive && <div style={{color: '#666', fontSize: '0.6rem'}}>Inactive</div>}
              </div>
            </div>
          );
          });
        })()}
      </div>
    </div>
  );
};

export default IndividualNeuronStates;
