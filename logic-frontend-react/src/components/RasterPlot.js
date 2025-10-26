import React, { useRef, useEffect, useState } from 'react';

const RasterPlot = ({ selectedNeurons, spikes, timeData, outputFiringTime, isReset, isSimulationRunning, currentMode, hideTitle = false, hideThreshold = false }) => {
  const canvasRef = useRef(null);
  const [simulationTime, setSimulationTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(null);

  const containerStyle = {
    background: '#1a1816',
    border: 'none',
    borderRadius: '8px',
    padding: hideTitle ? '0.5rem' : '1rem',
    marginBottom: '1rem',
    boxShadow: hideTitle ? 'none' : '0 0 8px rgba(74, 222, 128, 0.6), 0 0 16px rgba(74, 222, 128, 0.3)',
    position: 'relative'
  };

  const titleStyle = {
    color: '#ffffff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textAlign: 'center'
  };

  const canvasStyle = {
    width: '100%',
    maxWidth: '900px',
    height: '250px',
    background: '#1a1816',
    border: '1px solid #3d3a37',
    borderRadius: '4px',
    boxShadow: '0 0 3px rgba(74, 222, 128, 0.5), inset 0 0 2px rgba(74, 222, 128, 0.3)',
    imageRendering: 'pixelated',
    display: 'block',
    margin: '0 auto'
  };

  // Generate realistic spike patterns
  const generateRealisticSpikes = (neuron, currentTime) => {
    const spikes = [];
    
    // Check if this neuron is active for the current pattern
    let isActive = false;
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
    
    // Only generate spikes for active neurons
    if (!isActive && neuron.type === 'Input') {
      return spikes; // Return empty array for inactive input neurons
    }
    
    if (currentMode === 'Alzheimer') {
      // Alzheimer simulation: Use actual spike data from the simulation
      if (spikes && spikes[neuron.id]) {
        // Use the actual spikes from the Alzheimer's simulation
        return spikes[neuron.id];
      }
      
      // Fallback: Generate realistic Alzheimer's patterns if no spike data
      const degradationLevel = Math.min(1, currentTime / 30); // Gradual degradation over 30 seconds
      
      if (neuron.type === 'Input') {
        // Input neurons: constant activity (I1, I2)
        for (let t = 0; t < currentTime; t += 0.1) {
          const baseProbability = 0.03; // Constant activity for input neurons
          if (Math.random() < baseProbability) {
            spikes.push(t);
          }
        }
      } else if (neuron.type === 'Excitatory' || neuron.type === 'Inhibitory') {
        // Hidden neurons (H1, H2): irregular activity patterns
        for (let t = 0; t < currentTime; t += 0.1) {
          // Create irregular patterns with bursts and pauses
          const irregularityFactor = Math.random();
          let spikeProbability = 0;
          
          if (irregularityFactor < 0.1) {
            // 10% chance of burst firing
            spikeProbability = 0.08;
          } else if (irregularityFactor < 0.3) {
            // 20% chance of long pause
            spikeProbability = 0.005;
          } else {
            // 70% chance of normal irregular firing
            spikeProbability = 0.02 + Math.random() * 0.02;
          }
          
          if (Math.random() < spikeProbability) {
            spikes.push(t);
          }
        }
      } else if (neuron.type === 'Output') {
        // Output neuron: Use actual spike data from Alzheimer's simulation
        // The real spikes come from the 3-10 second random intervals in the simulation
        return [];
      }
    } else {
      // Normal simulation patterns
      if (neuron.type === 'Input') {
        // Input neurons: occasional random spikes throughout
        for (let t = 0; t < currentTime; t += 0.1) {
          if (Math.random() < 0.02) { // 2% chance per 0.1s
            spikes.push(t);
          }
        }
      } else if (neuron.type === 'Excitatory') {
        // Excitatory neurons: more active as time progresses
        const activityLevel = Math.min(1, currentTime / 15);
        for (let t = 0; t < currentTime; t += 0.1) {
          const spikeProbability = 0.01 + (activityLevel * 0.03);
          if (Math.random() < spikeProbability) {
            spikes.push(t);
          }
        }
      } else if (neuron.type === 'Inhibitory') {
        // Inhibitory neurons: moderate activity
        for (let t = 0; t < currentTime; t += 0.1) {
          if (Math.random() < 0.015) {
            spikes.push(t);
          }
        }
      } else if (neuron.type === 'Output') {
        // Output neuron: irregular firing with spikes that vanish and reappear
        // Create a pattern where spikes appear for a short time, then disappear
        let lastSpikeTime = 0;
        const spikeDuration = 2; // Spikes last for 2 seconds
        const minInterval = 3;
        const maxInterval = 10;
        
        for (let t = 0; t < currentTime; t += 0.1) {
          // Check if enough time has passed since last spike (3-10 seconds)
          if (t - lastSpikeTime >= minInterval + Math.random() * (maxInterval - minInterval)) {
            // Add spikes that will be visible for a short duration
            const burstCount = 1 + Math.floor(Math.random() * 2); // 1-2 spikes
            for (let i = 0; i < burstCount; i++) {
              const spikeTime = t + i * 0.1;
              // Only add spike if it's within the visible duration
              if (currentTime - spikeTime <= spikeDuration) {
                spikes.push(spikeTime);
              }
            }
            lastSpikeTime = t;
          }
        }
      }
    }
    
    return spikes;
  };

  // Draw raster plot
  const drawRaster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set high DPI resolution to fix fuzziness
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = 900;
    const canvasHeight = 250;
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Set up drawing parameters
    const neuronHeight = canvasHeight / selectedNeurons.length;
    const timeWindow = 20; // 20 seconds window
    
    // Draw time grid
    ctx.strokeStyle = '#3d3a37';
    ctx.lineWidth = 1;
    for (let i = 0; i <= timeWindow; i += 5) {
      const x = (i / timeWindow) * canvasWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    
    // Draw neuron separators
    ctx.strokeStyle = '#3d3a37';
    ctx.lineWidth = 1;
    for (let i = 1; i < selectedNeurons.length; i++) {
      const y = i * neuronHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
    
    // Draw spikes with scrolling window
    const windowStart = Math.max(0, simulationTime - timeWindow);
    
    selectedNeurons.forEach((neuron, index) => {
      const y = index * neuronHeight + neuronHeight / 2;
      
      // Use actual spike data from the simulation, or generate realistic spikes as fallback
      let neuronSpikes = [];
      if (currentMode === 'Alzheimer' && spikes && spikes[neuron.id]) {
        // Use actual spike data from Alzheimer's simulation
        neuronSpikes = spikes[neuron.id];
        
        // For output neuron, hardcode spike visibility to match golden hue exactly
        if (neuron.id === 'Out') {
          // Check if there's a recent spike that should trigger the golden hue
          const recentSpikes = neuronSpikes.filter(spikeTime => {
            const timeSinceSpike = Math.abs(simulationTime - spikeTime);
            return timeSinceSpike < 0.5; // Same 0.5 second window as golden hue
          });
          
          // Only show spikes if there's a recent spike (same logic as golden hue)
          if (recentSpikes.length > 0) {
            // Show the spike for the exact duration of the golden hue
            neuronSpikes = recentSpikes;
          } else {
            // No spike visible when no golden hue
            neuronSpikes = [];
          }
        }
      } else {
        // Generate realistic spikes for normal simulation
        neuronSpikes = generateRealisticSpikes(neuron, simulationTime);
      }
      
      // Only show spikes within the current time window
      const visibleSpikes = neuronSpikes.filter(spikeTime => 
        spikeTime >= windowStart && spikeTime <= simulationTime
      );
      
      visibleSpikes.forEach(spikeTime => {
        // Calculate relative position within the window
        const relativeTime = spikeTime - windowStart;
        const x = (relativeTime / timeWindow) * canvasWidth;
        
        // Color based on neuron type
        if (neuron.type === 'Input') {
          ctx.strokeStyle = '#4ade80';
        } else if (neuron.type === 'Excitatory') {
          ctx.strokeStyle = '#ff8c00';
        } else if (neuron.type === 'Inhibitory') {
          ctx.strokeStyle = '#ff6b6b';
        } else if (neuron.type === 'Output') {
          ctx.strokeStyle = '#ff6b6b';
        }
        
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    });
    
    // Draw output firing threshold line (around 13-16 seconds) - only for normal simulation
    if (!hideThreshold) {
      const thresholdTime = 14.5; // Middle of 13-16 second window
      if (thresholdTime >= windowStart && thresholdTime <= simulationTime) {
        const relativeTime = thresholdTime - windowStart;
        const x = (relativeTime / timeWindow) * canvasWidth;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // Draw neuron labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    selectedNeurons.forEach((neuron, index) => {
      const y = index * neuronHeight + neuronHeight / 2;
      ctx.fillText(neuron.label, 30, y + 4);
    });
    
  };

  // Reset simulation time when reset is triggered
  useEffect(() => {
    if (isReset) {
      setSimulationTime(0);
      setPausedTime(null);
    }
  }, [isReset]);

  // Reset simulation time when pattern changes
  useEffect(() => {
    setSimulationTime(0);
    setPausedTime(null);
  }, [currentMode]);

  // Simulation timer - only run when simulation is active
  useEffect(() => {
    if (!isSimulationRunning) {
      // Save current time when pausing, don't reset to 0
      if (simulationTime > 0 && !pausedTime) {
        setPausedTime(simulationTime);
      }
      return;
    }
    
    // Restore paused time when resuming
    if (pausedTime && simulationTime === 0) {
      setSimulationTime(pausedTime);
      setPausedTime(null);
    }
    
    const interval = setInterval(() => {
      setSimulationTime(prev => prev + 0.1);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isSimulationRunning, currentMode, simulationTime, pausedTime]); // Reset when pattern changes

  // Update raster plot when data changes
  useEffect(() => {
    drawRaster();
  }, [selectedNeurons, simulationTime]);

  return (
    <div style={containerStyle}>
      {!hideTitle && <h3 style={titleStyle}>Neural Activity Raster Plot</h3>}
      <canvas
        ref={canvasRef}
        style={canvasStyle}
      />
      <div style={{color: '#b0a99f', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center'}}>
        <span style={{color: '#4ade80'}}>●</span> Input neurons &nbsp;&nbsp;
        <span style={{color: '#ff8c00'}}>●</span> Excitatory neurons &nbsp;&nbsp;
        <span style={{color: '#ff6b6b'}}>●</span> Inhibitory neurons &nbsp;&nbsp;
        <span style={{color: '#ff6b6b'}}>●</span> Output neuron
        {!hideThreshold && <span>&nbsp;&nbsp;<span style={{color: '#ff6b6b'}}>┃</span> Output firing threshold</span>}
      </div>
    </div>
  );
};

export default RasterPlot;
