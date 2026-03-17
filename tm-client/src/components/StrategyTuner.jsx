import React from 'react';
import { Sliders, Zap, Timer, Target } from 'lucide-react';

const StrategyTuner = ({ config, onUpdate }) => {
  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5 neo-shadow bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">Engine Hyperparameters</h3>
      </div>

      <div className="space-y-6">
        <TuneSlider 
            icon={Zap} 
            label="Breakout Threshold" 
            value={120} 
            unit="pts" 
            desc="Minimum point move to trigger entry"
        />
        <TuneSlider 
            icon={Timer} 
            label="Time Window" 
            value={300} 
            unit="sec" 
            desc="Lookback period for momentum"
        />
        <TuneSlider 
            icon={Target} 
            label="Confirmation" 
            value={2} 
            unit="ticks" 
            desc="Wait for directional confirmation"
        />
      </div>

      <button className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-primary hover:border-primary transition-all uppercase tracking-widest">
        Deploy Parameters
      </button>
    </div>
  );
};

const TuneSlider = ({ icon: Icon, label, value, unit, desc }) => (
  <div className="group cursor-pointer">
    <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
            <Icon className="w-3 h-3 text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium text-white/60">{label}</span>
        </div>
        <span className="text-xs font-bold text-primary">{value}{unit}</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-primary/40 group-hover:bg-primary transition-all w-[60%]" />
    </div>
    <p className="text-[9px] text-white/20 mt-1.5">{desc}</p>
  </div>
);

export default StrategyTuner;
