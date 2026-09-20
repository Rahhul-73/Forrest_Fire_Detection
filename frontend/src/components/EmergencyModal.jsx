import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmergencyModal = ({ open, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;

    // Reset progress on open
    setProgress(0);

    // 1. Post to /api/lora/alert
    fetch('/api/lora/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'EMERGENCY BROADCAST' })
    }).catch(err => console.error('Emergency LoRa alert failed:', err));

    // 2. Animate progress from 0 to 100% over 1.2s (1200ms)
    const startTime = Date.now();
    const duration = 1200;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressInterval);
      }
    }, 30);

    // 3. Auto-close after 4 seconds
    const closeTimer = setTimeout(() => {
      onClose();
    }, 4000);

    // 4. Escape key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(closeTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full rounded-2xl bg-[#121826] bg-gradient-to-b from-[#ff2d55]/20 via-[#0a0e14] to-[#0a0e14] border-2 border-[#ff2d55]/50 shadow-[0_0_60px_rgba(255,45,85,0.5)] p-8 text-slate-100 font-mono space-y-5"
      >
        {/* Top Warning Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-[#ff2d55]/20 border-2 border-[#ff2d55] animate-pulse flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-[56px] h-[56px] text-[#ff2d55]" />
          </div>
        </div>

        {/* Titles */}
        <div className="text-center space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase">
            EMERGENCY BROADCAST DISPATCHED
          </h2>
          <p className="text-[#00d9a5] text-sm font-bold">
            Signal transmitted to all LoRa nodes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <div className="text-gray-400 text-xs">Nodes reached</div>
            <div className="text-white font-mono font-bold text-sm">8/8</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <div className="text-gray-400 text-xs">Frequency</div>
            <div className="text-white font-mono font-bold text-sm">868 MHz</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <div className="text-gray-400 text-xs">Airtime</div>
            <div className="text-white font-mono font-bold text-sm">342 ms</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <div className="text-gray-400 text-xs">Hops</div>
            <div className="text-white font-mono font-bold text-sm">2</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className={progress >= 100 ? 'text-[#00d9a5]' : 'text-[#ff6b35]'}>
              {progress >= 100 ? '✓ Delivered' : 'Broadcasting...'}
            </span>
            <span className="text-slate-400">{Math.min(100, Math.round(progress))}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-white/10">
            <div
              className="h-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? '#00d9a5' : '#ff2d55'
              }}
            />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 bg-[#ff2d55] hover:bg-[#ff2d55]/80 text-white font-bold py-3 rounded-lg tracking-wider transition-all active:scale-95 shadow-lg"
        >
          CLOSE
        </button>
      </motion.div>
    </div>
  );
};

export default EmergencyModal;
