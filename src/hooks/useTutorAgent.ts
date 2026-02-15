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
  
  // Canvas Clear Context - result of clearing conversation history
  canvasClearResult: CanvasClearResultPayload | null;
  
  // Canvas Selection - result of saving a concept/confusion point
  selectionResult: SelectionResultPayload | null;
  
  // Lesson Score - scores after ending a lesson
  lessonScore: LessonScorePayload | null;
  
  // Revision System - spaced repetition queue
  revisionQueue: RevisionQueueItem[];
  revisionStats: RevisionStatsPayload | null;
  revisionReviewResult: RevisionReviewResultPayload | null;
  isLoadingRevision: boolean;
  
  // Active Review Session state
  activeReviewSession: ActiveReviewSession | null;
  currentReviewItem: RevisionQueueItem | null;
  
  // Learning Items Management
  learningItems: LearningItemWithContext[];
  learningItemsCourses: CourseFilterOption[];
  learningItemsTotal: number;
  learningItemsLoading: boolean;
  learningItemDeleteResult: LearningItemDeleteResultPayload | null;
  learningItemDetail: LearningItemDetailResponsePayload | null;
  learningItemDetailLoading: boolean;
  
  // Calendar System
  calendarDays: CalendarDay[];
  calendarZones: CalendarZone[];
  calendarLoading: boolean;
  rescheduleResult: RescheduleResultPayload | null;
  livingTimeStats: LivingTimeStats | null;
  
  // Agent Console (concept vetting)
  vetMessages: VetMessage[];
  isVetConsoleOpen: boolean;
  vetConceptText: string | null;
  isAgentThinking: boolean;
  vetVerdict: VetVerdict | null;
  
  // Errors
  error: string | null;
}

// ============================================================================
// Revision System Types
// ============================================================================

/** Single item in the revision queue */
export interface RevisionQueueItem {
  itemUUID: string;
  itemType: string;        // 'concept' or 'confusion'
  itemTitle?: string;
  conceptText: string;
  priority: number;        // 1=first review, 2=regular, 3=mastered
  masteryState: string;    // new, learning, mastered, graduated
  totalReviews: number;
  sourceLessonUUID?: string;
  difficultyRating?: number;

  // LLM-generated content for concepts (active recall)
  reviewQuestion?: string;   // Active recall question
  reviewAnswer?: string;     // Expected answer
  keyInsight?: string;       // Core "aha!" moment

  // MCQ question (Phase 1.4)
  mcqQuestion?: string;
  mcqOptions?: string[];
  mcqCorrectIdx?: number;
  mcqExplanation?: string;

  // Application question (Phase 1.4)
  applicationQuestion?: string;
  applicationAnswer?: string;
  applicationHint?: string;

  // LLM-generated content for confusion points
  clarificationAnswer?: string;  // LLM explanation
  followUpCheck?: string;        // Verify understanding
  relatedConcepts?: string[];    // For interleaving
}

/** Revision queue response from server */
export interface RevisionQueuePayload {
  items: RevisionQueueItem[];
  totalDue: number;
  firstReviews: number;
  mastered: number;
}

/** Revision stats */
export interface RevisionStatsPayload {
  totalActive: number;
  dueToday: number;
  firstReviews: number;
  masteredItems: number;
  pendingVetting: number;
  retentionCoeff: number;
}

/** Review submission result */
export interface RevisionReviewResultPayload {
  itemUUID: string;
  success: boolean;
  newInterval: number;
  newEaseFactor: number;
  masteryState: string;
  nextReviewAt: string;
  message: string;
}

/** Session started response from backend */
export interface RevisionSessionStartedPayload {
  sessionUUID: string;
  itemUUID: string;
  sessionNumber: number;
  startedAt: string;
}

