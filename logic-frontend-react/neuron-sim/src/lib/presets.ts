export interface PresetInfo {
  name: string;
  description: string;
  neuronCount: number;
  synapseCount: number;
  features: string[];
}

export const PRESETS: Record<string, PresetInfo> = {
  'SingleLIF': {
    name: 'Single LIF Neuron',
    description: 'A single leaky integrate-and-fire neuron with Poisson input',
    neuronCount: 1,
    synapseCount: 0,
    features: ['Basic LIF dynamics', 'Poisson input']
  },
  'EE': {
    name: 'Excitatory-Excitatory',
    description: 'Two excitatory neurons connected in sequence',
    neuronCount: 2,
    synapseCount: 1,
    features: ['Feedforward excitation', 'Basic connectivity']
  },
  'EIE': {
    name: 'Excitatory-Inhibitory-Excitatory',
    description: 'Feedforward inhibition with three neurons',
    neuronCount: 3,
    synapseCount: 2,
    features: ['Feedforward inhibition', 'Inhibitory synapses']
  },
  'OR': {
    name: 'OR Gate (Learned)',
    description: 'Two inputs to hidden neuron to output, with STDP learning',
    neuronCount: 4,
    synapseCount: 3,
    features: ['STDP learning', 'Intrinsic plasticity', 'OR logic']
  },
  'AND': {
    name: 'AND Gate (Learned)',
    description: 'Coincidence detection requiring both inputs',
    neuronCount: 4,
    synapseCount: 3,
    features: ['Coincidence detection', 'STDP learning', 'AND logic']
  },
  'XOR(Hard)': {
    name: 'XOR Gate (Hard-coded)',
    description: 'Pre-configured XOR with excitatory and inhibitory pathways',
    neuronCount: 5,
    synapseCount: 6,
    features: ['Hard-coded weights', 'Excitatory/inhibitory balance', 'XOR logic']
  },
  'XOR(STDP)': {
    name: 'XOR Gate (STDP Learning)',
    description: 'XOR network that learns through STDP and intrinsic plasticity',
    neuronCount: 5,
    synapseCount: 6,
    features: ['STDP learning', 'Intrinsic plasticity', 'Self-organization', 'XOR logic']
  }
};

export const DEFAULT_PRESET = 'XOR(Hard)';

export function getPresetNames(): string[] {
  return Object.keys(PRESETS);
}

export function getPresetInfo(name: string): PresetInfo | undefined {
  return PRESETS[name];
}
