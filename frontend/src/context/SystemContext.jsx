import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SystemContext = createContext(null);

export const SystemProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('tactical_map');
  const [soundMuted, setSoundMuted] = useState(false);

  // WebSocket Live Stream State
  const [streamData, setStreamData] = useState(null);
  const [temporalFilter, setTemporalFilter] = useState({
    history: [true, true, false, true, true],
    positives_count: 4,
    confirmed_fire: true,
    status_label: 'CONFIRMED_FIRE',
    window_size: 5,
    threshold_count: 3
  });

  // Telemetry & Alerts
  const [nodes, setNodes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [riskZones, setRiskZones] = useState([]);

  // Rothermel Physics Simulation Parameters
  const [rothermelParams, setRothermelParams] = useState({
    wind_speed_kmh: 28.0,
    wind_dir_deg: 45.0,
    fuel_moisture_pct: 6.5,
    slope_deg: 18.0,
    vegetation_type: 'Dry Grass',
    temperature_c: 36.0,
    ignition_lat: 37.7780,
    ignition_lng: -122.4220,
  });

  const [spreadResult, setSpreadResult] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState('TOWER-ALPHA');

  // Trigger Rothermel Spread API
  const fetchSpreadSimulation = useCallback(async (paramsToUse) => {
    const p = paramsToUse || rothermelParams;
    try {
      const res = await fetch('/api/spread-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (res.ok) {
        const data = await res.json();
        setSpreadResult(data);
      }
    } catch (err) {
      console.warn('Backend REST API unavailable, computing local fallback Rothermel simulation:', err);
      // Fallback calculation in JS if backend REST is starting
      calculateFallbackSpread(p);
    }
  }, [rothermelParams]);

  // Fallback calculation for immediate visual feedback
  const calculateFallbackSpread = (p) => {
    const angleRad = ((450.0 - p.wind_dir_deg) % 360.0) * (Math.PI / 180.0);
    const ros = (3.5 + (p.wind_speed_kmh * 0.12) + (p.slope_deg * 0.05)) * (1.0 - (p.fuel_moisture_pct / 30.0));
    
    const horizons = [
      { hours: 0.5, label: 'T + 30 min Front', color: '#00d9a5' },
      { hours: 1.0, label: 'T + 1 Hour Front', color: '#ffb703' },
      { hours: 3.0, label: 'T + 3 Hour Front', color: '#ff6b35' },
      { hours: 6.0, label: 'T + 6 Hour Front', color: '#ff2d55' },
    ];

    const polygons = horizons.map(({ hours, label, color }) => {
      const distForward = ros * hours * 60; // meters
      const distBacking = ros * 0.25 * hours * 60;
      const distFlank = ros * 0.5 * hours * 60;
      const major = distForward + distBacking;
      const offset = (distForward - distBacking) / 2.0;
      const a = major / 2.0;
      const b = distFlank;

      const cx = offset * Math.cos(angleRad);
      const cy = offset * Math.sin(angleRad);

      const ring = [];
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const theta = (2.0 * Math.PI * i) / numPts;
        const ex = a * Math.cos(theta);
        const ey = b * Math.sin(theta);
        const rx = ex * Math.cos(angleRad) - ey * Math.sin(angleRad);
        const ry = ex * Math.sin(angleRad) + ey * Math.cos(angleRad);
        const tx = cx + rx;
        const ty = cy + ry;

        const deltaLat = ty / 111320.0;
        const deltaLng = tx / (111320.0 * Math.cos(p.ignition_lat * (Math.PI / 180.0)));
        ring.append ? ring.push([p.ignition_lat + deltaLat, p.ignition_lng + deltaLng]) : ring.push([Number((p.ignition_lat + deltaLat).toFixed(6)), Number((p.ignition_lng + deltaLng).toFixed(6))]);
      }

      return {
        horizon_hours: hours,
        label,
        color,
        area_hectares: Number(((Math.PI * a * b) / 10000.0).toFixed(2)),
        front_ros_m_min: Number(ros.toFixed(2)),
        flame_length_m: Number((0.45 * Math.pow(ros, 0.65)).toFixed(1)),
        coordinates: ring
      };
    });

    setSpreadResult({
      timestamp: Date.now(),
      params: p,
      polygons,
      summary: `Rothermel Model Predicts max ROS of ${ros.toFixed(1)} m/min towards ${p.wind_dir_deg}° under ${p.vegetation_type} conditions.`
    });
  };

  // Initial fetch of static data & Rothermel calculation
  useEffect(() => {
    fetchSpreadSimulation();
    
    // Initial fetch of nodes and risk zones
    fetch('/api/nodes').then(r => r.json()).then(data => setNodes(data)).catch(() => {});
    fetch('/api/risk-zones').then(r => r.json()).then(data => setRiskZones(data)).catch(() => {});
    fetch('/api/alerts').then(r => r.json()).then(data => setAlerts(data)).catch(() => {});
  }, []);

  // Recalculate Rothermel when params change
  useEffect(() => {
    fetchSpreadSimulation(rothermelParams);
  }, [rothermelParams, fetchSpreadSimulation]);

  // Connect WebSocket to FastAPI backend
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'localhost:8000' 
        : window.location.host;
      
      const wsUrl = `${protocol}//${host}/ws/stream`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected to FireSense streaming hub.');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'STREAM_UPDATE') {
            setStreamData(payload);
            if (payload.temporal_filter) setTemporalFilter(payload.temporal_filter);
            if (payload.nodes) setNodes(payload.nodes);
            if (payload.alerts) setAlerts(payload.alerts);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection every 3 seconds
        reconnectTimer = setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        setIsConnected(false);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Play synthesized web audio alert tone on critical fire confirmation
  const playAlertSound = useCallback(() => {
    if (soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }, [soundMuted]);

  // Trigger sound when confirmed_fire state turns true
  useEffect(() => {
    if (temporalFilter.confirmed_fire) {
      playAlertSound();
    }
  }, [temporalFilter.confirmed_fire, playAlertSound]);

  const acknowledgeAlert = async (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    try {
      await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
    } catch (e) {}
  };

  const setIgnitionPoint = (lat, lng) => {
    setRothermelParams(prev => ({
      ...prev,
      ignition_lat: Number(lat.toFixed(4)),
      ignition_lng: Number(lng.toFixed(4))
    }));
  };

  return (
    <SystemContext.Provider value={{
      isConnected,
      activeTab,
      setActiveTab,
      soundMuted,
      setSoundMuted,
      streamData,
      temporalFilter,
      nodes,
      alerts,
      riskZones,
      rothermelParams,
      setRothermelParams,
      spreadResult,
      selectedCamera,
      setSelectedCamera,
      acknowledgeAlert,
      setIgnitionPoint,
      fetchSpreadSimulation,
      playAlertSound
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
};