/** Active review session state */
export interface ActiveReviewSession {
  sessionUUID: string;
  itemUUID: string;
  sessionNumber: number;
  startedAt: Date;
  isTypingAnswer: boolean;
  founderAnswer: string;
  confidenceBefore: number;
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
  CANVAS_SELECTION: 'canvas.selection', // User wants to save selection as concept/confusion
  CANVAS_LESSON_END: 'canvas.lesson_end', // User ends lesson session
  CANVAS_CLEAR_CONTEXT: 'canvas.clear_context', // Clear conversation history
  // Revision System
  REVISION_QUEUE_REQUEST: 'revision.queue.request',
  REVISION_SESSION_START: 'revision.session.start', // Start timing for a card
  REVISION_REVIEW: 'revision.review',
  REVISION_STATS_REQUEST: 'revision.stats.request',
  REVISION_VET_REQUEST: 'revision.vet.request',
  // Learning Items Management
  LEARNING_ITEMS_LIST: 'revision.items.list',
  LEARNING_ITEM_DELETE: 'revision.item.delete',
  LEARNING_ITEM_DETAIL: 'revision.item.detail',
  // Calendar System
  CALENDAR_REQUEST: 'calendar.request',
  SLOT_RESCHEDULE: 'calendar.reschedule',
  // Agent Loop Control (client → server)
  LOOP_INJECT: 'tutor.loop.inject',
  LOOP_STOP: 'tutor.loop.stop',
  // Profile Schedule
  PROFILE_SCHEDULE_UPDATE: 'profile.schedule.update',
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
  CANVAS_CLEAR_RESULT: 'canvas.clear_result', // Result of clearing context
  SELECTION_RESULT: 'tutor.selection.result', // Response after saving selection
  LESSON_SCORE: 'tutor.lesson.score', // Final scores after ending lesson
  // Revision System responses
  REVISION_QUEUE_RESPONSE: 'revision.queue.response',
  REVISION_SESSION_STARTED: 'revision.session.started', // Session timing started
  REVISION_REVIEW_RESULT: 'revision.review.result',
  REVISION_STATS_RESPONSE: 'revision.stats.response',
  REVISION_VET_RESULT: 'revision.vet.result',
  // Learning Items Management responses
  LEARNING_ITEMS_LIST_RESPONSE: 'revision.items.response',
  LEARNING_ITEM_DELETE_RESULT: 'revision.item.deleted',
  LEARNING_ITEM_DETAIL_RESPONSE: 'revision.item.detail.response',
  // Calendar System responses
  CALENDAR_RESPONSE: 'calendar.response',
  PROFILE_SCHEDULE_UPDATED: 'profile.schedule.updated',
  // Agent Console / Loop events (server → client)
  VET_MESSAGE: 'tutor.vet.message',
  TUTOR_THINKING: 'tutor.thinking',
  LOOP_DONE: 'tutor.loop.done',
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

// Canvas Clear Context result payload
export interface CanvasClearResultPayload {
  success: boolean;
  message: string;
  deleted_count: number;
  lesson_uuid: string;
}

// ============================================================================
// Canvas Selection Types (for saving concepts/confusion points)
// ============================================================================

/** Action types for canvas selection */
export type SelectionActionType = 'save_concept' | 'mark_confusion' | 'explain' | 'relate';

/** Payload sent when user wants to save a selection */
export interface CanvasSelectionPayload {
  text: string;
  action: SelectionActionType;
  annotation?: string;
  source_type?: 'lesson' | 'notes' | 'ai_response';
  lesson_uuid?: string;
  position?: { x: number; y: number };
  view_mode?: 'static' | 'interactive';
}

/** Response from server after selection is saved */
export interface SelectionResultPayload {
  action: SelectionActionType;
  success: boolean;
  item_uuid?: string;
  item_type?: string;
  next_review_at?: string;
  message?: string;
}

// ============================================================================
// Agent Console Types (concept vetting)
// ============================================================================

/** A single message in the Agent Console conversation */
export interface VetMessage {
  id: string;
  text: string;
  role: 'agent' | 'system' | 'user';
  iteration: number;
  timestamp: Date;
}

/** Final verdict after concept vetting loop concludes */
export interface VetVerdict {
  reason: string;       // 'finished' | 'stopped' | 'max_iterations' | 'timeout' | 'error'
  iterations: number;
  finalContent: string; // Raw JSON from finish tool
}

/** Payload for tutor.vet.message from backend */
interface VetMessagePayload {
  text: string;
  iteration: number;
  role: 'agent' | 'system';
}

/** Payload for tutor.loop.done from backend */
interface LoopDonePayload {
  reason: string;
  iterations: number;
  final_content: string;
}

/** Payload for ending a lesson session */
export interface LessonEndPayload {
  lesson_uuid: string;
  time_spent_seconds: number;
  energy_level?: number; // 1-5 self-reported
}

/** Scores returned after ending a lesson */
export interface LessonScorePayload {
  lesson_uuid: string;
  understanding_score: number; // 0-10
  difficulty_score: number;    // 0-10
  ease_factor: number;         // SM-2 ease factor
  interval_days: number;       // Days until next review
  concepts_captured: number;
  confusion_points: number;
  time_spent_minutes: number;
}

// ============================================================================
// Learning Items Management Types (Daily Tasks Dashboard)
// ============================================================================

/** A learning item with full course/lesson/module context */
export interface LearningItemWithContext {
  item_uuid: string;
  item_type: string;
  item_title?: string;
  concept_text: string;
  annotation?: string;
  source_type?: string;
  status: string;
  mastery_state: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  total_reviews: number;
  difficulty_rating: number;
  next_review_at?: string;
  last_reviewed_at?: string;
  created_at: string;
  lesson_title?: string;
  module_title?: string;
  course_title?: string;
  course_uuid?: string;
  lesson_uuid?: string;
}

/** Course option for the filter dropdown */
export interface CourseFilterOption {
  course_uuid: string;
  course_title: string;
}

/** Response from server when listing learning items */
export interface LearningItemsListResponsePayload {
  items: LearningItemWithContext[];
  courses: CourseFilterOption[];
  total: number;
}

/** Response after deleting a learning item */
export interface LearningItemDeleteResultPayload {
  success: boolean;
  item_uuid: string;
  message: string;
}

/** Scheduling info from SM-2 algorithm */
export interface SchedulingInfo {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  mastery_state: string;
  next_review_at?: string;
  last_reviewed_at?: string;
  total_reviews: number;
  difficulty_rating: number;
}

/** Summary of a past review session */
export interface ReviewSessionSummary {
  session_uuid: string;
  session_number: number;
  started_at: string;
  ended_at?: string;
  quality_rating: number;
  founder_answer?: string;
  confidence_before: number;
  confidence_after: number;
  time_to_reveal_ms: number;
  hint_requested: boolean;
  gave_up: boolean;
}

/** Exercise linked to a learning item */
export interface ExerciseSummary {
  exercise_id: string;
  exercise_type: string;
  statement: string;
  solution?: string;
  explanation?: string;
  difficulty: string;
}

/** Quiz question info from normalized tables */
export interface QuizQuestionInfo {
  question_text: string;
  options: string[];
  correct_idx: number;
  explanation?: string;
}

/** Quiz linked to a learning item */
export interface QuizSummary {
  quiz_uuid: string;
  quiz_title: string;
  question_count: number;
  difficulty: string;
  questions?: QuizQuestionInfo[];
}

/** Full detail response for a learning item */
export interface LearningItemDetailResponsePayload {
  item_uuid: string;
  item_type: string;
  item_title?: string;
  concept_text: string;
  annotation?: string;
  course_title?: string;
  module_title?: string;
  lesson_title?: string;
  created_at: string;
  scheduling: SchedulingInfo;
  reviews: ReviewSessionSummary[];
  exercises: ExerciseSummary[];
  quizzes: QuizSummary[];
}

// ============================================================================
// Calendar System Types
// ============================================================================

/** Available time slot for scheduling */
export interface CalendarTimeSlot {
  start: string;     // "07:30"
  end: string;       // "08:30"
  duration: number;  // minutes
}

/** Scheduled review in the calendar */
export interface ScheduledReview {
  slotUUID: string;
  itemUUID: string;
  itemTitle: string;
  itemType: 'concept' | 'confusion';
  slotStart: string;
  slotEnd: string;
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled';
  masteryState: string;
  reviewNumber: number;
  priority: number;
  // Context for calendar grouping/color-coding
  lessonUUID?: string;
  lessonTitle?: string;
  moduleUUID?: string;
  moduleTitle?: string;
  courseUUID?: string;
  courseTitle?: string;
}

/** Calendar day representation */
export interface CalendarDay {
  date: string;           // "2026-02-08"
  dayOfWeek: string;      // "Saturday"
  availableSlots: CalendarTimeSlot[];
  scheduledReviews: ScheduledReview[];
  totalMinutes: number;   // Total available time
  bookedMinutes: number;  // Already scheduled
}

/** Calendar zone from founder's profile */
export interface CalendarZone {
  type: 'sleep' | 'work' | 'free';
  label: string;   // "Sleep", "Morning", "Work", "Evening"
  start: string;   // "HH:MM"
  end: string;     // "HH:MM"
}

/** Living time stats */
export interface LivingTimeStats {
  sleepMins: number;
  workMins: number;
  reviewMins: number;
  freeMins: number;
  freeDisplay: string; // "4h 20m"
}

/** Calendar response from server */
export interface CalendarResponsePayload {
  days: CalendarDay[];
  zones?: CalendarZone[];
  totalDays: number;
  totalReviews: number;
  totalMinutes: number;
  bookedMinutes: number;
  living_time_stats?: LivingTimeStats;
}

/** Profile schedule updated response */
export interface ProfileScheduleUpdatedPayload {
  success: boolean;
  message: string;
  zones: CalendarZone[];
  work_days: string[];
}

/** Reschedule result from server */
export interface RescheduleResultPayload {
  success: boolean;
  slotUUID?: string;
  scheduledAt?: string;
  slotStart?: string;
  slotEnd?: string;
  message: string;
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
    canvasClearResult: null,
    selectionResult: null,
    lessonScore: null,
    // Revision System
    revisionQueue: [],
    revisionStats: null,
    revisionReviewResult: null,
    isLoadingRevision: false,
    // Active Review Session
    activeReviewSession: null,
    currentReviewItem: null,
    // Learning Items Management
    learningItems: [],
    learningItemsCourses: [],
    learningItemsTotal: 0,
    learningItemsLoading: false,
    learningItemDeleteResult: null,
    learningItemDetail: null,
    learningItemDetailLoading: false,
    // Calendar System
    calendarDays: [],
    calendarZones: [],
    calendarLoading: false,
    rescheduleResult: null,
    livingTimeStats: null,
    // Agent Console (concept vetting)
    vetMessages: [],
    isVetConsoleOpen: false,
    vetConceptText: null,
    isAgentThinking: false,
    vetVerdict: null,
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
        
