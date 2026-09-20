import React, { useState, useEffect, useRef } from 'react';
import { Camera, Wifi, WifiOff, Play, Pause, RefreshCw, Radio, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const LiveStream = () => {
  const [status, setStatus] = useState('CONNECTING'); // 'LIVE' | 'CONNECTING' | 'DISCONNECTED'
  const [streamMode, setStreamMode] = useState('synthetic'); // 'real' | 'synthetic'
  const [fps, setFps] = useState(15);
  const [frameCount, setFrameCount] = useState(0);
  const [detections, setDetections] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  
  // Preset dropdown state
  const [selectedPreset, setSelectedPreset] = useState('sample'); // 'sample' | 'yosemite' | 'custom'
  const [customUrl, setCustomUrl] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const attemptsRef = useRef(0);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const connect = (sourceUrl = '') => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    setStatus('CONNECTING');

    let wsEndpoint = 'ws://localhost:8000/ws/stream';
    if (sourceUrl && sourceUrl.trim()) {
      wsEndpoint += `?src=${encodeURIComponent(sourceUrl.trim())}`;
    }

    try {
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('LIVE');
        attemptsRef.current = 0;
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        if (isPausedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          if (data.type === 'frame' && data.image) {
            const img = new Image();
            img.src = 'data:image/jpeg;base64,' + data.image;
            img.onload = () => {
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 640, 480);
              }
            };

            setFrameCount((prev) => prev + 1);
            if (data.fps) setFps(data.fps);
            if (data.detections) setDetections(data.detections);
            if (data.mode) setStreamMode(data.mode);
          }
        } catch (e) {
          console.error('[LiveStream] Parse error:', e);
        }
      };

      ws.onerror = () => {
        setStatus('DISCONNECTED');
      };

      ws.onclose = () => {
        setStatus('DISCONNECTED');

        if (attemptsRef.current < 5) {
          attemptsRef.current += 1;
          setReconnectAttempts(attemptsRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            connect(sourceUrl);
          }, 3000);
        }
      };
    } catch (e) {
      console.error('[LiveStream] Connection error:', e);
      setStatus('DISCONNECTED');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const handleLoadStream = (e) => {
    if (e) e.preventDefault();
    attemptsRef.current = 0;
    setReconnectAttempts(0);

    let urlToLoad = '';
    if (selectedPreset === 'yosemite') {
      urlToLoad = 'https://s1.ipcamlive.com/streams/3b4c10a4fa149eb03/stream.m3u8';
    } else if (selectedPreset === 'custom') {
      urlToLoad = customUrl;
    }

    connect(urlToLoad);
  };

  return (
    <div className="glass-panel p-5 font-mono text-slate-100 space-y-4 border border-[#1e293b]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wider text-white flex items-center gap-2">
              REAL-TIME LIVE STREAM
              <span className="text-[10px] text-[#ff6b35] font-normal px-2 py-0.5 rounded bg-[#ff6b35]/10 border border-[#ff6b35]/30">
                YOLOv8
              </span>
            </h2>
            {/* Stream Mode Indicator */}
            <p className="text-[10px] mt-0.5">
              MODE:{' '}
              {streamMode === 'real' ? (
                <span className="text-[#00d9a5] font-bold">REAL VIDEO STREAM</span>
              ) : (
                <span className="text-[#ffb020] font-bold">SYNTHETIC THERMAL/OPTICAL</span>
              )}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {status === 'LIVE' && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#00d9a5] bg-[#00d9a5]/10 px-3 py-1 rounded-full border border-[#00d9a5]/30 shadow-[0_0_10px_rgba(0,217,165,0.2)]">
              <motion.span
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#00d9a5]"
              />
              LIVE
            </span>
          )}

          {status === 'CONNECTING' && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#ffb020] bg-[#ffb020]/10 px-3 py-1 rounded-full border border-[#ffb020]/30">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#ffb020]"
              />
              CONNECTING...
            </span>
          )}

          {status === 'DISCONNECTED' && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff2d55] bg-[#ff2d55]/10 px-3 py-1 rounded-full border border-[#ff2d55]/30">
              <span className="w-2 h-2 rounded-full bg-[#ff2d55]" />
              DISCONNECTED
            </span>
          )}

          <button
            onClick={() => handleLoadStream()}
            title="Reconnect Stream"
            className="p-1.5 bg-[#0a0e14] hover:bg-slate-800 text-slate-300 rounded border border-[#1e293b] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Source Selection Controls */}
      <form onSubmit={handleLoadStream} className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          className="bg-[#0a0e14] text-slate-200 text-[11px] px-2.5 py-1.5 rounded border border-[#1e293b] focus:outline-none focus:border-[#ff6b35]"
        >
          <option value="sample">🌲 Sample Forest (loop)</option>
          <option value="yosemite">🌲 Yosemite Live Cam</option>
          <option value="custom">🌲 Custom RTSP / URL</option>
        </select>

        {selectedPreset === 'custom' && (
          <input
            type="text"
            placeholder="Enter custom RTSP / HLS / File URL"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 bg-[#0a0e14] text-slate-200 placeholder-slate-500 text-[11px] px-3 py-1.5 rounded border border-[#1e293b] focus:outline-none focus:border-[#ff6b35]"
          />
        )}

        <button
          type="submit"
          className="px-3 py-1.5 bg-[#ff6b35]/20 hover:bg-[#ff6b35]/30 text-[#ff6b35] border border-[#ff6b35]/40 rounded font-bold text-[11px] transition-colors flex items-center gap-1 ml-auto"
        >
          <Radio className="w-3.5 h-3.5" /> LOAD STREAM
        </button>
      </form>

      {/* Canvas Stream Area */}
      <div className="relative rounded-xl overflow-hidden border border-[#1e293b] bg-[#0a0e14] aspect-[4/3] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-contain"
        />

        {/* Disconnected Overlay */}
        {status !== 'LIVE' && (
          <div className="absolute inset-0 bg-[#0a0e14]/90 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400 gap-3 p-4 text-center">
            <WifiOff className="w-10 h-10 text-[#ff2d55] animate-bounce" />
            <div>
              <p className="text-xs font-bold text-slate-200">STREAM DISCONNECTED</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Ensure backend server is running on <code className="text-[#00d9a5]">ws://localhost:8000/ws/stream</code>
              </p>
              {reconnectAttempts > 0 && (
                <p className="text-[10px] text-[#ffb020] mt-1">
                  Auto-reconnecting... (Attempt {reconnectAttempts}/5)
                </p>
              )}
            </div>
            <button
              onClick={() => handleLoadStream()}
              className="mt-2 px-4 py-1.5 bg-[#ff6b35] text-white text-xs font-bold rounded-lg shadow-lg hover:bg-[#ff6b35]/80 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> RECONNECT WEBSOCKET
            </button>
          </div>
        )}

        {/* HUD Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none p-3 flex justify-between items-end text-[10px] font-mono">
          <div className="bg-[#0a0e14]/80 backdrop-blur border border-[#1e293b] px-2.5 py-1 rounded text-[#00d9a5]">
            YOLOv8 REAL-TIME FEED
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="pointer-events-auto bg-[#0a0e14]/90 hover:bg-slate-800 text-slate-200 border border-[#1e293b] px-3 py-1 rounded flex items-center gap-1.5 text-[11px] font-bold transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-[#00d9a5]" /> : <Pause className="w-3.5 h-3.5 text-[#ffb020]" />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="p-3 rounded-lg bg-[#0a0e14] border border-[#1e293b] flex flex-wrap items-center justify-between text-xs gap-2">
        <span className="text-[#00d9a5] font-bold">CAM-01 [OPTICAL-THERMAL]</span>
        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <span>RES: <strong className="text-white">640x480</strong></span>
          <span>|</span>
          <span>FPS: <strong className="text-[#ff6b35]">{fps}</strong></span>
          <span>|</span>
          <span>FRAME: <strong className="text-[#00d9a5]">{frameCount}</strong></span>
        </div>
      </div>

      {/* Stream Detections Section (Filtered strictly to FIRE & SMOKE) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-[#1e293b] pb-2">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Zap className="w-4 h-4 text-[#ff6b35]" /> STREAM DETECTIONS ({detections.length})
          </span>
          <span className="text-[10px] text-slate-500">FIRE / SMOKE CONFIDENCE</span>
        </div>

        {detections.length === 0 ? (
          <div className="p-3 rounded-lg bg-[#0a0e14] border border-[#1e293b] text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-600" /> No fire or smoke detected
          </div>
        ) : (
          <div className="space-y-2">
            {detections.map((item, idx) => {
              const confPct = Math.round(item.confidence * 100);
              const isFire = item.class.toLowerCase() === 'fire';

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#0a0e14] border border-[#1e293b] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isFire ? 'bg-[#ff2d55] animate-pulse' : 'bg-[#ffb020]'
                        }`}
                      />
                      <span
                        className={`font-extrabold uppercase tracking-wide ${
                          isFire ? 'text-[#ff2d55]' : 'text-[#ffb020]'
                        }`}
                      >
                        {item.class}
                      </span>
                    </div>

                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        isFire
                          ? 'bg-[#ff2d55]/20 text-[#ff2d55] border border-[#ff2d55]/40'
                          : 'bg-[#ffb020]/20 text-[#ffb020] border border-[#ffb020]/40'
                      }`}
                    >
                      {confPct}% CONFIDENCE
                    </span>
                  </div>

                  {/* Confidence Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFire ? 'bg-[#ff2d55] shadow-[0_0_8px_rgba(255,45,85,0.6)]' : 'bg-[#ffb020]'
                      }`}
                      style={{ width: `${confPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStream;
