/**
 * Ideas API
 * Handles idea submission, review, and retrieval for Founder OS
 */
import { founderClient } from './founderClient';
import type { components } from '@/types/api.gen';
import {
  PendingIdeasResponseSchema,
  IdeaResponseSchema,
  ReviewIdeaRequestSchema,
  type PendingIdeasResponse,
  type IdeaResponse,
  type ReviewDecision,
  parseApiResponse
} from './schemas';

// ============================================================================
// Types from OpenAPI
// ============================================================================

// Re-export types for convenience
export type { IdeaResponse, PendingIdeasResponse, ReviewDecision };

export interface ReviewIdeaRequest {
  decision: ReviewDecision;
  notes?: string;
}

export interface SubmitIdeaRequest {
  title: string;
  description: string;
  problem_statement?: string;
  target_audience?: string;
  industry?: string;
  priority?: number;
  user_id: number;
}

export interface SubmitTextRequest {
  text: string;
}

export interface ChunksResponse {
  chunks?: Array<{
    chunk_id?: string;
    text?: string;
    metadata?: Record<string, unknown>;
  }>;
  message?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get ideas pending founder review
 * GET /v1/founder/{userID}/ideas/pending
 * 
 * @param userID - The founder's user ID
 * @param limit - Number of ideas to return (default 10, max 50)
 * @param offset - Offset for pagination (default 0)
 * @returns PendingIdeasResponse with list of ideas and pagination info
 */
export async function getPendingIdeas(
  userID: number,
  limit: number = 10,
  offset: number = 0
): Promise<PendingIdeasResponse> {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });

  const endpoint = `/v1/founder/${userID}/ideas/pending?${queryParams.toString()}`;
  console.log('[ideasAPI] getPendingIdeas calling:', endpoint);

  const response = await founderClient.get<PendingIdeasResponse>(endpoint);
  
  console.log('[ideasAPI] Raw response:', response);

  // Validate response with Zod schema
  const validated = parseApiResponse(PendingIdeasResponseSchema, response);
  console.log('[ideasAPI] Validated response:', validated);
  
  return validated;
}

/**
 * Submit a review decision for an idea
 * POST /v1/founder/{userID}/ideas/{ideaUUID}/review
 * 
 * @param userID - The founder's user ID
 * @param ideaUUID - The UUID of the idea to review
 * @param decision - Review decision: 'approved', 'rejected', or 'deferred'
 * @param notes - Optional review notes
 * @returns Updated IdeaResponse
 */
export async function submitReview(
  userID: number,
  ideaUUID: string,
  decision: ReviewDecision,
  notes?: string
): Promise<IdeaResponse> {
  // Validate request before sending
  const requestBody: ReviewIdeaRequest = { decision };
  if (notes) {
    requestBody.notes = notes;
  }
  parseApiResponse(ReviewIdeaRequestSchema, requestBody);

  const response = await founderClient.post<IdeaResponse>(
    `/v1/founder/${userID}/ideas/${ideaUUID}/review`,
    requestBody
  );

  // Validate response
  return parseApiResponse(IdeaResponseSchema, response);
}

/**
 * Approve an idea (convenience method)
 */
export async function approveIdea(
  userID: number,
  ideaUUID: string,
  notes?: string
): Promise<IdeaResponse> {
  return submitReview(userID, ideaUUID, 'approved', notes);
}

/**
 * Reject an idea (convenience method)
 */
export async function rejectIdea(
  userID: number,
  ideaUUID: string,
  notes?: string
): Promise<IdeaResponse> {
  return submitReview(userID, ideaUUID, 'rejected', notes);
}

/**
 * Defer an idea for later review (convenience method)
 */
export async function deferIdea(
  userID: number,
  ideaUUID: string,
  notes?: string
): Promise<IdeaResponse> {
  return submitReview(userID, ideaUUID, 'deferred', notes);
}

