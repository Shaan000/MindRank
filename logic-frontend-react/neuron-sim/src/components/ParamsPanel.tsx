'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface STDPParams {
  Apos: number;
  Aneg: number;
  tauPos: number;
  tauNeg: number;
  wMin: number;
  wMax: number;
  enabled: boolean;
}

interface IntrinsicParams {
  eta: number;
  targetHz: number;
  enabled: boolean;
  windowMs: number;
}

interface ParamsPanelProps {
  stdp: STDPParams;
  intrinsic: IntrinsicParams;
  onSTDPChange: (params: Partial<STDPParams>) => void;
  onIntrinsicChange: (params: Partial<IntrinsicParams>) => void;
}

export default function ParamsPanel({ 
  stdp, 
  intrinsic, 
  onSTDPChange, 
  onIntrinsicChange 
}: ParamsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">STDP Parameters</h3>
        
        {/* A+ (potentiation amplitude) */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            A+ (Potentiation): {stdp.Apos.toFixed(3)}
          </Label>
          <Slider
            value={[stdp.Apos]}
            onValueChange={([value]) => onSTDPChange({ Apos: value })}
            min={0.001}
            max={0.1}
            step={0.001}
            className="w-full"
          />
        </div>

        {/* A- (depression amplitude) */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            A- (Depression): {stdp.Aneg.toFixed(3)}
          </Label>
          <Slider
            value={[stdp.Aneg]}
            onValueChange={([value]) => onSTDPChange({ Aneg: value })}
            min={0.001}
            max={0.1}
            step={0.001}
            className="w-full"
          />
        </div>

        {/* τ+ (potentiation time constant) */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            τ+ (Potentiation): {stdp.tauPos.toFixed(1)} ms
          </Label>
          <Slider
            value={[stdp.tauPos]}
            onValueChange={([value]) => onSTDPChange({ tauPos: value })}
            min={5}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* τ- (depression time constant) */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            τ- (Depression): {stdp.tauNeg.toFixed(1)} ms
          </Label>
          <Slider
            value={[stdp.tauNeg]}
            onValueChange={([value]) => onSTDPChange({ tauNeg: value })}
            min={5}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Weight bounds */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Min Weight</Label>
            <Input
              type="number"
              value={stdp.wMin}
              onChange={(e) => onSTDPChange({ wMin: parseFloat(e.target.value) })}
              className="w-full"
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Max Weight</Label>
            <Input
              type="number"
              value={stdp.wMax}
              onChange={(e) => onSTDPChange({ wMax: parseFloat(e.target.value) })}
              className="w-full"
              step={0.1}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Intrinsic Plasticity</h3>
        
        {/* Learning rate */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            η (Learning Rate): {intrinsic.eta.toExponential(2)}
          </Label>
          <Slider
            value={[intrinsic.eta]}
            onValueChange={([value]) => onIntrinsicChange({ eta: value })}
            min={1e-6}
            max={1e-3}
            step={1e-6}
            className="w-full"
          />
        </div>

        {/* Target firing rate */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            Target Rate: {intrinsic.targetHz.toFixed(1)} Hz
          </Label>
          <Slider
            value={[intrinsic.targetHz]}
            onValueChange={([value]) => onIntrinsicChange({ targetHz: value })}
            min={1}
            max={50}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Window size */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            Window: {intrinsic.windowMs.toFixed(0)} ms
          </Label>
          <Slider
            value={[intrinsic.windowMs]}
            onValueChange={([value]) => onIntrinsicChange({ windowMs: value })}
            min={50}
            max={1000}
            step={50}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Reset Parameters</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSTDPChange({
              Apos: 0.01,
              Aneg: 0.012,
              tauPos: 20,
              tauNeg: 20,
              wMin: -2,
              wMax: 2
            })}
            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
          >
            Reset STDP
          </button>
          <button
            onClick={() => onIntrinsicChange({
              eta: 1e-4,
              targetHz: 8,
              windowMs: 200
            })}
            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
          >
            Reset Intrinsic
          </button>
        </div>
      </div>
    </div>
  );
}
