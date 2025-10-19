'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface StimPanelProps {
  x1Rate: number;
  x2Rate: number;
  onRatesChange: (rates: { x1: number; x2: number }) => void;
}

export default function StimPanel({ x1Rate, x2Rate, onRatesChange }: StimPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Stimulation</h3>
        <p className="text-sm text-slate-400">
          Poisson input rates for x1 and x2 neurons
        </p>
        
        {/* x1 rate */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            x1 Rate: {x1Rate.toFixed(1)} Hz
          </Label>
          <Slider
            value={[x1Rate]}
            onValueChange={([value]) => onRatesChange({ x1: value, x2: x2Rate })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* x2 rate */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">
            x2 Rate: {x2Rate.toFixed(1)} Hz
          </Label>
          <Slider
            value={[x2Rate]}
            onValueChange={([value]) => onRatesChange({ x1: x1Rate, x2: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Quick rate presets */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-300">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRatesChange({ x1: 0, x2: 0 })}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            >
              Silent
            </button>
            <button
              onClick={() => onRatesChange({ x1: 10, x2: 10 })}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            >
              Low (10 Hz)
            </button>
            <button
              onClick={() => onRatesChange({ x1: 20, x2: 20 })}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            >
              Medium (20 Hz)
            </button>
            <button
              onClick={() => onRatesChange({ x1: 50, x2: 50 })}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            >
              High (50 Hz)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
