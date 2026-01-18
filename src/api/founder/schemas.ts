/**
 * Zod validation schemas for Founder OS API
 * Generated to match OpenAPI spec types from api.gen.ts
 */
import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const RiskToleranceSchema = z.enum(['low', 'medium', 'high']);
export const PrimaryGoalSchema = z.enum(['side_income', 'replace_job', 'build_empire', 'learn_and_grow']);
export const WorkStyleSchema = z.enum(['solo', 'small_team', 'large_team']);
export const ProjectOutcomeSchema = z.enum(['success', 'failed', 'abandoned', 'ongoing']);

export const IdeaStatusSchema = z.enum(['submitted', 'researching', 'reviewed', 'approved', 'rejected', 'pending_review']);
export const WorkflowStageSchema = z.enum([
  'pending_review',
  'pending_enrichment',
  'enriching',
  'enriched',
  'ready_for_review',
  'approved',
  'rejected',
  'deferred',
  'analyzing',
  'completed',
  'failed'
]);
export const ReviewDecisionSchema = z.enum(['approved', 'rejected', 'deferred']);

export const TaskTypeSchema = z.enum(['research', 'validate', 'build', 'market', 'measure']);
export const TaskPhaseSchema = z.enum(['research', 'validation', 'mvp', 'launch']);
export const TaskStatusSchema = z.enum(['pending', 'completed', 'skipped', 'blocked']);

// ============================================================================
// Auth Schemas
// ============================================================================

export const LoginRequestSchema = z.object({
  username_or_email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Registration request schema
 * Note: The backend expects RegisterUserPayloadV1 with uuid/id as required,
 * but those are generated server-side. We send the minimal required fields.
 */
export const RegisterRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().optional(),
  country: z.string().optional(),
  consent_date: z.string().optional() // ISO date string
});

export const UserBasicsSchema = z.object({
  id: z.number(),
  uuid: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  is_email_verified: z.boolean(),
  status: z.enum(['active', 'banned', 'canceled', 'canceling', 'delinquent', 'guest', 'paused', 'pending', 'registered', 'review']),
  hashed_password: z.string(),
  access_token: z.string().optional().nullable(),
  refresh_token: z.string().optional().nullable(),
  consent_date: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  password_updated_at: z.string().optional().nullable()
});

// ============================================================================
// Founder Profile Schemas
// ============================================================================

export const SkillsSchema = z.record(z.string(), z.number().min(1).max(10));
export const ConstraintsSchema = z.record(z.string(), z.boolean());

export const PastProjectSchema = z.object({
  name: z.string().optional(),
  outcome: ProjectOutcomeSchema.optional(),
  learnings: z.string().optional()
});

export const CreateFounderProfileRequestSchema = z.object({
  user_id: z.number().int(),
  display_name: z.string().optional(),
  skills: SkillsSchema.optional(),
  years_experience: z.number().int().min(0).optional(),
  job_title: z.string().optional(),
  industry_background: z.array(z.string()).optional(),
  hours_per_week: z.number().int().min(0).max(168).optional(),
  has_day_job: z.boolean().optional(),
  budget_available: z.number().int().min(0).optional(),
  risk_tolerance: RiskToleranceSchema.optional(),
  primary_goal: PrimaryGoalSchema.optional(),
  target_monthly_income: z.number().int().min(0).optional(),
  work_style: WorkStyleSchema.optional(),
  constraints: ConstraintsSchema.optional()
});

export const UpdateFounderProfileRequestSchema = z.object({
  display_name: z.string().optional(),
  skills: SkillsSchema.optional(),
  years_experience: z.number().int().min(0).optional(),
  job_title: z.string().optional(),
  industry_background: z.array(z.string()).optional(),
  hours_per_week: z.number().int().min(0).max(168).optional(),
  has_day_job: z.boolean().optional(),
  budget_available: z.number().int().min(0).optional(),
  risk_tolerance: RiskToleranceSchema.optional(),
  primary_goal: PrimaryGoalSchema.optional(),
  target_monthly_income: z.number().int().min(0).optional(),
  work_style: WorkStyleSchema.optional(),
  constraints: ConstraintsSchema.optional(),
  preferred_industries: z.array(z.string()).optional(),
  avoided_industries: z.array(z.string()).optional(),
  preferred_idea_types: z.array(z.string()).optional()
});

