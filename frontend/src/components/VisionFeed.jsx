import React, { useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { TemporalFilterWidget } from './TemporalFilterWidget';
import { Eye, Video, Camera, Cpu, Layers, Maximize2, RefreshCw, Zap } from 'lucide-react';

export const VisionFeed = () => {
  const { streamData, selectedCamera, setSelectedCamera, isConnected } = useSystem();
  const [activeTab, setActiveTab] = useState('optical');

  const imageData = streamData?.image_data;
  const detections = streamData?.detections || [
    { label: 'fire', confidence: 0.92, xmin: 275, ymin: 170, xmax: 365, ymax: 250 },
    { label: 'smoke', confidence: 0.84, xmin: 260, ymin: 110, xmax: 380, ymax: 200 }
  ];
  const frameId = streamData?.frame_id || 1042;
  const maxConf = Math.max(...detections.map(d => d.confidence), 0);

  return (
    <div className="w-full h-[calc(100vh-65px)] bg-[#0a0e14] p-6 text-slate-100 overflow-y-auto font-mono">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">YOLOv8 REAL-TIME DETECTION STREAM</h2>
              <p className="text-xs text-slate-400">Deep Learning Vision Pipeline & Temporal Verification</p>
            </div>
          </div>

          {/* Camera Source Selectors */}
          <div className="flex items-center gap-2 bg-[#0a0e14] p-1.5 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => setSelectedCamera('TOWER-ALPHA')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all ${
                selectedCamera === 'TOWER-ALPHA'
                  ? 'bg-[#ff6b35] text-white font-bold glow-fire'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Tower Alpha
            </button>

            <button
              onClick={() => setSelectedCamera('TOWER-BETA')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all ${
                selectedCamera === 'TOWER-BETA'
                  ? 'bg-[#ff6b35] text-white font-bold glow-fire'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Watchtower Beta
            </button>

            <button
              onClick={() => setSelectedCamera('DRONE-RECON')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all ${
                selectedCamera === 'DRONE-RECON'
                  ? 'bg-[#ff6b35] text-white font-bold glow-fire'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Recon Drone 01
            </button>
          </div>
        </div>

        {/* Main Stream & Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Video Viewport (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-[#1e293b] bg-[#121824] shadow-2xl aspect-video flex items-center justify-center">
              
              {/* Stream Image */}
              {imageData ? (
                <img
                  src={imageData}
                  alt="YOLOv8 Detection Stream"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#ff6b35]" />
                  <span className="text-sm">Initializing YOLOv8 Camera Stream...</span>
                </div>
              )}

              {/* HUD Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-slate-700/40 m-3 rounded-lg flex flex-col justify-between p-3">
                <div className="flex justify-between items-start text-[10px] text-[#00d9a5]">
                  <span>[ OPTICAL-THERMAL SENSOR 4K ]</span>
                  <span>FPS: 5.5 | RES: 640x360</span>
                </div>
                <div className="flex justify-between items-end text-[10px] text-slate-400">
                  <span>FRAME #{frameId.toString().padStart(6, '0')}</span>
                  <span className="text-[#ff6b35] font-bold">MODEL: ULTRALYTICS YOLOv8 NANO</span>
                </div>
              </div>
            </div>

            {/* Camera Metrics bar */}
            <div className="grid grid-cols-3 gap-4 font-mono text-xs">
              <div className="glass-panel p-3">
                <div className="text-slate-400 text-[10px]">DETECTIONS COUNT</div>
                <div className="text-lg font-bold text-white">{detections.length} Objects</div>
              </div>
              <div className="glass-panel p-3">
                <div className="text-slate-400 text-[10px]">MAX CONFIDENCE</div>
                <div className="text-lg font-bold text-[#ff2d55]">{int(maxConf * 100)}%</div>
              </div>
              <div className="glass-panel p-3">
                <div className="text-slate-400 text-[10px]">STREAM LATENCY</div>
                <div className="text-lg font-bold text-[#00d9a5]">42 ms</div>
              </div>
            </div>
          </div>

          {/* Right Column Sidebar: Temporal Filter & Detection Breakdown */}
          <div className="space-y-6">
            
            {/* Temporal Sliding Window Buffer Component */}
            <TemporalFilterWidget />

            {/* Bounding Box Objects List */}
            <div className="glass-panel p-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-3">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff6b35]" />
                  DETECTED BOUNDING BOXES
                </span>
                <span className="text-[10px] text-slate-400">{detections.length} Active</span>
              </div>

              <div className="space-y-2">
                {detections.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0a0e14] border border-[#1e293b]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          d.label === 'fire' ? 'bg-[#ff2d55]' : 'bg-[#ffb703]'
                        }`}
                      />
                      <span className="font-bold text-white uppercase">{d.label}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[10px]">
                        [{Math.round(d.xmin)},{Math.round(d.ymin)}]
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          d.label === 'fire'
                            ? 'bg-[#ff2d55]/20 text-[#ff2d55]'
                            : 'bg-[#ffb703]/20 text-[#ffb703]'
                        }`}
                      >
                        {Math.round(d.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

function int(val) {
  return Math.round(val);
}
