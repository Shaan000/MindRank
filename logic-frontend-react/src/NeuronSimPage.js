import React, { useState, useRef, useCallback, useEffect } from 'react';

// Biologically Realistic SNN Library with Competition Mechanisms
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

const DEFAULT_STD_PARAMS = {
  U: 0.2,        // utilization per spike
  tauRec: 600    // recovery time constant (ms)
};

// Jitter function for breaking symmetry
function jitterDelayMs(base) {
  const j = (Math.random() - 0.5) * 1.0;
  return Math.max(1, Math.round(base + j));
}

// Poisson spike generation
function maybeEmitPoisson(rateHz, dtMs) {
  const p = 1 - Math.exp(-rateHz * dtMs / 1000);
  return Math.random() < p;
}

// Sign-conserving weight update
function signConserve(w, inhibitory) {
  if (inhibitory) return Math.min(w, 0);
  return Math.max(w, 0);
}

// Clamp function
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Short-term depression recovery
function recoverSTD(syn, params, t) {
  const dt = Math.max(0, t - syn.lastUpdateMs);
  if (dt > 0) {
    syn.R = 1 - (1 - syn.R) * Math.exp(-dt / params.tauRec);
    syn.lastUpdateMs = t;
  }
}

// Probabilistic vesicle release
function preEnqueueWithRelease(net, synIdx) {
  const p = net.sParams[synIdx];
  const prel = Math.min(Math.max(0.05, 0.4 * Math.abs(p.w)), 0.9);
  
  if (Math.random() < prel) {
    const syn = net.synapses[synIdx];
    const steps = Math.max(1, Math.round(p.delayMs / net.dtMs));
    syn.delayQueue[(syn.head + steps) % syn.delayQueue.length] += 1;
    return true; // Release succeeded
  }
  return false; // Release failed
}

// Initialize biologically realistic XOR network with STDP
function initXORSTDP() {
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
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      { s: 0, delayQueue: new Uint16Array(2), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      // Lateral inhibition H_OR -> H_AND
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 },
      // Lateral inhibition H_AND -> H_OR
      { s: 0, delayQueue: new Uint16Array(1), head: 0, lastPreMs: -1000, lastPostMs: -1000, R: 1, lastUpdateMs: 0 }
    ],
    sParams: [
      // x1 -> H_OR (excitatory, with jitter and STD)
      { pre: 0, post: 2, w: 0.1, delayMs: jitterDelayMs(1), tauSyn: 5, jump: 1, inhibitory: false, U: 0.2, tauRec: 600 },
      // x2 -> H_OR (excitatory, with jitter and STD)
      { pre: 1, post: 2, w: 0.1, delayMs: jitterDelayMs(1), tauSyn: 5, jump: 1, inhibitory: false, U: 0.2, tauRec: 600 },
      // x1 -> H_AND (excitatory, with jitter and STD)
      { pre: 0, post: 3, w: 0.1, delayMs: jitterDelayMs(1), tauSyn: 5, jump: 1, inhibitory: false, U: 0.2, tauRec: 600 },
      // x2 -> H_AND (excitatory, with jitter and STD)
      { pre: 1, post: 3, w: 0.1, delayMs: jitterDelayMs(1), tauSyn: 5, jump: 1, inhibitory: false, U: 0.2, tauRec: 600 },
      // H_OR -> O (excitatory, longer delay)
      { pre: 2, post: 4, w: 0.05, delayMs: 2, tauSyn: 5, jump: 1, inhibitory: false, U: 0.2, tauRec: 600 },
      // H_AND -> O (inhibitory, shorter delay)
      { pre: 3, post: 4, w: -0.05, delayMs: 1, tauSyn: 5, jump: 1, inhibitory: true, U: 0.2, tauRec: 600 },
      // Lateral inhibition H_OR -> H_AND
      { pre: 2, post: 3, w: -0.15, delayMs: 1, tauSyn: 3, jump: 1, inhibitory: true, U: 0.2, tauRec: 300 },
      // Lateral inhibition H_AND -> H_OR
      { pre: 3, post: 2, w: -0.15, delayMs: 1, tauSyn: 3, jump: 1, inhibitory: true, U: 0.2, tauRec: 300 }
    ],
    fanOut: [[0, 2], [1, 3], [4, 6], [5, 7], []],
    fanIn: [[], [], [0, 1, 7], [2, 3, 6], [4, 5]],
    stdp: { ...DEFAULT_STDP_PARAMS },
    intr: { ...DEFAULT_INTRINSIC_PARAMS },
    inputRatesHz: [15, 15, 0, 0, 0], // Default Poisson rates
    jitterEnabled: true,
    spikeHistory: [[], [], [], [], []], // Track spikes for intrinsic plasticity
    learningMode: true
  };
  return network;
}