        case MSG_TYPES.CANVAS_CLEAR_RESULT:
          // Result of clearing conversation history
          {
            const clearPayload = message.payload as CanvasClearResultPayload;
            console.log('%c[Canvas] 🗑️ Context cleared', 'color: #ff5722; font-weight: bold', {
              success: clearPayload.success,
              deletedCount: clearPayload.deleted_count,
              message: clearPayload.message
            });
            setState(prev => ({ 
              ...prev, 
              canvasClearResult: clearPayload,
              // Also reset the context display since it's now empty
              canvasAIContext: clearPayload.success ? null : prev.canvasAIContext
            }));
          }
          break;
          
        case MSG_TYPES.SELECTION_RESULT:
          // Response after saving a selection as concept/confusion
          {
            const resultPayload = message.payload as SelectionResultPayload;
            console.log('%c[Canvas] 💾 Selection saved', 'color: #4caf50; font-weight: bold', {
              action: resultPayload.action,
              success: resultPayload.success,
              itemUUID: resultPayload.item_uuid
            });
            setState(prev => ({ ...prev, selectionResult: resultPayload }));
          }
          break;
          
        case MSG_TYPES.LESSON_SCORE:
          // Final scores after ending a lesson
          {
            const scorePayload = message.payload as LessonScorePayload;
            console.log('%c[Lesson] 📊 Scores received', 'color: #9c27b0; font-weight: bold', {
              understanding: scorePayload.understanding_score,
              difficulty: scorePayload.difficulty_score,
              easeFactor: scorePayload.ease_factor
            });
            setState(prev => ({ ...prev, lessonScore: scorePayload }));
          }
          break;
        
