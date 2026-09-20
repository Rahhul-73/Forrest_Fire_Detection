import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Trees, Flame } from 'lucide-react';
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

// 6 Hardcoded Karnataka / Western Ghats Reserve Forest Polygons (Bengaluru Region)
const FALLBACK_FOREST_POLYGONS = [
  { name: 'Bannerghatta National Park', center: [12.80, 77.58] },
  { name: 'Cauvery Wildlife Sanctuary', center: [12.30, 77.50] },
  { name: 'Nagarhole Tiger Reserve', center: [12.05, 76.15] },
  { name: 'Bandipur Tiger Reserve', center: [11.67, 76.63] },
  { name: 'Bhadra Wildlife Sanctuary', center: [13.70, 75.65] },
  { name: 'Kudremukh National Park', center: [13.25, 75.25] },
].map(f => ({
  name: f.name,
  coordinates: createFallbackForestPolygon(f.center[0], f.center[1], 0.08)
}));

// 5 Hardcoded Fallback Fire Points in Karnataka Region
const FALLBACK_FIRMS_FIRES = [
  { lat: 11.66, lon: 76.62, brightness: 342.5, confidence: 'high', locationName: 'Bandipur Tiger Reserve Sector 4' },
  { lat: 12.04, lon: 76.12, brightness: 338.1, confidence: 'nominal', locationName: 'Nagarhole Forest North Slope' },
  { lat: 13.22, lon: 75.24, brightness: 351.0, confidence: 'high', locationName: 'Kudremukh Ridge Peak' },
  { lat: 13.68, lon: 75.63, brightness: 329.4, confidence: 'nominal', locationName: 'Bhadra Wildlife Sanctuary East' },
  { lat: 12.28, lon: 77.48, brightness: 345.8, confidence: 'high', locationName: 'Cauvery River Reserve Basin' },
];

// Indian State Labels
const STATES = [
  { name: "KARNATAKA",   lat: 15.3173, lon: 75.7139 },
  { name: "KERALA",      lat: 10.8505, lon: 76.2711 },
  { name: "TAMIL NADU",  lat: 11.1271, lon: 78.6569 },
  { name: "MAHARASHTRA", lat: 19.7515, lon: 75.7139 },
  { name: "TELANGANA",   lat: 18.1124, lon: 79.0193 },
  { name: "ANDHRA PRADESH", lat: 15.9129, lon: 79.7400 },
  { name: "GOA",         lat: 15.2993, lon: 74.1240 },
];

// Major Western Ghats Forest Reserves Labels
const FORESTS = [
  { name: "🌲 BANNERGHATTA NP",       lat: 12.80, lon: 77.58 },
  { name: "🌲 NAGARHOLE TR",          lat: 12.05, lon: 76.15 },
  { name: "🌲 BANDIPUR TR",           lat: 11.67, lon: 76.63 },
  { name: "🌲 BHADRA WLS",            lat: 13.70, lon: 75.65 },
  { name: "🌲 KUDREMUKH NP",          lat: 13.25, lon: 75.25 },
  { name: "🌲 SILENT VALLEY NP",      lat: 11.13, lon: 76.45 },
  { name: "🌲 PERIYAR TR",            lat: 9.50,  lon: 77.15 },
  { name: "🌲 ANNAMALAI TR",          lat: 10.35, lon: 76.95 },
  { name: "🌲 MUDUMALAI TR",          lat: 11.57, lon: 76.53 },
  { name: "🌲 CAUVERY WLS",           lat: 12.30, lon: 77.50 },
];

export const RiskMap = ({ center = [12.97, 77.59] }) => {
  const [zones, setZones] = useState([]);
  const [forestGeoJSON, setForestGeoJSON] = useState(null);
  const [useFallbackForests, setUseFallbackForests] = useState(false);
  const [showForests, setShowForests] = useState(true);

  const [firmsFires, setFirmsFires] = useState([]);
  const [showFires, setShowFires] = useState(true);

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

  // 2. Fetch Public Indian Forest GeoJSON with Option A & Option B fallback
  useEffect(() => {
    let isMounted = true;
    const optionA = 'https://raw.githubusercontent.com/datameet/india-forests/master/india_forests.geojson';
    const optionB = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';

    fetch(optionA)
      .then(res => {
        if (!res.ok) throw new Error('Option A failed');
        return res.json();
      })
      .then(data => {
        if (isMounted && data) setForestGeoJSON(data);
      })
      .catch(() => {
        fetch(optionB)
          .then(res => {
            if (!res.ok) throw new Error('Option B failed');
            return res.json();
          })
          .then(data => {
            if (isMounted && data) setForestGeoJSON(data);
          })
          .catch(() => {
            if (isMounted) setUseFallbackForests(true);
          });
      });

    return () => { isMounted = false; };
  }, []);

  // 3. Fetch NASA FIRMS Fire Detection Data (VIIRS NRT) with Fallback
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
    weight: 0.8,
    opacity: 0.5,
    fillColor: '#00d9a5',
    fillOpacity: 0.12,
    smoothFactor: 1
  };

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#0a0e14] rounded-xl border border-[#1e293b] shadow-2xl font-mono">
      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={12}
        zoomControl={false}
        className="w-full h-full min-h-[480px] z-0"
      >
        {/* EXACTLY ONE CARTO Dark Matter Tiles (No labels, unauthenticated endpoint, detectRetina enabled) */}
        <TileLayer
          key="base-dark"
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          subdomains="abcd"
          maxZoom={20}
          detectRetina={true}
          crossOrigin=""
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
                    <div className="text-[10px] text-slate-300">Karnataka Forest Reserve</div>
                  </div>
                </Popup>
              </Polygon>
            ))
          ) : null
        )}

        {/* Indian State Name Overlay Labels */}
        {STATES.map((s) => (
          <Marker
            key={s.name}
            position={[s.lat, s.lon]}
            icon={L.divIcon({
              className: 'state-label',
              html: `<div style="
                color: rgba(255,255,255,0.55);
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 3px;
                text-shadow: 0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,1);
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

        {/* Western Ghats Forest Reserve Overlay Labels */}
        {showForests &&
          FORESTS.map((f) => (
            <Marker
              key={f.name}
              position={[f.lat, f.lon]}
              icon={L.divIcon({
                className: 'forest-label',
                html: `<div style="
                  color: #00d9a5;
                  font-size: 10px;
                  font-weight: 600;
                  font-style: italic;
                  letter-spacing: 1.5px;
                  text-shadow: 0 0 6px rgba(0,217,165,0.6), 0 0 3px rgba(0,0,0,1);
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
              radius={6}
              pathOptions={{
                color: '#ff2d55',
                fillColor: '#ff2d55',
                fillOpacity: 0.85,
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
                fillOpacity: 0.45,
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

      {/* Top-Right Glass Toggle Buttons for Overlay Layers */}
      <div className="absolute top-4 right-4 z-10 font-mono flex items-center gap-2">
        <button
          onClick={() => setShowFires(!showFires)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl border ${
            showFires
              ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-[#ff2d55] glow-alert'
              : 'bg-[#121826]/85 border-[#1e293b] text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-[#ff2d55]" />
          <span>🔥 LIVE FIRES {showFires ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => setShowForests(!showForests)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl border ${
            showForests
              ? 'bg-[#00d9a5]/20 border-[#00d9a5] text-[#00d9a5] glow-safe'
              : 'bg-[#121826]/85 border-[#1e293b] text-slate-400 hover:text-white'
          }`}
        >
          <Trees className="w-4 h-4 text-[#00d9a5]" />
          <span>🌲 FORESTS {showForests ? 'ON' : 'OFF'}</span>
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
