/**
 * useFounderAgent Hook
 * React hook for interacting with the Founder Agent WebSocket
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { founderAgentClient, ConnectionState, AgentSession } from '@/api/founder/agentAPI';
import type {
  AgentDomain,
  ConnectedPayload,
  StateChangePayload,
  AgentResponsePayload,
  AgentTypingPayload,
  PersonaUpdatePayload,
  MilestonePayload,
  ErrorPayload
} from '@/api/founder/schemas';
import type {
  AgentThinkingPayload,
  AgentToolCallPayload,
  AgentToolResultPayload,
  AgentDiscoveriesPayload
} from '@/api/founder/agentAPI';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentName?: string;
  actions?: Array<{ type: string; data?: Record<string, unknown> }>;
}

/** Phase 4: Streaming agent activity events */
export type StreamingEventType = 'thinking' | 'tool_call' | 'tool_result' | 'discoveries';
export interface StreamingEvent {
  id: string;
  type: StreamingEventType;
  payload: AgentThinkingPayload | AgentToolCallPayload | AgentToolResultPayload | AgentDiscoveriesPayload;
  timestamp: Date;
}

export interface UseFounderAgentOptions {
  autoConnect?: boolean;
  onError?: (error: ErrorPayload) => void;
  /** Called when agent creates/updates a pursuit or track — use to refetch pursuits */
  onPursuitUpdated?: () => void;
  /** Called when founder.agent.discoveries arrives (background crawl) — use to invalidate discovery data */
  onRadarDiscoveryIngested?: (pursuitUUID: string) => void;
  /** Called with full payload when discoveries stream — use for live radar run progress UI */
  onRadarRunProgress?: (payload: AgentDiscoveriesPayload) => void;
}

export interface UseFounderAgentReturn {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  
  // Session state
  session: AgentSession | null;
  
  // Chat state
  messages: ChatMessage[];
  isTyping: boolean;
  /** Phase 4: Real-time streaming events (thinking, tool calls, discoveries) */
  streamingEvents: StreamingEvent[];
  
  // Persona state
  personaMetrics: Record<string, unknown>;
  
  // Milestones
  lastMilestone: MilestonePayload | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startSession: (domain: AgentDomain, goalId?: string) => Promise<void>;
  endSession: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendEvent: (type: string, data?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFounderAgent(options: UseFounderAgentOptions = {}): UseFounderAgentReturn {
  const { autoConnect = false, onError, onPursuitUpdated, onRadarDiscoveryIngested, onRadarRunProgress } = options;

  // Connection state - sync from client on mount (handles return-to-page when already connected)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    () => founderAgentClient.getConnectionState()
  );
  
  // Session state
  const [session, setSession] = useState<AgentSession | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingEvents, setStreamingEvents] = useState<StreamingEvent[]>([]);
  
  // Persona metrics
  const [personaMetrics, setPersonaMetrics] = useState<Record<string, unknown>>({});
  
  // Milestones
  const [lastMilestone, setLastMilestone] = useState<MilestonePayload | null>(null);

  // Track mounted state
  const isMounted = useRef(true);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleConnect = useCallback((payload: ConnectedPayload) => {
    if (!isMounted.current) return;
    console.log('[useFounderAgent] Connected:', payload.connection_id);
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    if (!isMounted.current) return;
    console.log('[useFounderAgent] Disconnected:', reason);
    setSession(null);
    setIsTyping(false);
  }, []);

  const handleStateChange = useCallback((payload: StateChangePayload) => {
    if (!isMounted.current) return;
    setSession((prev) => prev ? {
      ...prev,
      currentState: payload.current_state
    } : null);
  }, []);

