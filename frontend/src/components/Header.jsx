import React, { useState, useEffect } from 'react';
import { Flame, Radio, Clock, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import EmergencyModal from './EmergencyModal';

export const Header = ({
  isConnected = false,
  onlineNodesCount = 7,
  totalNodesCount = 8,
  onEmergencyClick
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyClick = () => {
    setEmergencyOpen(true);
    if (onEmergencyClick) onEmergencyClick();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#0a0e14]/85 backdrop-blur-md border-b border-[#ff6b35]/30 px-6 py-3 text-slate-100 flex items-center justify-between font-mono shadow-2xl">
        {/* Left: Brand & Animated Flame Icon */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ff2d55] text-white shadow-lg glow-fire animate-flame-flicker">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide text-white flex items-center gap-2">
              FIRESENSE COMMAND CENTER
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              AUTONOMOUS FOREST FIRE EARLY WARNING SYSTEM
            </p>
          </div>
        </div>

        {/* Center: Live WebSocket Connection Pill */}
        <div className="flex items-center">
          <div className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
            isConnected
              ? 'bg-[#00d9a5]/15 border-[#00d9a5]/40 text-[#00d9a5] glow-safe'
              : 'bg-[#ff2d55]/15 border-[#ff2d55]/40 text-[#ff2d55] glow-alert animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00d9a5] animate-ping' : 'bg-[#ff2d55]'}`} />
            <span>{isConnected ? '● LIVE' : '● DISCONNECTED'}</span>
          </div>
        </div>

        {/* Right: LoRa Node Count, Clock, Emergency Button */}
        <div className="flex items-center gap-5 text-xs font-mono">
          {/* LoRa Count */}
          <div className="flex items-center gap-2 text-slate-300 bg-[#121826] px-3 py-1.5 rounded-lg border border-[#1e293b]">
            <Radio className="w-3.5 h-3.5 text-[#00d9a5]" />
            <span>LoRa: <strong className="text-white">{onlineNodesCount}/{totalNodesCount}</strong> nodes</span>
          </div>

          {/* System Clock */}
          <div className="hidden sm:flex items-center gap-2 text-slate-300 bg-[#121826] px-3 py-1.5 rounded-lg border border-[#1e293b]">
            <Clock className="w-3.5 h-3.5 text-[#ff6b35]" />
            <span className="font-bold text-white">{timeStr || '00:00:00'}</span>
          </div>

          {/* Emergency Action Button */}
          <button
            onClick={handleEmergencyClick}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d55] to-[#e02446] text-white font-bold text-xs shadow-lg glow-alert hover:brightness-110 active:scale-95 transition-all"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>EMERGENCY</span>
          </button>
        </div>
      </header>

      {/* Emergency Broadcast Glass Modal */}
      <AnimatePresence>
        {emergencyOpen && (
          <EmergencyModal
            open={emergencyOpen}
            onClose={() => setEmergencyOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
