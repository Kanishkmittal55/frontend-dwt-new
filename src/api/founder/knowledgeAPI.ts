/**
 * Knowledge / Memory Matrix API
 * Handles memory-matrix dashboard and learner-profile endpoints
 */
import { founderClient } from './founderClient';
import type { components } from '@/types/api.gen';

// ============================================================================
// Types from OpenAPI
// ============================================================================

export type MemoryMatrixResponse = components['schemas']['MemoryMatrixResponse'];
export type MemoryMatrixConceptsResponse = components['schemas']['MemoryMatrixConceptsResponse'];
export type RetentionCurveResponse = components['schemas']['RetentionCurveResponse'];
export type StrengthMatrixResponse = components['schemas']['StrengthMatrixResponse'];
export type PracticeImpactResponse = components['schemas']['PracticeImpactResponse'];
export type LearnerProfileResponse = components['schemas']['LearnerProfileResponse'];
export type DomainKnowledgeGraphResponse = components['schemas']['DomainKnowledgeGraphResponse'];
export type DomainKnowledgeActiveAssessment = {
  session_id: string;
  session_url: string;
  slug: string;
  domain_name: string;
};

export type DomainKnowledgeListResponse = {
  domains: Array<{
    slug: string;
    name: string;
    description?: string;
    skill_score_pct?: number;
    coverage_pct?: number;
    last_assessment?: string;
  }>;
  active_assessment?: DomainKnowledgeActiveAssessment;
};

// Types for new Phase 7 endpoints (add to api.gen when frontend openapi-generate runs)
export interface DomainKnowledgeMetricsResponse {
  overall_score_pct?: number;
  coverage_pct?: number;
  concept_scores?: Array<{ concept_slug?: string; score?: number; justification?: string }>;
  duration_sec?: number;
  hints_used?: number;
  inferred_at?: string;
  inference_error?: string;
}

export interface DomainKnowledgeFounderGraphResponse {
  domain: { slug: string; name: string; description?: string };
  concepts: Array<{
    uuid: string;
    slug: string;
    name: string;
    description?: string;
    difficulty: string;
    sub_domain?: string;
    sequence_order?: number;
    tested?: boolean;
    last_score?: number;
  }>;
  relationships: Array<{
    uuid: string;
    from_concept_uuid: string;
    to_concept_uuid: string;
    relationship: string;
    strength: number;
  }>;
}

// ============================================================================
// Memory Matrix API Functions
// ============================================================================

/**
 * Get full memory matrix for a course
 * GET /v1/courses/{courseUUID}/memory-matrix
 *
 * Returns the complete concept graph with retention estimates, relationships,
 * and aggregated retention metrics for all learning items linked to a course.
 */
export async function getMemoryMatrix(courseUUID: string): Promise<MemoryMatrixResponse> {
  return founderClient.get<MemoryMatrixResponse>(
    `/v1/courses/${courseUUID}/memory-matrix`
  );
}

/**
 * Get concepts sorted by review urgency
 * GET /v1/courses/{courseUUID}/memory-matrix/concepts
 *
 * Returns learning items ordered so the most-urgent-to-review appear first.
 */
export async function getMemoryMatrixConcepts(courseUUID: string): Promise<MemoryMatrixConceptsResponse> {
  return founderClient.get<MemoryMatrixConceptsResponse>(
    `/v1/courses/${courseUUID}/memory-matrix/concepts`
  );
}

/**
 * Get retention (forgetting) curves for a course
 * GET /v1/courses/{courseUUID}/memory-matrix/retention-curve
 *
 * Per-concept R(t) projected over the next 30 days.
 */
export async function getRetentionCurve(courseUUID: string): Promise<RetentionCurveResponse> {
  return founderClient.get<RetentionCurveResponse>(
    `/v1/courses/${courseUUID}/memory-matrix/retention-curve`
  );
}

/**
 * Get strength matrix (module × concept heatmap)
 * GET /v1/courses/{courseUUID}/memory-matrix/strength
 */
export async function getStrengthMatrix(courseUUID: string): Promise<StrengthMatrixResponse> {
  return founderClient.get<StrengthMatrixResponse>(
    `/v1/courses/${courseUUID}/memory-matrix/strength`
  );
}

