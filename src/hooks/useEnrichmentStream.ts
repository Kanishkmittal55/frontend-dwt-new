/**
 * useEnrichmentStream - SSE hook for real-time enrichment updates
 * 
 * Connects to backend SSE endpoint and streams enrichment progress.
 * Auto-reconnects on disconnect, auto-closes on completion.
 * 
 * Backend endpoint needed: GET /v1/founder/ideas/{uuid}/enrichment/stream
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { EnrichmentStatus } from '@/api/founder/schemas';
import { getStoredToken } from '@/api/founder/founderClient';

// ============================================================================
// Types
// ============================================================================

export type StreamState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'completed';

export interface UseEnrichmentStreamOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Reconnect delay in ms (default: 2000) */
  reconnectDelay?: number;
  /** Callback when status updates */
  onStatusUpdate?: (status: EnrichmentStatus) => void;
  /** Callback when enrichment completes */
  onComplete?: (status: EnrichmentStatus) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseEnrichmentStreamResult {
  /** Current enrichment status */
  status: EnrichmentStatus | null;
  /** Stream connection state */
  streamState: StreamState;
  /** Error if any */
  error: Error | null;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Is currently streaming */
  isStreaming: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_FOUNDER_API_URL || 'http://localhost:8000';

const DEFAULT_OPTIONS: Required<UseEnrichmentStreamOptions> = {
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,
  onStatusUpdate: () => {},
  onComplete: () => {},
  onError: () => {}
};

// Terminal states - stop streaming when reached
const TERMINAL_STATES = ['completed', 'failed', 'blocked'];

// ============================================================================
// Hook
// ============================================================================

export function useEnrichmentStream(
  ideaUUID: string | null,
  options: UseEnrichmentStreamOptions = {}
): UseEnrichmentStreamResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [status, setStatus] = useState<EnrichmentStatus | null>(null);
  const [streamState, setStreamState] = useState<StreamState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    cleanup();
    setStreamState('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [cleanup]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!ideaUUID) {
      console.warn('[useEnrichmentStream] No ideaUUID provided');
      return;
    }

    // Close existing connection
    cleanup();

    setStreamState('connecting');
    setError(null);

    // Build URL with auth token as query param (SSE doesn't support custom headers)
    const token = getStoredToken();
    const url = new URL(`${API_BASE_URL}/v1/founder/ideas/${ideaUUID}/enrichment/stream`);
    if (token) {
      url.searchParams.set('token', token);
    }

    console.log('[useEnrichmentStream] Connecting to:', url.toString());

    try {
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[useEnrichmentStream] Connected');
        setStreamState('connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as EnrichmentStatus;
          console.log('[useEnrichmentStream] Received:', data.state, data.progress_pct + '%');
          
          setStatus(data);
          opts.onStatusUpdate(data);

          // Check for terminal state
          if (TERMINAL_STATES.includes(data.state)) {
            console.log('[useEnrichmentStream] Terminal state reached:', data.state);
            setStreamState('completed');
            opts.onComplete(data);
            cleanup();
          }
        } catch (parseError) {
          console.error('[useEnrichmentStream] Failed to parse message:', event.data);
        }
      };

      eventSource.onerror = (event) => {
        console.error('[useEnrichmentStream] Error:', event);
        
        // EventSource auto-reconnects, but we track state
        if (eventSource.readyState === EventSource.CLOSED) {
          setStreamState('disconnected');
          
          // Attempt reconnect if enabled
          if (opts.autoReconnect && reconnectAttemptsRef.current < opts.maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            console.log(`[useEnrichmentStream] Reconnecting (${reconnectAttemptsRef.current}/${opts.maxReconnectAttempts})...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, opts.reconnectDelay);
          } else if (reconnectAttemptsRef.current >= opts.maxReconnectAttempts) {
            const err = new Error('Max reconnect attempts reached');
            setError(err);
            setStreamState('error');
            opts.onError(err);
          }
        }
      };

      // Handle specific event types (optional)
      eventSource.addEventListener('status', (event) => {
        try {
          const data = JSON.parse(event.data) as EnrichmentStatus;
          setStatus(data);
          opts.onStatusUpdate(data);
        } catch (e) {
          console.error('[useEnrichmentStream] Failed to parse status event');
        }
      });

      eventSource.addEventListener('complete', (event) => {
        try {
          const data = JSON.parse(event.data) as EnrichmentStatus;
          setStatus(data);
          setStreamState('completed');
          opts.onComplete(data);
          cleanup();
        } catch (e) {
          console.error('[useEnrichmentStream] Failed to parse complete event');
        }
      });

      eventSource.addEventListener('error', (event) => {
        console.error('[useEnrichmentStream] Server error event:', event);
        const err = new Error('Server reported an error');
        setError(err);
        opts.onError(err);
      });

    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create EventSource');
      console.error('[useEnrichmentStream] Failed to connect:', err);
      setError(err);
      setStreamState('error');
      opts.onError(err);
    }
  }, [ideaUUID, opts, cleanup]);

  // Auto-connect on mount
  useEffect(() => {
    if (opts.autoConnect && ideaUUID) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [ideaUUID, opts.autoConnect, connect, cleanup]);

  return {
    status,
    streamState,
    error,
    connect,
    disconnect,
    isStreaming: streamState === 'connecting' || streamState === 'connected'
  };
}

// ============================================================================
// Polling Fallback Hook (for browsers without SSE or when SSE fails)
// ============================================================================

export interface UseEnrichmentPollingOptions {
  /** Polling interval in ms (default: 3000) */
  interval?: number | undefined;
  /** Auto-start polling (default: true) */
  autoStart?: boolean | undefined;
  /** Callback when status updates */
  onStatusUpdate?: ((status: EnrichmentStatus) => void) | undefined;
  /** Callback when enrichment completes */
  onComplete?: ((status: EnrichmentStatus) => void) | undefined;
}

export function useEnrichmentPolling(
  ideaUUID: string | null,
  options: UseEnrichmentPollingOptions = {}
): UseEnrichmentStreamResult {
  const { 
    interval = 3000, 
    autoStart = true,
    onStatusUpdate,
    onComplete
  } = options;

  const [status, setStatus] = useState<EnrichmentStatus | null>(null);
  const [streamState, setStreamState] = useState<StreamState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreamState('disconnected');
  }, []);

  const poll = useCallback(async () => {
    if (!ideaUUID) return;

    try {
      const { getEnrichmentStatus } = await import('@/api/founder/enrichmentAPI');
      const data = await getEnrichmentStatus(ideaUUID);
      
      setStatus(data);
      onStatusUpdate?.(data);

      if (TERMINAL_STATES.includes(data.state)) {
        setStreamState('completed');
        onComplete?.(data);
        stopPolling();
      }
    } catch (e) {
      console.error('[useEnrichmentPolling] Poll failed:', e);
      setError(e instanceof Error ? e : new Error('Poll failed'));
    }
  }, [ideaUUID, onStatusUpdate, onComplete, stopPolling]);

  const startPolling = useCallback(() => {
    if (!ideaUUID) return;
    
    setStreamState('connected');
    setError(null);
    
    // Initial poll
    poll();
    
    // Start interval
    intervalRef.current = setInterval(poll, interval);
  }, [ideaUUID, interval, poll]);

  useEffect(() => {
    if (autoStart && ideaUUID) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [ideaUUID, autoStart, startPolling, stopPolling]);

  return {
    status,
    streamState,
    error,
    connect: startPolling,
    disconnect: stopPolling,
    isStreaming: streamState === 'connected'
  };
}

// ============================================================================
// Smart Hook (tries SSE, falls back to polling)
// ============================================================================

export function useEnrichmentUpdates(
  ideaUUID: string | null,
  options: UseEnrichmentStreamOptions & { fallbackToPolling?: boolean } = {}
): UseEnrichmentStreamResult {
  const { fallbackToPolling = true, ...sseOptions } = options;
  
  const sseResult = useEnrichmentStream(ideaUUID, {
    ...sseOptions,
    autoConnect: true
  });

  const pollingResult = useEnrichmentPolling(ideaUUID, {
    interval: 3000,
    autoStart: false, // Only start if SSE fails
    onStatusUpdate: sseOptions.onStatusUpdate,
    onComplete: sseOptions.onComplete
  });

  // Fall back to polling if SSE errors
  useEffect(() => {
    if (fallbackToPolling && sseResult.streamState === 'error') {
      console.log('[useEnrichmentUpdates] SSE failed, falling back to polling');
      pollingResult.connect();
    }
  }, [sseResult.streamState, fallbackToPolling, pollingResult]);

  // Return SSE result unless it errored and polling is active
  if (sseResult.streamState === 'error' && pollingResult.isStreaming) {
    return pollingResult;
  }

  return sseResult;
}

export default useEnrichmentStream;