export const FounderProfileSchema = z.object({
  uuid: z.string().uuid(),
  user_id: z.number().int(),
  display_name: z.string().optional().nullable(),
  skills: SkillsSchema.optional().nullable(),
  years_experience: z.number().int().optional().nullable(),
  job_title: z.string().optional().nullable(),
  industry_background: z.array(z.string()).optional().nullable(),
  hours_per_week: z.number().int().optional().nullable(),
  has_day_job: z.boolean().optional().nullable(),
  budget_available: z.number().int().optional().nullable(),
  risk_tolerance: RiskToleranceSchema.optional().nullable(),
  primary_goal: PrimaryGoalSchema.optional().nullable(),
  target_monthly_income: z.number().int().optional().nullable(),
  work_style: WorkStyleSchema.optional().nullable(),
  constraints: ConstraintsSchema.optional().nullable(),
  past_projects: z.array(PastProjectSchema).optional().nullable(),
  preferred_industries: z.array(z.string()).optional().nullable(),
  avoided_industries: z.array(z.string()).optional().nullable(),
  preferred_idea_types: z.array(z.string()).optional().nullable(),
  learnings: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  onboarding_completed: z.boolean().optional().nullable(),
  onboarding_completed_at: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

// ============================================================================
// Fit Score Schemas
// ============================================================================

export const FitScoreRequestSchema = z.object({
  required_skills: SkillsSchema.optional(),
  estimated_hours_week: z.number().int().min(0).optional(),
  estimated_budget: z.number().int().min(0).optional(),
  risk_level: RiskToleranceSchema.optional(),
  industry: z.string().optional()
});

export const FitScoreResponseSchema = z.object({
  overall: z.number().int().min(0).max(100),
  skill_match: z.number().int().min(0).max(100),
  time_match: z.number().int().min(0).max(100),
  budget_match: z.number().int().min(0).max(100),
  risk_match: z.number().int().min(0).max(100),
  pros: z.array(z.string()).optional().nullable(),
  cons: z.array(z.string()).optional().nullable(),
  warnings: z.array(z.string()).optional().nullable()
});

// ============================================================================
// Idea Schemas
// ============================================================================

export const IdeaResponseSchema = z.object({
  uuid: z.string().uuid(),
  id: z.number(),
  user_id: z.number().int(),
  title: z.string(),
  description: z.string(),
  problem_statement: z.string().optional().nullable(),
  target_audience: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  market_size: z.string().optional().nullable(),
  competitors: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  unique_value_proposition: z.string().optional().nullable(),
  technical_feasibility: z.number().int().min(1).max(10).optional().nullable(),
  market_feasibility: z.number().int().min(1).max(10).optional().nullable(),
  financial_feasibility: z.number().int().min(1).max(10).optional().nullable(),
  status: IdeaStatusSchema,
  workflow_stage: WorkflowStageSchema,
  priority: z.number().int().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  enrichment_data: z.record(z.string(), z.unknown()).optional().nullable(),
  external_references: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  enriched_at: z.string().optional().nullable(),
  reviewed_at: z.string().optional().nullable(),
  founder_fit_score: z.number().int().min(0).max(100).optional().nullable(),
  founder_fit_explanation: z.record(z.string(), z.unknown()).optional().nullable(),
  historical_validation: z.record(z.string(), z.unknown()).optional().nullable(),
  review_decision: ReviewDecisionSchema.optional().nullable(),
  review_notes: z.string().optional().nullable(),
  reviewed_by: z.number().int().optional().nullable()
});

export const PendingIdeasResponseSchema = z.object({
  ideas: z.array(IdeaResponseSchema),
  total: z.number(),
  limit: z.number().int(),
  offset: z.number().int()
});

export const ReviewIdeaRequestSchema = z.object({
  decision: ReviewDecisionSchema,
  notes: z.string().optional()
});

// ============================================================================
// Task Schemas
// ============================================================================

export const TaskResponseSchema = z.object({
  uuid: z.string().uuid(),
  idea_uuid: z.string().uuid(),
  idea_title: z.string().optional().nullable(),
  template_uuid: z.string().uuid().optional().nullable(),
  task_date: z.string(), // format: date (YYYY-MM-DD)
  title: z.string(),
  description: z.string(),
  completion_criteria: z.string().optional().nullable(),
  expected_duration_minutes: z.number().int().optional().nullable(),
  task_type: TaskTypeSchema,
  phase: TaskPhaseSchema,
  sequence_number: z.number().int().optional().nullable(),
  status: TaskStatusSchema,
  completed_at: z.string().optional().nullable(),
  quality_score: z.number().int().min(1).max(5).optional().nullable(),
  time_spent_minutes: z.number().int().optional().nullable(),
  outcome_notes: z.string().optional().nullable(),
  learnings: z.string().optional().nullable(),
  blockers: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable()
});

export const TodayTasksResponseSchema = z.object({
  tasks: z.array(TaskResponseSchema),
  total_pending: z.number().int(),
  active_ideas_count: z.number().int(),
  date: z.string().optional().nullable() // format: date (YYYY-MM-DD)
});

export const CompleteTaskRequestSchema = z.object({
  quality_score: z.number().int().min(1).max(5),
  time_spent_minutes: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  learnings: z.string().optional()
});

export const SkipTaskRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required')
});

