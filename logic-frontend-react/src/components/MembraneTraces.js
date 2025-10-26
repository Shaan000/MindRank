import React, { useRef, useEffect } from 'react';

const MembraneTraces = ({ neurons, membranePotentials, timeData, hideTitle = false, hideBorder = false, currentMode = null }) => {
  const canvasRefs = useRef({});

  const containerStyle = {
    background: '#1a1816',
    border: 'none',
    borderRadius: '8px',
    padding: hideBorder ? '0.5rem' : '1rem',
    marginBottom: '1rem',
    boxShadow: hideBorder ? 'none' : '0 0 8px rgba(74, 222, 128, 0.6), 0 0 16px rgba(74, 222, 128, 0.3)',
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
    gridTemplateColumns: window.innerWidth < 768 ? 'repeat(auto-fit, minmax(250px, 1fr))' : 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: window.innerWidth < 768 ? '0.5rem' : '1rem'
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
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '0.5rem'
  };

  const canvasStyle = {
    width: '100%',
    height: window.innerWidth < 768 ? '100px' : '120px',
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
    
    // Use a wide fixed range to ensure traces fill the canvas
    const minVoltage = -100;
    const maxVoltage = -20;
    const voltageRange = maxVoltage - minVoltage;
    
    // Set up drawing parameters with subtle glow effect
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    
    // Draw the trace
    neuronData.forEach((point, index) => {
      const x = (index / (neuronData.length - 1)) * width;
      // Scale voltage to fill the canvas properly
      const normalizedVoltage = (point - minVoltage) / voltageRange;
      const y = height - (normalizedVoltage * height);
      
      // Clamp y to canvas bounds
      const clampedY = Math.max(0, Math.min(height, y));
      
      if (index === 0) {
        ctx.moveTo(x, clampedY);
      } else {
        ctx.lineTo(x, clampedY);
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
    const thresholdY = height - ((-50 - minVoltage) / voltageRange) * height; // -50mV threshold
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw resting potential line
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    const restingY = height - ((-65 - minVoltage) / voltageRange) * height; // -65mV resting potential
    ctx.moveTo(0, restingY);
    ctx.lineTo(width, restingY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Update traces when data changes
  useEffect(() => {
    neurons.forEach(neuron => {
      const canvas = canvasRefs.current[neuron.id];
      if (canvas) {
        drawTrace(neuron.id, canvas);
      }
    });
  }, [neurons, timeData]);

  return (
    <div style={containerStyle}>
      {!hideTitle && <h3 style={titleStyle}>Membrane Potential Traces</h3>}
      <div style={tracesGridStyle}>
        {neurons.map(neuron => {
          const currentPotential = membranePotentials[neuron.id] || -65.0;
          
          // Determine if neuron is active based on pattern
          let isActive = true;
          if (currentMode === 'A') {
            isActive = neuron.id === 'I1' || neuron.id === 'I3' || neuron.id === 'I5' || neuron.type !== 'Input';
          } else if (currentMode === 'B') {
            isActive = neuron.id === 'I2' || neuron.id === 'I4' || neuron.id === 'I6' || neuron.type !== 'Input';
          }
          
          return (
            <div key={neuron.id} style={{
              ...traceContainerStyle,
              opacity: isActive ? 1 : 0.5
            }}>
              <div style={{
                ...traceLabelStyle,
                color: isActive ? '#ffffff' : '#666666'
              }}>
                {neuron.label} Membrane Trace {!isActive && '(Inactive)'}
              </div>
              <div style={{
                position: 'relative',
                display: 'inline-block'
              }}>
                <canvas
                  ref={el => canvasRefs.current[neuron.id] = el}
                  style={{
                    ...canvasStyle,
                    filter: isActive ? 'none' : 'grayscale(100%)'
                  }}
                  width={400}
                  height={120}
                />
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  color: isActive ? '#ffffff' : '#666666',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  pointerEvents: 'none'
                }}>
                  {isActive ? `${currentPotential.toFixed(1)}mV` : 'Inactive'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembraneTraces;