        // =======================================================================
        // Revision System Messages
        // =======================================================================
        case MSG_TYPES.REVISION_QUEUE_RESPONSE:
          {
            const queuePayload = message.payload;
            // Convert snake_case to camelCase, including LLM-generated content
            const items: RevisionQueueItem[] = (queuePayload.items || []).map((item: any) => ({
              itemUUID: item.item_uuid,
              itemType: item.item_type,
              itemTitle: item.item_title,
              conceptText: item.concept_text,
              priority: item.priority,
              masteryState: item.mastery_state,
              totalReviews: item.total_reviews,
              sourceLessonUUID: item.source_lesson_uuid,
              difficultyRating: item.difficulty_rating,
              // LLM-generated content for concepts
              reviewQuestion: item.review_question,
              reviewAnswer: item.review_answer,
              keyInsight: item.key_insight,
              // MCQ question
              mcqQuestion: item.mcq_question,
              mcqOptions: item.mcq_options,
              mcqCorrectIdx: item.mcq_correct_idx,
              mcqExplanation: item.mcq_explanation,
              // Application question
              applicationQuestion: item.application_question,
              applicationAnswer: item.application_answer,
              applicationHint: item.application_hint,
              // LLM-generated content for confusion points
              clarificationAnswer: item.clarification_answer,
              followUpCheck: item.follow_up_check,
              relatedConcepts: item.related_concepts
            }));
            setState(prev => ({
              ...prev,
              revisionQueue: items,
              isLoadingRevision: false
            }));
          }
          break;
        
        case MSG_TYPES.REVISION_SESSION_STARTED:
          {
            const sessionPayload = message.payload;
            const session: ActiveReviewSession = {
              sessionUUID: sessionPayload.session_uuid,
              itemUUID: sessionPayload.item_uuid,
              sessionNumber: sessionPayload.session_number,
              startedAt: new Date(sessionPayload.started_at),
              isTypingAnswer: false,
              founderAnswer: '',
              confidenceBefore: 3
            };
            // Find the current review item from the queue
            const currentItem = state.revisionQueue.find(
              item => item.itemUUID === sessionPayload.item_uuid
            ) || null;
            console.log('%c[Revision] ⏱️ Session started', 'color: #4caf50; font-weight: bold', {
              sessionUUID: session.sessionUUID,
              itemUUID: session.itemUUID,
              sessionNumber: session.sessionNumber
            });
            setState(prev => ({
              ...prev,
              activeReviewSession: session,
              currentReviewItem: currentItem,
              isLoadingRevision: false
            }));
          }
          break;
          
        case MSG_TYPES.REVISION_STATS_RESPONSE:
          {
            const statsPayload = message.payload;
            const stats: RevisionStatsPayload = {
              totalActive: statsPayload.total_active,
              dueToday: statsPayload.due_today,
              firstReviews: statsPayload.first_reviews,
              masteredItems: statsPayload.mastered_items,
              pendingVetting: statsPayload.pending_vetting,
              retentionCoeff: statsPayload.retention_coeff
            };
            console.log('%c[Revision] 📊 Stats received', 'color: #673ab7; font-weight: bold', stats);
            setState(prev => ({
              ...prev,
              revisionStats: stats,
              isLoadingRevision: false
            }));
          }
          break;
          
        case MSG_TYPES.REVISION_REVIEW_RESULT:
          {
            const resultPayload = message.payload;
            const result: RevisionReviewResultPayload = {
              itemUUID: resultPayload.item_uuid,
              success: resultPayload.success,
              newInterval: resultPayload.new_interval,
              newEaseFactor: resultPayload.new_ease_factor,
              masteryState: resultPayload.mastery_state,
              nextReviewAt: resultPayload.next_review_at,
              message: resultPayload.message
            };
            console.log('%c[Revision] ✅ Review result', 'color: #4caf50; font-weight: bold', result);
            // Remove reviewed item from queue and clear active session
            setState(prev => ({
              ...prev,
              revisionReviewResult: result,
              revisionQueue: prev.revisionQueue.filter(item => item.itemUUID !== result.itemUUID),
              activeReviewSession: null,  // Clear session after review
              currentReviewItem: null,
              isLoadingRevision: false
            }));
          }
          break;
          
        case MSG_TYPES.REVISION_VET_RESULT:
          {
            const vetPayload = message.payload;
            console.log('%c[Revision] 🔍 Vetting result', 'color: #ff9800; font-weight: bold', {
              processed: vetPayload.processed,
              activated: vetPayload.activated
            });
            // After vetting, refresh stats
            setState(prev => ({ ...prev, isLoadingRevision: false }));
          }
          break;
        
        // Learning Items Management
        case MSG_TYPES.LEARNING_ITEMS_LIST_RESPONSE:
          {
            const listPayload = message.payload as LearningItemsListResponsePayload;
            console.log('%c[Items] 📋 Items list received', 'color: #00bcd4; font-weight: bold', {
              total: listPayload.total,
              courses: listPayload.courses?.length || 0
            });
            setState(prev => ({
              ...prev,
              learningItems: listPayload.items || [],
              learningItemsCourses: listPayload.courses || [],
              learningItemsTotal: listPayload.total || 0,
              learningItemsLoading: false
            }));
          }
          break;
        
        case MSG_TYPES.LEARNING_ITEM_DELETE_RESULT:
          {
            const deletePayload = message.payload as LearningItemDeleteResultPayload;
            console.log('%c[Items] 🗑️ Item deleted', 'color: #f44336; font-weight: bold', {
              success: deletePayload.success,
              itemUUID: deletePayload.item_uuid
            });
            if (deletePayload.success) {
              // Remove the item from the local list
              setState(prev => ({
                ...prev,
                learningItems: prev.learningItems.filter(i => i.item_uuid !== deletePayload.item_uuid),
                learningItemsTotal: Math.max(0, prev.learningItemsTotal - 1),
                learningItemDeleteResult: deletePayload
              }));
            } else {
              setState(prev => ({ ...prev, learningItemDeleteResult: deletePayload }));
            }
          }
          break;

        case MSG_TYPES.LEARNING_ITEM_DETAIL_RESPONSE:
          {
            const detailPayload = message.payload as LearningItemDetailResponsePayload;
            console.log('%c[Items] 📖 Item detail received', 'color: #9c27b0; font-weight: bold', {
              itemUUID: detailPayload.item_uuid,
              reviews: detailPayload.reviews?.length || 0,
              exercises: detailPayload.exercises?.length || 0,
              quizzes: detailPayload.quizzes?.length || 0
            });
            setState(prev => ({
              ...prev,
              learningItemDetail: detailPayload,
              learningItemDetailLoading: false
            }));
          }
          break;
        
