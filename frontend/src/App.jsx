import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import axios from 'axios';

import { Header } from './components/Header';
import { DetectionFeed } from './components/DetectionFeed';
import { RiskMap } from './components/RiskMap';
import { AlertsPanel } from './components/AlertsPanel';
import { SpreadSimulation } from './components/SpreadSimulation';
import { LoRaStatus } from './components/LoRaStatus';

export default function App() {
  // Connect via custom useWebSocket hook using Vite proxy /ws/live
  const { latest, status } = useWebSocket('/ws/live');

  // REST API state
  const [alerts, setAlerts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [messages, setMessages] = useState([]);

  // Fetch initial REST data from backend endpoints
  useEffect(() => {
    axios.get('/api/alerts')
      .then(res => { if (Array.isArray(res.data)) setAlerts(res.data); })
      .catch(() => {});

    axios.get('/api/lora/nodes')
      .then(res => { if (Array.isArray(res.data)) setNodes(res.data); })
      .catch(() => {});

    axios.get('/api/lora/messages')
      .then(res => { if (Array.isArray(res.data)) setMessages(res.data); })
      .catch(() => {});
  }, []);

  // Update nodes from WebSocket stream if present
  useEffect(() => {
    if (latest && latest.nodes && Array.isArray(latest.nodes)) {
      setNodes(latest.nodes);
    }
  }, [latest]);

  const onlineNodesCount = nodes.filter(n => n.online).length;
  const totalNodesCount = nodes.length || 8;
  const isLive = status === 'LIVE';

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 font-mono flex flex-col selection:bg-[#ff6b35] selection:text-white">
      {/* Header bar connected to useWebSocket status */}
      <Header
        isConnected={isLive}
        onlineNodesCount={onlineNodesCount}
        totalNodesCount={totalNodesCount}
      />

      {/* Main Grid Content */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 flex-1 w-full">
        {/* Top Row: DetectionFeed | RiskMap | AlertsPanel (lg:grid-cols-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DetectionFeed />
          </div>

          <div className="lg:col-span-1 min-h-[480px]">
            <RiskMap center={[12.97, 77.59]} />
          </div>

          <div className="lg:col-span-1">
            <AlertsPanel alerts={alerts} />
          </div>
        </div>

        {/* Bottom Row: SpreadSimulation (2 cols) | LoRaStatus (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpreadSimulation />
          </div>

          <div className="lg:col-span-1">
            <LoRaStatus nodes={nodes} messages={messages} />
          </div>
        </div>
      </main>
    </div>
  );
}