// ============================================================================
// Stats Schemas
// ============================================================================

export const TrendPointSchema = z.object({
  date: z.string().optional(), // format: date
  score: z.number().optional()
});

export const CompoundStatsResponseSchema = z.object({
  current_score: z.number().min(0).max(100),
  previous_score: z.number().optional().nullable(),
  daily_change: z.number().optional().nullable(),
  streak_days: z.number().int(),
  completion_rate: z.number().min(0).max(1),
  avg_quality: z.number().min(1).max(5),
  velocity: z.number().optional().nullable(),
  trend: z.array(TrendPointSchema).optional().nullable(),
  alert: z.boolean().optional().nullable(),
  target_daily_improvement: z.number().optional().nullable()
});

export const StreakResponseSchema = z.object({
  current_streak: z.number().int(),
  longest_streak: z.number().int(),
  total_days_worked: z.number().int().optional().nullable(),
  total_tasks_completed: z.number().int().optional().nullable(),
  avg_tasks_per_day: z.number().optional().nullable(),
  last_active_date: z.string().optional().nullable() // format: date
});

// ============================================================================
// Upload & Scraper Schemas
// ============================================================================

export const PresignedUploadRequestSchema = z.object({
  user_id: z.number().int(),
  filename: z.string().min(1, 'Filename is required'),
  content_type: z.string().optional()
});

export const PresignedUploadResponseSchema = z.object({
  upload_url: z.string().url(),
  s3_key: z.string(),
  s3_uri: z.string(),
  expires_at: z.string().optional()
});

export const ScraperJobRequestSchema = z.object({
  user_id: z.number().int(),
  spider: z.string(),
  args: z.record(z.string(), z.string()).optional(),
  input_file_url: z.string().optional(),
  input_file_type: z.enum(['txt', 'pdf']).optional()
});

export const ScraperJobResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.number().int(),
  status: z.number().int(),
  created_at: z.string(),
  updated_at: z.string()
});

// ============================================================================
// Enrichment Schemas
// ============================================================================

// Matches EnrichmentStatusEvent.state from OpenAPI spec
export const EnrichmentStateSchema = z.enum([
  'pending',
  'queued',
  'processing',
  'legal',
  'market',
  'founder',
  'technical',
  'financial',
  'aggregating',
  'completed',
  'failed',
  'blocked'
]);

export const FitScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1).optional().nullable(),
  explanation: z.string().optional().nullable(),
  pros: z.array(z.string()).optional().nullable(),
  cons: z.array(z.string()).optional().nullable()
});

export const EnrichmentFactSchema = z.object({
  category: z.string(), // e.g., "legal", "market", "competitor"
  content: z.string(),
  source: z.string().optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable()
});

export const EnrichmentStatusSchema = z.object({
  idea_uuid: z.string().uuid(),
  session_id: z.string(),
  state: EnrichmentStateSchema,
  progress_pct: z.number().min(0).max(100),
  current_thread: z.string().optional().nullable(),
  threads_completed: z.number().int(),
  threads_total: z.number().int(),
  started_at: z.string().optional().nullable(),
  estimated_completion: z.string().optional().nullable(),
  error: z.string().optional().nullable()
});