        // Calendar System
        case MSG_TYPES.CALENDAR_RESPONSE:
          {
            const calPayload = message.payload as CalendarResponsePayload;
            console.log('%c[Calendar] 📅 Calendar received', 'color: #2196f3; font-weight: bold', {
              days: calPayload.days?.length || 0,
              totalReviews: calPayload.totalReviews
            });
            
            // Check if this is a reschedule response (has success field)
            if ('success' in calPayload) {
              const reschedulePayload = message.payload as RescheduleResultPayload;
              setState(prev => ({
                ...prev,
                calendarLoading: false,
                rescheduleResult: reschedulePayload
              }));
            } else {
              // Regular calendar response
              const days: CalendarDay[] = (calPayload.days || []).map((day: any) => ({
                date: day.date,
                dayOfWeek: day.day_of_week || day.dayOfWeek,
                availableSlots: (day.available_slots || day.availableSlots || []).map((slot: any) => ({
                  start: slot.start,
                  end: slot.end,
                  duration: slot.duration
                })),
                scheduledReviews: (day.scheduled_reviews || day.scheduledReviews || []).map((review: any) => ({
                  slotUUID: review.slot_uuid || review.slotUUID,
                  itemUUID: review.item_uuid || review.itemUUID,
                  itemTitle: review.item_title || review.itemTitle,
                  itemType: review.item_type || review.itemType,
                  slotStart: review.slot_start || review.slotStart,
                  slotEnd: review.slot_end || review.slotEnd,
                  status: review.status,
                  masteryState: review.mastery_state || review.masteryState,
                  reviewNumber: review.review_number || review.reviewNumber,
                  priority: review.priority,
                  lessonUUID: review.lesson_uuid || review.lessonUUID || '',
                  lessonTitle: review.lesson_title || review.lessonTitle || '',
                  moduleUUID: review.module_uuid || review.moduleUUID || '',
                  moduleTitle: review.module_title || review.moduleTitle || '',
                  courseUUID: review.course_uuid || review.courseUUID || '',
                  courseTitle: review.course_title || review.courseTitle || '',
                })),
                totalMinutes: day.total_minutes || day.totalMinutes || 0,
                bookedMinutes: day.booked_minutes || day.bookedMinutes || 0
              }));

              // Parse zones from the response
              const zones: CalendarZone[] = (calPayload.zones || []).map((z: any) => ({
                type: z.type,
                label: z.label,
                start: z.start,
                end: z.end,
              }));

              // Parse living time stats
              const lts = calPayload.living_time_stats;
              const livingTimeStats: LivingTimeStats | null = lts ? {
                sleepMins: lts.sleep_mins ?? lts.sleepMins ?? 0,
                workMins: lts.work_mins ?? lts.workMins ?? 0,
                reviewMins: lts.review_mins ?? lts.reviewMins ?? 0,
                freeMins: lts.free_mins ?? lts.freeMins ?? 0,
                freeDisplay: lts.free_display ?? lts.freeDisplay ?? '',
              } : null;
              
              setState(prev => ({
                ...prev,
                calendarDays: days,
                calendarZones: zones.length > 0 ? zones : prev.calendarZones,
                calendarLoading: false,
                livingTimeStats,
              }));
            }
          }
          break;
          
        case MSG_TYPES.PROFILE_SCHEDULE_UPDATED:
          {
            const schedPayload = message.payload as ProfileScheduleUpdatedPayload;
            console.log('%c[Profile] Schedule updated', 'color: #4caf50; font-weight: bold', schedPayload);
            if (schedPayload.success && schedPayload.zones) {
              const newZones: CalendarZone[] = schedPayload.zones.map((z: any) => ({
                type: z.type,
                label: z.label,
                start: z.start,
                end: z.end,
              }));
              setState(prev => ({
                ...prev,
                calendarZones: newZones,
              }));
              // Refresh calendar to recalculate living time stats with new zones
              const todayStr = new Date().toISOString().split('T')[0] as string;
              const endStr = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string;
              sendMessage(MSG_TYPES.CALENDAR_REQUEST, { start_date: todayStr, end_date: endStr });
            }
          }
          break;
          
        // =======================================================================
        // Agent Console / Loop Events
        // =======================================================================
        case MSG_TYPES.VET_MESSAGE:
          {
            const vetPayload = message.payload as VetMessagePayload;
            const vetMsg: VetMessage = {
              id: message.id || crypto.randomUUID(),
              text: vetPayload.text,
              role: vetPayload.role,
              iteration: vetPayload.iteration,
              timestamp: new Date()
            };
            console.log(
              `%c[VetMode] ${vetPayload.role === 'agent' ? '🤖' : '⚙️'} ${vetPayload.role}`,
              `color: ${vetPayload.role === 'agent' ? '#7c4dff' : '#78909c'}; font-weight: bold`,
              { text: vetPayload.text.substring(0, 80), iteration: vetPayload.iteration }
            );
            setState(prev => ({
              ...prev,
              vetMessages: [...prev.vetMessages, vetMsg],
              isAgentThinking: false, // Agent just spoke, no longer "thinking"
              isVetConsoleOpen: true   // Ensure console is open when messages arrive
            }));
          }
          break;

        case MSG_TYPES.TUTOR_THINKING:
          {
            const thinkPayload = message.payload as { message: string; iteration: number; max_steps: number };
            console.log(
              '%c[VetMode] 🧠 Thinking',
              'color: #ff9800; font-weight: bold',
              { message: thinkPayload.message, iteration: thinkPayload.iteration }
            );
            setState(prev => ({ ...prev, isAgentThinking: true }));
          }
          break;

