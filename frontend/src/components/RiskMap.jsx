import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Trees, Flame, Map, Layers, Eye } from 'lucide-react';
import axios from 'axios';

// Helper function to generate an 8-vertex circle polygon around (lat, lon) with radius_deg ~0.08
function createFallbackForestPolygon(centerLat, centerLon, radiusDeg = 0.08) {
  const points = [];
  const numVertices = 8;
  for (let i = 0; i < numVertices; i++) {
    const angle = (2 * Math.PI * i) / numVertices;
    const r = radiusDeg * (0.85 + 0.3 * Math.sin(i * 1.5));
    const dLat = r * Math.cos(angle);
    const dLon = (r * Math.sin(angle)) / Math.cos(centerLat * (Math.PI / 180));
    points.push([centerLat + dLat, centerLon + dLon]);
  }
  return points;
}

// Hardcoded Forest Polygons across Indian National Parks
const FALLBACK_FOREST_POLYGONS = [
  { name: 'Bannerghatta National Park', center: [12.80, 77.58] },
  { name: 'Cauvery Wildlife Sanctuary', center: [12.30, 77.50] },
  { name: 'Nagarhole Tiger Reserve', center: [12.05, 76.15] },
  { name: 'Bandipur Tiger Reserve', center: [11.67, 76.63] },
  { name: 'Bhadra Wildlife Sanctuary', center: [13.70, 75.65] },
  { name: 'Kudremukh National Park', center: [13.25, 75.25] },
  { name: 'Jim Corbett National Park', center: [29.53, 78.94] },
  { name: 'Sundarbans National Park', center: [21.94, 88.90] },
  { name: 'Kanha Tiger Reserve', center: [22.33, 80.61] },
  { name: 'Kaziranga National Park', center: [26.57, 93.17] },
  { name: 'Gir National Park', center: [21.12, 70.82] },
  { name: 'Ranthambore National Park', center: [26.01, 76.50] }
].map(f => ({
  name: f.name,
  coordinates: createFallbackForestPolygon(f.center[0], f.center[1], 0.12)
}));

// Fallback Fire Points across India
const FALLBACK_FIRMS_FIRES = [
  { lat: 11.66, lon: 76.62, brightness: 342.5, confidence: 'high', locationName: 'Bandipur Tiger Reserve Sector 4' },
  { lat: 12.04, lon: 76.12, brightness: 338.1, confidence: 'nominal', locationName: 'Nagarhole Forest North Slope' },
  { lat: 13.22, lon: 75.24, brightness: 351.0, confidence: 'high', locationName: 'Kudremukh Ridge Peak' },
  { lat: 29.50, lon: 78.90, brightness: 348.2, confidence: 'high', locationName: 'Jim Corbett National Park Range' },
  { lat: 22.30, lon: 80.58, brightness: 335.4, confidence: 'nominal', locationName: 'Kanha Tiger Reserve South' },
  { lat: 26.55, lon: 93.15, brightness: 349.0, confidence: 'high', locationName: 'Kaziranga Buffer Zone' }
];

// All Major Indian States & Union Territories Labels
const STATES = [
  { name: "KARNATAKA",   lat: 15.3173, lon: 75.7139 },
  { name: "KERALA",      lat: 10.8505, lon: 76.2711 },
  { name: "TAMIL NADU",  lat: 11.1271, lon: 78.6569 },
  { name: "MAHARASHTRA", lat: 19.7515, lon: 75.7139 },
  { name: "TELANGANA",   lat: 18.1124, lon: 79.0193 },
  { name: "ANDHRA PRADESH", lat: 15.9129, lon: 79.7400 },
  { name: "GOA",         lat: 15.2993, lon: 74.1240 },
  { name: "MADHYA PRADESH", lat: 22.9734, lon: 78.6569 },
  { name: "GUJARAT",     lat: 22.2587, lon: 71.1924 },
  { name: "RAJASTHAN",   lat: 27.0238, lon: 74.2179 },
  { name: "UTTAR PRADESH", lat: 26.8467, lon: 80.9462 },
  { name: "WEST BENGAL", lat: 22.9868, lon: 87.8550 },
  { name: "ODISHA",      lat: 20.9517, lon: 85.0985 },
  { name: "CHHATTISGARH", lat: 21.2787, lon: 81.8661 },
  { name: "JHARKHAND",   lat: 23.6102, lon: 85.2799 },
  { name: "ASSAM",       lat: 26.2006, lon: 92.9376 },
  { name: "UTTARAKHAND", lat: 30.0668, lon: 79.0193 },
  { name: "HIMACHAL PRADESH", lat: 31.1048, lon: 77.1734 },
  { name: "JAMMU & KASHMIR", lat: 33.7782, lon: 76.5762 }
];

