import React, { useRef, useEffect } from 'react';

const SelectiveMembranePotentials = ({ selectedNeurons, membranePotentials, timeData, currentMode }) => {
  const canvasRefs = useRef({});

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
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textAlign: 'center'
  };

  const tracesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  };

  const traceContainerStyle = {
    background: '#262421',
    border: '1px solid #3d3a37',
    borderRadius: '6px',
    padding: '0.5rem',
    boxShadow: '0 0 4px rgba(74, 222, 128, 0.4), inset 0 0 2px rgba(74, 222, 128, 0.2)',
    position: 'relative'
  };

  const traceLabelStyle = {
    color: '#ffffff',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  };

  const canvasStyle = {
    width: '100%',
    height: '150px',
    background: '#1a1816',
    border: '1px solid #3d3a37',
    borderRadius: '4px',
    boxShadow: '0 0 3px rgba(74, 222, 128, 0.5), inset 0 0 2px rgba(74, 222, 128, 0.3)'
  };

  // Draw membrane potential trace on canvas
  const drawTrace = (neuronId, canvas) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(0, 0, width, height);
    
    // Get membrane potential data for this neuron
    const neuronData = timeData[neuronId] || [];
    if (neuronData.length === 0) return;
    
    // Set up drawing parameters with subtle glow effect
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    
    // Draw the trace
    neuronData.forEach((point, index) => {
      const x = (index / (neuronData.length - 1)) * width;
      const y = height - ((point + 100) / 50) * height; // Scale from -100mV to 0mV
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Reset shadow for other lines
    ctx.shadowBlur = 0;
    
    // Draw threshold line
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height - ((-50 + 100) / 50) * height); // -50mV threshold
    ctx.lineTo(width, height - ((-50 + 100) / 50) * height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw resting potential line
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, height - ((-65 + 100) / 50) * height); // -65mV resting
    ctx.lineTo(width, height - ((-65 + 100) / 50) * height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add current potential value
    const currentPotential = membranePotentials[neuronId] || -65.0;
    ctx.fillStyle = '#4ade80';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentPotential.toFixed(1)}mV`, width - 5, 15);
  };

  // Update traces when data changes
  useEffect(() => {
    selectedNeurons.forEach(neuron => {
      const canvas = canvasRefs.current[neuron.id];
      if (canvas) {
        drawTrace(neuron.id, canvas);
      }
    });
  }, [selectedNeurons, timeData, membranePotentials]);

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Selected Neuron Membrane Potentials</h3>
      <div style={tracesGridStyle}>
        {selectedNeurons.map(neuron => {
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
            <div key={neuron.id} style={{...traceContainerStyle, ...(!isActive ? inactiveStyle : {})}}>
              <div style={traceLabelStyle}>
                {neuron.label} - {neuron.name} ({neuron.type})
                {!isActive && <span style={{color: '#666', fontSize: '0.8rem'}}> - Inactive</span>}
              </div>
              <canvas
                ref={el => canvasRefs.current[neuron.id] = el}
                style={canvasStyle}
                width={250}
                height={150}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectiveMembranePotentials;