export const EnrichmentResultSchema = z.object({
  idea_uuid: z.string().uuid(),
  session_id: z.string(),
  status: EnrichmentStateSchema,
  
  // Scores
  scores: z.array(FitScoreSchema).optional().nullable(),
  composite_score: z.number().min(0).max(100).optional().nullable(),
  composite_confidence: z.number().min(0).max(1).optional().nullable(),
  
  // Findings
  facts: z.array(EnrichmentFactSchema).optional().nullable(),
  blockers: z.array(z.string()).optional().nullable(),
  warnings: z.array(z.string()).optional().nullable(),
  recommendations: z.array(z.string()).optional().nullable(),
  
  // Temporal
  trend_ttl_days: z.number().int().optional().nullable(),
  opportunity_window: z.string().optional().nullable(),
  
  // Audit
  tokens_used: z.number().int().optional().nullable(),
  duration_ms: z.number().int().optional().nullable(),
  thread_count: z.number().int().optional().nullable(),
  partial: z.boolean().optional().nullable(),
  
  // Timestamps
  started_at: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  created_at: z.string().optional().nullable()
});

// ============================================================================
// Error Schema
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string()
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type RiskTolerance = z.infer<typeof RiskToleranceSchema>;
export type PrimaryGoal = z.infer<typeof PrimaryGoalSchema>;
export type WorkStyle = z.infer<typeof WorkStyleSchema>;
export type ProjectOutcome = z.infer<typeof ProjectOutcomeSchema>;
export type IdeaStatus = z.infer<typeof IdeaStatusSchema>;
export type WorkflowStage = z.infer<typeof WorkflowStageSchema>;
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type TaskPhase = z.infer<typeof TaskPhaseSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type UserBasics = z.infer<typeof UserBasicsSchema>;

export type Skills = z.infer<typeof SkillsSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type PastProject = z.infer<typeof PastProjectSchema>;
export type CreateFounderProfileRequest = z.infer<typeof CreateFounderProfileRequestSchema>;
export type UpdateFounderProfileRequest = z.infer<typeof UpdateFounderProfileRequestSchema>;
export type FounderProfile = z.infer<typeof FounderProfileSchema>;

export type FitScoreRequest = z.infer<typeof FitScoreRequestSchema>;
export type FitScoreResponse = z.infer<typeof FitScoreResponseSchema>;

export type IdeaResponse = z.infer<typeof IdeaResponseSchema>;
export type PendingIdeasResponse = z.infer<typeof PendingIdeasResponseSchema>;
export type ReviewIdeaRequest = z.infer<typeof ReviewIdeaRequestSchema>;

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type TodayTasksResponse = z.infer<typeof TodayTasksResponseSchema>;
export type CompleteTaskRequest = z.infer<typeof CompleteTaskRequestSchema>;
export type SkipTaskRequest = z.infer<typeof SkipTaskRequestSchema>;

export type TrendPoint = z.infer<typeof TrendPointSchema>;
export type CompoundStatsResponse = z.infer<typeof CompoundStatsResponseSchema>;
export type StreakResponse = z.infer<typeof StreakResponseSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type PresignedUploadRequest = z.infer<typeof PresignedUploadRequestSchema>;
export type PresignedUploadResponse = z.infer<typeof PresignedUploadResponseSchema>;
export type ScraperJobRequest = z.infer<typeof ScraperJobRequestSchema>;
export type ScraperJobResponse = z.infer<typeof ScraperJobResponseSchema>;

export type EnrichmentState = z.infer<typeof EnrichmentStateSchema>;
export type FitScore = z.infer<typeof FitScoreSchema>;
export type EnrichmentFact = z.infer<typeof EnrichmentFactSchema>;
export type EnrichmentStatus = z.infer<typeof EnrichmentStatusSchema>;
export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;

// ============================================================================
// Founder Agent WebSocket Schemas
// ============================================================================

// Agent domains
export const AgentDomainSchema = z.enum(['learning', 'habit_breaking']);

// FSM States (Learning)
export const LearningStateSchema = z.enum(['idle', 'reading', 'quiz', 'review', 'practice']);

// FSM States (Habit/TTM)
export const TTMStateSchema = z.enum(['precontemplation', 'contemplation', 'preparation', 'action', 'maintenance']);

// Combined state type
export const AgentStateSchema = z.union([LearningStateSchema, TTMStateSchema]);

// WebSocket Message Types (Client → Server)
export const ClientMessageTypeSchema = z.enum([
  'session.start',
  'session.end',
  'signal',
  'chat',
  'ping'
]);