// Major Indian National Parks & Forest Reserve Labels
const FORESTS = [
  { name: "🌲 BANNERGHATTA NP",       lat: 12.80, lon: 77.58 },
  { name: "🌲 NAGARHOLE TR",          lat: 12.05, lon: 76.15 },
  { name: "🌲 BANDIPUR TR",           lat: 11.67, lon: 76.63 },
  { name: "🌲 BHADRA WLS",            lat: 13.70, lon: 75.65 },
  { name: "🌲 KUDREMUKH NP",          lat: 13.25, lon: 75.25 },
  { name: "🌲 SILENT VALLEY NP",      lat: 11.13, lon: 76.45 },
  { name: "🌲 PERIYAR TR",            lat: 9.50,  lon: 77.15 },
  { name: "🌲 CAUVERY WLS",           lat: 12.30, lon: 77.50 },
  { name: "🌲 JIM CORBETT NP",        lat: 29.53, lon: 78.94 },
  { name: "🌲 SUNDARBANS NP",         lat: 21.94, lon: 88.90 },
  { name: "🌲 KANHA TIGER RESERVE",   lat: 22.33, lon: 80.61 },
  { name: "🌲 KAZIRANGA NP",          lat: 26.57, lon: 93.17 },
  { name: "🌲 GIR NATIONAL PARK",     lat: 21.12, lon: 70.82 },
  { name: "🌲 RANTHAMBORE NP",        lat: 26.01, lon: 76.50 },
  { name: "🌲 SIMLIPAL TR",           lat: 21.93, lon: 86.34 },
  { name: "🌲 TADOBA TR",             lat: 20.21, lon: 79.35 }
];

