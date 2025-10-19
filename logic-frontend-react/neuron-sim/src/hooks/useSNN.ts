import { useState, useRef, useCallback, useEffect } from 'react';
import { Network, initNetwork, resetNetwork, stepNetwork, STDPParams, IntrinsicParams } from '@/lib/snn';

export interface SNNState {
  tMs: number;
  spikesWindow: [number, number][]; // rolling window of spikes
  traces: { id: number; V: number; t: number }[];
  weights: { syn: number; w: number; t: number }[];
  vth: { id: number; Vth: number; t: number }[];
  isRunning: boolean;
  speed: number;
  selectedTraces: number[];
  selectedWeights: number[];
}

export interface SNNControls {
  start: () => void;
  pause: () => void;
  reset: (preset?: string) => void;
  step: (n?: number) => void;
  setRates: (rates: { x1: number; x2: number }) => void;
  setSTDP: (params: Partial<STDPParams>) => void;
  setIntrinsic: (params: Partial<IntrinsicParams>) => void;
  firePattern: (code: '00' | '10' | '01' | '11') => void;
  selectTraces: (ids: number[]) => void;
  selectWeights: (idxs: number[]) => void;
  setSpeed: (speed: number) => void;
}

const MAX_SPIKES_WINDOW = 1000;
const MAX_TRACES = 200;
const MAX_WEIGHTS = 200;
const MAX_VTH = 200;

export function useSNN(initialPreset: string = 'XOR(Hard)'): SNNState & SNNControls {
  const [network, setNetwork] = useState<Network>(() => initNetwork(initialPreset));
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [selectedTraces, setSelectedTraces] = useState<number[]>([]);
  const [selectedWeights, setSelectedWeights] = useState<number[]>([]);
  
  // Rolling buffers for visualization
  const [spikesWindow, setSpikesWindow] = useState<[number, number][]>([]);
  const [traces, setTraces] = useState<{ id: number; V: number; t: number }[]>([]);
  const [weights, setWeights] = useState<{ syn: number; w: number; t: number }[]>([]);
  const [vth, setVth] = useState<{ id: number; Vth: number; t: number }[]>([]);
  
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((preset?: string) => {
    setIsRunning(false);
    if (preset) {
      const newNetwork = initNetwork(preset);
      setNetwork(newNetwork);
    } else {
      setNetwork(prev => {
        const newNet = { ...prev };
        resetNetwork(newNet);
        return newNet;
      });
    }
    setSpikesWindow([]);
    setTraces([]);
    setWeights([]);
    setVth([]);
  }, []);

  const step = useCallback((n: number = 1) => {
    setNetwork(prev => {
      const newNet = { ...prev };
      for (let i = 0; i < n; i++) {
        const result = stepNetwork(newNet, []);
        
        // Update spikes window
        setSpikesWindow(current => {
          const newSpikes = [...current, ...result.spikes];
          return newSpikes.slice(-MAX_SPIKES_WINDOW);
        });

        // Update traces for selected neurons
        if (selectedTraces.length > 0 && result.traceSamples) {
          setTraces(current => {
            const newTraces = [...current, ...result.traceSamples!];
            return newTraces.slice(-MAX_TRACES);
          });
        }

        // Update weights for selected synapses
        if (selectedWeights.length > 0 && result.weightSamples) {
          setWeights(current => {
            const newWeights = [...current, ...result.weightSamples!];
            return newWeights.slice(-MAX_WEIGHTS);
          });
        }

        // Update thresholds
        if (result.vthSamples) {
          setVth(current => {
            const newVth = [...current, ...result.vthSamples!];
            return newVth.slice(-MAX_VTH);
          });
        }
      }
      return newNet;
    });
  }, [selectedTraces, selectedWeights]);

  const setRates = useCallback((rates: { x1: number; x2: number }) => {
    setNetwork(prev => ({
      ...prev,
      inputRatesHz: [rates.x1, rates.x2]
    }));
  }, []);

  const setSTDP = useCallback((params: Partial<STDPParams>) => {
    setNetwork(prev => ({
      ...prev,
      stdp: { ...prev.stdp, ...params }
    }));
  }, []);

  const setIntrinsic = useCallback((params: Partial<IntrinsicParams>) => {
    setNetwork(prev => ({
      ...prev,
      intr: { ...prev.intr, ...params }
    }));
  }, []);

  const firePattern = useCallback((code: '00' | '10' | '01' | '11') => {
    const rates = {
      '00': { x1: 0, x2: 0 },
      '10': { x1: 20, x2: 0 },
      '01': { x1: 0, x2: 20 },
      '11': { x1: 20, x2: 20 }
    };
    setRates(rates[code]);
  }, [setRates]);

  const selectTraces = useCallback((ids: number[]) => {
    setSelectedTraces(ids);
    setTraces([]); // Clear existing traces
  }, []);

  const selectWeights = useCallback((idxs: number[]) => {
    setSelectedWeights(idxs);
    setWeights([]); // Clear existing weights
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      const stepsToRun = Math.floor((deltaTime * speed) / 1000); // Convert to ms
      
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

  // Auto-select traces and weights for default visualization
  useEffect(() => {
    if (selectedTraces.length === 0) {
      // Select output neuron and a few hidden neurons
      const outputNeuron = network.neurons.length - 1;
      const hiddenNeurons = network.neurons.length > 2 ? [2, 3] : [1];
      selectTraces([outputNeuron, ...hiddenNeurons]);
    }
    
    if (selectedWeights.length === 0 && network.sParams.length > 0) {
      // Select a few synapses for weight tracking
      const synapseIndices = network.sParams.slice(-3).map((_, i) => network.sParams.length - 3 + i);
      selectWeights(synapseIndices);
    }
  }, [network.neurons.length, network.sParams.length, selectedTraces.length, selectedWeights.length, selectTraces, selectWeights, network.sParams]);

  return {
    tMs: network.tMs,
    spikesWindow,
    traces,
    weights,
    vth,
    isRunning,
    speed,
    selectedTraces,
    selectedWeights,
    start,
    pause,
    reset,
    step,
    setRates,
    setSTDP,
    setIntrinsic,
    firePattern,
    selectTraces,
    selectWeights,
    setSpeed
  };
}
