import React, { useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { Bell, ShieldAlert, CheckCircle, Clock, MapPin, Download, AlertTriangle, Send } from 'lucide-react';

export const AlertCenter = () => {
  const { alerts, acknowledgeAlert } = useSystem();
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setShowBroadcastModal(false);
    }, 2000);
  };

  const exportIncidentReport = () => {
    const reportText = `FIRESENSE COMMAND CENTER INCIDENT REPORT\nGenerated: ${new Date().toUTCString()}\n\n` +
      alerts.map(a => `[${a.timestamp}] ${a.severity} | ${a.source_name} (${a.lat}, ${a.lng})\nMessage: ${a.message}\nAcknowledged: ${a.acknowledged}\nConfirmed by Temporal Filter: ${a.confirmed_by_temporal_filter}\n----------------------------------------\n`).join('\n');
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FireSense_Incident_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="w-full h-[calc(100vh-65px)] bg-[#0a0e14] p-6 text-slate-100 overflow-y-auto font-mono">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Action Header */}
        <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff2d55]/20 text-[#ff2d55] border border-[#ff2d55]/30">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">INCIDENT ALERT LOG & DELIVERY DISPATCH</h2>
              <p className="text-xs text-slate-400">Temporal Filter Confirmed Alerts, Dispatch Logs & Delivery Confirmations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportIncidentReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#121824] border border-[#1e293b] text-xs font-bold text-slate-200 hover:border-[#00d9a5] hover:text-[#00d9a5] transition-all"
            >
              <Download className="w-4 h-4" />
              Export Log Report
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff2d55] text-white text-xs font-bold shadow-lg glow-alert hover:bg-[#e02446] transition-all"
            >
              <Send className="w-4 h-4" />
              Emergency Broadcast
            </button>
          </div>
        </div>

        {/* Alerts Table Card */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
            <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff2d55]" />
              ACTIVE INCIDENT ALERTS ({alerts.length})
            </span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active fire alerts logged. System monitoring clean.
              </div>
            ) : (
              alerts.map((alert) => {
                let badgeBg = 'bg-[#ff2d55]/20 text-[#ff2d55] border-[#ff2d55]/40';
                if (alert.severity === 'HIGH') badgeBg = 'bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/40';
                else if (alert.severity === 'MODERATE') badgeBg = 'bg-[#ffb703]/20 text-[#ffb703] border-[#ffb703]/40';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl bg-[#0a0e14] border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      alert.acknowledged
                        ? 'border-[#1e293b] opacity-80'
                        : 'border-[#ff2d55]/50 glow-alert'
                    }`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${badgeBg}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-extrabold text-white">{alert.id}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {alert.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 pt-1">{alert.message}</p>

                      <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#ff6b35]" /> {alert.source_name} ({alert.lat}, {alert.lng})
                        </span>
                        {alert.confirmed_by_temporal_filter && (
                          <span className="text-[#00d9a5] font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified via 3/5 Temporal Filter
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acknowledge Button */}
                    <div>
                      {alert.acknowledged ? (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-[#00d9a5]" /> Acknowledged
                        </span>
                      ) : (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-4 py-2 rounded-lg bg-[#00d9a5] text-slate-950 font-bold text-xs hover:bg-[#00c294] transition-all glow-teal"
                        >
                          Acknowledge Alert
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Emergency Broadcast Modal */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 max-w-md w-full border border-[#ff2d55] space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#ff2d55]" />
                <h3 className="font-extrabold text-white text-lg">DISPATCH EMERGENCY BROADCAST</h3>
              </div>
              <p className="text-xs text-slate-300">
                Send multi-channel alert SMS/Radio broadcast to nearby ranger stations and local emergency teams?
              </p>

              {broadcastSent ? (
                <div className="p-3 bg-[#00d9a5]/20 text-[#00d9a5] border border-[#00d9a5] rounded-lg text-xs font-bold text-center">
                  ✅ Emergency Broadcast Transmitted Successfully!
                </div>
              ) : (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendBroadcast}
                    className="px-4 py-2 rounded-lg bg-[#ff2d55] text-white text-xs font-bold glow-alert"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