// Keep old function for compatibility
function initXORHard() {
  return initXORSTDP();
}

// Biologically realistic step function with STDP and intrinsic plasticity
function stepNetwork(net, externalSpikes = []) {
  const result = {
    tMs: net.tMs,
    spikes: []
  };

  // Process external Poisson inputs (only for input neurons)
  for (let i = 0; i < 2; i++) { // Only x1, x2
    if (net.inputRatesHz[i] > 0) {
      if (maybeEmitPoisson(net.inputRatesHz[i], net.dtMs)) {
        externalSpikes.push({ target: i, atMs: net.tMs });
      }
    }
  }

  // Process external spikes with probabilistic release
  for (const spike of externalSpikes) {
    if (spike.target < net.neurons.length) {
      result.spikes.push([spike.target, net.tMs]);
      for (const synIdx of net.fanOut[spike.target] || []) {
        preEnqueueWithRelease(net, synIdx);
        net.synapses[synIdx].lastPreMs = net.tMs;
      }
    }
  }

  // Update neurons
  for (let i = 0; i < net.neurons.length; i++) {
    const neuron = net.neurons[i];
    const params = net.nParams[i];

    if (net.tMs < neuron.refUntilMs) continue;

    // Deliver synaptic inputs with STD
    let I_syn = 0;
    for (const synIdx of net.fanIn[i] || []) {
      const syn = net.synapses[synIdx];
      const synParams = net.sParams[synIdx];
      
      // Recover STD resources
      recoverSTD(syn, synParams, net.tMs);
      
      const count = syn.delayQueue[syn.head];
      if (count > 0) {
        // Apply STD depression
        const effectiveJump = synParams.jump * syn.R;
        syn.R = syn.R * (1 - synParams.U);
        syn.s += count * effectiveJump;
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
      
      // Enqueue with probabilistic release for internal spikes
      for (const synIdx of net.fanOut[i] || []) {
        preEnqueueWithRelease(net, synIdx);
        net.synapses[synIdx].lastPreMs = net.tMs;
      }
    }
  }

  // Decay synapses
  for (let i = 0; i < net.synapses.length; i++) {
    const syn = net.synapses[i];
    const synParams = net.sParams[i];
    syn.s -= (syn.s / synParams.tauSyn) * net.dtMs;
  }

  // STDP Learning (sign-conserving)
  if (net.stdp.enabled) {
    for (const spike of result.spikes) {
      const [neuronId, time] = spike;
      
      // Update fan-out synapses (pre-before-post LTP)
      for (const synIdx of net.fanOut[neuronId] || []) {
        const syn = net.synapses[synIdx];
        const synParams = net.sParams[synIdx];
        const dTpos = syn.lastPostMs - time;
        
        if (dTpos > 0) {
          const dw = net.stdp.Apos * Math.exp(-dTpos / net.stdp.tauPos);
          const newW = synParams.w + dw;
          synParams.w = clamp(signConserve(newW, synParams.inhibitory), net.stdp.wMin, net.stdp.wMax);
        }
        syn.lastPreMs = time;
      }
      
      // Update fan-in synapses (post-before-pre LTD)
      for (const synIdx of net.fanIn[neuronId] || []) {
        const syn = net.synapses[synIdx];
        const synParams = net.sParams[synIdx];
        const dTneg = time - syn.lastPreMs;
        
        if (dTneg > 0) {
          const dw = -net.stdp.Aneg * Math.exp(-dTneg / net.stdp.tauNeg);
          const newW = synParams.w + dw;
          synParams.w = clamp(signConserve(newW, synParams.inhibitory), net.stdp.wMin, net.stdp.wMax);
        }
        syn.lastPostMs = time;
      }
    }
  }

  // Intrinsic Plasticity (homeostatic threshold adjustment)
  if (net.intr.enabled && net.tMs % net.intr.windowMs === 0) {
    for (let i = 2; i < net.neurons.length; i++) { // Skip input neurons
      const spikesInWindow = net.spikeHistory[i].filter(t => t > net.tMs - net.intr.windowMs);
      const rate = spikesInWindow.length / (net.intr.windowMs / 1000);
      const dVth = net.intr.eta * (rate - net.intr.targetHz);
      net.nParams[i].Vth = clamp(net.nParams[i].Vth + dVth, -55, -45);
    }
  }

  // Track spikes for intrinsic plasticity
  for (const spike of result.spikes) {
    const [neuronId, time] = spike;
    net.spikeHistory[neuronId].push(time);
    // Keep only recent spikes
    net.spikeHistory[neuronId] = net.spikeHistory[neuronId].filter(t => t > net.tMs - 1000);
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

// Network Graph Component with Animated Connections
function NetworkGraph({ network, spikes, className = '' }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [signalParticles, setSignalParticles] = useState([]);

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

  // Update signal particles when spikes occur
  useEffect(() => {
    const recentSpikes = spikes.filter(([neuronId, time]) => time > network.tMs - 100);
    recentSpikes.forEach(([neuronId, time]) => {
      // Find outgoing connections from this neuron
      const outgoingSynapses = network.fanOut[neuronId] || [];
      outgoingSynapses.forEach(synIdx => {
        const synParams = network.sParams[synIdx];
        const delay = Math.max(100, synParams.delayMs); // Ensure minimum delay for visibility
        
        setSignalParticles(prev => [...prev, {
          id: Date.now() + Math.random(),
          from: neuronId,
          to: synParams.post,
          startTime: time,
          delay: delay,
          progress: 0,
          color: synParams.inhibitory ? '#ff6b6b' : '#4ade80'
        }]);
      });
    });
  }, [spikes, network]);

  // Update particle positions (faster updates for smoother animation)
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalParticles(prev => 
        prev.map(particle => ({
          ...particle,
          progress: Math.min(1, (network.tMs - particle.startTime) / particle.delay)
        })).filter(particle => particle.progress < 1)
      );
    }, 30); // Faster updates for smoother animation

    return () => clearInterval(interval);
  }, [network.tMs]);

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

    // Define neuron positions optimized for the larger container
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const neuronPositions = [
      { x: centerX - 200, y: centerY - 100 },   // x1
      { x: centerX - 200, y: centerY + 100 },   // x2
      { x: centerX, y: centerY - 50 },          // H_OR
      { x: centerX, y: centerY + 50 },          // H_AND
      { x: centerX + 200, y: centerY }          // O
    ];

    // Draw connections first (behind neurons)
    network.sParams.forEach((synParams, index) => {
      const fromPos = neuronPositions[synParams.pre];
      const toPos = neuronPositions[synParams.post];
      
      if (!fromPos || !toPos) return;

      // Connection color and style
      const weight = Math.abs(synParams.w);
      const alpha = Math.min(1, weight / 2);
      const color = synParams.inhibitory ? 
        `rgba(255, 107, 107, ${alpha})` : 
        `rgba(74, 222, 128, ${alpha})`;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, weight * 3);
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
      const arrowLength = 15;
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
    });

    // Draw signal particles
    signalParticles.forEach(particle => {
      const fromPos = neuronPositions[particle.from];
      const toPos = neuronPositions[particle.to];
      
      if (!fromPos || !toPos) return;

      const x = fromPos.x + (toPos.x - fromPos.x) * particle.progress;
      const y = fromPos.y + (toPos.y - fromPos.y) * particle.progress;

      // Draw larger, more visible signal particles
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Add stronger glow effect for better visibility
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Add pulsing effect
      const pulseSize = 6 + 2 * Math.sin(Date.now() * 0.01);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw neurons
    network.neurons.forEach((neuron, index) => {
      const pos = neuronPositions[index];
      if (!pos) return;

      const isSpiking = spikes.some(([neuronId, time]) => 
        neuronId === index && time > network.tMs - 100
      );

      // Neuron membrane (larger for better visibility)
      ctx.strokeStyle = isSpiking ? '#ff6b6b' : '#769656';
      ctx.lineWidth = isSpiking ? 6 : 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 40, 0, 2 * Math.PI);
      ctx.stroke();

      // Membrane potential visualization
      const voltageRatio = Math.max(0, Math.min(1, (neuron.V + 80) / 20));
      const innerRadius = 25 * voltageRatio;
      
      if (innerRadius > 0) {
        ctx.fillStyle = isSpiking ? '#ff6b6b' : '#4ade80';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, innerRadius, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Spike animation (larger and more visible)
      if (isSpiking) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6;
          const x1 = pos.x + Math.cos(angle) * 40;
          const y1 = pos.y + Math.sin(angle) * 40;
          const x2 = pos.x + Math.cos(angle) * 60;
          const y2 = pos.y + Math.sin(angle) * 60;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Neuron label (larger and more visible)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = index === 0 ? 'x1' : index === 1 ? 'x2' : 
                   index === 2 ? 'H_OR' : index === 3 ? 'H_AND' : 'O';
      ctx.fillText(label, pos.x, pos.y);

      // Voltage display (larger and positioned better)
      ctx.fillStyle = '#b0a99f';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${neuron.V.toFixed(1)}mV`, pos.x, pos.y + 55);
    });

  }, [network, spikes, signalParticles, dimensions]);

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ 
          background: '#1a1816', 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
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
  const [network, setNetwork] = useState(() => initXORSTDP());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [spikesWindow, setSpikesWindow] = useState([]);
  const [x1Rate, setX1Rate] = useState(15);
  const [x2Rate, setX2Rate] = useState(15);
  const [stdpEnabled, setStdpEnabled] = useState(true);
  const [intrinsicEnabled, setIntrinsicEnabled] = useState(true);
  const [jitterEnabled, setJitterEnabled] = useState(true);
  const [learningMode, setLearningMode] = useState(true);
  const [stdEnabled, setStdEnabled] = useState(true);
  const [releaseEnabled, setReleaseEnabled] = useState(true);
  const [lateralEnabled, setLateralEnabled] = useState(true);
  
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
    setNetwork(initXORSTDP());
    setSpikesWindow([]);
  }, []);

  const toggleStdp = useCallback(() => {
    setStdpEnabled(prev => {
      setNetwork(net => ({ ...net, stdp: { ...net.stdp, enabled: !prev } }));
      return !prev;
    });
  }, []);

  const toggleIntrinsic = useCallback(() => {
    setIntrinsicEnabled(prev => {
      setNetwork(net => ({ ...net, intr: { ...net.intr, enabled: !prev } }));
      return !prev;
    });
  }, []);

  const toggleJitter = useCallback(() => {
    setJitterEnabled(prev => {
      setNetwork(net => ({ ...net, jitterEnabled: !prev }));
      return !prev;
    });
  }, []);

  const toggleLearningMode = useCallback(() => {
    setLearningMode(prev => {
      setNetwork(net => ({ ...net, learningMode: !prev }));
      return !prev;
    });
  }, []);

  const toggleStd = useCallback(() => {
    setStdEnabled(prev => !prev);
  }, []);

  const toggleRelease = useCallback(() => {
    setReleaseEnabled(prev => !prev);
  }, []);

  const toggleLateral = useCallback(() => {
    setLateralEnabled(prev => !prev);
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
    maxWidth: '1200px',
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

          {/* Learning Controls */}
          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <h3 style={{color: '#ffffff', marginBottom: '1rem', fontFamily: 'Georgia, serif', fontSize: '1.125rem'}}>
              Learning Mechanisms
            </h3>
            <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem'}}>
              <button 
                onClick={toggleStdp}
                style={{
                  ...patternButtonStyle,
                  background: stdpEnabled ? '#769656' : '#1a1816',
                  color: stdpEnabled ? '#ffffff' : '#b0a99f'
                }}
              >
                STDP {stdpEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={toggleIntrinsic}
                style={{
                  ...patternButtonStyle,
                  background: intrinsicEnabled ? '#769656' : '#1a1816',
                  color: intrinsicEnabled ? '#ffffff' : '#b0a99f'
                }}
              >
                Intrinsic {intrinsicEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={toggleJitter}
                style={{
                  ...patternButtonStyle,
                  background: jitterEnabled ? '#769656' : '#1a1816',
                  color: jitterEnabled ? '#ffffff' : '#b0a99f'
                }}
              >
                Jitter {jitterEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={toggleLearningMode}
                style={{
                  ...patternButtonStyle,
                  background: learningMode ? '#cc8c14' : '#1a1816',
                  color: learningMode ? '#ffffff' : '#b0a99f'
                }}
              >
                Learning {learningMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Competition Mechanisms */}
          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <h3 style={{color: '#ffffff', marginBottom: '1rem', fontFamily: 'Georgia, serif', fontSize: '1.125rem'}}>
              Competition Mechanisms
            </h3>
            <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem'}}>
              <button 
                onClick={toggleStd}
                style={{
                  ...patternButtonStyle,
                  background: stdEnabled ? '#769656' : '#1a1816',
                  color: stdEnabled ? '#ffffff' : '#b0a99f'
                }}
              >
                STD {stdEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={toggleRelease}
                style={{
                  ...patternButtonStyle,
                  background: releaseEnabled ? '#769656' : '#1a1816',
                  color: releaseEnabled ? '#ffffff' : '#b0a99f'
                }}
              >
                Release {releaseEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={toggleLateral}
                style={{
                  ...patternButtonStyle,
                  background: lateralEnabled ? '#769656' : '#1a1816',
                  color: lateralEnabled ? '#ffffff' : '#b0a99f'
                }}
              >
                Lateral {lateralEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
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

        {/* Network Graph with Animated Connections */}
        <div style={cardStyle}>
          <h2 style={{fontSize: '1.5rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            Neural Network with Live Signal Propagation
          </h2>
          <div style={{height: '800px', width: '100%', background: '#1a1816', borderRadius: '8px', border: '1px solid #3d3a37', marginBottom: '1rem', overflow: 'hidden', position: 'relative'}}>
            <NetworkGraph
              network={network}
              spikes={spikesWindow}
              className="w-full h-full"
            />
          </div>
          <div style={{textAlign: 'center', color: '#b0a99f', fontSize: '0.9rem'}}>
            <span style={{color: '#4ade80'}}>●</span> Excitatory connections &nbsp;&nbsp;
            <span style={{color: '#ff6b6b'}}>●</span> Inhibitory connections &nbsp;&nbsp;
            <span style={{color: '#ff6b6b'}}>⚡</span> Moving signals
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
            Biologically Realistic XOR Network
          </h2>
          <div style={descriptionStyle}>
            <p style={descriptionTextStyle}>
              This simulation demonstrates a biologically realistic XOR network with stochastic inputs and local learning:
            </p>
            <ul style={{color: '#e5e0dc', marginTop: '1rem', paddingLeft: '1.5rem'}}>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>x1, x2:</strong> Poisson spike generators (no DC current)
              </li>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>H_OR, H_AND:</strong> Hidden neurons with symmetry-breaking jitter
              </li>
              <li style={listItemStyle}>
                <strong style={{color: '#769656'}}>O:</strong> Output neuron with STDP + intrinsic plasticity
              </li>
            </ul>
            <p style={{...descriptionTextStyle, marginTop: '1.5rem', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37'}}>
              <strong style={{color: '#cc8c14'}}>Learning Mechanisms:</strong> 
              <br/>• <strong>STDP:</strong> Pre-before-post LTP, post-before-pre LTD (sign-conserving)
              <br/>• <strong>Intrinsic Plasticity:</strong> Homeostatic threshold adjustment (target: 8 Hz)
              <br/>• <strong>Jitter:</strong> Asymmetry-breaking delays for natural differentiation
              <br/>• <strong>XOR Logic:</strong> Emerges through learning, not hard-wiring
            </p>
            <p style={{...descriptionTextStyle, marginTop: '1rem', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37'}}>
              <strong style={{color: '#4ade80'}}>Competition Mechanisms:</strong>
              <br/>• <strong>Short-Term Depression (STD):</strong> Synapses fatigue after use, preventing runaway activity
              <br/>• <strong>Probabilistic Release:</strong> Stronger synapses pass more spikes (weight-scaled probability)
              <br/>• <strong>Lateral Inhibition:</strong> H_OR ↔ H_AND mutual suppression creates winner-take-all
              <br/>• <strong>Visible Routing:</strong> STDP can now latch onto asymmetric patterns!
            </p>
            <p style={{...descriptionTextStyle, marginTop: '1rem', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37'}}>
              <strong style={{color: '#ff6b6b'}}>Realistic Features:</strong> No constant current injection, only Poisson inputs. 
              Network learns XOR through local plasticity rules with biological competition mechanisms!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