/**
 * Get practice impact / review history for a specific learning item
 * GET /v1/courses/{courseUUID}/memory-matrix/practice-impact?item_uuid=...
 */
export async function getPracticeImpact(
  courseUUID: string,
  itemUUID: string
): Promise<PracticeImpactResponse> {
  return founderClient.get<PracticeImpactResponse>(
    `/v1/courses/${courseUUID}/memory-matrix/practice-impact?item_uuid=${itemUUID}`
  );
}

// ============================================================================
// Learner Profile API
// ============================================================================

/**
 * Get full learner profile
 * GET /v1/founder/{userID}/learner-profile
 *
 * Returns mastery, retention, engagement, performance, and activity snapshots.
 */
export async function getLearnerProfile(userID: number): Promise<LearnerProfileResponse> {
  return founderClient.get<LearnerProfileResponse>(
    `/v1/founder/${userID}/learner-profile`
  );
}

// ============================================================================
// Domain Knowledge Graph API (NeuralMap for curated taxonomies)
// ============================================================================

/**
 * List available domain knowledge graphs
 * GET /v1/founder/domain-knowledge
 * When userId provided, includes skill_score_pct, coverage_pct, last_assessment per domain.
 */
export async function getDomainKnowledgeList(userId?: number): Promise<DomainKnowledgeListResponse> {
  const params = userId ? `?user_id=${userId}` : '';
  return founderClient.get<DomainKnowledgeListResponse>(
    `/v1/founder/domain-knowledge${params}`
  );
}

/**
 * Get last assessment metrics for a domain
 * GET /v1/founder/domain-knowledge/{slug}/metrics
 */
export async function getDomainKnowledgeMetrics(
  slug: string,
  userId?: number
): Promise<DomainKnowledgeMetricsResponse> {
  const params = userId ? `?user_id=${userId}` : '';
  return founderClient.get<DomainKnowledgeMetricsResponse>(
    `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/metrics${params}`
  );
}

/**
 * Get domain knowledge graph with founder scores (tested, last_score per concept)
 * GET /v1/founder/domain-knowledge/{slug}/founder-graph
 */
export async function getDomainKnowledgeFounderGraph(
  slug: string,
  userId?: number
): Promise<DomainKnowledgeFounderGraphResponse> {
  const params = userId ? `?user_id=${userId}` : '';
  return founderClient.get<DomainKnowledgeFounderGraphResponse>(
    `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/founder-graph${params}`
  );
}

/**
 * Get domain knowledge graph for NeuralMap view
 * GET /v1/founder/domain-knowledge/{slug}/graph
 */
export async function getDomainKnowledgeGraph(slug: string): Promise<DomainKnowledgeGraphResponse> {
  return founderClient.get<DomainKnowledgeGraphResponse>(
    `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/graph`
  );
}

// ============================================================================
// Domain Knowledge Assessment (scenario-based tests)
// ============================================================================

export interface DomainKnowledgeAssessmentValidationRules {
  must_have_from?: boolean;
  must_have_copy?: boolean;
  must_have_run?: boolean;
  must_have_multi_stage?: boolean;
  must_have_port_flag?: boolean;
  must_have_volume_flag?: boolean;
  expected_image?: string;
  must_have_volumes?: boolean;
  must_have_networks?: boolean;
  must_have_healthcheck?: boolean;
  correct_choice_index?: number;
}

export interface DomainKnowledgeAssessmentScenario {
  id: string;
  concept_slug: string;
  concept_name: string;
  task_type: 'dockerfile_edit' | 'command_build' | 'compose_edit' | 'scenario_choice' | 'code_edit' | 'test_write';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prompt: string;
  initial_content?: string;
  validation_rules: DomainKnowledgeAssessmentValidationRules;
  estimated_time_sec: number;
  hint?: string;
}

export interface DomainKnowledgeAssessmentVerifyResponse {
  passed: boolean;
  score: number;
  feedback: string[];
}

export interface DomainKnowledgeAssessmentGenerateResponse {
  domain_slug: string;
  scenarios: DomainKnowledgeAssessmentScenario[];
  total_count: number;
}