// WebSocket Message Types (Server → Client)
export const ServerMessageTypeSchema = z.enum([
  'connected',
  'state.change',
  'agent.response',
  'agent.typing',
  'persona.update',
  'milestone',
  'ack',
  'error',
  'pong'
]);

// Base message schema
export const AgentMessageSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.unknown().optional(),
  timestamp: z.string().optional()
});

// Session start payload
export const SessionStartPayloadSchema = z.object({
  domain: AgentDomainSchema,
  goal_id: z.string().optional()
});

// Chat payload
export const ChatPayloadSchema = z.object({
  message: z.string().min(1)
});

// Signal payload
export const SignalPayloadSchema = z.object({
  type: z.string(),
  interaction_type: z.string().optional(),
  goal_id: z.string().optional(),
  item_type: z.string().optional(),
  item_id: z.string().optional(),
  intensity: z.number().optional(),
  score: z.number().optional(),
  duration_seconds: z.number().optional(),
  outcome: z.string().optional(),
  trigger: z.string().optional(),
  coping_response: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional()
});

// Connected payload (server)
export const ConnectedPayloadSchema = z.object({
  user_id: z.number(),
  connection_id: z.string(),
  server_version: z.string(),
  connected_at: z.string()
});

// State change payload (server)
export const StateChangePayloadSchema = z.object({
  domain: AgentDomainSchema,
  previous_state: AgentStateSchema,
  current_state: AgentStateSchema,
  reason: z.string().optional(),
  transition_at: z.string()
});

// Agent response payload (server)
export const AgentResponsePayloadSchema = z.object({
  text: z.string(),
  domain: AgentDomainSchema,
  agent_name: z.string(),
  response_id: z.string(),
  actions: z.array(z.object({
    type: z.string(),
    data: z.record(z.string(), z.unknown()).optional()
  })).optional(),
  next_prompt: z.string().optional()
});

// Agent typing payload (server)
export const AgentTypingPayloadSchema = z.object({
  typing: z.boolean(),
  agent_name: z.string(),
  domain: AgentDomainSchema
});

// Persona update payload (server)
export const PersonaUpdatePayloadSchema = z.object({
  metrics: z.record(z.string(), z.unknown()),
  domain: AgentDomainSchema.optional()
});

// Milestone payload (server)
export const MilestonePayloadSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  achieved_at: z.string()
});

// Ack payload (server)
export const AckPayloadSchema = z.object({
  ref: z.string(),
  status: z.enum(['ok', 'error']),
  session_id: z.string().optional(),
  error: z.string().optional()
});

// Error payload (server)
export const ErrorPayloadSchema = z.object({
  ref: z.string().optional(),
  code: z.number(),
  message: z.string()
});

// Type exports
export type AgentDomain = z.infer<typeof AgentDomainSchema>;
export type LearningState = z.infer<typeof LearningStateSchema>;
export type TTMState = z.infer<typeof TTMStateSchema>;
export type AgentState = z.infer<typeof AgentStateSchema>;
export type ClientMessageType = z.infer<typeof ClientMessageTypeSchema>;
export type ServerMessageType = z.infer<typeof ServerMessageTypeSchema>;
export type AgentMessage = z.infer<typeof AgentMessageSchema>;
export type SessionStartPayload = z.infer<typeof SessionStartPayloadSchema>;
export type ChatPayload = z.infer<typeof ChatPayloadSchema>;
export type SignalPayload = z.infer<typeof SignalPayloadSchema>;
export type ConnectedPayload = z.infer<typeof ConnectedPayloadSchema>;
export type StateChangePayload = z.infer<typeof StateChangePayloadSchema>;
export type AgentResponsePayload = z.infer<typeof AgentResponsePayloadSchema>;
export type AgentTypingPayload = z.infer<typeof AgentTypingPayloadSchema>;
export type PersonaUpdatePayload = z.infer<typeof PersonaUpdatePayloadSchema>;
export type MilestonePayload = z.infer<typeof MilestonePayloadSchema>;
export type AckPayload = z.infer<typeof AckPayloadSchema>;
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Safely parse and validate API response data
 */
export function parseApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely parse with error handling - returns null on failure
 */
export function safeParseApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('API response validation failed:', result.error.issues);
  return null;
}