/**
 * Submit text to be processed and converted to idea chunks
 * 
 * @deprecated Use submitTextForProcessing from uploadAPI instead.
 * This function now redirects to the upload API flow:
 * 1. Uploads text as file to S3
 * 2. Starts scraper job to process
 * 
 * @param text - The text content to process (from PDF OCR, pitch deck, etc.)
 * @returns ChunksResponse (empty, actual processing happens async)
 */
export async function submitTextForIdeas(text: string): Promise<ChunksResponse> {
  // Import dynamically to avoid circular deps
  const { submitTextForProcessing } = await import('./uploadAPI');
  const { getStoredUserId } = await import('./founderClient');
  
  const userId = getStoredUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  // Use new upload flow
  await submitTextForProcessing(userId, text, 'idea-text');
  
  // Return empty response - processing happens async
  return { chunks: [], message: 'Processing started' };
}

/**
 * Get a single idea by UUID
 * Note: Uses the pending ideas endpoint and filters locally
 * (No direct GET /v1/ideas/{uuid} in founder namespace)
 * 
 * @param userID - The founder's user ID
 * @param ideaUUID - The UUID of the idea
 * @param limit - Search limit (default 50 to increase chance of finding)
 * @returns IdeaResponse or null if not found
 */
export async function getIdeaByUuid(
  userID: number,
  ideaUUID: string,
  limit: number = 50
): Promise<IdeaResponse | null> {
  try {
    const response = await getPendingIdeas(userID, limit, 0);
    const idea = response.ideas.find(i => i.uuid === ideaUUID);
    return idea || null;
  } catch (error) {
    const apiError = error as { status?: number };
    if (apiError.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get count of pending ideas for a founder
 * Useful for showing badge count in navigation
 * 
 * @param userID - The founder's user ID
 * @returns Number of pending ideas
 */
export async function getPendingIdeasCount(userID: number): Promise<number> {
  const response = await getPendingIdeas(userID, 1, 0); // Minimal fetch
  return response.total;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an idea is in a reviewable state
 */
export function isReviewable(idea: IdeaResponse): boolean {
  return idea.workflow_stage === 'ready_for_review' || 
         idea.workflow_stage === 'enriched';
}

/**
 * Check if an idea is currently being enriched
 */
export function isEnriching(idea: IdeaResponse): boolean {
  return idea.workflow_stage === 'enriching' || 
         idea.workflow_stage === 'pending_enrichment';
}

/**
 * Get a human-readable status for an idea
 */
export function getIdeaStatusLabel(idea: IdeaResponse): string {
  switch (idea.workflow_stage) {
    case 'pending_enrichment':
      return 'Queued for Research';
    case 'enriching':
      return 'Researching...';
    case 'enriched':
      return 'Research Complete';
    case 'ready_for_review':
      return 'Ready for Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'deferred':
      return 'Deferred';
    case 'analyzing':
      return 'Analyzing...';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Research Failed';
    default:
      return idea.status;
  }
}

/**
 * Get color for workflow stage (for UI badges)
 */
export function getWorkflowStageColor(stage: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (stage) {
    case 'pending_enrichment':
      return 'default';
    case 'enriching':
    case 'analyzing':
      return 'info';
    case 'enriched':
    case 'ready_for_review':
      return 'primary';
    case 'approved':
    case 'completed':
      return 'success';
    case 'rejected':
    case 'failed':
      return 'error';
    case 'deferred':
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Get fit score color based on value (0-100)
 */
export function getFitScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#9e9e9e'; // grey
  if (score >= 70) return '#4caf50'; // green
  if (score >= 40) return '#ff9800'; // orange
  return '#f44336'; // red
}

// ============================================================================
// Export
// ============================================================================

export const ideasAPI = {
  getPendingIdeas,
  submitReview,
  approveIdea,
  rejectIdea,
  deferIdea,
  submitTextForIdeas,
  getIdeaByUuid,
  getPendingIdeasCount,
  // Helpers
  isReviewable,
  isEnriching,
  getIdeaStatusLabel,
  getWorkflowStageColor,
  getFitScoreColor
};

export default ideasAPI;

