export type NeuronId = number;

export interface NeuronParams {
  Vrest: number;
  Vth: number;
  Vreset: number;
  tauM: number;
  tauRef: number;
  Rm: number;
}

export interface NeuronState {
  V: number;
  refUntilMs: number;
  lastSpikeMs: number;
}

export interface STDPParams {
  Apos: number;
  Aneg: number;
  tauPos: number;
  tauNeg: number;
  wMin: number;
  wMax: number;
  enabled: boolean;
}

export interface IntrinsicParams {
  eta: number; // threshold learning rate (per ms)
  targetHz: number; // desired firing rate
  enabled: boolean;
  windowMs: number; // rate estimation window
}

export interface SynapseParams {
  pre: NeuronId;
  post: NeuronId;
  w: number;
  delayMs: number;
  tauSyn: number;
  jump: number;
  inhibitory?: boolean; // if true, enforce w <= 0
}

export interface SynapseState {
  s: number;
  delayQueue: Uint16Array;
  head: number;
  lastPreMs: number;
  lastPostMs: number;
}

export interface Network {
  tMs: number;
  dtMs: number;
  neurons: NeuronState[];
  nParams: NeuronParams[];
  synapses: SynapseState[];
  sParams: SynapseParams[];
  fanOut: number[][];
  fanIn: number[][];
  stdp: STDPParams;
  intr: IntrinsicParams;
  // input config
  inputRatesHz: number[]; // e.g., [x1,x2]
}

export interface SpikeEvent {
  target: NeuronId;
  atMs: number;
}

export interface StepResult {
  tMs: number;
  spikes: [NeuronId, number][]; // spikes this step
  traceSamples?: { id: NeuronId; V: number; t: number }[];
  weightSamples?: { syn: number; w: number; t: number }[];
  vthSamples?: { id: NeuronId; Vth: number; t: number }[];
}

// Default parameters
const DEFAULT_NEURON_PARAMS: NeuronParams = {
  Vrest: -65,
  Vth: -50,
  Vreset: -65,
  tauM: 20,
  tauRef: 3,
  Rm: 1
};

const DEFAULT_STDP_PARAMS: STDPParams = {
  Apos: 0.01,
  Aneg: 0.012,
  tauPos: 20,
  tauNeg: 20,
  wMin: -2,
  wMax: 2,
  enabled: true
};

const DEFAULT_INTRINSIC_PARAMS: IntrinsicParams = {
  eta: 1e-4,
  targetHz: 8,
  enabled: true,
  windowMs: 200
};

export function initNetwork(preset: string): Network {
  const network: Network = {
    tMs: 0,
    dtMs: 1,
    neurons: [],
    nParams: [],
    synapses: [],
    sParams: [],
    fanOut: [],
    fanIn: [],
    stdp: { ...DEFAULT_STDP_PARAMS },
    intr: { ...DEFAULT_INTRINSIC_PARAMS },
    inputRatesHz: [0, 0]
  };

  switch (preset) {
    case 'SingleLIF':
      initSingleLIF(network);
      break;
    case 'EE':
      initEE(network);
      break;
    case 'EIE':
      initEIE(network);
      break;
    case 'OR':
      initOR(network);
      break;
    case 'AND':
      initAND(network);
      break;
    case 'XOR(Hard)':
      initXORHard(network);
      break;
    case 'XOR(STDP)':
      initXORSTDP(network);
      break;
    default:
      initSingleLIF(network);
  }

  return network;
}

export function resetNetwork(net: Network, preset?: string): void {
  if (preset) {
    const newNet = initNetwork(preset);
    Object.assign(net, newNet);
  } else {
    // Reset to initial state
    net.tMs = 0;
    for (let i = 0; i < net.neurons.length; i++) {
      net.neurons[i] = {
        V: net.nParams[i].Vrest,
        refUntilMs: 0,
        lastSpikeMs: -1000
      };
    }
    for (let i = 0; i < net.synapses.length; i++) {
      net.synapses[i] = {
        s: 0,
        delayQueue: new Uint16Array(Math.ceil(net.sParams[i].delayMs / net.dtMs)),
        head: 0,
        lastPreMs: -1000,
        lastPostMs: -1000
      };
    }
  }
}

