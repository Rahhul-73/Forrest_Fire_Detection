import { useState, useEffect, useRef } from 'react';

export function useWebSocket(path = '/ws/live') {
  const [status, setStatus] = useState('CONNECTING');
  const [latest, setLatest] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      setStatus('CONNECTING');

      // Use VITE_WS_URL environment variable if present, else fallback to window.location
      let wsUrl = '';
      if (import.meta.env.VITE_WS_URL) {
        const baseWs = import.meta.env.VITE_WS_URL.replace(/\/$/, '');
        wsUrl = `${baseWs}${path}`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}${path}`;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setStatus('LIVE');
          console.log('[useWebSocket] Connected to:', wsUrl);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setLatest(data);
          } catch (err) {
            console.error('[useWebSocket] Error parsing JSON:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setStatus('DISCONNECTED');
          console.warn('[useWebSocket] Connection closed. Retrying in 3s...');
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          if (!isMounted) return;
          setStatus('DISCONNECTED');
          console.error('[useWebSocket] WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        if (!isMounted) return;
        setStatus('DISCONNECTED');
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [path]);

  return { latest, status };
}
