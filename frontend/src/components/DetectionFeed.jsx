import React from 'react';
import { Camera, Eye, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';

export const DetectionFeed = () => {
  const { latest } = useWebSocket('/ws/live');

  // Parse targets array from WebSocket or use default reference targets
  const targets = latest?.targets || latest?.detection?.detections || [
    { class: 'fire', raw_confidence: 0.95, filtered_confidence: 0.99, bbox: [220, 140, 380, 290] },
    { class: 'smoke', raw_confidence: 0.85, filtered_confidence: 0.89, bbox: [180, 80, 300, 180] }
  ];

  const frameMeta = latest?.frame_meta || {
    resolution: '640x480',
    fps: 30,
    status: 'FRAME SYNC OK'
  };

  return (
    <div className="glass-panel p-5 font-mono text-slate-100 space-y-4 border border-[#1e293b]">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
            <Camera className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-sm tracking-widest text-white">DETECTION FEED</h2>
        </div>
        <span className="text-[10px] text-[#ffb020] bg-[#0a0e14] px-2.5 py-1 rounded border border-[#1e293b]">
          YOLOv8 Dual Spectrum Pipeline
        </span>
      </div>

      {/* Dual Spectrum Sensor Viewport (aspect-ratio 4:3) */}
      <div className="relative rounded-xl overflow-hidden border border-[#1e293b] bg-[#0a0e14] aspect-[4/3] flex items-center justify-center group">
        {/* Tactical Grid Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Center Animated Sweep Beam */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border border-[#00d9a5]/20 relative flex items-center justify-center">
            {/* Concentric Rings */}
            <div className="w-44 h-44 rounded-full border border-[#00d9a5]/15" />
            <div className="w-24 h-24 rounded-full border border-[#00d9a5]/10" />

            {/* Rotating 360° Radar Line */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#00d9a5]/60 to-[#00d9a5] origin-right ml-auto" />
            </motion.div>
          </div>
        </div>

        {/* Center Eye Icon & Status */}
        <div className="absolute flex flex-col items-center gap-2 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Eye className="w-8 h-8 text-[#ff6b35]" />
          </motion.div>
          <span className="text-xs text-slate-400 tracking-wider">SWEEPING CANOPY SPECTRUM...</span>
        </div>

        {/* SVG Bounding Boxes Overlay */}
        <svg
          viewBox="0 0 640 480"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <filter id="fire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {targets.map((target, idx) => {
            const [xmin, ymin, xmax, ymax] = target.bbox || [200, 150, 350, 280];
            const width = Math.max(20, xmax - xmin);
            const height = Math.max(20, ymax - ymin);
            const isFire = target.class.toLowerCase() === 'fire';
            const strokeColor = isFire ? '#ff2d55' : '#ffb020';
            const confPct = Math.round((target.filtered_confidence || target.raw_confidence || 0.9) * 100);

            return (
              <g key={idx} filter={isFire ? 'url(#fire-glow)' : undefined}>
                {/* Pulsing Bounding Box Frame */}
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  x={xmin}
                  y={ymin}
                  width={width}
                  height={height}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray="6, 4"
                />

                {/* Bounding Box Tag Header */}
                <rect
                  x={xmin}
                  y={Math.max(15, ymin - 22)}
                  width={Math.max(75, target.class.length * 10 + 45)}
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
                  {target.class.toUpperCase()} {confPct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Viewport HUD Corner Text Overlays */}
        <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between text-[10px] font-mono">
          <div className="flex justify-between items-start">
            <span className="text-[#00d9a5] bg-[#0a0e14]/80 backdrop-blur px-2 py-0.5 rounded border border-[#1e293b]">
              [ OPTICAL-THERMAL SENSOR 4K ]
            </span>
            <span className="text-slate-300 bg-[#0a0e14]/80 backdrop-blur px-2 py-0.5 rounded border border-[#1e293b]">
              {frameMeta.resolution} | {frameMeta.fps} FPS
            </span>
          </div>

          <div className="flex justify-between items-end">
            <span className="text-[#ffb020] bg-[#0a0e14]/80 backdrop-blur px-2 py-0.5 rounded border border-[#1e293b]">
              {frameMeta.status}
            </span>
            <span className="text-[#ffb020] bg-[#0a0e14]/80 backdrop-blur px-2 py-0.5 rounded border border-[#1e293b]">
              ULTRALYTICS YOLOV8
            </span>
          </div>
        </div>
      </div>

      {/* Target Analytics & Confidence Cards */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-[#1e293b] pb-2">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Zap className="w-4 h-4 text-[#ff6b35]" /> DETECTED TARGETS ({targets.length})
          </span>
          <span className="text-[10px] text-slate-500">RAW / FILTERED CONFIDENCE</span>
        </div>

        {targets.length === 0 ? (
          <div className="p-3 rounded-lg bg-[#0a0e14] border border-[#1e293b] text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-600" /> No target detections active
          </div>
        ) : (
          <div className="space-y-2.5">
            {targets.map((item, idx) => {
              const isFire = item.class.toLowerCase() === 'fire';
              const rawPct = Math.round((item.raw_confidence || item.confidence || 0.85) * 100);
              const filtPct = Math.round((item.filtered_confidence || item.confidence || 0.90) * 100);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg bg-[#0a0e14] border space-y-2.5 text-xs transition-all ${
                    isFire
                      ? 'border-[#ff2d55]/30 shadow-[0_0_12px_rgba(255,45,85,0.15)]'
                      : 'border-[#ffb020]/30 shadow-[0_0_12px_rgba(255,176,32,0.15)]'
                  }`}
                >
                  {/* Card Title Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className={`w-2.5 h-2.5 rounded-full ${
                          isFire ? 'bg-[#ff2d55]' : 'bg-[#ffb020]'
                        }`}
                      />
                      <span
                        className={`font-extrabold uppercase tracking-wider ${
                          isFire ? 'text-[#ff2d55]' : 'text-[#ffb020]'
                        }`}
                      >
                        {item.class}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      BBOX: [{item.bbox ? item.bbox.join(', ') : 'N/A'}]
                    </span>
                  </div>

                  {/* Raw Model Confidence */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Raw Model Confidence:</span>
                      <span className="font-bold text-slate-200">{rawPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFire ? 'bg-[#ff2d55]' : 'bg-[#ffb020]'
                        }`}
                        style={{ width: `${rawPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 3/5 Temporal Filtered Confidence */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>3/5 Temporal Filtered Confidence:</span>
                      <span className="font-bold text-[#00d9a5]">{filtPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00d9a5]/70 to-[#00d9a5] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,217,165,0.5)]"
                        style={{ width: `${filtPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionFeed;