export function stepNetwork(net: Network, externalSpikes: SpikeEvent[]): StepResult {
  const result: StepResult = {
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
      // Add to delay queues of outgoing synapses
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

    // Skip if refractory
    if (net.tMs < neuron.refUntilMs) {
      continue;
    }

    // Deliver synaptic inputs
    let I_syn = 0;
    for (const synIdx of net.fanIn[i] || []) {
      const syn = net.synapses[synIdx];
      const synParams = net.sParams[synIdx];
      
      // Deliver from delay queue
      const count = syn.delayQueue[syn.head];
      if (count > 0) {
        syn.s += synParams.jump * count;
        syn.delayQueue[syn.head] = 0;
      }
      syn.head = (syn.head + 1) % syn.delayQueue.length;

      // Add synaptic current
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

      // Update STDP for outgoing synapses
      if (net.stdp.enabled) {
        for (const synIdx of net.fanOut[i] || []) {
          const synParams = net.sParams[synIdx];
          const postNeuron = net.neurons[synParams.post];
          
          // Pre-before-post potentiation
          if (postNeuron.lastSpikeMs > 0) {
            const dt = postNeuron.lastSpikeMs - net.tMs;
            if (dt > 0) {
              const dw = net.stdp.Apos * Math.exp(-dt / net.stdp.tauPos);
              updateWeight(net, synIdx, dw);
            }
          }
        }
      }
    }
  }

  // Update STDP for incoming synapses (post-before-pre depression)
  if (net.stdp.enabled) {
    for (let i = 0; i < net.neurons.length; i++) {
      const neuron = net.neurons[i];
      if (neuron.lastSpikeMs === net.tMs) {
        for (const synIdx of net.fanIn[i] || []) {
          const syn = net.synapses[synIdx];
          
          // Post-before-pre depression
          if (syn.lastPreMs > 0) {
            const dt = net.tMs - syn.lastPreMs;
            if (dt > 0) {
              const dw = -net.stdp.Aneg * Math.exp(-dt / net.stdp.tauNeg);
              updateWeight(net, synIdx, dw);
            }
          }
          syn.lastPostMs = net.tMs;
        }
      }
    }
  }

  // Update intrinsic plasticity
  if (net.intr.enabled) {
    for (let i = 0; i < net.neurons.length; i++) {
      const neuron = net.neurons[i];
      const params = net.nParams[i];
      
      // Estimate firing rate over window
      const windowStart = net.tMs - net.intr.windowMs;
      const spikesInWindow = neuron.lastSpikeMs >= windowStart ? 1 : 0;
      const rate = spikesInWindow / (net.intr.windowMs / 1000);
      
      // Update threshold
      const dVth = net.intr.eta * (rate - net.intr.targetHz);
      params.Vth += dVth;
      
      // Clamp to reasonable bounds
      params.Vth = Math.max(-55, Math.min(-45, params.Vth));
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

function updateWeight(net: Network, synIdx: number, dw: number): void {
  const synParams = net.sParams[synIdx];
  const newWeight = synParams.w + dw;
  
  // Apply bounds
  let clampedWeight = Math.max(net.stdp.wMin, Math.min(net.stdp.wMax, newWeight));
  
  // Enforce inhibitory constraint
  if (synParams.inhibitory) {
    clampedWeight = Math.min(0, clampedWeight);
  } else {
    clampedWeight = Math.max(0, clampedWeight);
  }
  
  synParams.w = clampedWeight;
}

// Preset implementations
function initSingleLIF(net: Network): void {
  net.nParams = [{ ...DEFAULT_NEURON_PARAMS }];
  net.neurons = [{ V: -65, refUntilMs: 0, lastSpikeMs: -1000 }];
  net.fanOut = [[]];
  net.fanIn = [[]];
  net.inputRatesHz = [10];
}

function initEE(net: Network): void {
  // Excitatory to Excitatory
  net.nParams = [
    { ...DEFAULT_NEURON_PARAMS },
    { ...DEFAULT_NEURON_PARAMS }
  ];
  net.neurons = [
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
  ];
  
  const synParams: SynapseParams = {
    pre: 0, post: 1, w: 1.5, delayMs: 1, tauSyn: 5, jump: 1
  };
  net.sParams = [synParams];
  net.synapses = [{
    s: 0,
    delayQueue: new Uint16Array(Math.ceil(synParams.delayMs / net.dtMs)),
    head: 0,
    lastPreMs: -1000,
    lastPostMs: -1000
  }];
  
  net.fanOut = [[0], []];
  net.fanIn = [[], [0]];
  net.inputRatesHz = [20, 0];
}

function initEIE(net: Network): void {
  // Excitatory-Inhibitory-Excitatory
  net.nParams = [
    { ...DEFAULT_NEURON_PARAMS },
    { ...DEFAULT_NEURON_PARAMS },
    { ...DEFAULT_NEURON_PARAMS }
  ];
  net.neurons = [
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
  ];
  
  const synParams: SynapseParams[] = [
    { pre: 0, post: 1, w: 2, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 2, w: -1.5, delayMs: 1, tauSyn: 5, jump: 1, inhibitory: true }
  ];
  net.sParams = synParams;
  net.synapses = synParams.map(params => ({
    s: 0,
    delayQueue: new Uint16Array(Math.ceil(params.delayMs / net.dtMs)),
    head: 0,
    lastPreMs: -1000,
    lastPostMs: -1000
  }));
  
  net.fanOut = [[0], [1], []];
  net.fanIn = [[], [0], [1]];
  net.inputRatesHz = [15, 0, 0];
}

function initOR(net: Network): void {
  // x1, x2 -> H_OR -> O
  net.nParams = [
    { ...DEFAULT_NEURON_PARAMS }, // x1
    { ...DEFAULT_NEURON_PARAMS }, // x2
    { ...DEFAULT_NEURON_PARAMS }, // H_OR
    { ...DEFAULT_NEURON_PARAMS }  // O
  ];
  net.neurons = [
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
  ];
  
  const synParams: SynapseParams[] = [
    { pre: 0, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 2, post: 3, w: 1.5, delayMs: 1, tauSyn: 5, jump: 1 }
  ];
  net.sParams = synParams;
  net.synapses = synParams.map(params => ({
    s: 0,
    delayQueue: new Uint16Array(Math.ceil(params.delayMs / net.dtMs)),
    head: 0,
    lastPreMs: -1000,
    lastPostMs: -1000
  }));
  
  net.fanOut = [[0], [1], [2], []];
  net.fanIn = [[], [], [0, 1], [2]];
  net.inputRatesHz = [0, 0, 0, 0];
}

function initAND(net: Network): void {
  // x1, x2 -> H_AND -> O (coincidence detection)
  net.nParams = [
    { ...DEFAULT_NEURON_PARAMS }, // x1
    { ...DEFAULT_NEURON_PARAMS }, // x2
    { ...DEFAULT_NEURON_PARAMS }, // H_AND
    { ...DEFAULT_NEURON_PARAMS }  // O
  ];
  net.neurons = [
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
  ];
  
  const synParams: SynapseParams[] = [
    { pre: 0, post: 2, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 2, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 2, post: 3, w: 1.5, delayMs: 1, tauSyn: 5, jump: 1 }
  ];
  net.sParams = synParams;
  net.synapses = synParams.map(params => ({
    s: 0,
    delayQueue: new Uint16Array(Math.ceil(params.delayMs / net.dtMs)),
    head: 0,
    lastPreMs: -1000,
    lastPostMs: -1000
  }));
  
  net.fanOut = [[0], [1], [2], []];
  net.fanIn = [[], [], [0, 1], [2]];
  net.inputRatesHz = [0, 0, 0, 0];
}

function initXORHard(net: Network): void {
  // x1, x2 -> H_OR, H_AND -> O
  net.nParams = [
    { ...DEFAULT_NEURON_PARAMS }, // x1
    { ...DEFAULT_NEURON_PARAMS }, // x2
    { ...DEFAULT_NEURON_PARAMS }, // H_OR
    { ...DEFAULT_NEURON_PARAMS }, // H_AND
    { ...DEFAULT_NEURON_PARAMS }  // O
  ];
  net.neurons = [
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
  ];
  
  const synParams: SynapseParams[] = [
    { pre: 0, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 0, post: 3, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 3, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 2, post: 4, w: 1.5, delayMs: 2, tauSyn: 5, jump: 1 }, // excitatory
    { pre: 3, post: 4, w: -1.2, delayMs: 1, tauSyn: 5, jump: 1, inhibitory: true } // inhibitory, shorter delay
  ];
  net.sParams = synParams;
  net.synapses = synParams.map(params => ({
    s: 0,
    delayQueue: new Uint16Array(Math.ceil(params.delayMs / net.dtMs)),
    head: 0,
    lastPreMs: -1000,
    lastPostMs: -1000
  }));
  
  net.fanOut = [[0, 2], [1, 3], [4], [4], []];
  net.fanIn = [[], [], [0, 1], [0, 1], [2, 3]];
  net.inputRatesHz = [0, 0, 0, 0, 0];
}

function initXORSTDP(net: Network): void {
  // x1, x2 -> H_OR, H_AND -> O (with STDP learning)
  net.nParams = [
    { ...DEFAULT_NEURON_PARAMS }, // x1
    { ...DEFAULT_NEURON_PARAMS }, // x2
    { ...DEFAULT_NEURON_PARAMS }, // H_OR
    { ...DEFAULT_NEURON_PARAMS }, // H_AND
    { ...DEFAULT_NEURON_PARAMS }  // O
  ];
  net.neurons = [
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 },
    { V: -65, refUntilMs: 0, lastSpikeMs: -1000 }
  ];
  
  // Start with small random weights
  const synParams: SynapseParams[] = [
    { pre: 0, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 2, w: 1, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 0, post: 3, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 1, post: 3, w: 0.8, delayMs: 1, tauSyn: 5, jump: 1 },
    { pre: 2, post: 4, w: 0.1 + Math.random() * 0.2, delayMs: 2, tauSyn: 5, jump: 1 },
    { pre: 3, post: 4, w: -0.1 - Math.random() * 0.2, delayMs: 1, tauSyn: 5, jump: 1, inhibitory: true }
  ];
  net.sParams = synParams;
  net.synapses = synParams.map(params => ({
    s: 0,
    delayQueue: new Uint16Array(Math.ceil(params.delayMs / net.dtMs)),
    head: 0,
    lastPreMs: -1000,
    lastPostMs: -1000
  }));
  
  net.fanOut = [[0, 2], [1, 3], [4], [4], []];
  net.fanIn = [[], [], [0, 1], [0, 1], [2, 3]];
  net.inputRatesHz = [0, 0, 0, 0, 0];
}
