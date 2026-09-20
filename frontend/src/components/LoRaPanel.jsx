import React from 'react';
import { useSystem } from '../context/SystemContext';
import { Radio, Battery, Wifi, Thermometer, CloudRain, AlertCircle, RefreshCw, CheckCircle, Package } from 'lucide-react';

export const LoRaPanel = () => {
  const { nodes } = useSystem();

  const totalNodes = nodes.length || 8;
  const activeCount = nodes.filter(n => n.status === 'ACTIVE').length;
  const alertCount = nodes.filter(n => n.status === 'ALERT').length;
  const offlineCount = nodes.filter(n => n.status === 'OFFLINE').length;
  const queuedPackets = nodes.reduce((sum, n) => sum + (n.pending_packets || 0), 0);

  return (
    <div className="w-full h-[calc(100vh-65px)] bg-[#0a0e14] p-6 text-slate-100 overflow-y-auto font-mono">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header & Telemetry Summary Cards */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00d9a5]/20 text-[#00d9a5] border border-[#00d9a5]/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">LORA MESH TELEMETRY PANEL</h2>
              <p className="text-xs text-slate-400">868 MHz ISM Band Low-Power Sensor Network & Store-and-Forward Queue</p>
            </div>
          </div>
        </div>

        {/* Top Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 border border-[#1e293b]">
            <div className="text-[10px] text-slate-400 mb-1">TOTAL NODES</div>
            <div className="text-2xl font-extrabold text-white flex items-center justify-between">
              <span>{totalNodes}</span>
              <Radio className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="glass-panel p-4 border border-[#1e293b]">
            <div className="text-[10px] text-slate-400 mb-1">ACTIVE / ONLINE</div>
            <div className="text-2xl font-extrabold text-[#00d9a5] flex items-center justify-between">
              <span>{activeCount}</span>
              <CheckCircle className="w-5 h-5 text-[#00d9a5]" />
            </div>
          </div>

          <div className="glass-panel p-4 border border-[#1e293b]">
            <div className="text-[10px] text-slate-400 mb-1">OFFLINE NODES</div>
            <div className="text-2xl font-extrabold text-[#64748b] flex items-center justify-between">
              <span>{offlineCount}</span>
              <AlertCircle className="w-5 h-5 text-[#64748b]" />
            </div>
          </div>

          <div className="glass-panel p-4 border border-[#1e293b]">
            <div className="text-[10px] text-slate-400 mb-1">QUEUED PACKETS (STORE & FWD)</div>
            <div className="text-2xl font-extrabold text-[#ffb703] flex items-center justify-between">
              <span>{queuedPackets}</span>
              <Package className="w-5 h-5 text-[#ffb703]" />
            </div>
          </div>
        </div>

        {/* LoRa Node Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node) => {
            let statusColor = '#00d9a5';
            if (node.status === 'ALERT') statusColor = '#ff2d55';
            else if (node.status === 'WARNING') statusColor = '#ffb703';
            else if (node.status === 'OFFLINE') statusColor = '#64748b';

            return (
              <div
                key={node.id}
                className="glass-panel p-4 space-y-3 relative overflow-hidden border border-[#1e293b] hover:border-slate-700 transition-all"
              >
                {/* Node Title & Status Indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                  <div>
                    <h4 className="font-bold text-sm text-white">{node.name}</h4>
                    <span className="text-[10px] text-slate-400">{node.id.toUpperCase()}</span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                  >
                    {node.status}
                  </span>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0a0e14] p-2 rounded border border-[#1e293b]">
                    <div className="text-[9px] text-slate-400">TEMP</div>
                    <div className="font-bold text-white text-sm">{node.temp_c}°C</div>
                  </div>

                  <div className="bg-[#0a0e14] p-2 rounded border border-[#1e293b]">
                    <div className="text-[9px] text-slate-400">SMOKE</div>
                    <div className={`font-bold text-sm ${node.smoke_ppm > 150 ? 'text-[#ff2d55]' : 'text-white'}`}>
                      {node.smoke_ppm} PPM
                    </div>
                  </div>
                </div>

                {/* Battery & RSSI Level Bars */}
                <div className="space-y-2 pt-1">
                  {/* Battery Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3 h-3 text-[#00d9a5]" /> Battery
                      </span>
                      <span className="font-bold text-white">{node.battery_pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all rounded-full"
                        style={{
                          width: `${node.battery_pct}%`,
                          backgroundColor: node.battery_pct < 20 ? '#ff2d55' : '#00d9a5'
                        }}
                      />
                    </div>
                  </div>

                  {/* RSSI Signal Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-[#00f0ff]" /> RSSI
                      </span>
                      <span className="font-bold text-white">{node.rssi_dbm} dBm</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00f0ff] transition-all rounded-full"
                        style={{ width: `${Math.max(10, Math.min(100, (node.rssi_dbm + 120) * 1.25))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Offline Store-and-Forward Notice */}
                {node.pending_packets > 0 && (
                  <div className="mt-2 p-2 rounded bg-[#ffb703]/10 border border-[#ffb703]/30 text-[10px] text-[#ffb703] flex items-center justify-between">
                    <span>Queued Packets:</span>
                    <span className="font-bold">{node.pending_packets} (Store & Fwd)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
