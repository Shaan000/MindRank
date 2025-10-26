import React, { useState, useRef, useEffect, useCallback } from 'react';

// Fixed Network Configuration
const NETWORK_CONFIG = {
  INPUTS: 6,
  HIDDEN: 10,
  OUTPUTS: 1,
  MAX_PARTICLES: 20
};

// Pattern Configuration
const PATTERNS = {
  A: { activeInputs: [0, 2, 4] }, // Inputs 1, 3, 5
  B: { activeInputs: [1, 3, 5] }  // Inputs 2, 4, 6
};

// Fixed Network Component
function FixedNetwork({ currentMode, onModeChange, analyzeMode, analyzeSynapses, exitAnalyze, onCaptureEdgeStrengths, capturedEdgeStrengths, goldenFlash }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [particles, setParticles] = useState([]);
  const [edgeStrengths, setEdgeStrengths] = useState(new Map());
  const [elapsedTime, setElapsedTime] = useState({ A: 0, B: 0 });
  const [outputGateOpen, setOutputGateOpen] = useState(true);
  const [reacquireCountdown, setReacquireCountdown] = useState(0);
  const [outputFlash, setOutputFlash] = useState({ active: false, startTime: 0 });
  const [draggedNeuron, setDraggedNeuron] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(null);
  const [trainingStartTime, setTrainingStartTime] = useState(null);
  
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  const particleIdRef = useRef(0);

  // Fixed neuron positions
  const [neuronPositions, setNeuronPositions] = useState({});

  // Initialize fixed positions
  useEffect(() => {
    if (dimensions.width > 0) {
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const positions = {};

      // Input neurons (left side) - FARTHER LEFT AND SLIGHTLY UP
      for (let i = 0; i < NETWORK_CONFIG.INPUTS; i++) {
        const y = centerY - 200 + (i * 60); // Moved up by 50px
        positions[i] = { x: centerX - 350, y: y, type: 'input' }; // Moved left by 100px
      }

      // Hidden neurons (center) - MUCH MORE SPREAD OUT
      for (let i = 0; i < NETWORK_CONFIG.HIDDEN; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = centerX - 200 + (col * 100); // Much wider spacing: 100px between columns
        const y = centerY - 200 + (row * 100); // Much taller spacing: 100px between rows
        positions[NETWORK_CONFIG.INPUTS + i] = { 
          x: x, 
          y: y, 
          type: i % 4 === 0 ? 'inhibitory' : 'excitatory' 
        };
      }

      // Output neuron (right side)
      positions[NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN] = { 
        x: centerX + 250, 
        y: centerY, 
        type: 'output' 
      };

      setNeuronPositions(positions);
    }
  }, [dimensions.width, dimensions.height]);

  // Handle canvas resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        setDimensions({
          width: rect.width * dpr,
          height: rect.height * dpr
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // IMMEDIATE particle cleanup when mode changes
  useEffect(() => {
    if (currentMode && PATTERNS[currentMode]) {
      const activeInputs = PATTERNS[currentMode].activeInputs;
      setParticles(prev => prev.filter(particle => activeInputs.includes(particle.from)));
    } else if (currentMode === 'Alzheimer') {
      // For Alzheimer mode, clear all particles
      setParticles([]);
    }
  }, [currentMode]);

  // Capture edge strengths when analyze mode is activated
  useEffect(() => {
    if (analyzeMode && onCaptureEdgeStrengths) {
      onCaptureEdgeStrengths(new Map(edgeStrengths));
      setParticles([]); // Clear all particles
    }
  }, [analyzeMode, edgeStrengths, onCaptureEdgeStrengths]);

  // Mode switching logic
  const switchMode = useCallback((newMode) => {
    if (currentMode && currentMode !== newMode) {
      // For Alzheimer mode, don't do reacquire logic
      if (newMode === 'Alzheimer') {
        setParticles([]);
        setOutputGateOpen(true);
        return;
      }
      
      // Calculate reacquire time for normal modes
      if (PATTERNS[currentMode]) {
        const reacquireMs = Math.round(elapsedTime[currentMode] * 1.5);
        setReacquireCountdown(reacquireMs);
        
        // Clear particles immediately
        setParticles([]);
        
        // Close output gate
        setOutputGateOpen(false);
        
        // Start reacquire countdown
        const countdownInterval = setInterval(() => {
          setReacquireCountdown(prev => {
            if (prev <= 100) {
              clearInterval(countdownInterval);
              setOutputGateOpen(true);
              return 0;
            }
            return prev - 100;
          });
        }, 100);
      }
    }
  }, [currentMode, elapsedTime]);

  // Animation loop
  const animate = useCallback((timestamp) => {
    if (!canvasRef.current || !dimensions.width) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw connections
    ctx.strokeStyle = '#3d3a37';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // Draw all possible connections
    Object.keys(neuronPositions).forEach(fromId => {
      const fromPos = neuronPositions[fromId];
      Object.keys(neuronPositions).forEach(toId => {
        if (fromId !== toId) {
          const toPos = neuronPositions[toId];
          const fromIndex = parseInt(fromId);
          const toIndex = parseInt(toId);
          
          // Only draw connections from inputs to hidden, and hidden to output
          const shouldConnect = (fromIndex < NETWORK_CONFIG.INPUTS && toIndex >= NETWORK_CONFIG.INPUTS && toIndex < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN) ||
                               (fromIndex >= NETWORK_CONFIG.INPUTS && fromIndex < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN && toIndex === NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN);
          
          if (shouldConnect) {
            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(toPos.x, toPos.y);
            ctx.stroke();
          }
        }
      });
    });

    ctx.globalAlpha = 1;

    // Draw neurons
    Object.keys(neuronPositions).forEach(id => {
      const pos = neuronPositions[id];
      const index = parseInt(id);
      
      // Determine neuron type and color
      let color = '#4ade80';
      let radius = 15;
      
      if (index < NETWORK_CONFIG.INPUTS) {
        // Input neurons
        color = '#4ade80';
        radius = 12;
      } else if (index < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN) {
        // Hidden neurons
        const hiddenIndex = index - NETWORK_CONFIG.INPUTS;
        if (hiddenIndex % 4 === 0) {
          color = '#ff6b6b'; // Inhibitory
        } else {
          color = '#4ade80'; // Excitatory
        }
        radius = 15;
      } else {
        // Output neuron
        color = '#ffd700';
        radius = 20;
      }

      // Draw neuron
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let label = '';
      if (index < NETWORK_CONFIG.INPUTS) {
        label = `I${index + 1}`;
      } else if (index < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN) {
        label = `H${index - NETWORK_CONFIG.INPUTS + 1}`;
      } else {
        label = 'Out';
      }
      
      ctx.fillText(label, pos.x, pos.y);
    });

    // Draw particles
    particles.forEach(particle => {
      const fromPos = neuronPositions[particle.from];
      const toPos = neuronPositions[particle.to];
      
      if (fromPos && toPos) {
        // Calculate particle position based on progress
        const x = fromPos.x + (toPos.x - fromPos.x) * particle.progress;
        const y = fromPos.y + (toPos.y - fromPos.y) * particle.progress;
        
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw idle state message when no mode is selected
    if (!currentMode) {
      ctx.fillStyle = '#666666';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select a training pattern to begin simulation', dimensions.width / 2, dimensions.height / 2);
    }

    // Draw golden flash effect
    if (goldenFlash.active) {
      const flashAge = Date.now() - goldenFlash.startTime;
      const flashIntensity = Math.max(0, 1 - flashAge / 1000);
      
      if (flashIntensity > 0) {
        ctx.fillStyle = `rgba(255, 215, 0, ${flashIntensity * 0.3})`;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }
    }

    // Draw output flash
    if (outputFlash.active) {
      const flashAge = Date.now() - outputFlash.startTime;
      const flashIntensity = Math.max(0, 1 - flashAge / 500);
      
      if (flashIntensity > 0) {
        const outputPos = neuronPositions[NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN];
        if (outputPos) {
          ctx.fillStyle = `rgba(255, 215, 0, ${flashIntensity * 0.8})`;
          ctx.beginPath();
          ctx.arc(outputPos.x, outputPos.y, 30 + (flashIntensity * 20), 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [dimensions, neuronPositions, particles, goldenFlash, outputFlash]);

  // Particle generation logic
  useEffect(() => {
    if (!currentMode || Object.keys(neuronPositions).length === 0 || analyzeMode) {
      // Clear particles when no mode is selected or in analyze mode
      setParticles([]);
      return;
    }

    // Set training start time when pattern begins
    setTrainingStartTime(Date.now());

    const interval = setInterval(() => {
      const activeInputs = PATTERNS[currentMode].activeInputs;
      
      setParticles(prev => {
        // FIRST: Remove ALL particles from inactive inputs immediately
        const filteredParticles = prev.filter(particle => {
          const isFromActiveInput = activeInputs.includes(particle.from);
          return isFromActiveInput; // Keep only particles from active inputs
        });
        
        const newParticles = [...filteredParticles];
        
        // THEN: Generate particles ONLY for active inputs
        activeInputs.forEach(inputId => {
          if (Math.random() < 0.3) { // 30% chance per frame
            // Find all hidden neurons this input connects to
            for (let hiddenId = NETWORK_CONFIG.INPUTS; hiddenId < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN; hiddenId++) {
              if (newParticles.length < NETWORK_CONFIG.MAX_PARTICLES) {
                newParticles.push({
                  id: particleIdRef.current++,
                  from: inputId,
                  to: hiddenId,
                  progress: 0,
                  speed: 0.02 + Math.random() * 0.01,
                  color: '#4ade80',
                  startTime: Date.now()
                });
              }
            }
          }
        });

        // ALSO: Generate some random particles from hidden to output to show synapse activity
        if (Math.random() < 0.1) { // 10% chance per frame
          const randomHiddenId = NETWORK_CONFIG.INPUTS + Math.floor(Math.random() * NETWORK_CONFIG.HIDDEN);
          if (newParticles.length < NETWORK_CONFIG.MAX_PARTICLES) {
            newParticles.push({
              id: particleIdRef.current++,
              from: randomHiddenId,
              to: NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN,
              progress: 0,
              speed: 0.025,
              color: '#4ade80',
              startTime: Date.now()
            });
          }
        }

        return newParticles;
      });
    }, 50); // Generate particles every 50ms

    return () => clearInterval(interval);
  }, [currentMode, neuronPositions, analyzeMode]);

  // Update particles and edge strengths
  useEffect(() => {
    if (analyzeMode || !currentMode) {
      // Clear particles when no mode is selected or in analyze mode
      setParticles([]);
      return;
    }
    
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(particle => ({
          ...particle,
          progress: Math.min(1, particle.progress + particle.speed)
        })).filter(particle => particle.progress < 1);

        // Update edge strengths based on particle activity with gradual 13-second buildup
        setEdgeStrengths(prev => {
          const newStrengths = new Map(prev);
          
          // Calculate training progress (0 to 1 over 13 seconds)
          const trainingProgress = trainingStartTime ? 
            Math.min(1, (Date.now() - trainingStartTime) / (13 * 1000)) : 0;
          
          // Calculate activity for each edge
          const edgeActivity = new Map();
          updated.forEach(particle => {
            const edgeKey = `${particle.from}-${particle.to}`;
            edgeActivity.set(edgeKey, (edgeActivity.get(edgeKey) || 0) + 1);
          });

          // Update strengths with gradual buildup
          edgeActivity.forEach((activity, edgeKey) => {
            const currentStrength = newStrengths.get(edgeKey) || 0;
            // Scale the strength increase by training progress
            const strengthIncrease = activity * 0.01 * trainingProgress;
            const newStrength = Math.min(1, currentStrength + strengthIncrease);
            newStrengths.set(edgeKey, newStrength);
          });

          // Decay inactive edges (much slower decay for old pattern lines)
          newStrengths.forEach((strength, edgeKey) => {
            if (!edgeActivity.has(edgeKey)) {
              // Much slower decay rate for old pattern lines
              const decayed = Math.max(0, strength - 0.001);
              newStrengths.set(edgeKey, decayed);
            }
          });

          return newStrengths;
        });

        return updated;
      });
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [analyzeMode, trainingStartTime]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#1a1816'
      }}
    />
  );
}

export default FixedNetwork;
