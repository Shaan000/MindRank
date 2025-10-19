'use client';

import TopNav from '@/components/TopNav';
import Controls from '@/components/Controls';
import StimPanel from '@/components/StimPanel';
import ParamsPanel from '@/components/ParamsPanel';
import RasterPlot from '@/components/RasterPlot';
import TracePlot from '@/components/TracePlot';
import WeightsPlot from '@/components/WeightsPlot';
import GraphView from '@/components/GraphView';
import { Card } from '@/components/ui/card';
import { useSNN } from '@/hooks/useSNN';
import { useState } from 'react';

export default function NeuronSimPage() {
  const {
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
    setSpeed
  } = useSNN('XOR(Hard)');

  const [currentPreset, setCurrentPreset] = useState('XOR(Hard)');
  const [x1Rate, setX1Rate] = useState(0);
  const [x2Rate, setX2Rate] = useState(0);
  const [stdpEnabled, setSTDPEnabled] = useState(true);
  const [intrinsicEnabled, setIntrinsicEnabled] = useState(true);

  const handlePresetChange = (preset: string) => {
    setCurrentPreset(preset);
    reset(preset);
  };

  const handleRatesChange = (rates: { x1: number; x2: number }) => {
    setX1Rate(rates.x1);
    setX2Rate(rates.x2);
    setRates(rates);
  };

  const handleSTDPToggle = (enabled: boolean) => {
    setSTDPEnabled(enabled);
    setSTDP({ enabled });
  };

  const handleIntrinsicToggle = (enabled: boolean) => {
    setIntrinsicEnabled(enabled);
    setIntrinsic({ enabled });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left rail */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <Controls
              isRunning={isRunning}
              speed={speed}
              preset={currentPreset}
              stdpEnabled={stdpEnabled}
              intrinsicEnabled={intrinsicEnabled}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onStep={() => step(1)}
              onSpeedChange={setSpeed}
              onPresetChange={handlePresetChange}
              onSTDPToggle={handleSTDPToggle}
              onIntrinsicToggle={handleIntrinsicToggle}
              onPatternFire={firePattern}
            />
          </Card>
          
          <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <StimPanel
              x1Rate={x1Rate}
              x2Rate={x2Rate}
              onRatesChange={handleRatesChange}
            />
          </Card>
          
          <Card className="p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <ParamsPanel
              stdp={{
                Apos: 0.01,
                Aneg: 0.012,
                tauPos: 20,
                tauNeg: 20,
                wMin: -2,
                wMax: 2,
                enabled: stdpEnabled
              }}
              intrinsic={{
                eta: 1e-4,
                targetHz: 8,
                enabled: intrinsicEnabled,
                windowMs: 200
              }}
              onSTDPChange={setSTDP}
              onIntrinsicChange={setIntrinsic}
            />
          </Card>
        </div>
        
        {/* Right visuals */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-2 h-64 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <RasterPlot
              spikes={spikesWindow}
              neuronCount={5} // Adjust based on current preset
              timeWindow={2000}
              className="w-full h-full"
            />
          </Card>
          
          <Card className="p-2 h-56 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <TracePlot
              traces={traces}
              selectedNeurons={selectedTraces}
              timeWindow={2000}
              className="w-full h-full"
            />
          </Card>
          
          <Card className="p-2 h-56 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <WeightsPlot
              weights={weights}
              vth={vth}
              selectedSynapses={selectedWeights}
              timeWindow={2000}
              className="w-full h-full"
            />
          </Card>
          
          <Card className="p-2 h-64 bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <GraphView
              spikes={spikesWindow}
              network={{
                neurons: [], // Will be populated by the hook
                sParams: [],
                fanOut: [],
                fanIn: []
              }}
              timeWindow={2000}
              className="w-full h-full"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
