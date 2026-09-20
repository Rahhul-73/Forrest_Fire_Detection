import React from 'react';
import { useSystem } from '../context/SystemContext';
import { Wind, Flame, Compass, Thermometer, Layers, AlertCircle, Play, Sparkles } from 'lucide-react';

export const RothermelControls = () => {
  const { rothermelParams, setRothermelParams, spreadResult, fetchSpreadSimulation } = useSystem();

  const handleParamChange = (field, value) => {
    setRothermelParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fuelOptions = [
    { name: 'Dry Grass', baseRos: '4.2 m/min', desc: 'Fast surface spread, low moisture threshold' },
    { name: 'Chaparral', baseRos: '3.1 m/min', desc: 'Dense brushwood, intense heat generation' },
    { name: 'Pine Forest', baseRos: '1.8 m/min', desc: 'Heavy canopy, moderate surface ROS' },
    { name: 'Eucalyptus', baseRos: '5.0 m/min', desc: 'Volatile oil leaves, extreme spot fire potential' },
  ];

  const presets = [
    { label: 'Extreme Summer Gale', wind: 45, moisture: 4, slope: 25, temp: 40, fuel: 'Dry Grass' },
    { label: 'Moderate Ridge Wind', wind: 22, moisture: 8, slope: 15, temp: 32, fuel: 'Chaparral' },
    { label: 'Damp Forest Breeze', wind: 10, moisture: 16, slope: 5, temp: 22, fuel: 'Pine Forest' },
  ];

  const applyPreset = (p) => {
    setRothermelParams(prev => ({
      ...prev,
      wind_speed_kmh: p.wind,
      fuel_moisture_pct: p.moisture,
      slope_deg: p.slope,
      temperature_c: p.temp,
      vegetation_type: p.fuel
    }));
  };

  return (
    <div className="w-full h-[calc(100vh-65px)] bg-[#0a0e14] p-6 text-slate-100 overflow-y-auto font-mono">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">ROTHERMEL FIRE SPREAD PHYSICS MODEL</h2>
              <p className="text-xs text-slate-400">Surface Fire Spread Equations, Wind Vectors & Topographic Slope Correction</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg bg-[#0a0e14] border border-[#1e293b] text-xs text-slate-300 hover:text-white hover:border-[#ff6b35] transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Controls Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Parameters Form Grid */}
            <div className="glass-panel p-5 space-y-6">
              <h3 className="font-bold text-sm text-slate-200 border-b border-[#1e293b] pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff6b35]" />
                ENVIRONMENTAL & TOPOGRAPHIC INPUT PARAMETERS
              </h3>

              {/* Wind Speed & Direction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-[#ff6b35]" /> Wind Speed
                    </span>
                    <span className="font-bold text-[#ff6b35]">{rothermelParams.wind_speed_kmh} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={rothermelParams.wind_speed_kmh}
                    onChange={(e) => handleParamChange('wind_speed_kmh', parseFloat(e.target.value))}
                    className="w-full accent-[#ff6b35] bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#00f0ff]" /> Wind Direction Vector
                    </span>
                    <span className="font-bold text-[#00f0ff]">{rothermelParams.wind_dir_deg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={rothermelParams.wind_dir_deg}
                    onChange={(e) => handleParamChange('wind_dir_deg', parseFloat(e.target.value))}
                    className="w-full accent-[#00f0ff] bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  {/* Cardinal Direction Buttons */}
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <button onClick={() => handleParamChange('wind_dir_deg', 0)} className="hover:text-white">N (0°)</button>
                    <button onClick={() => handleParamChange('wind_dir_deg', 45)} className="hover:text-white">NE (45°)</button>
                    <button onClick={() => handleParamChange('wind_dir_deg', 90)} className="hover:text-white">E (90°)</button>
                    <button onClick={() => handleParamChange('wind_dir_deg', 180)} className="hover:text-white">S (180°)</button>
                    <button onClick={() => handleParamChange('wind_dir_deg', 270)} className="hover:text-white">W (270°)</button>
                  </div>
                </div>
              </div>

              {/* Fuel Moisture & Incline Slope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#ff2d55]" /> Fuel Moisture Content
                    </span>
                    <span className="font-bold text-[#ff2d55]">{rothermelParams.fuel_moisture_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={rothermelParams.fuel_moisture_pct}
                    onChange={(e) => handleParamChange('fuel_moisture_pct', parseFloat(e.target.value))}
                    className="w-full accent-[#ff2d55] bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>1% (Bone Dry - High ROS)</span>
                    <span>30% (Moist - Damped)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#ffb703]" /> Terrain Slope Incline
                    </span>
                    <span className="font-bold text-[#ffb703]">{rothermelParams.slope_deg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={rothermelParams.slope_deg}
                    onChange={(e) => handleParamChange('slope_deg', parseFloat(e.target.value))}
                    className="w-full accent-[#ffb703] bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>0° (Flat Valley)</span>
                    <span>60° (Steep Canyon Wall)</span>
                  </div>
                </div>
              </div>

              {/* Vegetation Model Selector */}
              <div className="pt-2">
                <label className="text-xs text-slate-300 font-semibold mb-3 block">
                  VEGETATION FUEL BED MODEL
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fuelOptions.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => handleParamChange('vegetation_type', f.name)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        rothermelParams.vegetation_type === f.name
                          ? 'bg-[#ff6b35]/15 border-[#ff6b35] text-white shadow-lg glow-fire'
                          : 'bg-[#0a0e14] border-[#1e293b] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs mb-1">
                        <span className="text-slate-200">{f.name}</span>
                        <span className="text-[10px] text-[#ff6b35]">{f.baseRos}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Calculated Prediction Output */}
          <div className="space-y-6">
            <div className="glass-panel p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 border-b border-[#1e293b] pb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff2d55]" />
                ROTHERMEL SIMULATION OUTPUT
              </h3>

              {spreadResult && spreadResult.polygons ? (
                <div className="space-y-4">
                  
                  {/* Summary Box */}
                  <div className="p-3.5 rounded-lg bg-[#0a0e14] border border-[#1e293b] text-xs text-slate-300 leading-relaxed">
                    {spreadResult.summary}
                  </div>

                  {/* Polygon Horizons Grid */}
                  <div className="space-y-2.5">
                    {spreadResult.polygons.map((poly, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#0a0e14] border border-[#1e293b] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs" style={{ color: poly.color }}>
                            {poly.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Front ROS: {poly.front_ros_m_min} m/min | Flame: {poly.flame_length_m}m
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-sm text-white">{poly.area_hectares} Ha</div>
                          <div className="text-[10px] text-slate-400">Coverage Area</div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Calculating Rothermel fire spread contours...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
