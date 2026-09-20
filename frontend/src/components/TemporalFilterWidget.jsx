import React from 'react';
import { useSystem } from '../context/SystemContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Sliders, AlertTriangle } from 'lucide-react';

export const TemporalFilterWidget = () => {
  const { temporalFilter } = useSystem();

  const history = temporalFilter.history || [true, true, false, true, true];
  const positivesCount = temporalFilter.positives_count ?? 4;
  const isConfirmed = temporalFilter.confirmed_fire;
  const statusLabel = temporalFilter.status_label || (isConfirmed ? 'CONFIRMED_FIRE' : 'SAFE');

  return (
    <div className="glass-panel p-4 text-slate-100 font-mono text-xs shadow-xl rounded-xl border border-[#1e293b]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <ShieldAlert className="w-5 h-5 text-[#ff2d55] animate-pulse" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#00d9a5]" />
          )}
          <span className="font-bold text-sm tracking-wider">TEMPORAL FRAME FILTER (3/5)</span>
        </div>
        <span className="text-[10px] bg-[#0a0e14] text-slate-400 px-2 py-0.5 rounded border border-[#1e293b]">
          False Alarm Reduction Engine
        </span>
      </div>

      {/* Sliding Window Frame Indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>5-FRAME SLIDING WINDOW BUFFER</span>
          <span className="font-bold text-white">
            {positivesCount} / 5 POSITIVES (Req: &ge;3)
          </span>
        </div>

        {/* Indicator Pills */}
        <div className="grid grid-cols-5 gap-2">
          {history.map((isPositive, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all ${
                isPositive
                  ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-[#ff2d55] glow-alert'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500'
              }`}
            >
              <span className="text-[9px] text-slate-400 mb-1">F-{5 - idx}</span>
              {isPositive ? (
                <CheckCircle2 className="w-4 h-4 text-[#ff2d55]" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`mt-4 p-3 rounded-lg flex items-center justify-between border ${
          isConfirmed
            ? 'bg-[#ff2d55]/15 border-[#ff2d55]/40 text-[#ff2d55] glow-alert'
            : positivesCount > 0
            ? 'bg-[#ffb703]/15 border-[#ffb703]/40 text-[#ffb703]'
            : 'bg-[#00d9a5]/15 border-[#00d9a5]/40 text-[#00d9a5]'
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-extrabold tracking-wider">{statusLabel}</span>
        </div>
        <span className="text-[10px] opacity-80">
          {isConfirmed
            ? '🔥 High-confidence alert verified across consecutive frames'
            : 'Scanning optical/thermal spectrum for persistent fire vector...'}
        </span>
      </div>
    </div>
  );
};
