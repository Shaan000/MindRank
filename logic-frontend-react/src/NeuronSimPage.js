import React, { useState, useRef, useCallback, useEffect } from 'react';

// SNN Core Library
const DEFAULT_NEURON_PARAMS = {
  Vrest: -65,
  Vth: -50,
  Vreset: -65,
  tauM: 20,
  tauRef: 3,
  Rm: 1
};

const DEFAULT_STDP_PARAMS = {
  Apos: 0.01,
  Aneg: 0.012,
  tauPos: 20,
  tauNeg: 20,
  wMin: -2,
  wMax: 2,
  enabled: true
};

const DEFAULT_INTRINSIC_PARAMS = {
  eta: 1e-4,
  targetHz: 8,
  enabled: true,
  windowMs: 200
};

// Initialize XOR(Hard) network
function initXORHard() {
  const network = {
    tMs: 0,
    dtMs: 1,
    neurons: [
      { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
      { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
      { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
      { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
      { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
    ],
    nParams: [
      { ...DEFAULT_NEURON_PARAMS },
      { ...DEFAULT_NEURON_PARAMS },
      { ...DEFAULT_NEURON_PARAMS },
      { ...DEFAULT_NEURON_PARAMS },
      { ...DEFAULT_NEURON_PARAMS }
    ],
    synapses: [
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000 },
      { s: 0, delayQueue: new Uint16Array(2), head: 0, lastPreMs: -1000, lastPostMs: -1000 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000 }
    ],
    sParams: [
      { pre: 0, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
      { pre: 1, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
      { pre: 0, post: 3, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
      { pre: 1, post: 3, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
      { pre: 2, post: 4, w: 1.5, delayMs: 2, tauSyn: 5, jump: 1 },
      { pre: 3, post: 4, w: -1.2, delayMs: 1, tauSyn: 5, jump: 1, inhibitory: true }
    ],
    fanOut: [[0, 2], [1, 3], [4], [4], []],
    fanIn: [[], [], [0, 1], [0, 1], [2, 3]],
    stdp: { ...DEFAULT_STDP_PARAMS },
    intr: { ...DEFAULT_INTRINSIC_PARAMS },
    inputRatesHz: [0, 0, 0, 0, 0]
  };
  return network;
}

// Simple step function
function stepNetwork(net, externalSpikes = []) {
  const result = {
    tMs: net.tMs,
    spikes: []
  };

  // Process external Poisson inputs
  for (let i = 0; i < net.inputRatesHz.length; i++) {
    if (net.inputRatesHz[i] > 0) {
      const p = 1 - Math.exp(-net.inputRatesHz[i] * net.dtMs / 1000);
      if (Math.random() < p) {
        externalSpikes.push({ target: i, atMs: net.tMs });
      }
    }
  }

  // Process external spikes
  for (const spike of externalSpikes) {
    if (spike.target < net.neurons.length) {
      result.spikes.push([spike.target, net.tMs]);
      for (const synIdx of net.fanOut[spike.target] || []) {
        const syn = net.synapses[synIdx];
        const delaySteps = Math.floor(net.sParams[synIdx].delayMs / net.dtMs);
        const queueIdx = (syn.head + delaySteps) % syn.delayQueue.length;
        syn.delayQueue[queueIdx]++;
        syn.lastPreMs = net.tMs;
      }
    }
  }

  // Update neurons
  for (let i = 0; i < net.neurons.length; i++) {
    const neuron = net.neurons[i];
    const params = net.nParams[i];

    if (net.tMs < neuron.refUntilMs) continue;

    // Deliver synaptic inputs
    let I_syn = 0;
    for (const synIdx of net.fanIn[i] || []) {
      const syn = net.synapses[synIdx];
      const synParams = net.sParams[synIdx];
      
      const count = syn.delayQueue[syn.head];
      if (count > 0) {
        syn.s += synParams.jump * count;
        syn.delayQueue[syn.head] = 0;
      }
      syn.head = (syn.head + 1) % syn.delayQueue.length;
      I_syn += synParams.w * syn.s;
    }

    // LIF dynamics
    const I_total = I_syn;
    const dV_dt = (params.Vrest - neuron.V + params.Rm * I_total) / params.tauM;
    neuron.V += dV_dt * net.dtMs;

    // Check for spike
    if (neuron.V >= params.Vth) {
      result.spikes.push([i, net.tMs]);
      neuron.V = params.Vreset;
      neuron.refUntilMs = net.tMs + params.tauRef;
      neuron.lastSpikeMs = net.tMs;
    }
  }

  // Decay synapses
  for (let i = 0; i < net.synapses.length; i++) {
    const syn = net.synapses[i];
    const synParams = net.sParams[i];
    syn.s -= (syn.s / synParams.tauSyn) * net.dtMs;
  }

  net.tMs += net.dtMs;
  return result;
}

// Individual Neuron Display Component
function NeuronDisplay({ neuronId, neuron, params, spikes, isSpiking, className = '' }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.width = `${dimensions.width / (window.devicePixelRatio || 1)}px`;
    canvas.style.height = `${dimensions.height / (window.devicePixelRatio || 1)}px`;

    // Clear canvas
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) / 3;

    // Draw neuron membrane
    ctx.strokeStyle = isSpiking ? '#ff6b6b' : '#769656';
    ctx.lineWidth = isSpiking ? 4 : 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw threshold line
    ctx.strokeStyle = '#cc8c14';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw membrane potential as inner circle
    const voltageRatio = Math.max(0, Math.min(1, (neuron.V + 80) / 20)); // Map -80 to -60 mV to 0-1
    const innerRadius = radius * 0.6 * voltageRatio;
    
    if (innerRadius > 0) {
      ctx.fillStyle = isSpiking ? '#ff6b6b' : '#4ade80';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw spike animation
    if (isSpiking) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + 20);
        const y2 = centerY + Math.sin(angle) * (radius + 20);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw neuron label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(neuronId === 0 ? 'x1' : neuronId === 1 ? 'x2' : 
                 neuronId === 2 ? 'H_OR' : neuronId === 3 ? 'H_AND' : 'O', 
                 centerX, centerY);

    // Draw voltage value
    ctx.fillStyle = '#b0a99f';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${neuron.V.toFixed(1)}mV`, centerX, centerY + 25);

  }, [neuron, isSpiking, dimensions]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#1a1816' }}
      />
    </div>
  );
}

// Membrane Trace Component
function MembraneTrace({ neuronId, voltage, timeWindow = 2000, className = '' }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [traceData, setTraceData] = useState([]);

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

  useEffect(() => {
    setTraceData(prev => {
      const newData = [...prev, { voltage, time: Date.now() }];
      return newData.slice(-200); // Keep last 200 points
    });
  }, [voltage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.width = `${dimensions.width / (window.devicePixelRatio || 1)}px`;
    canvas.style.height = `${dimensions.height / (window.devicePixelRatio || 1)}px`;

    ctx.fillStyle = '#1a1816';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (traceData.length < 2) return;

    const padding = 20;
    const plotWidth = dimensions.width - 2 * padding;
    const plotHeight = dimensions.height - 2 * padding;

    // Voltage range
    const vMin = -80;
    const vMax = -40;
    const vRange = vMax - vMin;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }

    // Draw trace
    ctx.strokeStyle = '#769656';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const currentTime = Date.now();
    const timeStart = currentTime - timeWindow;

    traceData.forEach((point, index) => {
      if (point.time >= timeStart) {
        const x = padding + ((point.time - timeStart) / timeWindow) * plotWidth;
        const y = padding + ((vMax - point.voltage) / vRange) * plotHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    });

    ctx.stroke();

    // Draw threshold line
    ctx.strokeStyle = '#cc8c14';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const thresholdY = padding + ((vMax - (-50)) / vRange) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding, thresholdY);
    ctx.lineTo(padding + plotWidth, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [traceData, dimensions, timeWindow]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#1a1816' }}
      />
    </div>
  );
}

// Canvas Components
function RasterPlot({ spikes, neuronCount, timeWindow = 2000, className = '' }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.width = `${dimensions.width / (window.devicePixelRatio || 1)}px`;
    canvas.style.height = `${dimensions.height / (window.devicePixelRatio || 1)}px`;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (neuronCount === 0) return;

    const padding = 20;
    const plotWidth = dimensions.width - 2 * padding;
    const plotHeight = dimensions.height - 2 * padding;
    const neuronHeight = plotHeight / neuronCount;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i <= neuronCount; i++) {
      const y = padding + i * neuronHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }

    // Draw spikes
    const currentTime = Math.max(...spikes.map(([, t]) => t), 0);
    const timeStart = currentTime - timeWindow;

    ctx.fillStyle = '#10b981';
    spikes.forEach(([neuronId, time]) => {
      if (time >= timeStart && time <= currentTime) {
        const x = padding + ((time - timeStart) / timeWindow) * plotWidth;
        const y = padding + neuronId * neuronHeight + neuronHeight / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i < neuronCount; i++) {
      const y = padding + i * neuronHeight + neuronHeight / 2;
      const label = i === 0 ? 'x1' : i === 1 ? 'x2' : 
                   i === neuronCount - 1 ? 'O' : 
                   i === 2 ? 'H_OR' : i === 3 ? 'H_AND' : `N${i}`;
      ctx.fillText(label, padding - 5, y + 4);
    }

  }, [spikes, neuronCount, timeWindow, dimensions]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      />
      <div className="absolute top-2 left-2 text-sm text-slate-300">
        Raster Plot
      </div>
    </div>
  );
}

export default function NeuronSimPage() {
  const [network, setNetwork] = useState(() => initXORHard());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [spikesWindow, setSpikesWindow] = useState([]);
  const [x1Rate, setX1Rate] = useState(0);
  const [x2Rate, setX2Rate] = useState(0);
  
  const animationRef = useRef();
  const lastTimeRef = useRef(0);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setNetwork(initXORHard());
    setSpikesWindow([]);
  }, []);

  const step = useCallback((n = 1) => {
    setNetwork(prev => {
      const newNet = { ...prev };
      for (let i = 0; i < n; i++) {
        const result = stepNetwork(newNet, []);
        
        setSpikesWindow(current => {
          const newSpikes = [...current, ...result.spikes];
          return newSpikes.slice(-1000);
        });
      }
      return newNet;
    });
  }, []);

  const setRates = useCallback((rates) => {
    setNetwork(prev => ({
      ...prev,
      inputRatesHz: [rates.x1, rates.x2, 0, 0, 0]
    }));
  }, []);

  const firePattern = useCallback((code) => {
    const rates = {
      '00': { x1: 0, x2: 0 },
      '10': { x1: 20, x2: 0 },
      '01': { x1: 0, x2: 20 },
      '11': { x1: 20, x2: 20 }
    };
    setRates(rates[code]);
  }, [setRates]);

  // Animation loop
  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      return;
    }

    const animate = (currentTime) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      const stepsToRun = Math.floor((deltaTime * speed) / 1000);
      
      if (stepsToRun > 0) {
        step(stepsToRun);
        lastTimeRef.current = currentTime;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [isRunning, speed, step]);

  // Chess.com style inline styles - matching landing page
  const homepageStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
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
    background: '#312e2b',
    padding: '3rem 2rem'
  };

  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    margin: '1.5rem auto',
    maxWidth: '800px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 0, 0.3)',
    border: '1px solid #00ff00'
  };

  const controlButtonStyle = {
    background: '#cc8c14',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    margin: '0.25rem',
    fontFamily: 'Georgia, serif',
    minWidth: '80px'
  };

  const startButtonStyle = {
    ...controlButtonStyle,
    background: '#769656'
  };

  const pauseButtonStyle = {
    ...controlButtonStyle,
    background: '#cc4125'
  };

  const resetButtonStyle = {
    ...controlButtonStyle,
    background: '#5a4a2d'
  };

  const stepButtonStyle = {
    ...controlButtonStyle,
    background: '#2d5a2d'
  };

  const sliderContainerStyle = {
    margin: '1.5rem 0',
    textAlign: 'center'
  };

  const sliderLabelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '1rem',
    color: '#b0a99f',
    fontWeight: '500'
  };

  const sliderStyle = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#1a1816',
    outline: 'none',
    cursor: 'pointer'
  };

  const patternButtonStyle = {
    background: '#1a1816',
    color: '#b0a99f',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #3d3a37',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
    margin: '0.25rem',
    fontFamily: 'Georgia, serif',
    minWidth: '100px'
  };

  const rasterContainerStyle = {
    background: '#1a1816',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1.5rem 0',
    border: '1px solid #3d3a37',
    minHeight: '300px'
  };

  const descriptionStyle = {
    background: '#1a1816',
    padding: '1.5rem',
    borderRadius: '8px',
    marginTop: '1.5rem',
    border: '1px solid #3d3a37'
  };

  const descriptionTextStyle = {
    color: '#e5e0dc',
    lineHeight: '1.6',
    fontSize: '1rem'
  };

  const listItemStyle = {
    marginBottom: '0.5rem',
    fontFamily: 'Georgia, serif'
  };

  return (
    <div style={homepageStyle}>
      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 style={titleStyle}>🧠 Interactive Neuron Simulation</h1>
        <p style={subtitleStyle}>Watch XOR Logic Emerge from Spiking Neural Networks</p>
        
        <button 
          style={backButtonStyle}
          onClick={() => window.history.back()}
        >
          ← Back to Home
        </button>
      </div>

      {/* Main Content */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '2rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            Simulation Controls
          </h2>
          
          {/* Control Buttons */}
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            {!isRunning ? (
              <button 
                onClick={start} 
                style={startButtonStyle}
              >
                ▶️ Start
              </button>
            ) : (
              <button 
                onClick={pause} 
                style={pauseButtonStyle}
              >
                ⏸️ Pause
              </button>
            )}
            <button 
              onClick={() => step(1)} 
              style={stepButtonStyle}
            >
              ⏭️ Step
            </button>
            <button 
              onClick={reset} 
              style={resetButtonStyle}
            >
              🔄 Reset
            </button>
          </div>

          {/* Speed Control */}
          <div style={sliderContainerStyle}>
            <label style={sliderLabelStyle}>
              Simulation Speed: {speed.toFixed(1)}×
            </label>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </div>

          {/* Input Rate Controls */}
          <div style={sliderContainerStyle}>
            <label style={sliderLabelStyle}>
              x1 Input Rate: {x1Rate.toFixed(1)} Hz
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={x1Rate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setX1Rate(rate);
                setRates({ x1: rate, x2: x2Rate });
              }}
              style={sliderStyle}
            />
          </div>

          <div style={sliderContainerStyle}>
            <label style={sliderLabelStyle}>
              x2 Input Rate: {x2Rate.toFixed(1)} Hz
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={x2Rate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setX2Rate(rate);
                setRates({ x1: x1Rate, x2: rate });
              }}
              style={sliderStyle}
            />
          </div>

          {/* Test Patterns */}
          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <h3 style={{color: '#ffffff', marginBottom: '1rem', fontFamily: 'Georgia, serif', fontSize: '1.125rem'}}>
              Test Patterns
            </h3>
            <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem'}}>
              <button 
                onClick={() => firePattern('00')}
                style={patternButtonStyle}
              >
                00 (No input)
              </button>
              <button 
                onClick={() => firePattern('10')}
                style={patternButtonStyle}
              >
                10 (x1 only)
              </button>
              <button 
                onClick={() => firePattern('01')}
                style={patternButtonStyle}
              >
                01 (x2 only)
              </button>
              <button 
                onClick={() => firePattern('11')}
                style={patternButtonStyle}
              >
                11 (Both inputs)
              </button>
            </div>
          </div>
        </div>

        {/* Individual Neuron Displays */}
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            Individual Neuron States
          </h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
            {network.neurons.map((neuron, index) => {
              const isSpiking = spikesWindow.some(([neuronId, time]) => 
                neuronId === index && time > network.tMs - 100
              );
              return (
                <div key={index} style={{textAlign: 'center'}}>
                  <div style={{height: '150px', marginBottom: '0.5rem'}}>
                    <NeuronDisplay
                      neuronId={index}
                      neuron={neuron}
                      params={network.nParams[index]}
                      spikes={spikesWindow}
                      isSpiking={isSpiking}
                      className="w-full h-full"
                    />
                  </div>
                  <div style={{color: '#b0a99f', fontSize: '0.9rem', fontFamily: 'Georgia, serif'}}>
                    {index === 0 ? 'x1' : index === 1 ? 'x2' : 
                     index === 2 ? 'H_OR' : index === 3 ? 'H_AND' : 'O'}
                  </div>
                  <div style={{color: '#769656', fontSize: '0.8rem'}}>
                    {neuron.V.toFixed(1)}mV
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membrane Traces */}
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            Membrane Potential Traces
          </h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
            {network.neurons.map((neuron, index) => (
              <div key={index} style={{textAlign: 'center'}}>
                <div style={{color: '#b0a99f', fontSize: '1rem', marginBottom: '0.5rem', fontFamily: 'Georgia, serif'}}>
                  {index === 0 ? 'x1' : index === 1 ? 'x2' : 
                   index === 2 ? 'H_OR' : index === 3 ? 'H_AND' : 'O'} Membrane Trace
                </div>
                <div style={{height: '120px', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37'}}>
                  <MembraneTrace
                    neuronId={index}
                    voltage={neuron.V}
                    timeWindow={2000}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raster Plot */}
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            Neural Activity Raster Plot
          </h2>
          <div style={rasterContainerStyle}>
            <RasterPlot
              spikes={spikesWindow}
              neuronCount={5}
              timeWindow={2000}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Network Description */}
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            XOR Network Architecture
          </h2>
          <div style={descriptionStyle}>
            <p style={descriptionTextStyle}>
              This simulation demonstrates an XOR (exclusive OR) neural network with 5 spiking neurons:
            </p>
            <ul style={{color: '#e5e0dc', marginTop: '1rem', paddingLeft: '1.5rem'}}>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>x1, x2:</strong> Input neurons that generate Poisson spike trains
              </li>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>H_OR:</strong> Hidden neuron that fires when either input is active
              </li>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>H_AND:</strong> Hidden neuron that fires when both inputs are active
              </li>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>O:</strong> Output neuron that implements XOR logic
              </li>
            </ul>
            <p style={{...descriptionTextStyle, marginTop: '1.5rem', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37'}}>
              <strong style={{color: '#cc8c14'}}>XOR Logic:</strong> The output fires when exactly one input is active (patterns 01 or 10), 
              but remains silent when both inputs are active (11) or when neither is active (00). 
              This demonstrates how neural networks can implement logical operations through spike timing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
