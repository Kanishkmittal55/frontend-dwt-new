/**
 * Enrichment API
 * Handles idea enrichment status and results for Founder OS
 * 
 * Types from OpenAPI spec via: yarn generate:types
 * Zod validation in schemas.ts
 */
import { founderClient } from './founderClient';
import {
  EnrichmentStatusSchema,
  EnrichmentResultSchema,
  type EnrichmentStatus,
  type EnrichmentResult,
  type EnrichmentState,
  parseApiResponse
} from './schemas';

// Re-export types for convenience
export type { EnrichmentStatus, EnrichmentResult, EnrichmentState };

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get enrichment status for an idea
 * GET /v1/founder/ideas/{ideaUUID}/enrichment/status
 * 
 * @param ideaUUID - The UUID of the idea
 * @returns EnrichmentStatus with current state and progress
 */
export async function getEnrichmentStatus(ideaUUID: string): Promise<EnrichmentStatus> {
  const endpoint = `/v1/founder/ideas/${ideaUUID}/enrichment/status`;
  console.log('[enrichmentAPI] getEnrichmentStatus calling:', endpoint);

  const response = await founderClient.get<EnrichmentStatus>(endpoint);
  return parseApiResponse(EnrichmentStatusSchema, response);
}

/**
 * Get full enrichment result for an idea
 * GET /v1/founder/ideas/{ideaUUID}/enrichment
 * 
 * @param ideaUUID - The UUID of the idea
 * @returns EnrichmentResult with scores, facts, recommendations
 */
export async function getEnrichmentResult(ideaUUID: string): Promise<EnrichmentResult> {
  const endpoint = `/v1/founder/ideas/${ideaUUID}/enrichment`;
  console.log('[enrichmentAPI] getEnrichmentResult calling:', endpoint);

  const response = await founderClient.get<EnrichmentResult>(endpoint);
  return parseApiResponse(EnrichmentResultSchema, response);
}

/**
 * Trigger enrichment for an approved idea (if not auto-triggered)
 * POST /v1/founder/ideas/{ideaUUID}/enrichment/trigger
 * 
 * NOTE: This endpoint may not exist yet - enrichment is typically auto-triggered
 * when an idea is approved.
 * 
 * @param ideaUUID - The UUID of the idea to enrich
 * @returns EnrichmentStatus with initial state
 */
export async function triggerEnrichment(ideaUUID: string): Promise<EnrichmentStatus> {
  const endpoint = `/v1/founder/ideas/${ideaUUID}/enrichment/trigger`;
  console.log('[enrichmentAPI] triggerEnrichment calling:', endpoint);

  const response = await founderClient.post<EnrichmentStatus>(endpoint);
  return parseApiResponse(EnrichmentStatusSchema, response);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if enrichment is in a terminal state
 */
export function isEnrichmentComplete(status: EnrichmentStatus): boolean {
  return status.state === 'completed' || 
         status.state === 'failed' || 
         status.state === 'blocked';
}

/**
 * Check if enrichment is actively processing
 */
export function isEnrichmentProcessing(status: EnrichmentStatus): boolean {
  return ['queued', 'processing', 'legal', 'market', 'founder', 'aggregating'].includes(status.state);
}

/**
 * Get human-readable label for enrichment state
 */
export function getEnrichmentStateLabel(state: EnrichmentState): string {
  const labels: Record<EnrichmentState, string> = {
    pending: 'Pending',
    queued: 'Queued',
    processing: 'Starting...',
    legal: 'Analyzing Legal...',
    market: 'Analyzing Market...',
    founder: 'Analyzing Founder Fit...',
    aggregating: 'Synthesizing Results...',
    completed: 'Complete',
    failed: 'Failed',
    blocked: 'Blocked'
  };
  return labels[state] || state;
}

/**
 * Get color for enrichment state (MUI palette)
 */
export function getEnrichmentStateColor(state: EnrichmentState): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (state) {
    case 'pending':
    case 'queued':
      return 'default';
    case 'processing':
    case 'legal':
    case 'market':
    case 'founder':
    case 'aggregating':
      return 'info';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'blocked':
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Get fit score interpretation
 */
export function interpretFitScore(score: number | null | undefined): {
  label: string;
  color: string;
  description: string;
} {
  if (score === null || score === undefined) {
    return { label: 'Unknown', color: '#9e9e9e', description: 'Score not available' };
  }
  if (score >= 80) {
    return { label: 'Excellent', color: '#2e7d32', description: 'Strong fit across all dimensions' };
  }
  if (score >= 60) {
    return { label: 'Good', color: '#4caf50', description: 'Good fit with minor gaps' };
  }
  if (score >= 40) {
    return { label: 'Moderate', color: '#ff9800', description: 'Some concerns to address' };
  }
  if (score >= 20) {
    return { label: 'Weak', color: '#f57c00', description: 'Significant challenges expected' };
  }
  return { label: 'Poor', color: '#d32f2f', description: 'Major misalignment detected' };
}

// ============================================================================
// Export
// ============================================================================

export const enrichmentAPI = {
  getEnrichmentStatus,
  getEnrichmentResult,
  triggerEnrichment,
  // Helpers
  isEnrichmentComplete,
  isEnrichmentProcessing,
  getEnrichmentStateLabel,
  getEnrichmentStateColor,
  interpretFitScore
};

export default enrichmentAPI;

