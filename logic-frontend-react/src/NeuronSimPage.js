import React, { useState, useRef, useCallback, useEffect } from 'react';
import IndividualNeuronStates from './components/IndividualNeuronStates';
import MembraneTraces from './components/MembraneTraces';
import RasterPlot from './components/RasterPlot';
import SelectiveMembranePotentials from './components/SelectiveMembranePotentials';

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
function FixedNetwork({ currentMode, onModeChange, analyzeMode, analyzeSynapses, exitAnalyze, onCaptureEdgeStrengths, capturedEdgeStrengths, goldenFlash, synapticDegradation, resilientSynapses, isAlzheimerSimulation, alzheimerTrainingStartTime, calculateAlzheimerDegradationEffect, alzheimerSpikes }) {
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
    if (currentMode) {
      const activeInputs = PATTERNS[currentMode].activeInputs;
      setParticles(prev => prev.filter(particle => activeInputs.includes(particle.from)));
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
      // Calculate reacquire time
      const reacquireMs = Math.round(elapsedTime[currentMode] * 1.5);
      setReacquireCountdown(reacquireMs);
      setOutputGateOpen(false);
    }
    
    onModeChange(newMode);
    setElapsedTime(prev => ({ ...prev, [newMode]: 0 }));
  }, [currentMode, elapsedTime, onModeChange]);

  // Update elapsed time
  useEffect(() => {
    if (currentMode) {
      const interval = setInterval(() => {
        setElapsedTime(prev => ({
          ...prev,
          [currentMode]: prev[currentMode] + 16 // ~60fps
        }));
      }, 16);
      return () => clearInterval(interval);
    }
  }, [currentMode]);

  // Update reacquire countdown
  useEffect(() => {
    if (reacquireCountdown > 0) {
      const interval = setInterval(() => {
        setReacquireCountdown(prev => {
          if (prev <= 16) {
            setOutputGateOpen(true);
            return 0;
          }
          return prev - 16;
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [reacquireCountdown]);

  // Particle generation - STRICT MODE ENFORCEMENT (disabled in analyze mode)
  useEffect(() => {
    if (!currentMode || Object.keys(neuronPositions).length === 0 || analyzeMode) return;

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
    }, 50); // 20 FPS particle generation

    return () => clearInterval(interval);
  }, [currentMode, neuronPositions]);

  // Update particles and edge strengths (DISABLED in analyze mode)
  useEffect(() => {
    if (analyzeMode) return; // Don't update edge strengths in analyze mode
    
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

        // Check for particles reaching hidden neurons - FORCE OUTPUT PARTICLE SPAWNING
        const particlesToRemove = [];
        const newOutputParticles = [];
        
        updated.forEach((particle, index) => {
          if (particle.progress >= 1 && particle.to >= NETWORK_CONFIG.INPUTS && particle.to < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN) {
            // Mark this particle for removal
            particlesToRemove.push(index);
            
            // FORCE spawn particle to output immediately
            if (updated.length + newOutputParticles.length < NETWORK_CONFIG.MAX_PARTICLES) {
              newOutputParticles.push({
                id: particleIdRef.current++,
                from: particle.to,
                to: NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN,
                progress: 0,
                speed: 0.03,
                color: particle.color,
                startTime: Date.now()
              });
            }

            // Check if output should spike
            if (outputGateOpen) {
              const totalStrength = Array.from(edgeStrengths.values()).reduce((sum, strength) => sum + strength, 0);
              if (totalStrength > 0.5) {
                  setOutputFlash({ active: true, startTime: Date.now() });
              }
            }
          }
        });

        // Remove particles that reached hidden neurons
        const filteredParticles = updated.filter((_, index) => !particlesToRemove.includes(index));
        
        // Add new output particles
        return [...filteredParticles, ...newOutputParticles];
      });
    }, 16); // 60 FPS

    return () => clearInterval(interval);
  }, [edgeStrengths, outputGateOpen, analyzeMode]);

  // Handle output flash
  useEffect(() => {
    if (outputFlash.active) {
      const timer = setTimeout(() => {
        setOutputFlash({ active: false, startTime: 0 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [outputFlash.active]);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e, neuronId) => {
    if (analyzeMode) return; // Don't allow dragging in analyze mode
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;
    
    const neuronPos = neuronPositions[neuronId];
    if (neuronPos) {
      setDraggedNeuron(neuronId);
      setDragStartTime(Date.now());
      setDragOffset({
        x: mouseX - neuronPos.x,
        y: mouseY - neuronPos.y
      });
    }
  }, [neuronPositions, analyzeMode]);

  const handleMouseMove = useCallback((e) => {
    if (!draggedNeuron) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;
    
    setNeuronPositions(prev => ({
      ...prev,
      [draggedNeuron]: {
        ...prev[draggedNeuron],
        x: mouseX - dragOffset.x,
        y: mouseY - dragOffset.y
      }
    }));
  }, [draggedNeuron, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedNeuron(null);
    setDragStartTime(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (draggedNeuron) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    }
  }, [draggedNeuron, handleMouseMove, handleMouseUp]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || Object.keys(neuronPositions).length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.width = `${dimensions.width / (window.devicePixelRatio || 1)}px`;
    canvas.style.height = `${dimensions.height / (window.devicePixelRatio || 1)}px`;

    // Clear canvas
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw connections
    Object.keys(neuronPositions).forEach(fromId => {
      const fromPos = neuronPositions[fromId];
      if (!fromPos) return;

      Object.keys(neuronPositions).forEach(toId => {
        const toPos = neuronPositions[toId];
        if (!toPos || fromId === toId) return;

        // Only draw input->hidden and hidden->output connections
        const fromNum = parseInt(fromId);
        const toNum = parseInt(toId);
        const isInputToHidden = fromNum < NETWORK_CONFIG.INPUTS && toNum >= NETWORK_CONFIG.INPUTS && toNum < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN;
        const isHiddenToOutput = fromNum >= NETWORK_CONFIG.INPUTS && fromNum < NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN && toNum === NETWORK_CONFIG.INPUTS + NETWORK_CONFIG.HIDDEN;

        if (isInputToHidden || isHiddenToOutput) {
          const edgeKey = `${fromId}-${toId}`;
          const strength = analyzeMode ? 
            (capturedEdgeStrengths.get(edgeKey) || 0) : 
            (edgeStrengths.get(edgeKey) || 0);
          
          // Determine if this edge is active in current mode
          const isActive = currentMode && (
            (currentMode === 'A' && fromNum < NETWORK_CONFIG.INPUTS && PATTERNS.A.activeInputs.includes(fromNum)) ||
            (currentMode === 'B' && fromNum < NETWORK_CONFIG.INPUTS && PATTERNS.B.activeInputs.includes(fromNum))
          );

          // Apply degradation effects for Alzheimer's simulation
          let finalStrength = strength;
          let finalAlpha = Math.max(0.1, strength);
          let finalThickness = Math.max(0.5, 1 + strength * 4);
          let finalColor = fromPos.type === 'inhibitory' ? '#ff6b6b' : '#4ade80';
          let shouldGlow = isActive && strength > 0.3;

          if (isAlzheimerSimulation && synapticDegradation) {
            const degradation = synapticDegradation.get(edgeKey) || 0;
            const isResilient = resilientSynapses && resilientSynapses.has(edgeKey);
            
            if (isResilient) {
              // Persistent synapses: bright, stable, glowing
              finalStrength = strength * 1.2; // Stronger than normal
              finalAlpha = Math.min(1.0, finalAlpha * 1.5); // Brighter
              finalThickness = Math.max(3.0, finalThickness * 1.8); // Thicker
              finalColor = '#00ff88'; // Bright green for persistent synapses
              shouldGlow = true; // Always glow brightly
            } else {
              // Normal synapses: apply degradation effects
              finalStrength = strength * (1 - degradation * 0.8);
              finalAlpha = Math.max(0.05, finalAlpha * (1 - degradation * 0.9));
              finalThickness = Math.max(0.2, finalThickness * (1 - degradation * 0.7));
              
              // Add flickering effect based on degradation
              const flickerIntensity = degradation * 0.5;
              const flicker = Math.random() < flickerIntensity;
              if (flicker) {
                finalAlpha *= 0.3; // Flicker to very low opacity
              }
              
              // Change color based on degradation level
              if (degradation > 0.7) {
                finalColor = '#ff4444'; // Red for highly degraded
              } else if (degradation > 0.4) {
                finalColor = '#ff8844'; // Orange for moderately degraded
              }
              
              // Reduce glow for degraded connections
              if (degradation > 0.5) {
                shouldGlow = false;
              }
            }
          }

          ctx.strokeStyle = `${finalColor}${Math.floor(finalAlpha * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = finalThickness;

          // Add glow effect for active edges
          if (shouldGlow) {
            ctx.shadowColor = finalColor;
            ctx.shadowBlur = 10;
            } else {
            ctx.shadowBlur = 0;
          }

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
          const arrowLength = 12;
      const arrowAngle = Math.PI / 6;
      
      ctx.beginPath();
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(
        toPos.x - arrowLength * Math.cos(angle - arrowAngle),
        toPos.y - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(
        toPos.x - arrowLength * Math.cos(angle + arrowAngle),
        toPos.y - arrowLength * Math.sin(angle + arrowAngle)
      );
      ctx.stroke();

          ctx.shadowBlur = 0;
        }
      });
    });

    // Draw particles
    particles.forEach(particle => {
      const fromPos = neuronPositions[particle.from];
      const toPos = neuronPositions[particle.to];
        if (!fromPos || !toPos) return;

        const x = fromPos.x + (toPos.x - fromPos.x) * particle.progress;
        const y = fromPos.y + (toPos.y - fromPos.y) * particle.progress;

        ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;
        ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

    // Draw neurons
    Object.keys(neuronPositions).forEach((neuronId, index) => {
      const pos = neuronPositions[neuronId];
      if (!pos) return;

      const isOutput = pos.type === 'output';
      const shouldFlash = isOutput && outputFlash.active;

      // Output flash effect
      if (shouldFlash) {
        const flashAge = Date.now() - outputFlash.startTime;
        const flashProgress = Math.min(1, flashAge / 500);
        const flashIntensity = 1 - flashProgress;
        
        ctx.fillStyle = `rgba(255, 255, 0, ${flashIntensity * 0.8})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 60 + flashProgress * 30, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 255, 0, ${flashIntensity * 0.6})`;
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 45 + flashProgress * 15, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Golden flash effect (steady pulsing during training)
      if (isOutput && goldenFlash.active) {
        const flashAge = Date.now() - goldenFlash.startTime;
        const pulsePhase = (flashAge % 1000) / 1000; // 1 second pulse cycle
        const pulseIntensity = (Math.sin(pulsePhase * 2 * Math.PI) + 1) / 2; // 0 to 1
        
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.6})`;
      ctx.beginPath();
        ctx.arc(pos.x, pos.y, 50 + pulseIntensity * 20, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 35 + pulseIntensity * 15, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Alzheimer's golden hue effect - only when output neuron actually fires
      if (isOutput && isAlzheimerSimulation && currentMode) {
        const currentTime = Date.now();
        const simulationTime = (currentTime - (alzheimerTrainingStartTime || currentTime)) / 1000;
        
        // Check if output neuron has fired recently (within last 0.5 seconds)
        const recentSpikes = alzheimerSpikes['Out'] || [];
        const hasRecentSpike = recentSpikes.some(spikeTime => 
          Math.abs(simulationTime - spikeTime) < 0.5
        );
        
        // Only show golden hue if there's a recent spike
        if (hasRecentSpike) {
          // Calculate degradation effect for intensity
          const outputDegradation = calculateAlzheimerDegradationEffect ? calculateAlzheimerDegradationEffect('Out') : 0;
          
          // Create golden flash effect that fades out over 0.5 seconds
          const timeSinceLastSpike = Math.min(...recentSpikes.map(spikeTime => 
            Math.abs(simulationTime - spikeTime)
          ));
          const fadeProgress = Math.min(1, timeSinceLastSpike / 0.5); // Fade over 0.5 seconds
          const fadeIntensity = 1 - fadeProgress;
          
          // Base intensity affected by degradation
          const baseIntensity = fadeIntensity * (1 - outputDegradation * 0.3);
          const pulseRadius = 50 + fadeIntensity * 30;
          const pulseOpacity = baseIntensity * 0.8;
          
          // Apply the golden flash effect
          if (baseIntensity > 0.1) {
            // Outer glow ring
            ctx.fillStyle = `rgba(255, 215, 0, ${pulseOpacity * 0.4})`;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pulseRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Inner pulse ring
            ctx.strokeStyle = `rgba(255, 215, 0, ${pulseOpacity * 0.8})`;
            ctx.lineWidth = 3 + baseIntensity * 3;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pulseRadius * 0.7, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Core pulse
            ctx.fillStyle = `rgba(255, 215, 0, ${pulseOpacity * 0.6})`;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pulseRadius * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.shadowBlur = 0;
          }
        }
      }

      // Bubbly drag effect
      if (draggedNeuron === neuronId && dragStartTime) {
        const dragAge = Date.now() - dragStartTime;
        const bubblePhase = (dragAge % 2000) / 2000; // 2 second cycle
        const bubbleIntensity = (Math.sin(bubblePhase * 2 * Math.PI) + 1) / 2; // 0 to 1
        
        // Create multiple bubble rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = 40 + (i * 15) + (bubbleIntensity * 20);
          const ringOpacity = (1 - i * 0.3) * bubbleIntensity * 0.6;
          const ringColor = pos.type === 'inhibitory' ? '#ff6b6b' : '#769656';
          
          ctx.strokeStyle = `rgba(${pos.type === 'inhibitory' ? '255, 107, 107' : '118, 150, 86'}, ${ringOpacity})`;
          ctx.lineWidth = 2 + bubbleIntensity * 2;
          ctx.shadowColor = ringColor;
          ctx.shadowBlur = 10 + bubbleIntensity * 10;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, ringRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        // Add floating particles around the neuron
        for (let i = 0; i < 8; i++) {
          const particleAngle = (i / 8) * 2 * Math.PI + (bubblePhase * 2 * Math.PI);
          const particleRadius = 60 + bubbleIntensity * 30;
          const particleX = pos.x + Math.cos(particleAngle) * particleRadius;
          const particleY = pos.y + Math.sin(particleAngle) * particleRadius;
          const particleSize = 2 + bubbleIntensity * 3;
          
          ctx.fillStyle = `rgba(${pos.type === 'inhibitory' ? '255, 107, 107' : '118, 150, 86'}, ${bubbleIntensity * 0.8})`;
          ctx.shadowColor = pos.type === 'inhibitory' ? '#ff6b6b' : '#769656';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
      }

      // Neuron circle
      ctx.strokeStyle = pos.type === 'inhibitory' ? '#ff6b6b' : '#769656';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
      ctx.stroke();

      // Neuron label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = pos.type === 'input' ? `I${parseInt(neuronId) + 1}` : 
                   pos.type === 'output' ? 'Out' : 
                   `H${parseInt(neuronId) - NETWORK_CONFIG.INPUTS + 1}`;
      ctx.fillText(label, pos.x, pos.y);
    });

  }, [dimensions, neuronPositions, particles, edgeStrengths, currentMode, outputFlash, goldenFlash, draggedNeuron, dragStartTime, trainingStartTime]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ 
          background: '#1a1816', 
          width: '100%', 
          height: '100%',
          display: 'block',
          cursor: draggedNeuron ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => {
          // Find which neuron was clicked
          const rect = canvasRef.current.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const mouseX = (e.clientX - rect.left) * dpr;
          const mouseY = (e.clientY - rect.top) * dpr;
          
          // Check each neuron to see if mouse is within its radius
          for (const [neuronId, pos] of Object.entries(neuronPositions)) {
            const distance = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
            if (distance <= 30) { // Within neuron radius
              handleMouseDown(e, neuronId);
              break;
            }
          }
        }}
      />
    </div>
  );
}

// Main Simulation Page
export default function NeuronSimPage() {
  const [currentMode, setCurrentMode] = useState(null);
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const [capturedEdgeStrengths, setCapturedEdgeStrengths] = useState(new Map());
  const [trainingStartTime, setTrainingStartTime] = useState(null);
  const [trainingElapsed, setTrainingElapsed] = useState(0);
  const [goldenFlash, setGoldenFlash] = useState({ active: false, startTime: 0 });
  const [flashTriggerTime, setFlashTriggerTime] = useState(null);
  
  // Membrane potential simulation state
  const [membranePotentials, setMembranePotentials] = useState({});
  const [timeData, setTimeData] = useState({});
  const [neurons, setNeurons] = useState([]);
  const [spikes, setSpikes] = useState({});
  const [outputFiringTime, setOutputFiringTime] = useState(null);
  const [selectedNeurons, setSelectedNeurons] = useState([]);
  const [isReset, setIsReset] = useState(false);
  const [pausedTrainingTime, setPausedTrainingTime] = useState(null);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  // Alzheimer's simulation independent state
  const [alzheimerMode, setAlzheimerMode] = useState(null);
  const [alzheimerAnalyzeMode, setAlzheimerAnalyzeMode] = useState(false);
  const [alzheimerTrainingStartTime, setAlzheimerTrainingStartTime] = useState(null);
  const [alzheimerTrainingElapsed, setAlzheimerTrainingElapsed] = useState(0);
  const [alzheimerMembranePotentials, setAlzheimerMembranePotentials] = useState({});
  const [alzheimerTimeData, setAlzheimerTimeData] = useState({});
  const [alzheimerSpikes, setAlzheimerSpikes] = useState({});
  const [alzheimerOutputFiringTime, setAlzheimerOutputFiringTime] = useState(null);
  const [alzheimerGoldenFlash, setAlzheimerGoldenFlash] = useState({ active: false, startTime: 0 });
  const [alzheimerFlashTriggerTime, setAlzheimerFlashTriggerTime] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [alzheimerCapturedEdgeStrengths, setAlzheimerCapturedEdgeStrengths] = useState(new Map());
  const [alzheimerPausedTrainingTime, setAlzheimerPausedTrainingTime] = useState(null);
  const [alzheimerPausedElapsed, setAlzheimerPausedElapsed] = useState(0);

  const handleModeChange = useCallback((mode) => {
    setCurrentMode(mode);
    // Reset raster plot when switching patterns
    if (mode !== null) {
      setIsReset(true);
      setTimeout(() => setIsReset(false), 100);
    }
  }, []);

  // Alzheimer's simulation handlers
  const handleAlzheimerModeChange = useCallback((mode) => {
    setAlzheimerMode(mode);
    // Reset raster plot when switching patterns
    if (mode !== null) {
      setIsReset(true);
      setTimeout(() => setIsReset(false), 100);
    }
  }, []);

  const alzheimerAnalyzeSynapses = useCallback(() => {
    // Save current training state when pausing
    setAlzheimerPausedTrainingTime(alzheimerTrainingStartTime);
    setAlzheimerPausedElapsed(alzheimerTrainingElapsed);
    setAlzheimerAnalyzeMode(true);
  }, [alzheimerTrainingStartTime, alzheimerTrainingElapsed]);

  const alzheimerExitAnalyze = useCallback(() => {
    setAlzheimerAnalyzeMode(false);
    setAlzheimerCapturedEdgeStrengths(new Map());
    // Restore training state from when we paused
    if (alzheimerPausedTrainingTime) {
      setAlzheimerTrainingStartTime(alzheimerPausedTrainingTime);
    }
    if (alzheimerPausedElapsed > 0) {
      setAlzheimerTrainingElapsed(alzheimerPausedElapsed);
    }
  }, [alzheimerPausedTrainingTime, alzheimerPausedElapsed]);

  const alzheimerResetSimulation = useCallback(() => {
    setAlzheimerMode(null);
    setAlzheimerAnalyzeMode(false);
    setAlzheimerCapturedEdgeStrengths(new Map());
    setAlzheimerTrainingStartTime(null);
    setAlzheimerTrainingElapsed(0);
    setAlzheimerGoldenFlash({ active: false, startTime: 0 });
    setAlzheimerFlashTriggerTime(null);
    setAlzheimerOutputFiringTime(null);
    setAlzheimerPausedTrainingTime(null);
    setAlzheimerPausedElapsed(0);
    setAlzheimerSynapticDegradation(new Map());
    setAlzheimerResilientSynapses(new Set());
    
    // Reset membrane potentials
    const initialPotentials = {};
    neurons.forEach(neuron => {
      initialPotentials[neuron.id] = -65.0;
    });
    setAlzheimerMembranePotentials(initialPotentials);
    
    // Reset time data
    setAlzheimerTimeData({});
    
    // Reset spikes
    const initialSpikes = {};
    neurons.forEach(neuron => {
      initialSpikes[neuron.id] = [];
    });
    setAlzheimerSpikes(initialSpikes);
  }, [neurons]);

  const handleAlzheimerCaptureEdgeStrengths = useCallback((strengths) => {
    setAlzheimerCapturedEdgeStrengths(strengths);
  }, []);

  // Initialize neurons
  useEffect(() => {
    const neuronList = [
      { id: 'I1', label: 'I1', name: 'I1', type: 'Input' },
      { id: 'I2', label: 'I2', name: 'I2', type: 'Input' },
      { id: 'I3', label: 'I3', name: 'I3', type: 'Input' },
      { id: 'I4', label: 'I4', name: 'I4', type: 'Input' },
      { id: 'I5', label: 'I5', name: 'I5', type: 'Input' },
      { id: 'I6', label: 'I6', name: 'I6', type: 'Input' },
      { id: 'H1', label: 'H1', name: 'H1', type: 'Inhibitory' },
      { id: 'H2', label: 'H2', name: 'H2', type: 'Excitatory' },
      { id: 'H3', label: 'H3', name: 'H3', type: 'Excitatory' },
      { id: 'H4', label: 'H4', name: 'H4', type: 'Excitatory' },
      { id: 'H5', label: 'H5', name: 'H5', type: 'Inhibitory' },
      { id: 'H6', label: 'H6', name: 'H6', type: 'Excitatory' },
      { id: 'H7', label: 'H7', name: 'H7', type: 'Excitatory' },
      { id: 'H8', label: 'H8', name: 'H8', type: 'Excitatory' },
      { id: 'H9', label: 'H9', name: 'H9', type: 'Inhibitory' },
      { id: 'H10', label: 'H10', name: 'H10', type: 'Excitatory' },
      { id: 'Out', label: 'Out', name: 'Out', type: 'Output' }
    ];
    setNeurons(neuronList);
    
    // Select a few neurons for detailed visualization
    const selected = [
      { id: 'I1', label: 'I1', name: 'I1', type: 'Input' },
      { id: 'I2', label: 'I2', name: 'I2', type: 'Input' },
      { id: 'H1', label: 'H1', name: 'H1', type: 'Inhibitory' },
      { id: 'H2', label: 'H2', name: 'H2', type: 'Excitatory' },
      { id: 'Out', label: 'Out', name: 'Out', type: 'Output' }
    ];
    setSelectedNeurons(selected);
    
    // Initialize membrane potentials
    const initialPotentials = {};
    neuronList.forEach(neuron => {
      initialPotentials[neuron.id] = -65.0;
    });
    setMembranePotentials(initialPotentials);
    
    // Initialize spikes
    const initialSpikes = {};
    neuronList.forEach(neuron => {
      initialSpikes[neuron.id] = [];
    });
    setSpikes(initialSpikes);
  }, []);

  // Membrane potential simulation with realistic depolarization
  useEffect(() => {
    if (!currentMode || neurons.length === 0 || analyzeMode) return;

    const interval = setInterval(() => {
      setMembranePotentials(prev => {
        const newPotentials = { ...prev };
        const currentTime = Date.now();
        const simulationTime = (currentTime - (trainingStartTime || currentTime)) / 1000;
        
        neurons.forEach(neuron => {
          let currentPotential = prev[neuron.id] || -65.0;
          
          // Base resting potential
          const restingPotential = -70.0;
          
          // Calculate training progress (0 to 1 over 13-16 seconds)
          const trainingProgress = Math.min(1, simulationTime / 16);
          
          // Check if this neuron is active for the current pattern
          let isActive = false;
          if (currentMode === 'A') {
            // Pattern A: I1, I3, I5 are active (indices 0, 2, 4)
            isActive = neuron.id === 'I1' || neuron.id === 'I3' || neuron.id === 'I5' || 
                      neuron.type !== 'Input';
          } else if (currentMode === 'B') {
            // Pattern B: I2, I4, I6 are active (indices 1, 3, 5)
            isActive = neuron.id === 'I2' || neuron.id === 'I4' || neuron.id === 'I6' || 
                      neuron.type !== 'Input';
          }
          
          if (!isActive && neuron.type === 'Input') {
            // Inactive input neurons remain at resting potential
            newPotentials[neuron.id] = restingPotential;
            return;
          }
          
          // Gradual depolarization over time
          const depolarizationAmount = trainingProgress * 15; // -70mV to -55mV over time
          const targetPotential = restingPotential + depolarizationAmount;
          
          // Add realistic fluctuations based on neuron type and activity
          let fluctuation = 0;
          
          if (neuron.type === 'Input') {
            // Input neurons have moderate activity
            fluctuation = (Math.random() - 0.5) * 8;
          } else if (neuron.type === 'Excitatory') {
            // Excitatory neurons gradually increase activity
            const activityLevel = trainingProgress * 0.8;
            fluctuation = (Math.random() - 0.5) * 12 * activityLevel;
          } else if (neuron.type === 'Inhibitory') {
            // Inhibitory neurons have opposite effect
            const activityLevel = trainingProgress * 0.6;
            fluctuation = (Math.random() - 0.5) * 10 * activityLevel * -0.7;
          } else if (neuron.type === 'Output') {
            // Output neuron shows strong depolarization as it approaches firing
            const outputActivity = Math.pow(trainingProgress, 2) * 0.9; // Accelerating activity
            fluctuation = (Math.random() - 0.5) * 15 * outputActivity;
            
            // Strong depolarization in final seconds
            if (simulationTime > 12) {
              const finalDepolarization = (simulationTime - 12) * 2; // -2mV per second
              fluctuation += finalDepolarization;
            }
          }
          
          // Smooth transition towards target potential
          const smoothingFactor = 0.02; // Controls how quickly it approaches target
          currentPotential = currentPotential * (1 - smoothingFactor) + 
                           (targetPotential + fluctuation) * smoothingFactor;
          
          // Add small random noise for realism
          const noise = (Math.random() - 0.5) * 0.5;
          currentPotential += noise;
          
          // Clamp to realistic biological range
          currentPotential = Math.max(-80, Math.min(-30, currentPotential));
          
          newPotentials[neuron.id] = currentPotential;
        });
        
        return newPotentials;
      });

      // Update time series data and detect spikes
      setTimeData(prev => {
        const newTimeData = { ...prev };
        const currentTime = Date.now();
        const simulationTime = (currentTime - (trainingStartTime || currentTime)) / 1000;
        
        neurons.forEach(neuron => {
          const currentPotential = membranePotentials[neuron.id] || -65.0;
          if (!newTimeData[neuron.id]) {
            newTimeData[neuron.id] = [];
          }
          newTimeData[neuron.id].push(currentPotential);
          
          // Keep only last 100 data points
          if (newTimeData[neuron.id].length > 100) {
            newTimeData[neuron.id] = newTimeData[neuron.id].slice(-100);
          }
          
          // Detect spikes (threshold crossing at -50mV)
          const previousPotential = membranePotentials[neuron.id] || -65.0;
          if (currentPotential > -50 && previousPotential <= -50) {
            setSpikes(prevSpikes => {
              const newSpikes = { ...prevSpikes };
              if (!newSpikes[neuron.id]) {
                newSpikes[neuron.id] = [];
              }
              newSpikes[neuron.id].push(simulationTime);
              return newSpikes;
            });
          }
        });
        
        return newTimeData;
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [currentMode, neurons, membranePotentials, trainingStartTime, analyzeMode]);

  // Output neuron firing logic (13-16 second random timing)
  useEffect(() => {
    if (!currentMode || !trainingStartTime || analyzeMode) return;
    
    const currentTime = Date.now();
    const simulationTime = (currentTime - trainingStartTime) / 1000;
    
    // Set random firing time between 13-16 seconds if not already set
    if (!outputFiringTime && simulationTime > 12) {
      const randomFiringTime = 13 + Math.random() * 3; // 13-16 seconds
      setOutputFiringTime(randomFiringTime);
    }
    
    // Check if it's time for output neuron to fire
    if (outputFiringTime && simulationTime >= outputFiringTime) {
      // Add spike to output neuron
      setSpikes(prevSpikes => {
        const newSpikes = { ...prevSpikes };
        if (!newSpikes['Out']) {
          newSpikes['Out'] = [];
        }
        // Only add spike if not already added for this firing time
        if (!newSpikes['Out'].includes(outputFiringTime)) {
          newSpikes['Out'].push(outputFiringTime);
        }
        return newSpikes;
      });
    }
  }, [currentMode, trainingStartTime, outputFiringTime, analyzeMode]);

  // Analyze function to capture current synapse states
  const analyzeSynapses = useCallback(() => {
    // Save current training state when pausing
    setPausedTrainingTime(trainingStartTime);
    setPausedElapsed(trainingElapsed);
    setAnalyzeMode(true);
  }, [trainingStartTime, trainingElapsed]);

  // Exit analyze mode
  const exitAnalyze = useCallback(() => {
    setAnalyzeMode(false);
    setCapturedEdgeStrengths(new Map());
    // Restore training state from when we paused
    if (pausedTrainingTime) {
      setTrainingStartTime(pausedTrainingTime);
    }
    if (pausedElapsed > 0) {
      setTrainingElapsed(pausedElapsed);
    }
    // Note: We don't reset training progress - simulation continues from where it was paused
  }, [pausedTrainingTime, pausedElapsed]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setCurrentMode(null);
    setAnalyzeMode(false);
    setCapturedEdgeStrengths(new Map());
    setTrainingStartTime(null);
    setTrainingElapsed(0);
    setGoldenFlash({ active: false, startTime: 0 });
    setFlashTriggerTime(null);
    setOutputFiringTime(null);
    setPausedTrainingTime(null);
    setPausedElapsed(0);
    
    // Reset membrane potentials
    const initialPotentials = {};
    neurons.forEach(neuron => {
      initialPotentials[neuron.id] = -65.0;
    });
    setMembranePotentials(initialPotentials);
    
    // Reset time data
    setTimeData({});
    
    // Reset spikes
    const initialSpikes = {};
    neurons.forEach(neuron => {
      initialSpikes[neuron.id] = [];
    });
    setSpikes(initialSpikes);
    
    // Trigger raster plot reset
    setIsReset(true);
    setTimeout(() => setIsReset(false), 100); // Reset the flag after a brief moment
  }, [neurons]);

  // Capture edge strengths from FixedNetwork
  const handleCaptureEdgeStrengths = useCallback((strengths) => {
    setCapturedEdgeStrengths(strengths);
  }, []);

  // Training timer effect
  useEffect(() => {
    if (currentMode && !analyzeMode) {
      // Only set new training start time if we don't have a paused state
      if (!pausedTrainingTime) {
        setTrainingStartTime(Date.now());
        setTrainingElapsed(0);
        
        // Set random flash trigger time between 13-16 seconds
        const randomTriggerTime = 13 + Math.random() * 3; // 13.0 to 15.999
        setFlashTriggerTime(randomTriggerTime);
      }
      
      const interval = setInterval(() => {
        setTrainingElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!currentMode) {
      // Only reset when completely stopping simulation
      setTrainingStartTime(null);
      setTrainingElapsed(0);
      setFlashTriggerTime(null);
      setGoldenFlash({ active: false, startTime: 0 });
      setPausedTrainingTime(null);
      setPausedElapsed(0);
    }
  }, [currentMode, analyzeMode, pausedTrainingTime]);

  // Golden flash effect when training reaches the random trigger time
  useEffect(() => {
    if (flashTriggerTime && trainingElapsed >= flashTriggerTime && currentMode && !analyzeMode) {
      setGoldenFlash({ active: true, startTime: Date.now() });
    } else if (trainingElapsed < flashTriggerTime || !currentMode || analyzeMode) {
      setGoldenFlash({ active: false, startTime: 0 });
    }
  }, [trainingElapsed, flashTriggerTime, currentMode, analyzeMode]);

  // Chess.com style inline styles
  const homepageStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    position: 'relative',
    width: '100%'
  };

  const heroStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '3rem 2rem',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const subtitleStyle = {
    fontSize: '1.125rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '2rem',
    fontWeight: '400'
  };

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    background: '#ffffff',
    color: '#262421',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    textDecoration: 'none'
  };

  const sectionStyle = {
    background: '#262421',
    padding: '3rem 2rem',
    overflowX: 'hidden'
  };

  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    margin: '1.5rem auto',
    maxWidth: '1200px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37',
    overflowX: 'hidden'
  };

  const buttonStyle = {
    background: '#1a1816',
    color: '#b0a99f',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #3d3a37',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    margin: '0.25rem',
    fontFamily: 'Georgia, serif',
    minWidth: '120px'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: '#769656',
    color: '#000000'
  };

  const bannerStyle = {
    textAlign: 'center',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: currentMode === 'A' ? '#4ade80' : '#ff6b6b',
    color: '#000000',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    fontFamily: 'Georgia, serif'
  };

  // Alzheimer's simulation logic - completely independent
  // Initialize Alzheimer's membrane potentials
  useEffect(() => {
    if (neurons.length > 0 && Object.keys(alzheimerMembranePotentials).length === 0) {
      const initialPotentials = {};
      neurons.forEach(neuron => {
        initialPotentials[neuron.id] = -65.0;
      });
      setAlzheimerMembranePotentials(initialPotentials);
    }
  }, [neurons, alzheimerMembranePotentials]);

  // Alzheimer's synaptic degradation state
  const [alzheimerSynapticDegradation, setAlzheimerSynapticDegradation] = useState(new Map());
  const [alzheimerResilientSynapses, setAlzheimerResilientSynapses] = useState(new Set());
  
  // Initialize persistent synapses when Alzheimer's mode starts
  useEffect(() => {
    if (alzheimerMode && alzheimerResilientSynapses.size === 0) {
      // Create 2-4 random persistent synapses that will remain strong
      const persistentCount = 2 + Math.floor(Math.random() * 3); // 2-4 synapses
      const newResilientSynapses = new Set();
      
      for (let i = 0; i < persistentCount; i++) {
        const from = Math.floor(Math.random() * 16);
        const to = Math.floor(Math.random() * 16);
        if (from !== to) {
          newResilientSynapses.add(`${from}-${to}`);
        }
      }
      
      setAlzheimerResilientSynapses(newResilientSynapses);
    }
  }, [alzheimerMode, alzheimerResilientSynapses.size]);

  // Calculate degradation effect for a specific neuron (Alzheimer's only)
  const calculateAlzheimerDegradationEffect = useCallback((neuronId) => {
    const neuronIndex = neurons.findIndex(n => n.id === neuronId);
    if (neuronIndex === -1) return 0;
    
    let totalDegradation = 0;
    let connectionCount = 0;
    
    for (let from = 0; from < 16; from++) {
      const synapseKey = `${from}-${neuronIndex}`;
      const degradation = alzheimerSynapticDegradation.get(synapseKey) || 0;
      totalDegradation += degradation;
      connectionCount++;
    }
    
    return connectionCount > 0 ? totalDegradation / connectionCount : 0;
  }, [neurons, alzheimerSynapticDegradation]);

  // Alzheimer's membrane potential simulation
  useEffect(() => {
    if (!alzheimerMode || neurons.length === 0 || alzheimerAnalyzeMode) return;

    const interval = setInterval(() => {
      setAlzheimerMembranePotentials(prev => {
        const newPotentials = { ...prev };
        const currentTime = Date.now();
        const simulationTime = (currentTime - (alzheimerTrainingStartTime || currentTime)) / 1000;
        
        neurons.forEach(neuron => {
          let currentPotential = prev[neuron.id] || -65.0;
          
          // Base resting potential
          const restingPotential = -70.0;
          
          // Calculate training progress (0 to 1 over 13-16 seconds)
          const trainingProgress = Math.min(1, simulationTime / 16);
          
          // Check if this neuron is active for the current pattern
          let isActive = false;
          if (alzheimerMode === 'A') {
            // Pattern A: I1, I3, I5 are active (indices 0, 2, 4)
            isActive = neuron.id === 'I1' || neuron.id === 'I3' || neuron.id === 'I5' || 
                      neuron.type !== 'Input';
          } else if (alzheimerMode === 'B') {
            // Pattern B: I2, I4, I6 are active (indices 1, 3, 5)
            isActive = neuron.id === 'I2' || neuron.id === 'I4' || neuron.id === 'I6' || 
                      neuron.type !== 'Input';
          }
          
          if (!isActive && neuron.type === 'Input') {
            // Inactive input neurons remain at resting potential
            newPotentials[neuron.id] = restingPotential;
            return;
          }
          
          // Calculate degradation effect for this neuron
          const degradationEffect = calculateAlzheimerDegradationEffect(neuron.id);
          
          // Gradual depolarization over time (affected by degradation)
          const depolarizationAmount = trainingProgress * 15 * (1 - degradationEffect * 0.3); // -70mV to -55mV over time, reduced by degradation
          const targetPotential = restingPotential + depolarizationAmount;
          
          // Add realistic fluctuations based on neuron type and activity with degradation effects
          let fluctuation = 0;
          
          if (neuron.type === 'Input') {
            // Input neurons: irregular, unstable fluctuations with no clear pattern
            const inputInstability = (Math.random() - 0.5) * 8; // Random drift between -4 and +4 mV
            const timeBasedDrift = Math.sin(simulationTime * 0.5 + Math.random() * Math.PI) * 3; // Slow, irregular oscillations
            fluctuation = inputInstability + timeBasedDrift;
          } else if (neuron.type === 'Excitatory' || neuron.id === 'H1' || neuron.id === 'H2') {
            // Hidden neurons: erratic changes, never settling into stable patterns
            const erraticActivity = (Math.random() - 0.5) * 12; // Large random fluctuations
            const unstableOscillation = Math.sin(simulationTime * (0.3 + Math.random() * 0.7)) * 5; // Irregular frequency oscillations
            const degradationAmplification = degradationEffect * 2; // Amplify degradation effects
            fluctuation = erraticActivity + unstableOscillation + degradationAmplification;
          } else if (neuron.type === 'Inhibitory') {
            // Inhibitory neurons: also show erratic behavior
            const unstableActivity = (Math.random() - 0.5) * 10;
            const erraticOscillation = Math.sin(simulationTime * (0.4 + Math.random() * 0.6)) * 4;
            fluctuation = unstableActivity + erraticOscillation;
          } else if (neuron.type === 'Output') {
            // Output neuron: erratic fluctuations with irregular firing
            const outputErraticity = (Math.random() - 0.5) * 15; // Large random fluctuations
            const firingInstability = Math.sin(simulationTime * (0.2 + Math.random() * 0.8)) * 8; // Irregular firing patterns
            const severeDegradation = degradationEffect * 3; // Severe degradation effects
            fluctuation = outputErraticity + firingInstability + severeDegradation;
          }
          
          
          // Smooth transition towards target potential (affected by degradation)
          const smoothingFactor = 0.02 * (1 - degradationEffect * 0.5); // Degraded synapses are less responsive
          currentPotential = currentPotential * (1 - smoothingFactor) + 
                           (targetPotential + fluctuation) * smoothingFactor;
          
          // Add small random noise for realism
          const noise = (Math.random() - 0.5) * 0.5;
          currentPotential += noise;
          
          // Clamp to realistic biological range
          currentPotential = Math.max(-80, Math.min(-30, currentPotential));
          
          newPotentials[neuron.id] = currentPotential;
        });
        
        return newPotentials;
      });

      // Update time series data and detect spikes
      setAlzheimerTimeData(prev => {
        const newTimeData = { ...prev };
        const currentTime = Date.now();
        const simulationTime = (currentTime - (alzheimerTrainingStartTime || currentTime)) / 1000;
        
        neurons.forEach(neuron => {
          const currentPotential = alzheimerMembranePotentials[neuron.id] || -65.0;
          if (!newTimeData[neuron.id]) {
            newTimeData[neuron.id] = [];
          }
          newTimeData[neuron.id].push(currentPotential);
          
          // Keep only last 100 data points
          if (newTimeData[neuron.id].length > 100) {
            newTimeData[neuron.id] = newTimeData[neuron.id].slice(-100);
          }
          
          // Spike detection (threshold crossing)
          if (currentPotential > -50 && newTimeData[neuron.id].length > 1) {
            const prevPotential = newTimeData[neuron.id][newTimeData[neuron.id].length - 2];
            if (prevPotential <= -50) {
              setAlzheimerSpikes(prevSpikes => {
                const newSpikes = { ...prevSpikes };
                if (!newSpikes[neuron.id]) {
                  newSpikes[neuron.id] = [];
                }
                newSpikes[neuron.id].push(simulationTime);
                return newSpikes;
              });
            }
          }
        });
        
        return newTimeData;
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [alzheimerMode, neurons, alzheimerMembranePotentials, alzheimerTrainingStartTime, alzheimerAnalyzeMode]);

  // Alzheimer's output neuron firing logic with random 3-10 second intervals
  useEffect(() => {
    if (!alzheimerMode || !alzheimerTrainingStartTime || alzheimerAnalyzeMode) return;
    
    const currentTime = Date.now();
    const simulationTime = (currentTime - alzheimerTrainingStartTime) / 1000;
    
    // Calculate degradation effect for output neuron
    const outputDegradation = calculateAlzheimerDegradationEffect('Out');
    
    // Random firing with 3-10 second intervals - NO CONSISTENT TIMING
    const shouldFire = () => {
      // Get the last firing time
      const lastFiringTime = alzheimerOutputFiringTime || 0;
      const timeSinceLastFire = simulationTime - lastFiringTime;
      
      // Random interval between 3-10 seconds (affected by degradation)
      let minInterval = 3;
      let maxInterval = 10;
      
      // Degradation affects the intervals - more degradation = longer intervals
      if (outputDegradation > 0.7) {
        minInterval = 5;
        maxInterval = 15; // High degradation: 5-15 seconds
      } else if (outputDegradation > 0.4) {
        minInterval = 4;
        maxInterval = 12; // Medium degradation: 4-12 seconds
      }
      
      // Generate random interval for this firing
      const randomInterval = minInterval + Math.random() * (maxInterval - minInterval);
      
      // Check if enough time has passed since last firing
      return timeSinceLastFire >= randomInterval;
    };
    
          // Check for firing every 100ms - ALWAYS IRREGULAR, NO CONSISTENT TIMING
          if (shouldFire()) {
            setAlzheimerSpikes(prevSpikes => {
              const newSpikes = { ...prevSpikes };
              if (!newSpikes['Out']) {
                newSpikes['Out'] = [];
              }
              // Add spike with current time
              newSpikes['Out'].push(simulationTime);
              return newSpikes;
            });
            
            // Update the last firing time
            setAlzheimerOutputFiringTime(simulationTime);
          }
          
          // Generate irregular spikes for H1 and H2 hidden neurons
          const hiddenNeuronSpikeProbability = () => {
            const irregularityFactor = Math.random();
            if (irregularityFactor < 0.1) {
              // 10% chance of burst firing
              return 0.08;
            } else if (irregularityFactor < 0.3) {
              // 20% chance of long pause
              return 0.005;
            } else {
              // 70% chance of normal irregular firing
              return 0.02 + Math.random() * 0.02;
            }
          };
          
          // Check for H1 and H2 firing
          if (Math.random() < hiddenNeuronSpikeProbability()) {
            setAlzheimerSpikes(prevSpikes => {
              const newSpikes = { ...prevSpikes };
              if (!newSpikes['H1']) {
                newSpikes['H1'] = [];
              }
              if (!newSpikes['H2']) {
                newSpikes['H2'] = [];
              }
              // Add spikes with current time for both hidden neurons
              newSpikes['H1'].push(simulationTime);
              newSpikes['H2'].push(simulationTime);
              return newSpikes;
            });
          }
          
          // Generate constant activity for I1 and I2 input neurons
          if (Math.random() < 0.03) { // 3% chance per 100ms = constant activity
            setAlzheimerSpikes(prevSpikes => {
              const newSpikes = { ...prevSpikes };
              if (!newSpikes['I1']) {
                newSpikes['I1'] = [];
              }
              if (!newSpikes['I2']) {
                newSpikes['I2'] = [];
              }
              // Add spikes with current time for both input neurons
              newSpikes['I1'].push(simulationTime);
              newSpikes['I2'].push(simulationTime);
              return newSpikes;
            });
          }
  }, [alzheimerMode, alzheimerTrainingStartTime, alzheimerAnalyzeMode, calculateAlzheimerDegradationEffect, alzheimerOutputFiringTime]);

  // Alzheimer's training timer effect - NO CONSISTENT TIMING
  useEffect(() => {
    if (alzheimerMode && !alzheimerAnalyzeMode) {
      // Only set new training start time if we don't have a paused state
      if (!alzheimerPausedTrainingTime) {
        setAlzheimerTrainingStartTime(Date.now());
        setAlzheimerTrainingElapsed(0);
        
        // NO CONSISTENT TIMING - Keep it completely irregular
        // Removed the 13-16 second flash trigger for Alzheimer's simulation
      }
      
      const interval = setInterval(() => {
        setAlzheimerTrainingElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!alzheimerMode) {
      // Only reset when completely stopping simulation
      setAlzheimerTrainingStartTime(null);
      setAlzheimerTrainingElapsed(0);
      setAlzheimerFlashTriggerTime(null);
      setAlzheimerGoldenFlash({ active: false, startTime: 0 });
      setAlzheimerPausedTrainingTime(null);
      setAlzheimerPausedElapsed(0);
    }
  }, [alzheimerMode, alzheimerAnalyzeMode, alzheimerPausedTrainingTime]);

  // Alzheimer's golden flash effect - DISABLED for irregular firing
  // Removed the consistent 13-16 second flash trigger
  // Golden hue now only appears when output neuron actually fires (3-10 second random intervals)

  // Initialize resilient synapses for Alzheimer's simulation
  useEffect(() => {
    if (alzheimerMode && alzheimerResilientSynapses.size === 0) {
      const resilientSet = new Set();
      // Randomly select 30% of synapses to be more resilient
      for (let from = 0; from < 16; from++) {
        for (let to = 0; to < 16; to++) {
          if (from !== to && Math.random() < 0.3) {
            resilientSet.add(`${from}-${to}`);
          }
        }
      }
      setAlzheimerResilientSynapses(resilientSet);
    }
  }, [alzheimerMode, alzheimerResilientSynapses.size]);

  // Alzheimer's synaptic degradation effect with time-based visual changes
  useEffect(() => {
    if (!alzheimerMode || alzheimerAnalyzeMode) return;

    const interval = setInterval(() => {
      setAlzheimerSynapticDegradation(prev => {
        const newDegradation = new Map(prev);
        const currentTime = Date.now();
        const simulationTime = (currentTime - (alzheimerTrainingStartTime || currentTime)) / 1000;
        
        // Time-based degradation progression
        let degradationRate = 0;
        let instability = 0;
        
        if (simulationTime <= 4) {
          // t=0 to t=4: Initial formation - subtle degradation
          degradationRate = Math.min(0.1, simulationTime / 40); // Very slow initial degradation
          instability = 0.1; // Low instability
        } else if (simulationTime <= 8) {
          // t=4 to t=8: Attempting to stabilize - moderate degradation with flickering
          degradationRate = 0.1 + Math.min(0.3, (simulationTime - 4) / 13.33); // 0.1 to 0.4
          instability = 0.2 + (simulationTime - 4) * 0.05; // Increasing instability
        } else if (simulationTime <= 13) {
          // t=8 to t=13: Increasing fragility - high degradation
          degradationRate = 0.4 + Math.min(0.4, (simulationTime - 8) / 12.5); // 0.4 to 0.8
          instability = 0.4 + (simulationTime - 8) * 0.08; // High instability
        } else {
          // t>13: Severe degradation - random flickering
          degradationRate = 0.8 + Math.min(0.2, (simulationTime - 13) / 10); // 0.8 to 1.0
          instability = 0.8 + Math.random() * 0.2; // Very high random instability
        }
        
        // Update degradation for all possible synapses
        for (let from = 0; from < 16; from++) {
          for (let to = 0; to < 16; to++) {
            if (from !== to) {
              const synapseKey = `${from}-${to}`;
              const isResilient = alzheimerResilientSynapses.has(synapseKey);
              
              if (isResilient) {
                // Persistent synapses: very slow degradation, sometimes even recovery
                const currentDegradation = newDegradation.get(synapseKey) || 0;
                const persistentDegradation = Math.max(0, currentDegradation - 0.001); // Very slow degradation
                // Occasionally recover slightly
                const recovery = Math.random() < 0.05 ? 0.02 : 0;
                const finalDegradation = Math.max(0, persistentDegradation - recovery);
                newDegradation.set(synapseKey, finalDegradation);
              } else {
                // Normal synapses: degrade as before
                const baseDegradation = degradationRate;
                const randomInstability = (Math.random() - 0.5) * instability;
                const finalDegradation = Math.max(0, Math.min(1, baseDegradation + randomInstability));
                newDegradation.set(synapseKey, finalDegradation);
              }
            }
          }
        }
        
        return newDegradation;
      });
    }, 100); // Update every 100ms for smooth visual changes

    return () => clearInterval(interval);
  }, [alzheimerMode, alzheimerAnalyzeMode, alzheimerTrainingStartTime, alzheimerResilientSynapses]);

  return (
    <div style={homepageStyle}>
      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 style={titleStyle}>🧠 Interactive Neuron Simulation</h1>
        <p style={subtitleStyle}>Watch Pattern Learning Emerge from Fixed Neural Networks</p>
        
        <button 
          style={backButtonStyle}
          onClick={() => window.history.back()}
        >
          ← Back to Home
        </button>
      </div>

      {/* Introduction Modal */}
      {showIntroModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#262421',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #769656',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontFamily: 'Georgia, serif'
            }}>
              🧠 How Neural Simulations Work
            </h2>
            
            <div style={{ color: '#e5e0dc', lineHeight: '1.6', fontSize: '1rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                This simulation demonstrates <strong style={{ color: '#769656' }}>biologically accurate neural networks</strong> that can learn patterns more efficiently than traditional AI neural networks. Unlike AI systems that use gradient descent and consume massive amounts of energy, these simulations show how real neurons work.
              </p>

              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
                🧬 Normal Brain Simulation
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                The <strong style={{ color: '#769656' }}>"Presynaptic-Postsynaptic Network"</strong> shows how a healthy brain learns:
              </p>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Pattern A:</strong> Inputs I1, I3, I5 fire together → synapses strengthen → output neuron sparks
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Pattern B:</strong> Inputs I2, I4, I6 fire together → synapses adapt → output neuron sparks
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Learning:</strong> When switching patterns, neurons must learn new input combinations
                </li>
              </ul>

              <h3 style={{ color: '#ff6b6b', fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
                🧠 Alzheimer's Brain Simulation
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                The <strong style={{ color: '#ff6b6b' }}>Alzheimer's simulation</strong> shows brain dysfunction:
              </p>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Stubborn Synapses:</strong> Some connections won't adapt to pattern changes
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Incomplete Formation:</strong> Many synapses never fully develop
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Erratic Output:</strong> Random firing instead of consistent pattern recognition
                </li>
              </ul>

              <div style={{
                background: '#1a1816',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #3d3a37',
                marginBottom: '1.5rem'
              }}>
                <p style={{ marginBottom: '0.5rem', fontStyle: 'italic' }}>
                  <strong style={{ color: '#769656' }}>Key Insight:</strong> This demonstrates how biological neurons can accomplish the same tasks as AI neural networks but more efficiently, using less energy and water than traditional AI systems.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowIntroModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Continue to Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            Presynaptic-Postsynaptic Network with Live Signal Propagation
          </h2>
          
          {/* Pattern Training Buttons */}
          <div style={{textAlign: 'center', marginBottom: '1rem'}}>
              <button 
              onClick={() => setCurrentMode('A')}
              style={currentMode === 'A' ? activeButtonStyle : buttonStyle}
              >
                Train Pattern A
              </button>
              <button 
              onClick={() => setCurrentMode('B')}
              style={currentMode === 'B' ? activeButtonStyle : buttonStyle}
              >
                Train Pattern B
              </button>
              <button 
              onClick={analyzeMode ? exitAnalyze : analyzeSynapses}
                style={{
                ...buttonStyle,
                background: analyzeMode ? '#ff6b6b' : '#4ade80',
                color: analyzeMode ? '#ffffff' : '#000000'
              }}
            >
              {analyzeMode ? 'Exit Analysis' : 'Analyze Trained Synapses'}
              </button>
              <button 
              onClick={resetSimulation}
              style={{
                ...buttonStyle,
                background: '#ff8c00',
                color: '#000000'
              }}
            >
              Reset Simulation
              </button>
            </div>
            
          {/* Training Pattern Banner */}
          {analyzeMode ? (
            <div style={{...bannerStyle, background: '#4ade80'}}>
              ANALYZING TRAINED SYNAPSES - NO INPUT FIRING
              </div>
          ) : currentMode ? (
            <div style={bannerStyle}>
              TRAINING PATTERN {currentMode} - {trainingElapsed} seconds training {currentMode.toLowerCase()}
              </div>
          ) : null}

          {/* Individual Neuron States */}
          <IndividualNeuronStates 
            neurons={neurons}
            membranePotentials={membranePotentials}
            currentMode={currentMode}
          />

          {/* Selective Membrane Potentials */}
          <SelectiveMembranePotentials 
            selectedNeurons={selectedNeurons}
            membranePotentials={membranePotentials}
            timeData={timeData}
            currentMode={currentMode}
          />

          {/* Raster Plot - Always visible */}
          <RasterPlot 
            selectedNeurons={selectedNeurons}
            spikes={spikes}
            timeData={timeData}
            outputFiringTime={outputFiringTime}
            isReset={isReset}
            isSimulationRunning={currentMode !== null && !analyzeMode}
            currentMode={currentMode}
          />

          {/* Alzheimer's Raster Plot - REMOVED (was showing empty/not working) */}

          {/* Network Canvas */}
          <div style={{height: '800px', width: '100%', background: '#1a1816', borderRadius: '8px', border: 'none', marginBottom: '1rem', overflow: 'hidden', position: 'relative', boxShadow: '0 0 8px rgba(74, 222, 128, 0.6), 0 0 16px rgba(74, 222, 128, 0.3)'}}>
            <FixedNetwork 
              currentMode={currentMode}
              onModeChange={handleModeChange}
              analyzeMode={analyzeMode}
              analyzeSynapses={analyzeSynapses}
              exitAnalyze={exitAnalyze}
              onCaptureEdgeStrengths={handleCaptureEdgeStrengths}
              capturedEdgeStrengths={capturedEdgeStrengths}
              goldenFlash={goldenFlash}
            />
          </div>
          
          <div style={{textAlign: 'center', color: '#b0a99f', fontSize: '0.9rem'}}>
            <span style={{color: '#4ade80'}}>●</span> Excitatory connections &nbsp;&nbsp;
            <span style={{color: '#ff6b6b'}}>●</span> Inhibitory connections &nbsp;&nbsp;
            <span style={{color: '#4ade80'}}>⚡</span> Signal particles
          </div>
        </div>

        {/* Description */}
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            🧠 Network Pattern Learning Demo
          </h2>
          <div style={{
            background: 'linear-gradient(135deg, #1a1816 0%, #262421 100%)',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #769656',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background pattern */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(118, 150, 86, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{color: '#e5e0dc', lineHeight: '1.7', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '500'}}>
                This simulation demonstrates <strong style={{color: '#769656'}}>biologically accurate neural learning</strong> that can accomplish the same tasks as AI neural networks but more efficiently. Unlike traditional AI that uses gradient descent and consumes massive energy, these neurons learn through <strong style={{color: '#769656'}}>synaptic strengthening</strong>.
              </p>
              
              <div style={{
                background: '#262421',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #3d3a37',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{color: '#ffffff', fontSize: '1.2rem', marginBottom: '1rem', fontFamily: 'Georgia, serif'}}>
                  🧬 How Neurons Learn Patterns
                </h3>
                <ul style={{color: '#e5e0dc', paddingLeft: '1.5rem', lineHeight: '1.6'}}>
                  <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
                    <strong style={{color: '#769656'}}>Pattern A (I1, I3, I5):</strong> When these inputs fire together, synapses strengthen and create a pathway to the output neuron
                  </li>
                  <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
                    <strong style={{color: '#769656'}}>Pattern B (I2, I4, I6):</strong> Switching patterns forces neurons to learn new input combinations and adapt their connections
                  </li>
                  <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
                    <strong style={{color: '#769656'}}>Synaptic Learning:</strong> Connections brighten and thicken as they strengthen, showing real biological plasticity
                  </li>
                  <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
                    <strong style={{color: '#769656'}}>Output Gating:</strong> The output neuron only fires when sufficient synaptic strength is achieved
                  </li>
                </ul>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #4ade80',
                boxShadow: '0 4px 12px rgba(118, 150, 86, 0.2)'
              }}>
                <p style={{color: '#ffffff', lineHeight: '1.6', fontSize: '1rem', margin: 0, fontWeight: '500'}}>
                  <strong>💡 Key Insight:</strong> This demonstrates how biological neurons can accomplish the same tasks as AI neural networks but more efficiently, using less energy and water than traditional AI systems. Watch the visual feedback as connections strengthen and glow when patterns are learned!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALZHEIMER'S SIMULATION - RED THEME */}
      <div style={{
        background: '#262421',
        borderRadius: '12px',
        padding: '2rem',
        margin: '1.5rem auto',
        maxWidth: '1200px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        overflowX: 'hidden'
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '2rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Alzheimer's Neuron Simulation
        </h2>

        {/* Alzheimer's Timer Display */}
        {alzheimerMode && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1rem',
            padding: '1rem',
            background: '#1a1816',
            borderRadius: '8px',
            border: '2px solid #ff6b6b',
            boxShadow: '0 0 8px rgba(255, 107, 107, 0.6), 0 0 16px rgba(255, 107, 107, 0.3)'
          }}>
            <div style={{
              color: '#ff9999',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Alzheimer's Simulation Timer
            </div>
            <div style={{
              color: '#ffffff',
              fontSize: '2rem',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {alzheimerTrainingElapsed}s
            </div>
            <div style={{
              color: '#ff9999',
              fontSize: '1rem',
              marginTop: '0.5rem'
            }}>
              Pattern {alzheimerMode} - Degradation Progress: {Math.min(100, Math.round((alzheimerTrainingElapsed / 30) * 100))}%
            </div>
          </div>
        )}

        {/* Duplicate Control Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => handleAlzheimerModeChange('A')}
            style={{
              background: alzheimerMode === 'A' ? '#ff6b6b' : '#2d2b28',
              color: alzheimerMode === 'A' ? '#000000' : '#ff6b6b',
              border: '2px solid #ff6b6b',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: alzheimerMode === 'A' ? '0 0 15px rgba(255, 107, 107, 0.8)' : 'none'
            }}
          >
            Train Pattern A
          </button>
          <button
            onClick={() => handleAlzheimerModeChange('B')}
            style={{
              background: alzheimerMode === 'B' ? '#ff6b6b' : '#2d2b28',
              color: alzheimerMode === 'B' ? '#000000' : '#ff6b6b',
              border: '2px solid #ff6b6b',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: alzheimerMode === 'B' ? '0 0 15px rgba(255, 107, 107, 0.8)' : 'none'
            }}
          >
            Train Pattern B
          </button>
          <button
            onClick={alzheimerAnalyzeMode ? alzheimerExitAnalyze : alzheimerAnalyzeSynapses}
            style={{
              background: alzheimerAnalyzeMode ? '#ff8c00' : '#2d2b28',
              color: alzheimerAnalyzeMode ? '#000000' : '#ff8c00',
              border: '2px solid #ff8c00',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: alzheimerAnalyzeMode ? '0 0 15px rgba(255, 140, 0, 0.8)' : 'none'
            }}
          >
            {alzheimerAnalyzeMode ? 'Exit Analysis' : 'Analyze Synapses'}
          </button>
          <button
            onClick={alzheimerResetSimulation}
            style={{
              background: '#2d2b28',
              color: '#ff6b6b',
              border: '2px solid #ff6b6b',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Reset Simulation
          </button>
        </div>

        {/* Duplicate Individual Neuron States */}
        <div style={{
          background: '#1a1816',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 0 8px rgba(255, 107, 107, 0.6), 0 0 16px rgba(255, 107, 107, 0.3)'
        }}>
          <div style={{
            background: '#1a1816',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: 'none',
            position: 'relative'
          }}>
            <h3 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Individual Neuron States
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              gap: '1.5rem',
              padding: '1rem',
              minHeight: '400px',
              alignItems: 'center',
              justifyItems: 'center'
            }}>
              {(() => {
                const inputNeurons = neurons.filter(n => n.type === 'Input');
                const hiddenNeurons = neurons.filter(n => n.type === 'Excitatory' || n.type === 'Inhibitory');
                const outputNeurons = neurons.filter(n => n.type === 'Output');
                
                const organizedNeurons = [
                  ...inputNeurons,
                  ...hiddenNeurons.slice(0, 6),
                  ...hiddenNeurons.slice(6),
                  ...outputNeurons
                ];
                
                return organizedNeurons.map((neuron, index) => {
                  const potential = alzheimerMembranePotentials[neuron.id] || -65.0;
                  
                  const neuronCircleStyle = (neuron) => {
                    let backgroundColor = '#4ade80';
                    let shadowColor = 'rgba(74, 222, 128, 0.8)';
                    let shadowColorOuter = 'rgba(74, 222, 128, 0.4)';
                    
                    if (neuron.type === 'Excitatory') {
                      backgroundColor = '#ff8c00';
                      shadowColor = 'rgba(255, 140, 0, 0.8)';
                      shadowColorOuter = 'rgba(255, 140, 0, 0.4)';
                    } else if (neuron.type === 'Inhibitory') {
                      backgroundColor = '#ff6b6b';
                      shadowColor = 'rgba(255, 107, 107, 0.8)';
                      shadowColorOuter = 'rgba(255, 107, 107, 0.4)';
                    } else if (neuron.type === 'Output') {
                      backgroundColor = '#ffd700';
                      shadowColor = 'rgba(255, 215, 0, 0.8)';
                      shadowColorOuter = 'rgba(255, 215, 0, 0.4)';
                    }
                    
                    return {
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: backgroundColor,
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      boxShadow: `0 0 6px ${shadowColor}, 0 0 12px ${shadowColorOuter}`,
                      position: 'relative'
                    };
                  };
                  
                  let isActive = true;
                  if (alzheimerMode === 'A') {
                    isActive = neuron.id === 'I1' || neuron.id === 'I3' || neuron.id === 'I5' || neuron.type !== 'Input';
                  } else if (alzheimerMode === 'B') {
                    isActive = neuron.id === 'I2' || neuron.id === 'I4' || neuron.id === 'I6' || neuron.type !== 'Input';
                  }
                  
                  return (
                    <div key={neuron.id} style={{ textAlign: 'center' }}>
                      <div style={neuronCircleStyle(neuron)}>
                        <div>{neuron.label}</div>
                      </div>
                      <div style={{ 
                        color: isActive ? '#ff9999' : '#666666',
                        fontSize: '0.8rem',
                        marginTop: '0.5rem',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>
                        <div>{neuron.label}</div>
                        <div>{neuron.type}</div>
                        <div>{isActive ? `${potential.toFixed(1)}mV` : '- Inactive'}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Alzheimer's Membrane Potential Graphs */}
        <div style={{
          background: '#1a1816',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 0 8px rgba(255, 107, 107, 0.6), 0 0 16px rgba(255, 107, 107, 0.3)'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Alzheimer's Membrane Potential Traces
          </h3>
          {selectedNeurons && selectedNeurons.length > 0 && (
            <MembraneTraces 
              neurons={selectedNeurons}
              membranePotentials={alzheimerMembranePotentials}
              timeData={alzheimerTimeData || {}}
              hideTitle={true}
              hideBorder={true}
              currentMode={alzheimerMode}
            />
          )}
        </div>

        {/* Alzheimer's Raster Plot - Shows I1, I2, H1, H2, and Output activity */}
        <div style={{
          background: '#1a1816',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 0 8px rgba(255, 107, 107, 0.6), 0 0 16px rgba(255, 107, 107, 0.3)'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Alzheimer's Neural Activity Raster Plot
          </h3>
          <RasterPlot 
            selectedNeurons={selectedNeurons}
            spikes={alzheimerSpikes}
            timeData={alzheimerTimeData}
            outputFiringTime={alzheimerOutputFiringTime}
            isReset={isReset}
            isSimulationRunning={alzheimerMode !== null && !alzheimerAnalyzeMode}
            currentMode={alzheimerMode}
            hideTitle={true}
            hideThreshold={true}
          />
        </div>


        {/* Duplicate Network Canvas */}
        <div style={{
          height: '800px',
          width: '100%',
          background: '#1a1816',
          borderRadius: '8px',
          border: 'none',
          marginBottom: '1rem',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 0 8px rgba(255, 107, 107, 0.6), 0 0 16px rgba(255, 107, 107, 0.3)'
        }}>
          <FixedNetwork 
            currentMode={alzheimerMode}
            onModeChange={handleAlzheimerModeChange}
            analyzeMode={alzheimerAnalyzeMode}
            analyzeSynapses={alzheimerAnalyzeSynapses}
            exitAnalyze={alzheimerExitAnalyze}
            onCaptureEdgeStrengths={handleAlzheimerCaptureEdgeStrengths}
            capturedEdgeStrengths={alzheimerCapturedEdgeStrengths}
            goldenFlash={alzheimerGoldenFlash}
            synapticDegradation={alzheimerSynapticDegradation}
            resilientSynapses={alzheimerResilientSynapses}
            isAlzheimerSimulation={true}
            alzheimerTrainingStartTime={alzheimerTrainingStartTime}
            calculateAlzheimerDegradationEffect={calculateAlzheimerDegradationEffect}
            alzheimerSpikes={alzheimerSpikes}
          />
        </div>

        {/* Alzheimer's Simulation Description */}
        <div style={{
          background: '#1a1816',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #3d3a37',
          marginTop: '1.5rem'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '1.25rem',
            marginBottom: '1rem',
            fontWeight: '600',
            fontFamily: 'Georgia, serif'
          }}>
            Alzheimer's Disease Effects on Neural Networks
          </h3>
          <p style={{
            color: '#e5e0dc',
            lineHeight: '1.6',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}>
            In this simulation, you will observe how Alzheimer's disease affects neural network learning:
          </p>
          <ul style={{
            color: '#e5e0dc',
            marginTop: '1rem',
            paddingLeft: '1.5rem',
            lineHeight: '1.6'
          }}>
            <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
              <strong style={{color: '#ff6b6b'}}>Stubborn Synapses:</strong> Some connections become rigid and do not weaken when patterns change, preventing the network from adapting to new input patterns.
            </li>
            <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
              <strong style={{color: '#ff6b6b'}}>Incomplete Formation:</strong> Many synapses fail to form properly, creating gaps in the neural pathway that prevent effective signal transmission.
            </li>
            <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
              <strong style={{color: '#ff6b6b'}}>Erratic Output:</strong> The output neuron fires irregularly and unpredictably because proper connections cannot be established, leading to random bursts and long pauses.
            </li>
            <li style={{marginBottom: '0.75rem', fontFamily: 'Georgia, serif'}}>
              <strong style={{color: '#ff6b6b'}}>No Pattern Learning:</strong> Despite using the same input patterns (I1, I3, I5 for Pattern A and I2, I4, I6 for Pattern B), the synapses cannot adapt to the specific firing patterns, preventing the network from learning to distinguish between different inputs.
            </li>
          </ul>
          <p style={{
            color: '#b0a99f',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#262421',
            borderRadius: '4px',
            border: '1px solid #3d3a37'
          }}>
            This demonstrates how synaptic degradation in Alzheimer's disease prevents the formation of stable neural pathways, leading to memory loss and cognitive decline.
          </p>
        </div>
      </div>

    </div>
  );
}