/**
 * Generate domain knowledge assessment
 * POST /v1/founder/domain-knowledge/{slug}/assessment/generate
 *
 * Uses LLM to generate interesting scenarios from concepts when user_id is provided.
 * Pass user_id to enable LLM-based generation (otherwise falls back to template-based).
 * auto_select: true lets the LLM suggest best concept combinations.
 */
export async function generateDomainKnowledgeAssessment(
  slug: string,
  overrides?: {
    scenario_count?: number;
    max_difficulty?: string;
    concept_filter?: string[];
    auto_select?: boolean;
  },
  userId?: number | null
): Promise<DomainKnowledgeAssessmentGenerateResponse> {
  const params = new URLSearchParams();
  if (userId != null && userId > 0) {
    params.set('user_id', String(userId));
  }
  const query = params.toString();
  const endpoint = `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/assessment/generate${query ? `?${query}` : ''}`;
  return founderClient.post<DomainKnowledgeAssessmentGenerateResponse>(endpoint, overrides ?? undefined);
}

export interface DomainKnowledgeAssessmentStartResponse {
  session_id: string;
  session_url: string;
}

export interface DomainKnowledgeAssessmentEndResponse {
  session_log: string;
}

/**
 * Start a domain knowledge assessment rig session
 * POST /v1/founder/domain-knowledge/{slug}/assessment/start
 *
 * Spawns a container with the scenario setup. Returns session_url for terminal (ttyd).
 */
export async function startDomainKnowledgeAssessment(
  slug: string,
  userId: number,
  scenario: DomainKnowledgeAssessmentScenario
): Promise<DomainKnowledgeAssessmentStartResponse> {
  return founderClient.post<DomainKnowledgeAssessmentStartResponse>(
    `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/assessment/start`,
    { user_id: userId, scenario }
  );
}

/**
 * Verify a domain knowledge assessment submission (LLM-based pass/fail)
 * POST /v1/founder/domain-knowledge/{slug}/assessment/sessions/{session_id}/verify
 * Must be called before End while the container is still running.
 */
export async function verifyDomainKnowledgeAssessment(
  slug: string,
  sessionId: string,
  userId: number,
  scenario: DomainKnowledgeAssessmentScenario
): Promise<DomainKnowledgeAssessmentVerifyResponse> {
  return founderClient.post<DomainKnowledgeAssessmentVerifyResponse>(
    `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/assessment/sessions/${encodeURIComponent(sessionId)}/verify`,
    { user_id: userId, scenario }
  );
}

export interface DomainKnowledgeAssessmentEndRequest {
  user_id: number;
  verify_passed?: boolean;
  verify_score?: number;
  verify_feedback?: string[];
}

/**
 * End a domain knowledge assessment session
 * POST /v1/founder/domain-knowledge/{slug}/assessment/sessions/{session_id}/end
 * Pass verify results when Verify was called before End (recommended flow).
 */
export async function endDomainKnowledgeAssessment(
  slug: string,
  sessionId: string,
  userId: number,
  verifyResult?: { passed: boolean; score: number; feedback: string[] }
): Promise<DomainKnowledgeAssessmentEndResponse> {
  const body: DomainKnowledgeAssessmentEndRequest = { user_id: userId };
  if (verifyResult != null) {
    body.verify_passed = verifyResult.passed;
    body.verify_score = verifyResult.score;
    body.verify_feedback = verifyResult.feedback;
  }
  return founderClient.post<DomainKnowledgeAssessmentEndResponse>(
    `/v1/founder/domain-knowledge/${encodeURIComponent(slug)}/assessment/sessions/${encodeURIComponent(sessionId)}/end`,
    body
  );
}

// ============================================================================
// Export
// ============================================================================

export const knowledgeAPI = {
  getMemoryMatrix,
  getMemoryMatrixConcepts,
  getRetentionCurve,
  getStrengthMatrix,
  getPracticeImpact,
  getLearnerProfile,
  getDomainKnowledgeList,
  getDomainKnowledgeGraph,
  getDomainKnowledgeFounderGraph,
  getDomainKnowledgeMetrics,
  generateDomainKnowledgeAssessment,
  startDomainKnowledgeAssessment,
  verifyDomainKnowledgeAssessment,
  endDomainKnowledgeAssessment
};

export default knowledgeAPI;











