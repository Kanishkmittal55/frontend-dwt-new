/**
 * useTutorAgent Hook
 * WebSocket-based hook for real-time tutor agent communication
 * Handles intake, lesson generation, quizzes, and chat
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface TutorMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}

export interface SessionInfo {
  sessionId: string;
  currentState: string;
  courseId: string;
}

// Re-export types from schema file
export type {
  IntakeQuestion,
  IntakeProgress,
  LessonPayload
} from '@/api/founder/tutorWSSchemas';

export interface QuizPayload {
  quizId: string;
  quizType: string;
  purpose: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  questionId: string;
  question: string;
  questionType: string;
  options?: string[];
  points: number;
}

export interface QuizResult {
  quizId: string;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  feedback: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProgressPayload {
  courseId: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesCompleted: number;
  currentStreak: number;
  completionPercent: number;
}

export interface LessonCompletePrompt {
  lessonUUID: string;
  lessonTitle: string;
  promptType: string;
  message: string;
  nextChunkIdx: number;
  hasMoreContent: boolean;
}

export interface TutorState {
  isConnected: boolean;
  isConnecting: boolean;
  hasSession: boolean;
  currentState: string;
  sessionId: string | null;
  courseId: string | null;
  
  // LLM Configuration (from session start)
  llmProvider: string | null;
  llmModel: string | null;
  
  // Intake
  isIntakeActive: boolean;
  currentIntakeQuestion: IntakeQuestion | null;
  intakeProgress: IntakeProgress | null;
  intakeComplete: boolean;
  
  // Learning
  currentLesson: LessonPayload | null;
  isGeneratingLesson: boolean;
  lessonCompletePrompt: LessonCompletePrompt | null;
  
  // Quiz
  currentQuiz: QuizPayload | null;
  quizResult: QuizResult | null;
  
  // Chat
  messages: ChatMessage[];
  isTutorTyping: boolean;
  
  // Progress
  progress: ProgressPayload | null;
  
  // Canvas AI - when AI wants to write on canvas
  canvasAIWrite: CanvasAIWritePayload | null;
  
  // Canvas AI Status - feedback when AI doesn't respond
  canvasAIStatus: CanvasAIStatusPayload | null;
  
  // Canvas AI Context - debug info showing context/prompt sent to LLM
  canvasAIContext: CanvasAIContextPayload | null;
  
  // Errors
  error: string | null;
}

// Message types
const MSG_TYPES = {
  // Inbound (client → server)
  SESSION_START: 'tutor.session.start',
  SESSION_END: 'tutor.session.end',
  INTAKE_START: 'tutor.intake.start',
  INTAKE_ANSWER: 'tutor.intake.answer',
  INTAKE_COMPLETE: 'tutor.intake.complete',
  LESSON_REQUEST: 'tutor.lesson.request',
  LESSON_COMPLETE: 'tutor.lesson.complete',
  LESSON_SKIP: 'tutor.lesson.skip',
  LESSON_SELECT: 'tutor.lesson.select',
  LESSON_NEXT: 'tutor.lesson.next',
  QUIZ_START: 'tutor.quiz.start',
  QUIZ_ANSWER: 'tutor.quiz.answer',
  CHAT: 'tutor.chat',
  FEEDBACK: 'tutor.feedback',
  PROGRESS_GET: 'tutor.progress.get',
  CANVAS_TEXT_UPDATE: 'canvas.text_update', // User typed on canvas
  CANVAS_IDLE: 'canvas.idle', // User idle on canvas
  PING: 'ping',
  
  // Outbound (server → client)
  CONNECTED: 'connected',
  STATE_CHANGE: 'tutor.state.change',
  INTAKE_QUESTION: 'tutor.intake.question',
  INTAKE_PROGRESS: 'tutor.intake.progress',
  INTAKE_READY: 'tutor.intake.ready',
  LESSON_GENERATED: 'tutor.lesson.generated',
  LESSON_CONTENT: 'tutor.lesson.content',
  LESSON_COMPLETE_PROMPT: 'tutor.lesson.complete_prompt',
  TUTOR_RESPONSE: 'tutor.response',
  TUTOR_TYPING: 'tutor.typing',
  QUIZ_GENERATED: 'tutor.quiz.generated',
  QUIZ_RESULT: 'tutor.quiz.result',
  PROGRESS_UPDATE: 'tutor.progress.update',
  CANVAS_AI_WRITE: 'canvas.ai_write', // AI wants to write on canvas
  CANVAS_AI_STATUS: 'canvas.ai_status', // AI status update (thinking, rate limited, etc.)
  CANVAS_AI_CONTEXT: 'canvas.ai_context', // Debug: shows context/prompt sent to LLM
  ACK: 'ack',
  ERROR: 'error',
  PONG: 'pong'
};

// Canvas AI Write payload
export interface CanvasAIWritePayload {
  text: string;
  position?: { x: number; y: number };
  color?: 'black' | 'blue' | 'violet' | 'green' | 'red' | 'orange';
  typingSpeed?: number;
  size?: 's' | 'm' | 'l' | 'xl';
}

// Canvas AI Status payload - sent when AI doesn't respond to explain why
export type AIStatusType = 'thinking' | 'rate_limited' | 'ready' | 'need_more' | 'error' | 'duplicate';

export interface CanvasAIStatusPayload {
  status: AIStatusType;
  message: string;
  retry_after_ms?: number;
}

// Context message in conversation history
export interface ContextMessage {
  role: 'user' | 'assistant' | 'system' | 'summary';
  content: string;
  token_count: number;
}

// Canvas AI Context payload - debug info showing what was sent to LLM
export interface CanvasAIContextPayload {
  summaries: ContextMessage[];
  recent_messages: ContextMessage[];
  lesson_title?: string;
  lesson_content?: string;
  user_input: string;
  full_prompt: string;
  token_estimate: number;
  window_size: number;
  summarize_threshold: number;
  total_messages_in_db: number;
  summarized_count: number;
  timestamp: number;
}

// Import Zod-validated converters
import {
  parseIntakeQuestion,
  parseIntakeProgress,
  parseLessonPayload
} from '@/api/founder/tutorWSSchemas';

// ============================================================================
// Hook
// ============================================================================

interface UseTutorAgentOptions {
  apiKey: string;
  userId: number;
  courseId?: string;
  autoConnect?: boolean;
  wsBaseUrl?: string;
}

export function useTutorAgent({
  apiKey,
  userId,
  courseId: initialCourseId,
  autoConnect = false,
  wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
}: UseTutorAgentOptions) {
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [state, setState] = useState<TutorState>({
    isConnected: false,
    isConnecting: false,
    hasSession: false,
    currentState: 'tutor_idle',
    sessionId: null,
    courseId: initialCourseId || null,
    
    llmProvider: null,
    llmModel: null,
    
    isIntakeActive: false,
    currentIntakeQuestion: null,
    intakeProgress: null,
    intakeComplete: false,
    
    currentLesson: null,
    isGeneratingLesson: false,
    lessonCompletePrompt: null,
    
    currentQuiz: null,
    quizResult: null,
    
    messages: [],
    isTutorTyping: false,
    
    progress: null,
    canvasAIWrite: null,
    canvasAIStatus: null,
    canvasAIContext: null,
    error: null
  });

  // Send message helper
  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }
    
    const message = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    
    wsRef.current.send(JSON.stringify(message));
    return message.id;
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: TutorMessage = JSON.parse(event.data);
      
      // Only log important messages (skip ack, pong, etc)
      if (!['ack', 'pong', 'connected'].includes(message.type)) {
        console.log('[TutorAgent] ←', message.type);
      }
      
      switch (message.type) {
        case MSG_TYPES.CONNECTED:
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            error: null
          }));
          break;
          
        case MSG_TYPES.STATE_CHANGE:
          // Backend sends snake_case: current_state, session_id, llm_provider, llm_model
          setState(prev => ({
            ...prev,
            currentState: message.payload.current_state || message.payload.newState,
            hasSession: (message.payload.session_id ?? message.payload.sessionId) != null,
            sessionId: message.payload.session_id || message.payload.sessionId || prev.sessionId,
            // Capture LLM config from session start
            llmProvider: message.payload.llm_provider || prev.llmProvider,
            llmModel: message.payload.llm_model || prev.llmModel
          }));
          console.log('%c[TutorAgent] Session state updated', 'color: #4caf50', {
            hasSession: (message.payload.session_id ?? message.payload.sessionId) != null,
            sessionId: message.payload.session_id || message.payload.sessionId,
            state: message.payload.current_state || message.payload.newState,
            llmProvider: message.payload.llm_provider,
            llmModel: message.payload.llm_model
          });
          break;
          
        case MSG_TYPES.INTAKE_QUESTION:
          setState(prev => ({
            ...prev,
            isIntakeActive: true,
            currentIntakeQuestion: parseIntakeQuestion(message.payload)
          }));
          break;
          
        case MSG_TYPES.INTAKE_PROGRESS:
          // #region agent log
          const parsedProgress = parseIntakeProgress(message.payload);
          fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTutorAgent.ts:INTAKE_PROGRESS',message:'[DEBUG-B4] Received INTAKE_PROGRESS',data:{raw:message.payload,parsed:parsedProgress},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B4'})}).catch(()=>{});
          // #endregion
          setState(prev => ({
            ...prev,
            intakeProgress: parsedProgress
          }));
          break;
          
        case MSG_TYPES.INTAKE_READY:
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTutorAgent.ts:INTAKE_READY',message:'[DEBUG-C] Received INTAKE_READY, setting intakeComplete=true',data:{payload:message.payload},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          setState(prev => ({
            ...prev,
            isIntakeActive: false,
            intakeComplete: true,
            currentIntakeQuestion: null
          }));
          break;
          
        case MSG_TYPES.LESSON_GENERATED:
          setState(prev => ({
            ...prev,
            currentLesson: parseLessonPayload(message.payload),
            isGeneratingLesson: false
          }));
          break;
          
        case MSG_TYPES.LESSON_CONTENT:
          // Streaming content update
          setState(prev => ({
            ...prev,
            currentLesson: prev.currentLesson 
              ? { ...prev.currentLesson, content: prev.currentLesson.content + message.payload.chunk }
              : null
          }));
          break;
          
        case MSG_TYPES.LESSON_COMPLETE_PROMPT:
          console.log('[TutorAgent] LESSON_COMPLETE_PROMPT received:', message.payload);
          setState(prev => ({
            ...prev,
            lessonCompletePrompt: {
              lessonUUID: message.payload.lesson_uuid,
              lessonTitle: message.payload.lesson_title,
              promptType: message.payload.prompt_type,
              message: message.payload.message,
              nextChunkIdx: message.payload.next_chunk_idx,
              hasMoreContent: message.payload.has_more_content
            }
          }));
          break;
          
        case MSG_TYPES.TUTOR_RESPONSE:
          console.log('[TutorAgent] TUTOR_RESPONSE received, setting isTutorTyping=false', message.payload);
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: message.id,
              role: 'tutor',
              content: message.payload.text,
              timestamp: new Date(),
              metadata: message.payload.metadata
            }],
            isTutorTyping: false
          }));
          break;
          
        case MSG_TYPES.TUTOR_TYPING:
          // Backend sends { typing: bool }, not isTyping
          console.log('[TutorAgent] TUTOR_TYPING received, typing=', message.payload.typing);
          setState(prev => ({ ...prev, isTutorTyping: message.payload.typing ?? true }));
          break;
          
        case MSG_TYPES.QUIZ_GENERATED:
          setState(prev => ({
            ...prev,
            currentQuiz: message.payload,
            quizResult: null
          }));
          break;
          
        case MSG_TYPES.QUIZ_RESULT:
          setState(prev => ({
            ...prev,
            quizResult: message.payload,
            currentQuiz: null
          }));
          break;
          
        case MSG_TYPES.PROGRESS_UPDATE:
          setState(prev => ({ ...prev, progress: message.payload }));
          break;
        
        case MSG_TYPES.CANVAS_AI_WRITE:
          // AI wants to write on canvas - pass to CourseViewer to handle
          {
            const aiPayload = message.payload as CanvasAIWritePayload;
            console.log('%c[Canvas] 🤖 AI Response', 'color: #9c27b0; font-weight: bold; font-size: 12px', {
              text: aiPayload.text,
              position: aiPayload.position,
              color: aiPayload.color
            });
            // Clear any previous status when AI responds
            setState(prev => ({ ...prev, canvasAIWrite: aiPayload, canvasAIStatus: null }));
          }
          break;
          
        case MSG_TYPES.CANVAS_AI_STATUS:
          // AI status update (thinking, rate limited, need more content, etc.)
          {
            const statusPayload = message.payload as CanvasAIStatusPayload;
            // Only log if not 'ready' or 'duplicate' (less spammy)
            if (!['ready', 'duplicate'].includes(statusPayload.status)) {
              console.log('%c[Canvas] 📊 AI Status', 'color: #ff9800; font-weight: bold', {
                status: statusPayload.status,
                message: statusPayload.message,
                retryAfterMs: statusPayload.retry_after_ms
              });
            }
            setState(prev => ({ ...prev, canvasAIStatus: statusPayload }));
          }
          break;
          
        case MSG_TYPES.CANVAS_AI_CONTEXT:
          // Debug context info showing what was sent to the LLM
          {
            const contextPayload = message.payload as CanvasAIContextPayload;
            console.log('%c[Canvas] 🧠 AI Context', 'color: #2196f3; font-weight: bold; font-size: 12px', {
              recentMessages: contextPayload.recent_messages?.length || 0,
              summaries: contextPayload.summaries?.length || 0,
              tokenEstimate: contextPayload.token_estimate,
              lessonTitle: contextPayload.lesson_title
            });
            setState(prev => ({ ...prev, canvasAIContext: contextPayload }));
          }
          break;
          
        case MSG_TYPES.ERROR:
          setState(prev => ({ ...prev, error: message.payload.message }));
          break;
          
        case MSG_TYPES.PONG:
          // Heartbeat response
          break;
          
        default:
          // Ignore unknown message types (ack, pong, etc are handled silently)
          break;
      }
    } catch (err) {
      console.error('[TutorAgent] Failed to parse message:', err);
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback((courseId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[TutorAgent] Already connected');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[TutorAgent] Connection in progress');
      return;
    }
    
    setState(prev => {
      if (prev.isConnecting) {
        console.log('[TutorAgent] Already connecting (state)');
        return prev;
      }
      return { ...prev, isConnecting: true, error: null };
    });
    
    const targetCourseId = courseId || state.courseId;
    const wsUrl = `${wsBaseUrl}/v1/courses/tutor/ws?user_id=${userId}&x-api-key=${apiKey}${targetCourseId ? `&course_id=${targetCourseId}` : ''}`;
    
    console.log('[TutorAgent] Connecting to:', wsUrl.replace(apiKey, '***'));
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('[TutorAgent] Connected');
      wsRef.current = ws;
      
      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        sendMessage(MSG_TYPES.PING);
      }, 30000);
    };
    
    ws.onmessage = handleMessage;
    
    ws.onerror = (error) => {
      console.error('[TutorAgent] WebSocket error:', error);
      setState(prev => ({ ...prev, error: 'Connection error' }));
    };
    
    ws.onclose = (event) => {
      console.log('[TutorAgent] Disconnected:', event.code, event.reason);
      wsRef.current = null;
      
      // Clear intervals
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        hasSession: false
      }));
      
      // Auto-reconnect on abnormal close
      if (event.code !== 1000 && event.code !== 1001) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[TutorAgent] Attempting reconnect...');
          connect(targetCourseId || undefined);
        }, 3000);
      }
    };
  }, [userId, apiKey, wsBaseUrl, state.courseId, handleMessage, sendMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      hasSession: false
    }));
  }, []);

  // Start session
  const startSession = useCallback((courseId: string) => {
    setState(prev => ({ ...prev, courseId }));
    sendMessage(MSG_TYPES.SESSION_START, { course_id: courseId });
  }, [sendMessage]);

  // End session
  const endSession = useCallback(() => {
    sendMessage(MSG_TYPES.SESSION_END);
    setState(prev => ({
      ...prev,
      hasSession: false,
      sessionId: null,
      currentLesson: null,
      currentQuiz: null,
      messages: []
    }));
  }, [sendMessage]);

  // Start intake
  const startIntake = useCallback(() => {
    sendMessage(MSG_TYPES.INTAKE_START);
    setState(prev => ({ ...prev, isIntakeActive: true }));
  }, [sendMessage]);

  // Answer intake question
  const answerIntakeQuestion = useCallback((questionId: string, answer: any) => {
    sendMessage(MSG_TYPES.INTAKE_ANSWER, { question_id: questionId, answer });
  }, [sendMessage]);

  // Complete intake (skip remaining)
  const completeIntake = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTutorAgent.ts:completeIntake',message:'[DEBUG-B] Sending INTAKE_COMPLETE message',data:{msgType:MSG_TYPES.INTAKE_COMPLETE},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    sendMessage(MSG_TYPES.INTAKE_COMPLETE);
  }, [sendMessage]);

  // Request lesson
  const requestLesson = useCallback((chunkIndex?: number) => {
    setState(prev => ({ ...prev, isGeneratingLesson: true, currentLesson: null }));
    sendMessage(MSG_TYPES.LESSON_REQUEST, { chunk_index: chunkIndex });
  }, [sendMessage]);

  // Complete lesson
  const completeLesson = useCallback((lessonUUID: string, timeSpent: number, scrollDepth: number) => {
    sendMessage(MSG_TYPES.LESSON_COMPLETE, { lesson_uuid: lessonUUID, time_spent_secs: timeSpent, scroll_depth: scrollDepth });
  }, [sendMessage]);

  // Skip lesson
  const skipLesson = useCallback((lessonUUID: string, reason: string) => {
    sendMessage(MSG_TYPES.LESSON_SKIP, { lesson_uuid: lessonUUID, reason });
  }, [sendMessage]);

  // Start quiz
  const startQuiz = useCallback((quizType: string = 'knowledge', lessonUUID?: string) => {
    sendMessage(MSG_TYPES.QUIZ_START, { quiz_type: quizType, lesson_uuid: lessonUUID });
  }, [sendMessage]);

  // Answer quiz question
  const answerQuizQuestion = useCallback((quizId: string, questionId: string, answer: any) => {
    sendMessage(MSG_TYPES.QUIZ_ANSWER, { quiz_id: quizId, question_id: questionId, answer });
  }, [sendMessage]);

  // Send chat message
  const sendChat = useCallback(async (text: string) => {
    console.log('[TutorAgent] sendChat called, setting isTutorTyping=true');
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTutorTyping: true
    }));
    
    sendMessage(MSG_TYPES.CHAT, { message: text });
  }, [sendMessage]);

  const selectLesson = useCallback((lessonUUID: string) => {
    console.log('[TutorAgent] selectLesson:', lessonUUID);
    sendMessage(MSG_TYPES.LESSON_SELECT, { lesson_uuid: lessonUUID });
  }, [sendMessage]);

  // Request next lesson (skip quiz)
  const requestNextLesson = useCallback((lessonUUID: string, chunkIndex: number) => {
    console.log('[TutorAgent] requestNextLesson:', lessonUUID, 'chunk:', chunkIndex);
    setState(prev => ({
      ...prev,
      lessonCompletePrompt: null, // Clear the prompt
      isGeneratingLesson: true
    }));
    sendMessage(MSG_TYPES.LESSON_NEXT, { 
      lesson_uuid: lessonUUID, 
      skip_quiz: true,
      chunk_index: chunkIndex 
    });
  }, [sendMessage]);

  // Dismiss lesson complete prompt (e.g., user chose quiz)
  const dismissLessonPrompt = useCallback(() => {
    setState(prev => ({
      ...prev,
      lessonCompletePrompt: null
    }));
  }, []);

  // Submit feedback
  const submitFeedback = useCallback((type: string, rating: number, comment: string, targetId: string) => {
    sendMessage(MSG_TYPES.FEEDBACK, { type, rating, comment, target_id: targetId });
  }, [sendMessage]);

  // Get progress
  const getProgress = useCallback(() => {
    sendMessage(MSG_TYPES.PROGRESS_GET);
  }, [sendMessage]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // The hook uses a single setState for the entire state object, not individual setters.
  const setIntakeComplete = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, intakeComplete: value }));
  }, []);

  // ==========================================================================
  // Canvas Collaboration Methods
  // ==========================================================================

  // Send canvas text update (user typed on canvas)
  const sendCanvasText = useCallback((
    text: string, 
    position: { x: number; y: number }, 
    shapeId: string
  ) => {
    if (!state.isConnected) {
      console.warn('[Canvas] Cannot send text - not connected');
      return;
    }
    
    console.log('%c[Canvas] → Sending text to server', 'color: #9c27b0', text.substring(0, 50));
    sendMessage(MSG_TYPES.CANVAS_TEXT_UPDATE, {
      text,
      position_x: position.x,
      position_y: position.y,
      shape_id: shapeId
    });
  }, [sendMessage, state.isConnected]);

  // Send canvas idle signal (user idle for threshold)
  const sendCanvasIdle = useCallback((durationMs: number) => {
    if (!state.isConnected) return;
    
    console.log('%c[Canvas] → Sending idle signal', 'color: #2196f3', `${(durationMs/1000).toFixed(0)}s`);
    sendMessage(MSG_TYPES.CANVAS_IDLE, {
      idle_duration_ms: durationMs
    });
  }, [sendMessage, state.isConnected]);

  // Clear canvas AI write state after processing
  const clearCanvasAIWrite = useCallback(() => {
    setState(prev => ({ ...prev, canvasAIWrite: null }));
  }, []);

  // Clear canvas AI status state
  const clearCanvasAIStatus = useCallback(() => {
    setState(prev => ({ ...prev, canvasAIStatus: null }));
  }, []);

  // Clear canvas AI context state
  const clearCanvasAIContext = useCallback(() => {
    setState(prev => ({ ...prev, canvasAIContext: null }));
  }, []);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && userId && apiKey) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, userId, apiKey]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    startSession,
    endSession,
    startIntake,
    answerIntakeQuestion,
    completeIntake,
    requestLesson,
    completeLesson,
    skipLesson,
    startQuiz,
    answerQuizQuestion,
    sendChat,
    selectLesson,
    requestNextLesson,
    dismissLessonPrompt,
    submitFeedback,
    getProgress,
    clearError,
    setIntakeComplete,
    // Canvas collaboration
    sendCanvasText,
    sendCanvasIdle,
    clearCanvasAIWrite,
    clearCanvasAIStatus,
    clearCanvasAIContext
  };
}

export default useTutorAgent;

