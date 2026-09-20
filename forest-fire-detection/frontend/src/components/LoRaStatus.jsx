import React from 'react';
import { Radio, Battery, Wifi, Check, X, Send } from 'lucide-react';

export const LoRaStatus = ({
  nodes = [
    { id: 'node-01', name: 'Ridge Lookout', battery: 82, rssi: -68, online: true },
    { id: 'node-02', name: 'North Canyon', battery: 94, rssi: -74, online: true },
    { id: 'node-03', name: 'Pine Valley', battery: 78, rssi: -82, online: true },
    { id: 'node-04', name: 'Lake Reserve', battery: 91, rssi: -55, online: true },
    { id: 'node-05', name: 'Timber Pass', battery: 18, rssi: -114, online: false },
    { id: 'node-06', name: 'East Summit', battery: 86, rssi: -64, online: true },
    { id: 'node-07', name: 'South Creek', battery: 69, rssi: -88, online: true },
    { id: 'node-08', name: 'Watchtower Bravo', battery: 89, rssi: -71, online: true }
  ],
  messages = [
    { id: 'msg-62996', payload: 'ALERT EXTREME: Ridge Sector Alpha - Fire outbreak', timestamp: '2m ago', delivered: true, hops: 2 },
    { id: 'msg-62995', payload: 'TELEMETRY: Node-01 Temp 44.5°C Smoke 320PPM', timestamp: '5m ago', delivered: true, hops: 1 },
    { id: 'msg-62994', payload: 'SYSTEM_PING: Gateway Heartbeat 868 MHz', timestamp: '12m ago', delivered: true, hops: 1 }
  ]
}) => {
  const lastMsgId = messages[0]?.id || 'msg-62996';
  const totalAirtime = '142 ms';

  return (
    <div className="glass-panel p-5 font-mono text-slate-100 space-y-4 border border-[#1e293b]">
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#00d9a5]/20 text-[#00d9a5] border border-[#00d9a5]/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="font-bold text-sm tracking-wider text-white">LoRa NETWORK</h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-[#0a0e14] px-2.5 py-1 rounded border border-[#1e293b]">
          868 MHz ISM Band
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-[#0a0e14] p-2.5 rounded-lg border border-[#1e293b] flex items-center justify-between">
          <div className="text-[10px] text-slate-400">GATEWAY</div>
          <div className="font-bold text-[#00d9a5] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00d9a5] animate-ping" />
            <span>ONLINE</span>
          </div>
        </div>

        <div className="bg-[#0a0e14] p-2.5 rounded-lg border border-[#1e293b]">
          <div className="text-[10px] text-slate-400">AIRTIME</div>
          <div className="font-bold text-white text-xs">{totalAirtime}</div>
        </div>

        <div className="bg-[#0a0e14] p-2.5 rounded-lg border border-[#1e293b]">
          <div className="text-[10px] text-slate-400">LAST MSG ID</div>
          <div className="font-bold text-[#00f0ff] text-xs">{lastMsgId}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {nodes.map((node) => {
          const isOnline = node.online;
          const batteryColor = node.battery < 20 ? '#ff2d55' : '#00d9a5';

          return (
            <div
              key={node.id}
              className="p-2.5 rounded-lg bg-[#0a0e14] border border-[#1e293b] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{node.id.toUpperCase()}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-[#00d9a5] glow-safe' : 'bg-slate-600'
                  }`}
                />
              </div>

              <div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Bat:</span>
                  <span className="font-bold text-white">{node.battery}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${node.battery}%`, backgroundColor: batteryColor }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                <span>RSSI:</span>
                <span className="font-bold text-[#00f0ff]">{node.rssi} dBm</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-[#1e293b] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#00d9a5]" /> RECENT LORA MESSAGES
          </span>
          <span className="text-[10px] text-slate-400">Store & Forward</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {messages.slice(0, 5).map((msg, i) => (
            <div
              key={msg.id || i}
              className="p-2 rounded bg-[#0a0e14] border border-[#1e293b] flex items-center justify-between gap-2"
            >
              <div className="truncate max-w-[240px] text-[10px] text-slate-300">
                <span className="font-bold text-[#00f0ff] mr-1">[{msg.id}]</span>
                {msg.payload}
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-slate-400">{msg.hops || 1} h</span>
                {msg.delivered ? (
                  <span className="text-[#00d9a5] font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3 text-[#00d9a5]" /> ✓
                  </span>
                ) : (
                  <span className="text-[#ff2d55] font-bold flex items-center gap-0.5">
                    <X className="w-3 h-3 text-[#ff2d55]" /> ✗
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