        case MSG_TYPES.LOOP_DONE:
          {
            const donePayload = message.payload as LoopDonePayload;
            const verdict: VetVerdict = {
              reason: donePayload.reason,
              iterations: donePayload.iterations,
              finalContent: donePayload.final_content
            };
            console.log(
              '%c[VetMode] 🏁 Loop done',
              'color: #4caf50; font-weight: bold',
              { reason: donePayload.reason, iterations: donePayload.iterations, finalContent: donePayload.final_content?.substring(0, 100) }
            );
            setState(prev => ({
              ...prev,
              vetVerdict: verdict,
              isAgentThinking: false
            }));
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

  // End session - clears all session and canvas state
  const endSession = useCallback(() => {
    sendMessage(MSG_TYPES.SESSION_END);
    setState(prev => ({
      ...prev,
      hasSession: false,
      sessionId: null,
      courseId: null,
      currentLesson: null,
      currentQuiz: null,
      messages: [],
      // Clear all canvas-related state
      canvasAIWrite: null,
      canvasAIStatus: null,
      canvasAIContext: null,
      // Reset LLM info
      llmProvider: null,
      llmModel: null
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

  // Clear canvas AI context state (local only - doesn't delete from server)
  const clearCanvasAIContext = useCallback(() => {
    setState(prev => ({ ...prev, canvasAIContext: null }));
  }, []);

  // Clear conversation history on server (deletes all messages for this lesson)
  const clearConversationHistory = useCallback((lessonUUID: string) => {
    if (!state.isConnected) {
      console.warn('[Canvas] Cannot clear context - not connected');
      return;
    }
    
    console.log('%c[Canvas] → Clearing conversation history', 'color: #ff5722; font-weight: bold', {
      lessonUUID
    });
    sendMessage(MSG_TYPES.CANVAS_CLEAR_CONTEXT, { lesson_uuid: lessonUUID });
  }, [sendMessage, state.isConnected]);

  // Clear the clear result state
  const clearClearResult = useCallback(() => {
    setState(prev => ({ ...prev, canvasClearResult: null }));
  }, []);

  // ==========================================================================
  // Agent Console Methods (concept vetting)
  // ==========================================================================

  /** Open the Agent Console when a concept selection triggers vetting */
  const openVetConsole = useCallback((conceptText: string) => {
    console.log('%c[VetMode] 📂 Opening console', 'color: #7c4dff; font-weight: bold', {
      text: conceptText.substring(0, 60)
    });
    setState(prev => ({
      ...prev,
      isVetConsoleOpen: true,
      vetConceptText: conceptText,
      vetMessages: [],
      vetVerdict: null,
      isAgentThinking: true // Will be thinking until first message arrives
    }));
  }, []);

  /** Close the Agent Console and optionally stop the running loop */
  const closeVetConsole = useCallback((stopLoop = true) => {
    console.log('%c[VetMode] 📕 Closing console', 'color: #78909c; font-weight: bold', { stopLoop });
    if (stopLoop && state.isConnected && !state.vetVerdict) {
      // Send stop signal to backend if loop is still running
      sendMessage(MSG_TYPES.LOOP_STOP, { reason: 'founder_closed_console' });
    }
    setState(prev => ({
      ...prev,
      isVetConsoleOpen: false,
      vetConceptText: null,
      vetMessages: [],
      vetVerdict: null,
      isAgentThinking: false
    }));
  }, [sendMessage, state.isConnected, state.vetVerdict]);

  /** Send a founder message into the running agent loop */
  const injectVetMessage = useCallback((text: string) => {
    if (!state.isConnected) {
      console.warn('[VetMode] Cannot inject - not connected');
      return;
    }
    if (!text.trim()) return;

    console.log('%c[VetMode] 💬 Founder →', 'color: #2196f3; font-weight: bold', {
      text: text.substring(0, 60)
    });

    // Add founder message to local console immediately
    const founderMsg: VetMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      role: 'user',
      iteration: 0,
      timestamp: new Date()
    };
    setState(prev => ({
      ...prev,
      vetMessages: [...prev.vetMessages, founderMsg],
      isAgentThinking: true // Agent will process the injected message
    }));

    // Send to backend
    sendMessage(MSG_TYPES.LOOP_INJECT, { message: text.trim() });
  }, [sendMessage, state.isConnected]);

  /** Stop the running agent loop (e.g., cancel button) */
  const stopVetLoop = useCallback((reason = 'founder_cancelled') => {
    if (!state.isConnected) return;
    console.log('%c[VetMode] 🛑 Stopping loop', 'color: #f44336; font-weight: bold', { reason });
    sendMessage(MSG_TYPES.LOOP_STOP, { reason });
  }, [sendMessage, state.isConnected]);

  // ==========================================================================
  // Canvas Selection Methods (save concepts/confusion points)
  // ==========================================================================

  // Send canvas selection (user wants to save selected text)
  // In interactive mode + save_concept → opens vetting mode in TutorChat
  // In static mode or other actions → direct save, no vetting
  const sendCanvasSelection = useCallback((params: CanvasSelectionPayload) => {
    if (!state.isConnected) {
      console.warn('[Canvas] Cannot send selection - not connected');
      return;
    }
    
    console.log('%c[Canvas] → Saving selection', 'color: #4caf50; font-weight: bold', {
      action: params.action,
      view_mode: params.view_mode,
      text: params.text.substring(0, 50) + (params.text.length > 50 ? '...' : '')
    });

    // Only trigger vetting mode for interactive + save_concept
    if (params.action === 'save_concept' && params.view_mode === 'interactive') {
      openVetConsole(params.text);
    }

    sendMessage(MSG_TYPES.CANVAS_SELECTION, params);
  }, [sendMessage, state.isConnected, openVetConsole]);

  // Send lesson end (user ends the lesson session)
  const sendLessonEnd = useCallback((params: LessonEndPayload) => {
    if (!state.isConnected) {
      console.warn('[Canvas] Cannot end lesson - not connected');
      return;
    }
    
    console.log('%c[Lesson] → Ending lesson', 'color: #ff9800; font-weight: bold', {
      lessonUUID: params.lesson_uuid,
      timeSpent: params.time_spent_seconds
    });
    sendMessage(MSG_TYPES.CANVAS_LESSON_END, params);
  }, [sendMessage, state.isConnected]);

  // Clear selection result state
  const clearSelectionResult = useCallback(() => {
    setState(prev => ({ ...prev, selectionResult: null }));
  }, []);

  // Clear lesson score state
  const clearLessonScore = useCallback(() => {
    setState(prev => ({ ...prev, lessonScore: null }));
  }, []);

  // ==========================================================================
  // Revision System Methods
  // ==========================================================================

  // Request the daily revision queue
  const getRevisionQueue = useCallback((limit: number = 10) => {
    if (!state.isConnected) {
      console.warn('[Revision] Cannot get queue - not connected');
      return;
    }
    
    console.log('%c[Revision] → Requesting queue', 'color: #673ab7; font-weight: bold', { limit });
    setState(prev => ({ ...prev, isLoadingRevision: true }));
    sendMessage(MSG_TYPES.REVISION_QUEUE_REQUEST, { limit });
  }, [sendMessage, state.isConnected]);

  /** Start a review session for a specific item (tracks timing on backend) */
  const startReviewSession = useCallback((itemUUID: string) => {
    if (!state.isConnected) {
      console.warn('[Revision] Cannot start session - not connected');
      return;
    }
    
    // Find the item in the queue and set it as current
    const item = state.revisionQueue.find(i => i.itemUUID === itemUUID) || null;
    
    console.log('%c[Revision] → Starting session', 'color: #4caf50; font-weight: bold', { itemUUID });
    setState(prev => ({ 
      ...prev, 
      isLoadingRevision: true,
      currentReviewItem: item
    }));
    sendMessage(MSG_TYPES.REVISION_SESSION_START, { item_uuid: itemUUID });
  }, [sendMessage, state.isConnected, state.revisionQueue]);

  /** Update active session state (typing mode, confidence, etc.) */
  const updateActiveSession = useCallback((updates: Partial<{
    isTypingAnswer: boolean;
    founderAnswer: string;
    confidenceBefore: number;
  }>) => {
    setState(prev => {
      if (!prev.activeReviewSession) return prev;
      return {
        ...prev,
        activeReviewSession: {
          ...prev.activeReviewSession,
          ...updates
        }
      };
    });
  }, []);

  /** Clear the active review session */
  const clearActiveSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeReviewSession: null,
      currentReviewItem: null
    }));
  }, []);