  const handleAgentResponse = useCallback(
    (payload: AgentResponsePayload) => {
      if (!isMounted.current) return;

      const newMessage: ChatMessage = {
        id: payload.response_id,
        role: 'agent',
        content: payload.text,
        timestamp: new Date(),
        agentName: payload.agent_name,
        actions: payload.actions as ChatMessage['actions']
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
      setStreamingEvents([]); // Phase 4: clear streaming events when full response arrives

      if (onPursuitUpdated && payload.actions?.some((a) => a.type === 'pursuit_updated')) {
        onPursuitUpdated();
      }
    },
    [onPursuitUpdated]
  );

  const eventIdRef = useRef(0);
  const nextEventId = () => `evt-${++eventIdRef.current}-${Date.now()}`;

  const handleAgentThinking = useCallback((payload: AgentThinkingPayload) => {
    if (!isMounted.current) return;
    setStreamingEvents((prev) => [
      ...prev,
      { id: nextEventId(), type: 'thinking', payload, timestamp: new Date() }
    ]);
  }, []);

  const handleAgentToolCall = useCallback((payload: AgentToolCallPayload) => {
    if (!isMounted.current) return;
    // Debug: log tool calls (especially crawl_radar, create_milestone for milestone creation flow)
    console.log('[FounderAgent] tool_call:', payload.name, payload.arguments);
    setStreamingEvents((prev) => [
      ...prev,
      { id: nextEventId(), type: 'tool_call', payload, timestamp: new Date() }
    ]);
  }, []);

  const handleAgentToolResult = useCallback((payload: AgentToolResultPayload) => {
    if (!isMounted.current) return;
    // Debug: log tool results - crawl_radar should include aggregated_skill_gaps for milestone creation
    if (payload.name === 'crawl_radar') {
      try {
        const parsed = JSON.parse(payload.result || '{}');
        const gaps = parsed.aggregated_skill_gaps;
        console.log('[FounderAgent] crawl_radar result:', {
          discoveries_count: parsed.discoveries_count,
          aggregated_skill_gaps: gaps,
          has_skill_gaps: Array.isArray(gaps) && gaps.length > 0,
          raw_result_preview: payload.result?.slice(0, 200)
        });
        if (!gaps || gaps.length === 0) {
          console.warn('[FounderAgent] crawl_radar returned NO aggregated_skill_gaps — milestones will not be auto-created. Check: analyses table has skill_gaps? Resume uploaded with relevance enabled?');
        }
      } catch {
        console.log('[FounderAgent] crawl_radar result (parse failed):', payload.result?.slice(0, 300));
      }
    } else if (payload.name === 'create_milestone' || payload.name === 'create_milestones_from_skill_gaps') {
      console.log('[FounderAgent]', payload.name, 'result:', payload.result, payload.error);
    }
    setStreamingEvents((prev) => [
      ...prev,
      { id: nextEventId(), type: 'tool_result', payload, timestamp: new Date() }
    ]);
  }, []);

  const handleAgentDiscoveries = useCallback(
    (payload: AgentDiscoveriesPayload) => {
      if (!isMounted.current) return;
      setStreamingEvents((prev) => [
        ...prev,
        { id: nextEventId(), type: 'discoveries', payload, timestamp: new Date() }
      ]);
      onPursuitUpdated?.(); // Refetch pursuits so discoveries appear in pursuit cards
      onRadarDiscoveryIngested?.(payload.pursuit_uuid); // Invalidate discovery data for live updates
      onRadarRunProgress?.(payload); // Live radar run progress for Discover track
    },
    [onPursuitUpdated, onRadarDiscoveryIngested, onRadarRunProgress]
  );

  const handleAgentTyping = useCallback((payload: AgentTypingPayload) => {
    if (!isMounted.current) return;
    setIsTyping(payload.typing);
  }, []);

  const handlePersonaUpdate = useCallback((payload: PersonaUpdatePayload) => {
    if (!isMounted.current) return;
    setPersonaMetrics((prev) => ({
      ...prev,
      ...payload.metrics
    }));
  }, []);

  const handleMilestone = useCallback((payload: MilestonePayload) => {
    if (!isMounted.current) return;
    setLastMilestone(payload);
  }, []);

  const handleError = useCallback((payload: ErrorPayload) => {
    if (!isMounted.current) return;
    console.error('[useFounderAgent] Error:', payload);
    onError?.(payload);
  }, [onError]);

  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    if (!isMounted.current) return;
    setConnectionState(state);
  }, []);

  // ============================================================================
  // Actions
  // ============================================================================

  const connect = useCallback(async () => {
    try {
      await founderAgentClient.connect({
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onStateChange: handleStateChange,
        onAgentResponse: handleAgentResponse,
        onAgentTyping: handleAgentTyping,
        onPersonaUpdate: handlePersonaUpdate,
        onMilestone: handleMilestone,
        onError: handleError,
        onConnectionStateChange: handleConnectionStateChange,
        onAgentThinking: handleAgentThinking,
        onAgentToolCall: handleAgentToolCall,
        onAgentToolResult: handleAgentToolResult,
        onAgentDiscoveries: handleAgentDiscoveries
      });
    } catch (error) {
      console.error('[useFounderAgent] Connect failed:', error);
      throw error;
    }
  }, [
    handleConnect,
    handleDisconnect,
    handleStateChange,
    handleAgentResponse,
    handleAgentTyping,
    handlePersonaUpdate,
    handleMilestone,
    handleError,
    handleConnectionStateChange,
    handleAgentThinking,
    handleAgentToolCall,
    handleAgentToolResult,
    handleAgentDiscoveries
  ]);

  const disconnect = useCallback(() => {
    founderAgentClient.disconnect();
    setSession(null);
    setIsTyping(false);
  }, []);

  const startSession = useCallback(async (domain: AgentDomain, goalId?: string) => {
    const ack = await founderAgentClient.startSession(domain, goalId);
    if (ack.session_id) {
      setSession({
        sessionId: ack.session_id,
        domain,
        currentState: 'idle',
        goalId
      });
    }
  }, []);

  const endSession = useCallback(async () => {
    await founderAgentClient.endSession();
    setSession(null);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Send to server
    await founderAgentClient.sendChat(message);
  }, []);

  const sendEvent = useCallback(async (type: string, data?: Record<string, unknown>) => {
    // Extract known EventPayload fields to top level, rest goes to data
    const { item_type, item_id, duration_seconds, score, intensity, ...rest } = data || {};
    await founderAgentClient.sendEvent({
      type,
      item_type: item_type as string | undefined,
      item_id: item_id as string | undefined,
      duration_seconds: duration_seconds as number | undefined,
      score: score as number | undefined,
      intensity: intensity as number | undefined,
      data: Object.keys(rest).length > 0 ? rest : undefined
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Auto-connect on mount if enabled
  // Note: We DON'T auto-disconnect on cleanup to handle React StrictMode
  // The AgentChat component manages connect/disconnect lifecycle
  useEffect(() => {
    isMounted.current = true;
    
    if (autoConnect) {
      connect().catch(console.error);
    }

    return () => {
      isMounted.current = false;
      // Don't disconnect here - let the component manage the lifecycle
      // This prevents React StrictMode from killing connections
    };
  }, [autoConnect, connect]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Connection state
    connectionState,
    isConnected: connectionState === 'connected',
    
    // Session state
    session,
    
    // Chat state
    messages,
    isTyping,
    streamingEvents,
    
    // Persona state
    personaMetrics,
    
    // Milestones
    lastMilestone,
    
    // Actions
    connect,
    disconnect,
    startSession,
    endSession,
    sendMessage,
    sendEvent,
    clearMessages
  };
}

export default useFounderAgent;

