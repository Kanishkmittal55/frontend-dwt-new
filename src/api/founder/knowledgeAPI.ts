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
// Export
// ============================================================================

export const knowledgeAPI = {
  getMemoryMatrix,
  getMemoryMatrixConcepts,
  getRetentionCurve,
  getStrengthMatrix,
  getPracticeImpact,
  getLearnerProfile
};

export default knowledgeAPI;