  // Submit a review (user rates recall quality)
  /** Submit a review with full session data */
  const submitRevisionReview = useCallback((params: {
    itemUUID: string;
    quality: 1 | 2 | 3 | 4;
    timeSpentMs: number | undefined;
    timeToRevealMs: number | undefined;
    timeToRateMs: number | undefined;
    founderAnswer: string | undefined;
    confidenceBefore: number | undefined;
    confidenceAfter: number | undefined;
    hintRequested: boolean | undefined;
    gaveUp: boolean | undefined;
  }) => {
    if (!state.isConnected) {
      console.warn('[Revision] Cannot submit review - not connected');
      return;
    }
    
    console.log('%c[Revision] → Submitting review', 'color: #4caf50; font-weight: bold', params);
    setState(prev => ({ ...prev, isLoadingRevision: true }));
    sendMessage(MSG_TYPES.REVISION_REVIEW, {
      item_uuid: params.itemUUID,
      quality: params.quality,
      time_spent_ms: params.timeSpentMs || 0,
      time_to_reveal_ms: params.timeToRevealMs,
      time_to_rate_ms: params.timeToRateMs,
      founder_answer: params.founderAnswer,
      confidence_before: params.confidenceBefore,
      confidence_after: params.confidenceAfter,
      hint_requested: params.hintRequested,
      gave_up: params.gaveUp
    });
  }, [sendMessage, state.isConnected]);

  // Request revision stats
  const getRevisionStats = useCallback(() => {
    if (!state.isConnected) {
      console.warn('[Revision] Cannot get stats - not connected');
      return;
    }
    
    console.log('%c[Revision] → Requesting stats', 'color: #673ab7; font-weight: bold');
    setState(prev => ({ ...prev, isLoadingRevision: true }));
    sendMessage(MSG_TYPES.REVISION_STATS_REQUEST, {});
  }, [sendMessage, state.isConnected]);

  // Request vetting of pending concepts
  const requestRevisionVetting = useCallback(() => {
    if (!state.isConnected) {
      console.warn('[Revision] Cannot request vetting - not connected');
      return;
    }
    
    console.log('%c[Revision] → Requesting vetting', 'color: #ff9800; font-weight: bold');
    setState(prev => ({ ...prev, isLoadingRevision: true }));
    sendMessage(MSG_TYPES.REVISION_VET_REQUEST, {});
  }, [sendMessage, state.isConnected]);

  // Clear revision review result
  const clearRevisionReviewResult = useCallback(() => {
    setState(prev => ({ ...prev, revisionReviewResult: null }));
  }, []);

  // ==========================================================================
  // Learning Items Management Methods
  // ==========================================================================

