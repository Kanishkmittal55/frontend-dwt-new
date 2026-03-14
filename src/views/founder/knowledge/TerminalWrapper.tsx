/**
 * TerminalWrapper — xterm.js wrapper that connects to ttyd's WebSocket.
 * Loaded in iframe for domain knowledge assessment. Accepts postMessage
 * with type 'terminal_input' to inject commands (e.g. from agent).
 */
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

/** ttyd exposes WebSocket at /ws, not at root. Requires subprotocol 'tty'. */
function wsUrlFromHttpUrl(httpUrl: string): string {
  const base = httpUrl.replace(/^http/, 'ws').replace(/\/$/, '');
  return `${base}/ws`;
}

/** ttyd protocol: first byte = command. OUTPUT='0', INPUT='0', RESIZE='1', etc. */
const TTYD = {
  OUTPUT: 0x30,
  INPUT: 0x30,
  RESIZE: 0x31
} as const;

export default function TerminalWrapper() {
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendInputRef = useRef<((data: string) => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const url = searchParams.get('url');

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const wsUrl = wsUrlFromHttpUrl(url);
    setError(null);

    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);
    fitAddon.fit();
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Focus terminal so keyboard input works (critical for iframe embedding)
    term.focus();

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl, ['tty']);
        ws.binaryType = 'arraybuffer'; // ttyd sends PTY output as binary
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setError(null);
          const cols = term.cols;
          const rows = term.rows;
          const initMsg = JSON.stringify({ AuthToken: '', columns: cols, rows });
          ws.send(new TextEncoder().encode(initMsg));
          term.focus();
        };

        ws.onmessage = (evt) => {
          const t = termRef.current;
          if (!t) return;

          const raw = evt.data;
          const isArrayBuffer = raw instanceof ArrayBuffer;
          const isString = typeof raw === 'string';
          const len = isArrayBuffer ? raw.byteLength : isString ? raw.length : 0;

          if (isArrayBuffer && len > 0) {
            const arr = new Uint8Array(raw);
            const cmd = arr[0] ?? -1;
            const payload = arr.slice(1);
            if (cmd === TTYD.OUTPUT) {
              t.write(payload);
            }
            // SET_WINDOW_TITLE (0x31), SET_PREFERENCES (0x32) — ignore
          } else if (isString) {
            t.write(raw);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          wsRef.current = null;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (termRef.current && containerRef.current) connect();
          }, 2000);
        };

        ws.onerror = () => {
          setError('WebSocket connection failed');
        };

        const textEncoder = new TextEncoder();
        const sendInput = (data: string) => {
          const payload = new Uint8Array(data.length * 3 + 1);
          payload[0] = TTYD.INPUT;
          const written = textEncoder.encodeInto(data, payload.subarray(1)).written ?? 0;
          ws.send(payload.subarray(0, written + 1));
        };
        sendInputRef.current = sendInput;

        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) sendInput(data);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    };

    connect();

    const handleResize = () => {
      fitAddon.fit();
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN && termRef.current) {
        const { cols, rows } = termRef.current;
        const msg = String.fromCharCode(TTYD.RESIZE) + JSON.stringify({ columns: cols, rows });
        ws.send(new TextEncoder().encode(msg));
      }
    };
    term.onResize(handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sendInputRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    const handler = (evt: MessageEvent) => {
      const data = evt.data;
      if (data?.type === 'terminal_input' && typeof data.command === 'string') {
        const send = sendInputRef.current;
        const ws = wsRef.current;
        if (send && ws?.readyState === WebSocket.OPEN) send(data.command);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!url) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Missing url parameter. Use ?url=http://localhost:PORT</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const handleContainerClick = () => {
    termRef.current?.focus();
  };

  return (
    <Box
      onClick={handleContainerClick}
      onMouseDown={handleContainerClick}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        bgcolor: '#1e1e1e',
        p: 1,
        cursor: 'text',
        '& .xterm': { height: '100%' },
        '& .xterm-viewport': { overflow: 'auto !important' }
      }}
    >
      {!connected && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Connecting...
        </Typography>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: connected ? '100%' : 'calc(100% - 24px)' }}
      />
    </Box>
  );
}
