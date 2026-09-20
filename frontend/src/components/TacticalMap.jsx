import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useSystem } from '../context/SystemContext';
import { MapPin, Compass, Eye, ShieldAlert, Layers, Flame, RefreshCw } from 'lucide-react';

export const TacticalMap = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const ignitionMarkerRef = useRef(null);

  const {
    nodes,
    riskZones,
    spreadResult,
    rothermelParams,
    setIgnitionPoint,
    fetchSpreadSimulation,
  } = useSystem();

  const [showRothermel, setShowRothermel] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [isClickIgnitionMode, setIsClickIgnitionMode] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered over San Francisco reserve area
    const map = L.map(mapContainerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 13,
      zoomControl: false,
    });

    // Dark Esri tiles (No API key required)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click for placing custom ignition origin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      setIgnitionPoint(lat, lng);
      setIsClickIgnitionMode(false);
    };

    if (isClickIgnitionMode) {
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getContainer().style.cursor = '';
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isClickIgnitionMode, setIgnitionPoint]);

  // Update map overlays whenever state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Risk Zones (Heat gradient circles)
    if (showRiskZones && riskZones.length > 0) {
      riskZones.forEach((rz) => {
        const circle = L.circle([rz.center_lat, rz.center_lng], {
          radius: rz.radius_m,
          color: rz.color,
          fillColor: rz.color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 6',
        });
        circle.bindPopup(`
          <div class="p-2 font-mono text-xs">
            <div class="font-bold text-sm text-slate-100">${rz.name}</div>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-slate-400">Risk Score:</span>
              <span class="font-bold" style="color: ${rz.color}">${rz.risk_score}/100 (${rz.risk_level})</span>
            </div>
          </div>
        `);
        layerGroup.addLayer(circle);
      });
    }

    // 2. Render Rothermel Fire Spread Polygons
    if (showRothermel && spreadResult && spreadResult.polygons) {
      // Reverse order so largest 6h polygon is rendered at bottom, 0.5h on top
      [...spreadResult.polygons].reverse().forEach((poly) => {
        const leafletCoords = poly.coordinates.map((c) => [c[0], c[1]]);
        const polygonLayer = L.polygon(leafletCoords, {
          color: poly.color,
          fillColor: poly.color,
          fillOpacity: 0.28,
          weight: 2,
        });

        polygonLayer.bindPopup(`
          <div class="p-2 font-mono text-xs">
            <div class="font-extrabold text-sm mb-1" style="color: ${poly.color}">${poly.label}</div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
              <span>Time Horizon:</span> <span class="font-bold text-white">${poly.horizon_hours} Hours</span>
              <span>Predicted Area:</span> <span class="font-bold text-white">${poly.area_hectares} Ha</span>
              <span>Front ROS:</span> <span class="font-bold text-white">${poly.front_ros_m_min} m/min</span>
              <span>Max Flame:</span> <span class="font-bold text-white">${poly.flame_length_m} m</span>
            </div>
          </div>
        `);
        layerGroup.addLayer(polygonLayer);
      });
    }

    // 3. Render Ignition Origin Pin
    if (rothermelParams) {
      const ignitionIcon = L.divIcon({
        className: 'custom-ignition-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#ff2d55]/30 border-2 border-[#ff2d55] text-[#ff2d55] animate-pulse glow-alert">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([rothermelParams.ignition_lat, rothermelParams.ignition_lng], {
        icon: ignitionIcon,
      });
      marker.bindPopup(`
        <div class="p-2 font-mono text-xs">
          <div class="font-bold text-white text-sm mb-1">🔥 FIRE IGNITION ORIGIN</div>
          <div class="text-slate-300">Lat: ${rothermelParams.ignition_lat}, Lng: ${rothermelParams.ignition_lng}</div>
          <div class="text-slate-400 mt-1">Wind: ${rothermelParams.wind_speed_kmh} km/h @ ${rothermelParams.wind_dir_deg}°</div>
        </div>
      `);
      layerGroup.addLayer(marker);
    }

    // 4. Render LoRa Mesh Sensor Nodes
    if (showNodes && nodes.length > 0) {
      nodes.forEach((node) => {
        let nodeColor = '#00d9a5'; // active safe
        if (node.status === 'ALERT') nodeColor = '#ff2d55';
        else if (node.status === 'WARNING') nodeColor = '#ffb703';
        else if (node.status === 'OFFLINE') nodeColor = '#64748b';

        const nodeIcon = L.divIcon({
          className: 'custom-node-icon',
          html: `
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#121824] border-2 text-white font-mono text-[10px] font-bold shadow-lg" style="border-color: ${nodeColor}; color: ${nodeColor}">
              ${node.id.split('-')[1]}
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style="background-color: ${nodeColor}"></span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const nodeMarker = L.marker([node.lat, node.lng], { icon: nodeIcon });
        nodeMarker.bindPopup(`
          <div class="p-2 font-mono text-xs min-w-[200px]">
            <div class="font-extrabold text-sm mb-1" style="color: ${nodeColor}">${node.name} (${node.id.toUpperCase()})</div>
            <div class="grid grid-cols-2 gap-[#1e293b] gap-y-1 text-slate-300 my-2">
              <span>Status:</span> <span class="font-bold" style="color: ${nodeColor}">${node.status}</span>
              <span>Temp:</span> <span class="font-bold text-white">${node.temp_c}°C</span>
              <span>Smoke:</span> <span class="font-bold text-white">${node.smoke_ppm} PPM</span>
              <span>Humidity:</span> <span class="font-bold text-white">${node.humidity_pct}%</span>
              <span>RSSI:</span> <span class="font-bold text-white">${node.rssi_dbm} dBm</span>
              <span>Battery:</span> <span class="font-bold text-white">${node.battery_pct}%</span>
            </div>
            ${node.pending_packets > 0 ? `<div class="text-[#ffb703] text-[10px]">⚠️ Queued Store-and-Forward: ${node.pending_packets} packets</div>` : ''}
          </div>
        `);
        layerGroup.addLayer(nodeMarker);
      });
    }
  }, [showRothermel, showRiskZones, showNodes, spreadResult, rothermelParams, nodes, riskZones]);

  return (
    <div className="relative w-full h-[calc(100vh-65px)] overflow-hidden bg-[#0a0e14]">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Layer Visibility & Control Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        {/* Layer Toggles Card */}
        <div className="glass-panel p-3.5 text-slate-200 font-mono text-xs shadow-xl w-64">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-3">
            <span className="font-bold flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-[#ff6b35]" />
              TACTICAL LAYERS
            </span>
            <button
              onClick={() => fetchSpreadSimulation()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Refresh layers"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b35]"></span>
                Rothermel Polygons
              </span>
              <input
                type="checkbox"
                checked={showRothermel}
                onChange={(e) => setShowRothermel(e.target.checked)}
                className="accent-[#ff6b35] rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff2d55]"></span>
                Risk Zones (Heatmap)
              </span>
              <input
                type="checkbox"
                checked={showRiskZones}
                onChange={(e) => setShowRiskZones(e.target.checked)}
                className="accent-[#ff2d55] rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00d9a5]"></span>
                LoRa Sensor Nodes
              </span>
              <input
                type="checkbox"
                checked={showNodes}
                onChange={(e) => setShowNodes(e.target.checked)}
                className="accent-[#00d9a5] rounded"
              />
            </label>
          </div>
        </div>

        {/* Click to Simulate Ignition Button */}
        <button
          onClick={() => setIsClickIgnitionMode(!isClickIgnitionMode)}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
            isClickIgnitionMode
              ? 'bg-[#ff2d55] text-white animate-pulse glow-alert'
              : 'bg-[#121824] text-slate-200 border border-[#1e293b] hover:border-[#ff6b35] hover:text-[#ff6b35]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {isClickIgnitionMode ? 'Click Map to Set Fire Origin...' : 'Set Fire Origin on Map'}
        </button>
      </div>

      {/* Wind Direction Compass Widget Overlay */}
      {rothermelParams && (
        <div className="absolute top-4 right-4 z-10 glass-panel p-3 text-slate-200 font-mono text-xs shadow-xl flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center bg-[#0a0e14]">
            <Compass
              className="w-7 h-7 text-[#ff6b35] transition-transform duration-500"
              style={{ transform: `rotate(${rothermelParams.wind_dir_deg}deg)` }}
            />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">SURFACE WIND</div>
            <div className="font-bold text-white">
              {rothermelParams.wind_speed_kmh} km/h @ {rothermelParams.wind_dir_deg}°
            </div>
            <div className="text-[10px] text-slate-400">Fuel: {rothermelParams.vegetation_type}</div>
          </div>
        </div>
      )}

      {/* Rothermel Horizon Legend Overlay */}
      <div className="absolute bottom-6 left-4 z-10 glass-panel p-3 text-slate-200 font-mono text-xs shadow-xl flex items-center gap-4">
        <span className="font-bold text-slate-400 text-[10px] tracking-wider uppercase">Spread Horizons:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#00d9a5]"></span>
          <span>0.5h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ffb703]"></span>
          <span>1.0h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff6b35]"></span>
          <span>3.0h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff2d55]"></span>
          <span>6.0h</span>
        </div>
      </div>
    </div>
  );
};