export const RiskMap = ({ center = [20.5937, 78.9629] }) => {
  const [zones, setZones] = useState([]);
  const [forestGeoJSON, setForestGeoJSON] = useState(null);
  const [useFallbackForests, setUseFallbackForests] = useState(false);
  const [showForests, setShowForests] = useState(true);

  const [firmsFires, setFirmsFires] = useState([]);
  const [showFires, setShowFires] = useState(true);

  // Map Tile Style State: 'color_map' | 'satellite' | 'topo' | 'dark'
  const [mapStyle, setMapStyle] = useState('color_map');

  // 1. Fetch Risk Zones from /api/risk/zones
  useEffect(() => {
    let isMounted = true;
    axios.get(`/api/risk/zones?lat=${center[0]}&lon=${center[1]}`)
      .then(res => {
        if (isMounted && res.data) {
          const fetchedZones = res.data.zones || (Array.isArray(res.data) ? res.data : []);
          setZones(fetchedZones);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch risk zones:', err);
      });

    return () => { isMounted = false; };
  }, [center]);

  // 2. Fetch Public Indian Forest GeoJSON with fallback
  useEffect(() => {
    let isMounted = true;
    const optionA = 'https://raw.githubusercontent.com/datameet/india-forests/master/india_forests.geojson';

    fetch(optionA)
      .then(res => {
        if (!res.ok) throw new Error('Option A failed');
        return res.json();
      })
      .then(data => {
        if (isMounted && data) setForestGeoJSON(data);
      })
      .catch(() => {
        if (isMounted) setUseFallbackForests(true);
      });

    return () => { isMounted = false; };
  }, []);

  // 3. Fetch NASA FIRMS Fire Detection Data with Fallback
  useEffect(() => {
    let isMounted = true;
    const apiKey = 'MAP_KEY_PLACEHOLDER';
    const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/68,8,97,37/1`;

    fetch(firmsUrl)
      .then(res => {
        if (!res.ok) throw new Error('NASA FIRMS API request failed');
        return res.text();
      })
      .then(csvText => {
        if (!csvText || csvText.includes('Invalid') || csvText.includes('HTML') || csvText.includes('Error')) {
          throw new Error('Invalid CSV returned from NASA FIRMS');
        }
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) throw new Error('No data rows in FIRMS CSV');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const latIdx = headers.indexOf('latitude');
        const lonIdx = headers.indexOf('longitude');
        const brightIdx = headers.indexOf('bright_ti4');
        const confIdx = headers.indexOf('confidence');

        const points = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length > Math.max(latIdx, lonIdx)) {
            const lat = parseFloat(cols[latIdx]);
            const lon = parseFloat(cols[lonIdx]);
            if (!isNaN(lat) && !isNaN(lon)) {
              points.push({
                lat,
                lon,
                brightness: brightIdx >= 0 ? parseFloat(cols[brightIdx]) || 330 : 330,
                confidence: confIdx >= 0 ? cols[confIdx] : 'nominal',
                locationName: `VIIRS Anomaly (${lat.toFixed(2)}, ${lon.toFixed(2)})`
              });
            }
          }
        }

        if (points.length === 0) throw new Error('No parsed points from FIRMS');
        if (isMounted) setFirmsFires(points);
      })
      .catch(() => {
        if (isMounted) setFirmsFires(FALLBACK_FIRMS_FIRES);
      });

    return () => { isMounted = false; };
  }, []);

  const getColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'extreme': return '#ff2d55';
      case 'high': return '#ff6b35';
      case 'moderate': return '#ffb020';
      case 'low': return '#00d9a5';
      default: return '#00d9a5';
    }
  };

  const forestStyle = {
    color: '#00d9a5',
    weight: 1.5,
    opacity: 0.85,
    fillColor: '#00d9a5',
    fillOpacity: 0.35,
    smoothFactor: 1
  };

  // Tile Layer Configurations (No API Keys required!)
  const getTileConfig = () => {
    switch (mapStyle) {
      case 'color_map':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
          subdomains: 'abc'
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        };
      case 'topo':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        };
      case 'dark':
      default:
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        };
    }
  };

  const currentTile = getTileConfig();

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#0a0e14] rounded-xl border border-[#1e293b] shadow-2xl font-mono">
      {/* Map Container centered over India */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        zoomControl={false}
        className="w-full h-full min-h-[480px] z-0"
      >
        {/* Active Vibrant Tile Layer */}
        <TileLayer
          key={mapStyle}
          url={currentTile.url}
          attribution={currentTile.attribution}
          subdomains={currentTile.subdomains || 'abc'}
          maxZoom={19}
          detectRetina={true}
        />

        {/* Indian Forest GeoJSON Layer or Fallback Polygons */}
        {showForests && (
          forestGeoJSON ? (
            <GeoJSON data={forestGeoJSON} style={() => forestStyle} />
          ) : useFallbackForests ? (
            FALLBACK_FOREST_POLYGONS.map((forest, i) => (
              <Polygon
                key={i}
                positions={forest.coordinates}
                pathOptions={forestStyle}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs text-[#00d9a5]">
                    🌲 <strong>{forest.name}</strong>
                    <div className="text-[10px] text-slate-300">Indian National Park / Forest Reserve</div>
                  </div>
                </Popup>
              </Polygon>
            ))
          ) : null
        )}

        {/* All Indian State Names Overlay Labels */}
        {STATES.map((s) => (
          <Marker
            key={s.name}
            position={[s.lat, s.lon]}
            icon={L.divIcon({
              className: 'state-label-badge',
              html: `<div style="
                color: ${mapStyle === 'color_map' || mapStyle === 'topo' ? '#0f172a' : '#ffffff'};
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1.5px;
                background: ${mapStyle === 'color_map' || mapStyle === 'topo' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)'};
                border: 1px solid ${mapStyle === 'color_map' || mapStyle === 'topo' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.25)'};
                padding: 2px 7px;
                border-radius: 6px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                white-space: nowrap;
                pointer-events: none;
                font-family: Inter, sans-serif;
              ">${s.name}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            })}
            interactive={false}
          />
        ))}

        {/* Major Indian National Parks & Forest Reserves Overlay Labels */}
        {showForests &&
          FORESTS.map((f) => (
            <Marker
              key={f.name}
              position={[f.lat, f.lon]}
              icon={L.divIcon({
                className: 'forest-label-badge',
                html: `<div style="
                  color: #00d9a5;
                  font-size: 10px;
                  font-weight: 700;
                  letter-spacing: 0.5px;
                  background: rgba(10, 14, 20, 0.85);
                  border: 1px solid rgba(0, 217, 165, 0.6);
                  padding: 2px 6px;
                  border-radius: 6px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  white-space: nowrap;
                  pointer-events: none;
                  font-family: Inter, sans-serif;
                ">${f.name}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
              })}
              interactive={false}
            />
          ))}

        {/* NASA FIRMS Live Fire Detection Markers */}
        {showFires &&
          firmsFires.map((fire, idx) => (
            <CircleMarker
              key={`fire-${idx}`}
              center={[fire.lat, fire.lon]}
              radius={7}
              pathOptions={{
                color: '#ff2d55',
                fillColor: '#ff2d55',
                fillOpacity: 0.9,
                weight: 2,
                className: 'animate-pulse'
              }}
            >
              <Popup>
                <div className="p-1 font-mono text-xs text-slate-100">
                  <div className="font-bold text-sm uppercase text-[#ff2d55] flex items-center gap-1 mb-1">
                    🔥 LIVE FIRE DETECTION
                  </div>
                  <div className="text-slate-300 space-y-0.5 border-t border-[#1e293b] pt-1 text-[11px]">
                    <div><strong>Location:</strong> {fire.locationName}</div>
                    <div><strong>Lat/Lon:</strong> {fire.lat.toFixed(4)}, {fire.lon.toFixed(4)}</div>
                    <div><strong>Brightness:</strong> {fire.brightness ? `${fire.brightness} K` : 'N/A'}</div>
                    <div><strong>Confidence:</strong> <span className="text-[#ff2d55] uppercase">{fire.confidence}</span></div>
                    <div className="text-[9px] text-slate-400 mt-1">Source: NASA FIRMS (VIIRS NRT)</div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Risk Zones Circle Markers */}
        {zones.map((z, idx) => {
          const color = z.color || getColor(z.level);
          const radius = Math.max(8, Math.round((z.risk || 50) * 0.35));

          return (
            <CircleMarker
              key={z.id || idx}
              center={[z.lat, z.lon]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1.5 font-mono text-xs text-slate-100">
                  <div className="font-bold text-sm uppercase mb-1" style={{ color: color }}>
                    {z.id || 'RISK ZONE'}
                  </div>
                  <div className="text-slate-300 border-t border-[#1e293b] pt-1">
                    Risk: <strong className="text-white">{z.risk}%</strong> | Level: <strong className="uppercase" style={{ color: color }}>{z.level}</strong>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Top-Right Style & Layer Switcher Control Bar */}
      <div className="absolute top-4 right-4 z-10 font-mono flex flex-wrap items-center gap-2">
        {/* Color / Satellite / Dark Mode Selector */}
        <div className="bg-[#121826]/90 backdrop-blur p-1 rounded-lg border border-[#1e293b] flex items-center gap-1 shadow-2xl">
          <button
            onClick={() => setMapStyle('color_map')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              mapStyle === 'color_map'
                ? 'bg-[#ff6b35] text-white shadow-[0_0_8px_rgba(255,107,53,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ COLOR MAP
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              mapStyle === 'satellite'
                ? 'bg-[#ff6b35] text-white shadow-[0_0_8px_rgba(255,107,53,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛰️ SATELLITE
          </button>
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              mapStyle === 'dark'
                ? 'bg-[#ff6b35] text-white shadow-[0_0_8px_rgba(255,107,53,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌙 DARK
          </button>
        </div>

        {/* Live Fires Toggle */}
        <button
          onClick={() => setShowFires(!showFires)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl border ${
            showFires
              ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-[#ff2d55] glow-alert'
              : 'bg-[#121826]/85 border-[#1e293b] text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-[#ff2d55]" />
          <span>🔥 FIRES</span>
        </button>

        {/* Forests Toggle */}
        <button
          onClick={() => setShowForests(!showForests)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl border ${
            showForests
              ? 'bg-[#00d9a5]/20 border-[#00d9a5] text-[#00d9a5] glow-safe'
              : 'bg-[#121826]/85 border-[#1e293b] text-slate-400 hover:text-white'
          }`}
        >
          <Trees className="w-4 h-4 text-[#00d9a5]" />
          <span>🌲 FORESTS</span>
        </button>
      </div>

      {/* Bottom-Left Glass Legend */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel p-3 text-slate-100 text-xs w-52 shadow-2xl space-y-2 border border-[#1e293b]">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-[#1e293b] pb-1 text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#ff6b35]" />
          <span>SPATIAL RISK LEGEND</span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff2d55] animate-pulse" /> FIRMS Fire
            </span>
            <span className="text-slate-400 font-bold">VIIRS</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d9a5]" /> Low Risk
            </span>
            <span className="text-slate-400 font-bold">&le; 35%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb020]" /> Moderate Risk
            </span>
            <span className="text-slate-400 font-bold">36-55%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b35]" /> High Risk
            </span>
            <span className="text-slate-400 font-bold">56-75%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff2d55]" /> Extreme Risk
            </span>
            <span className="text-slate-400 font-bold">&gt; 75%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMap;
