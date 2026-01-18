/**
 * Founder Agent WebSocket API
 * Real-time bi-directional communication with the Founder Agent
 */
import {
  AgentMessage,
  AgentDomain,
  SessionStartPayload,
  ChatPayload,
  SignalPayload,
  ConnectedPayload,
  StateChangePayload,
  AgentResponsePayload,
  AgentTypingPayload,
  PersonaUpdatePayload,
  MilestonePayload,
  AckPayload,
  ErrorPayload,
  AgentMessageSchema,
  safeParseApiResponse
} from './schemas';
import { getStoredUserId } from './founderClient';

// ============================================================================
// Configuration
// ============================================================================

const WS_BASE_URL = import.meta.env.VITE_FOUNDER_WS_URL || 'ws://localhost:8000';
const API_KEY = import.meta.env.VITE_FOUNDER_API_KEY || 'test-all-access-key';

// Simple UUID generator (no external dependency)
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface AgentSession {
  sessionId: string;
  domain: AgentDomain;
  currentState: string;
  goalId?: string | undefined;
}

export interface AgentEventHandlers {
  onConnect?: (payload: ConnectedPayload) => void;
  onDisconnect?: (reason: string) => void;
  onStateChange?: (payload: StateChangePayload) => void;
  onAgentResponse?: (payload: AgentResponsePayload) => void;
  onAgentTyping?: (payload: AgentTypingPayload) => void;
  onPersonaUpdate?: (payload: PersonaUpdatePayload) => void;
  onMilestone?: (payload: MilestonePayload) => void;
  onAck?: (payload: AckPayload) => void;
  onError?: (payload: ErrorPayload) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

// ============================================================================
// WebSocket Client
// ============================================================================

class FounderAgentClient {
  private ws: WebSocket | null = null;
  private handlers: AgentEventHandlers = {};
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pendingAcks: Map<string, (ack: AckPayload) => void> = new Map();

  /**
   * Connect to the Founder Agent WebSocket
   */
  connect(handlers: AgentEventHandlers = {}): Promise<ConnectedPayload> {
    return new Promise((resolve, reject) => {
      // Already connected or connecting - don't create new connection
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        console.log('[AgentWS] Already connected/connecting, skipping');
        resolve({ user_id: 0, session_id: '' }); // Return placeholder
        return;
      }

      const userId = getStoredUserId();
      if (!userId) {
        reject(new Error('User not authenticated'));
        return;
      }

      this.handlers = handlers;
      this.setConnectionState('connecting');

      const wsUrl = `${WS_BASE_URL}/v1/founder/agent/ws?user_id=${userId}&x-api-key=${API_KEY}`;
      
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        this.setConnectionState('disconnected');
        reject(error);
        return;
      }

      this.ws.onopen = () => {
        console.log('[AgentWS] Connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message = safeParseApiResponse(AgentMessageSchema, data);
          
          if (!message) {
            console.error('[AgentWS] Invalid message format:', data);
            return;
          }

          this.handleMessage(message, resolve);
        } catch (error) {
          console.error('[AgentWS] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[AgentWS] Error:', error);
        this.handlers.onError?.({
          code: 0,
          message: 'WebSocket error'
        });
      };

      this.ws.onclose = (event) => {
        console.log('[AgentWS] Disconnected:', event.code, event.reason);
        this.stopPingInterval();
        this.setConnectionState('disconnected');
        this.handlers.onDisconnect?.(event.reason || 'Connection closed');

        // Only attempt reconnect if:
        // 1. Not a clean close (1000)
        // 2. Not an auth error (4001, 4003)
        // 3. Under max attempts
        // 4. Was previously connected (not initial connection failure)
        const shouldReconnect = 
          event.code !== 1000 && 
          event.code !== 4001 && 
          event.code !== 4003 &&
          event.code !== 1006 && // Connection failed - don't retry immediately
          this.reconnectAttempts < this.maxReconnectAttempts;

        if (shouldReconnect) {
          this.attemptReconnect();
        }
      };
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  /**
   * Start a new agent session
   */
  async startSession(domain: AgentDomain, goalId?: string): Promise<AckPayload> {
    const payload: SessionStartPayload = { domain, goal_id: goalId };
    return this.sendWithAck('session.start', payload);
  }

  /**
   * End the current session
   */
  async endSession(): Promise<AckPayload> {
    return this.sendWithAck('session.end', null);
  }

  /**
   * Send a chat message
   */
  async sendChat(message: string): Promise<AckPayload> {
    const payload: ChatPayload = { message };
    return this.sendWithAck('chat', payload);
  }

  /**
   * Send a signal
   */
  async sendSignal(signal: SignalPayload): Promise<AckPayload> {
    return this.sendWithAck('signal', signal);
  }

  /**
   * Send ping (keep-alive)
   */
  sendPing(): void {
    this.send('ping', null);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private send(type: string, payload: unknown): string {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const id = generateId();
    const message: AgentMessage = {
      id,
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(message));
    return id;
  }

  private sendWithAck(type: string, payload: unknown): Promise<AckPayload> {
    return new Promise((resolve, reject) => {
      try {
        const id = this.send(type, payload);
        
        // Set timeout for ack
        const timeout = setTimeout(() => {
          this.pendingAcks.delete(id);
          reject(new Error(`Timeout waiting for ack: ${type}`));
        }, 30000); // 30s timeout for LLM responses

        this.pendingAcks.set(id, (ack) => {
          clearTimeout(timeout);
          this.pendingAcks.delete(id);
          if (ack.status === 'ok') {
            resolve(ack);
          } else {
            reject(new Error(ack.error || 'Request failed'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: AgentMessage, onConnectResolve?: (payload: ConnectedPayload) => void): void {
    const { type, payload } = message;

    switch (type) {
      case 'connected':
        this.setConnectionState('connected');
        const connectedPayload = payload as ConnectedPayload;
        this.handlers.onConnect?.(connectedPayload);
        onConnectResolve?.(connectedPayload);
        break;

      case 'state.change':
        this.handlers.onStateChange?.(payload as StateChangePayload);
        break;

      case 'agent.response':
        this.handlers.onAgentResponse?.(payload as AgentResponsePayload);
        break;

      case 'agent.typing':
        this.handlers.onAgentTyping?.(payload as AgentTypingPayload);
        break;

      case 'persona.update':
        this.handlers.onPersonaUpdate?.(payload as PersonaUpdatePayload);
        break;

      case 'milestone':
        this.handlers.onMilestone?.(payload as MilestonePayload);
        break;

      case 'ack':
        const ackPayload = payload as AckPayload;
        const ackHandler = this.pendingAcks.get(ackPayload.ref);
        if (ackHandler) {
          ackHandler(ackPayload);
        }
        this.handlers.onAck?.(ackPayload);
        break;

      case 'error':
        this.handlers.onError?.(payload as ErrorPayload);
        break;

      case 'pong':
        // Keep-alive response, no action needed
        break;

      default:
        console.warn('[AgentWS] Unknown message type:', type);
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.handlers.onConnectionStateChange?.(state);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      }
    }, 30000); // Ping every 30s
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[AgentWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.connectionState === 'reconnecting') {
        this.connect(this.handlers).catch((error) => {
          console.error('[AgentWS] Reconnect failed:', error);
        });
      }
    }, delay);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const founderAgentClient = new FounderAgentClient();
export default founderAgentClient;

