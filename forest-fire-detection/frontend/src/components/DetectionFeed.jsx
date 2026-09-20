import React from 'react';
import { Camera, Eye, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export const DetectionFeed = ({ detection = null }) => {
  const detections = detection?.detections || [
    { class: 'fire', confidence: 0.92, bbox: [270, 160, 370, 260], is_fire: true, filtered_confidence: 0.88 },
    { class: 'smoke', confidence: 0.78, bbox: [240, 90, 390, 180], is_fire: false, filtered_confidence: 0.42 }
  ];

  const imageSrc = detection?.image_data || null;

  return (
    <div className="glass-panel p-5 font-mono text-slate-100 space-y-4 border border-[#1e293b]">
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
            <Camera className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm tracking-wider text-white">DETECTION FEED</h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-[#0a0e14] px-2.5 py-1 rounded border border-[#1e293b]">
          YOLOv8 Dual Spectrum Pipeline
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-[#1e293b] bg-[#0a0e14] aspect-[4/3] flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="YOLOv8 Feed"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0a0e14] flex flex-col items-center justify-center text-slate-600 gap-2">
            <div className="w-full h-full opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute flex flex-col items-center gap-2">
              <Eye className="w-8 h-8 text-[#ff6b35] animate-pulse" />
              <span className="text-xs text-slate-400">SWEEPING CANOPY SPECTRUM...</span>
            </div>
          </div>
        )}

        <svg
          viewBox="0 0 640 480"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <filter id="glow-fire-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {detections.map((d, index) => {
            const [xmin, ymin, xmax, ymax] = d.bbox || [100, 100, 200, 200];
            const width = Math.max(10, xmax - xmin);
            const height = Math.max(10, ymax - ymin);
            const strokeColor = d.is_fire ? '#ff2d55' : '#ffb020';

            return (
              <g key={index} filter="url(#glow-fire-filter)">
                <rect
                  x={xmin}
                  y={ymin}
                  width={width}
                  height={height}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray="6, 4"
                  className="animate-pulse"
                />
                <rect
                  x={xmin}
                  y={Math.max(15, ymin - 22)}
                  width={Math.max(70, d.class.length * 10 + 45)}
                  height="20"
                  fill={strokeColor}
                  rx="3"
                />
                <text
                  x={xmin + 6}
                  y={Math.max(29, ymin - 8)}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {d.class.toUpperCase()} {Math.round((d.filtered_confidence || d.confidence) * 100)}%
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0 pointer-events-none border border-slate-700/30 m-2 rounded-lg flex flex-col justify-between p-2 text-[9px] text-[#00d9a5]">
          <div className="flex justify-between">
            <span>[ OPTICAL-THERMAL SENSOR 4K ]</span>
            <span>640x480 | 30 FPS</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>FRAME SYNC OK</span>
            <span className="text-[#ff6b35] font-bold">ULTRALYTICS YOLOv8</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-[#1e293b] pb-2">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Zap className="w-4 h-4 text-[#ff6b35]" /> DETECTED TARGETS ({detections.length})
          </span>
          <span>RAW / FILTERED CONFIDENCE</span>
        </div>

        <div className="space-y-2.5">
          {detections.map((item, idx) => {
            const rawPct = Math.round(item.confidence * 100);
            const filteredPct = Math.round((item.filtered_confidence || item.confidence) * 100);
            const isHighConfidence = (item.filtered_confidence || item.confidence) >= 0.7;
            const isPendingTemporal = (item.filtered_confidence || item.confidence) < 0.5;

            return (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#0a0e14] border border-[#1e293b] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.is_fire ? 'bg-[#ff2d55]' : 'bg-[#ffb020]'
                      }`}
                    />
                    <span className="font-extrabold text-white uppercase">{item.class}</span>
                  </div>

                  {isPendingTemporal && (
                    <span className="px-2 py-0.5 rounded bg-[#ffb020]/20 border border-[#ffb020]/40 text-[#ffb020] text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      TEMPORAL FILTER: pending confirmation
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Raw Model Confidence:</span>
                    <span className="font-bold text-slate-200">{rawPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full transition-all"
                      style={{ width: `${rawPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>3/5 Temporal Filtered Confidence:</span>
                    <span
                      className={`font-bold ${
                        isHighConfidence ? 'text-[#00d9a5]' : 'text-[#ffb020]'
                      }`}
                    >
                      {filteredPct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighConfidence ? 'bg-[#00d9a5] glow-safe' : 'bg-[#ffb020]'
                      }`}
                      style={{ width: `${filteredPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
