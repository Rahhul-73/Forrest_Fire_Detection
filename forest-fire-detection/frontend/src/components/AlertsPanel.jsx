import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AlertsPanel = ({ alerts: propAlerts }) => {
  const [alerts, setAlerts] = useState([]);
  const [toastMap, setToastMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  // Compute relative time string from unix timestamp or fallback
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    if (typeof timestamp === 'string' && (timestamp.includes('ago') || timestamp.includes('m') || timestamp.includes('h'))) {
      return timestamp;
    }
    const now = Math.floor(Date.now() / 1000);
    const tsNum = typeof timestamp === 'number' ? timestamp : parseFloat(timestamp);
    if (isNaN(tsNum)) return 'Just now';

    const diffSec = Math.max(0, Math.floor(now - tsNum));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        const alertsList = Array.isArray(data) ? data : (data.alerts || []);
        // Sort newest first based on timestamp
        const sorted = [...alertsList].sort((a, b) => {
          const tA = typeof a.timestamp === 'number' ? a.timestamp : 0;
          const tB = typeof b.timestamp === 'number' ? b.timestamp : 0;
          return tB - tA;
        });
        setAlerts(sorted);
      }
    } catch (err) {
      console.error('Error fetching /api/alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync if propAlerts changes and alerts state is empty
  useEffect(() => {
    if (propAlerts && propAlerts.length > 0 && alerts.length === 0) {
      const sorted = [...propAlerts].sort((a, b) => {
        const tA = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const tB = typeof b.timestamp === 'number' ? b.timestamp : 0;
        return tB - tA;
      });
      setAlerts(sorted);
    }
  }, [propAlerts]);

  const handleLoRaTX = async (alertItem) => {
    const alertId = alertItem.id;
    setLoadingMap(prev => ({ ...prev, [alertId]: true }));
    try {
      const res = await fetch('/api/lora/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: alertItem.message })
      });
      if (res.ok) {
        setToastMap(prev => ({ ...prev, [alertId]: true }));
        setTimeout(() => {
          setToastMap(prev => ({ ...prev, [alertId]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error('LoRa TX failed:', err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [alertId]: false }));
    }
  };

  // Severity color mapping: EXTREME=#ff2d55, HIGH=#ff6b35, MODERATE=#ffb020
  const getSeverityBadgeStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'EXTREME':
        return 'bg-[#ff2d55]/20 text-[#ff2d55] border-[#ff2d55]/50 glow-alert';
      case 'HIGH':
        return 'bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/50 glow-fire';
      case 'MODERATE':
        return 'bg-[#ffb020]/20 text-[#ffb020] border-[#ffb020]/50';
      default:
        return 'bg-slate-700/20 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="glass-panel p-5 font-mono text-slate-100 space-y-4 border border-[#1e293b] flex flex-col h-full max-h-[580px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#ff2d55]/20 text-[#ff2d55] border border-[#ff2d55]/30">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <h2 className="font-bold text-sm tracking-wider text-white">ALERTS</h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-[#0a0e14] px-2.5 py-1 rounded border border-[#1e293b]">
          Incident Feed ({alerts.length})
        </span>
      </div>

      {/* Scrollable Alert List */}
      <div className="overflow-y-auto space-y-3 pr-1 flex-1">
        <AnimatePresence initial={false}>
          {alerts.map((alertItem) => {
            const isToast = toastMap[alertItem.id];
            const isLoading = loadingMap[alertItem.id];

            return (
              <motion.div
                key={alertItem.id}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-3.5 rounded-xl bg-[#0a0e14] border transition-all space-y-2.5 ${
                  alertItem.severity === 'EXTREME'
                    ? 'border-[#ff2d55]/60 glow-alert'
                    : alertItem.severity === 'HIGH'
                    ? 'border-[#ff6b35]/40 glow-fire'
                    : 'border-[#ffb020]/40'
                }`}
              >
                {/* Alert Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getSeverityBadgeStyle(
                        alertItem.severity
                      )}`}
                    >
                      {alertItem.severity}
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#ff6b35]" />
                      {alertItem.zone}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {getRelativeTime(alertItem.timestamp)}
                  </span>
                </div>

                {/* Message Text */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {alertItem.message}
                </p>

                {/* Footer: Confidence & LoRa TX Button / Toast */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]/60">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {alertItem.confidence !== undefined && (
                      <span className="text-[#00d9a5]">
                        Confidence: {(alertItem.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </span>

                  {isToast ? (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2.5 py-1 rounded bg-[#00d9a5]/20 border border-[#00d9a5]/40 text-[#00d9a5] text-[10px] font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-[#00d9a5]" />
                      ✓ Sent
                    </motion.span>
                  ) : (
                    <button
                      onClick={() => handleLoRaTX(alertItem)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded bg-[#121826] border border-[#1e293b] text-slate-300 hover:text-white hover:border-[#ff2d55] text-[10px] font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-xs">🔴</span>
                      {isLoading ? 'TX...' : 'LoRa TX'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertsPanel;