  /** Request all learning items with optional course/lesson filter */
  const getLearningItems = useCallback((filters?: { courseUUID?: string; lessonUUID?: string }) => {
    if (!state.isConnected) {
      console.warn('[Items] Cannot list items - not connected');
      return;
    }

    console.log('%c[Items] → Requesting items', 'color: #00bcd4; font-weight: bold', filters);
    setState(prev => ({ ...prev, learningItemsLoading: true }));
    sendMessage(MSG_TYPES.LEARNING_ITEMS_LIST, {
      course_uuid: filters?.courseUUID || '',
      lesson_uuid: filters?.lessonUUID || ''
    });
  }, [sendMessage, state.isConnected]);

  /** Delete a learning item by UUID */
  const deleteLearningItem = useCallback((itemUUID: string) => {
    if (!state.isConnected) {
      console.warn('[Items] Cannot delete item - not connected');
      return;
    }

    console.log('%c[Items] → Deleting item', 'color: #f44336; font-weight: bold', { itemUUID });
    sendMessage(MSG_TYPES.LEARNING_ITEM_DELETE, { item_uuid: itemUUID });
  }, [sendMessage, state.isConnected]);

  /** Clear delete result */
  const clearLearningItemDeleteResult = useCallback(() => {
    setState(prev => ({ ...prev, learningItemDeleteResult: null }));
  }, []);

  /** Request full detail for a learning item (scheduling, reviews, exercises, quizzes) */
  const getLearningItemDetail = useCallback((itemUUID: string) => {
    if (!state.isConnected) {
      console.warn('[Items] Cannot get item detail - not connected');
      return;
    }

    console.log('%c[Items] → Requesting item detail', 'color: #9c27b0; font-weight: bold', { itemUUID });
    setState(prev => ({ ...prev, learningItemDetailLoading: true, learningItemDetail: null }));
    sendMessage(MSG_TYPES.LEARNING_ITEM_DETAIL, { item_uuid: itemUUID });
  }, [sendMessage, state.isConnected]);

  /** Clear item detail */
  const clearLearningItemDetail = useCallback(() => {
    setState(prev => ({ ...prev, learningItemDetail: null, learningItemDetailLoading: false }));
  }, []);

  // ============================================================================
  // Calendar System Methods
  // ============================================================================

  // Get calendar for date range
  const getCalendar = useCallback((startDate: string, endDate: string) => {
    if (!state.isConnected) {
      console.warn('[Calendar] Cannot get calendar - not connected');
      return;
    }
    
    console.log('%c[Calendar] → Requesting calendar', 'color: #2196f3; font-weight: bold', { startDate, endDate });
    setState(prev => ({ ...prev, calendarLoading: true }));
    sendMessage(MSG_TYPES.CALENDAR_REQUEST, {
      start_date: startDate,
      end_date: endDate
    });
  }, [sendMessage, state.isConnected]);

  // Reschedule a review slot
  const rescheduleSlot = useCallback((slotUUID: string, newDate: string) => {
    if (!state.isConnected) {
      console.warn('[Calendar] Cannot reschedule - not connected');
      return;
    }
    
    console.log('%c[Calendar] → Rescheduling slot', 'color: #ff9800; font-weight: bold', { slotUUID, newDate });
    setState(prev => ({ ...prev, calendarLoading: true }));
    sendMessage(MSG_TYPES.SLOT_RESCHEDULE, {
      slot_uuid: slotUUID,
      new_date: newDate
    });
  }, [sendMessage, state.isConnected]);

  // Clear reschedule result
  const clearRescheduleResult = useCallback(() => {
    setState(prev => ({ ...prev, rescheduleResult: null }));
  }, []);

  // Get today's scheduled reviews
  const getTodaySchedule = useCallback(() => {
    const today = new Date().toISOString().split('T')[0] as string;
    getCalendar(today, today);
  }, [getCalendar]);

  // Get this week's schedule
  const getWeekSchedule = useCallback(() => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0] as string;
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string;
    getCalendar(startDate, endDate);
  }, [getCalendar]);

  // Update founder schedule (sleep/work times)
  const updateSchedule = useCallback((params: {
    workStart?: string;
    workEnd?: string;
    sleepStart?: string;
    sleepEnd?: string;
    workDays?: string[];
  }) => {
    if (!state.isConnected) {
      console.warn('[Profile] Cannot update schedule - not connected');
      return;
    }
    console.log('%c[Profile] → Updating schedule', 'color: #4caf50; font-weight: bold', params);
    sendMessage(MSG_TYPES.PROFILE_SCHEDULE_UPDATE, {
      work_start: params.workStart,
      work_end: params.workEnd,
      sleep_start: params.sleepStart,
      sleep_end: params.sleepEnd,
      work_days: params.workDays,
    });
  }, [sendMessage, state.isConnected]);

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
    clearCanvasAIContext,
    clearConversationHistory,
    clearClearResult,
    // Canvas selection (save concepts/confusion)
    sendCanvasSelection,
    sendLessonEnd,
    clearSelectionResult,
    clearLessonScore,
    // Revision system
    getRevisionQueue,
    startReviewSession,
    updateActiveSession,
    clearActiveSession,
    submitRevisionReview,
    getRevisionStats,
    requestRevisionVetting,
    clearRevisionReviewResult,
    // Learning Items Management
    getLearningItems,
    deleteLearningItem,
    clearLearningItemDeleteResult,
    getLearningItemDetail,
    clearLearningItemDetail,
    // Calendar System
    getCalendar,
    rescheduleSlot,
    clearRescheduleResult,
    getTodaySchedule,
    getWeekSchedule,
    // Schedule Configuration
    updateSchedule,
    // Agent Console (concept vetting)
    openVetConsole,
    closeVetConsole,
    injectVetMessage,
    stopVetLoop
  };
}

export default useTutorAgent;

