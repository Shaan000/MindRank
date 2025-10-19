'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ControlsProps {
  isRunning: boolean;
  speed: number;
  preset: string;
  stdpEnabled: boolean;
  intrinsicEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: (preset?: string) => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onPresetChange: (preset: string) => void;
  onSTDPToggle: (enabled: boolean) => void;
  onIntrinsicToggle: (enabled: boolean) => void;
  onPatternFire: (pattern: '00' | '10' | '01' | '11') => void;
}

const PRESETS = [
  'SingleLIF',
  'EE',
  'EIE',
  'OR',
  'AND',
  'XOR(Hard)',
  'XOR(STDP)'
];

const PATTERNS = [
  { code: '00' as const, label: '00 (No input)' },
  { code: '10' as const, label: '10 (x1 only)' },
  { code: '01' as const, label: '01 (x2 only)' },
  { code: '11' as const, label: '11 (Both inputs)' }
];

export default function Controls({
  isRunning,
  speed,
  preset,
  stdpEnabled,
  intrinsicEnabled,
  onStart,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  onPresetChange,
  onSTDPToggle,
  onIntrinsicToggle,
  onPatternFire
}: ControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Simulation Controls</h3>
        
        {/* Start/Pause/Reset buttons */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={onStart} className="flex-1 bg-green-600 hover:bg-green-700">
              ▶️ Start
            </Button>
          ) : (
            <Button onClick={onPause} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
              ⏸️ Pause
            </Button>
          )}
          <Button onClick={onStep} variant="outline" className="flex-1">
            ⏭️ Step
          </Button>
          <Button onClick={() => onReset()} variant="outline" className="flex-1">
            🔄 Reset
          </Button>
        </div>

        {/* Speed control */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">Speed: {speed.toFixed(1)}×</Label>
          <Slider
            value={[speed]}
            onValueChange={([value]) => onSpeedChange(value)}
            min={0.25}
            max={10}
            step={0.25}
            className="w-full"
          />
        </div>

        {/* Preset selection */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">Network Preset</Label>
          <Select value={preset} onValueChange={onPresetChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map(presetName => (
                <SelectItem key={presetName} value={presetName}>
                  {presetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Learning toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="stdp-toggle" className="text-sm text-slate-300">
              STDP Learning
            </Label>
            <Switch
              id="stdp-toggle"
              checked={stdpEnabled}
              onCheckedChange={onSTDPToggle}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="intrinsic-toggle" className="text-sm text-slate-300">
              Intrinsic Plasticity
            </Label>
            <Switch
              id="intrinsic-toggle"
              checked={intrinsicEnabled}
              onCheckedChange={onIntrinsicToggle}
            />
          </div>
        </div>

        {/* Pattern firing */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">Test Patterns</Label>
          <div className="grid grid-cols-2 gap-2">
            {PATTERNS.map(pattern => (
              <Button
                key={pattern.code}
                onClick={() => onPatternFire(pattern.code)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {pattern.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
