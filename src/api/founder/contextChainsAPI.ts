/**
 * Context Chains API (CoFounders dashboard)
 * HTTP client for context chain CRUD and preview
 */
import { founderClient, getStoredUserId } from './founderClient';
import {
  CreateContextChainRequestSchema,
  UpdateContextChainRequestSchema,
  type CreateContextChainRequest,
  type UpdateContextChainRequest
} from './schemas';
import type { components } from '@/types/api.gen';

// ============================================================================
// Types from OpenAPI
// ============================================================================

export type ContextChainResponse = components['schemas']['ContextChainResponse'];
export type ContextChainListResponse = components['schemas']['ContextChainListResponse'];
export type ContextChainDetailResponse = components['schemas']['ContextChainDetailResponse'];
export type ContextChainNodeResponse = components['schemas']['ContextChainNodeResponse'];
export type ContextChainEdgeResponse = components['schemas']['ContextChainEdgeResponse'];
export type ContextChainPreviewResponse = components['schemas']['ContextChainPreviewResponse'];
export type ContextChainPreviewEncounter = components['schemas']['ContextChainPreviewEncounter'];
export type ContextChainPreviewAgentConfig = components['schemas']['ContextChainPreviewAgentConfig'];

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get context chain preview for a user
 * GET /v1/context/chain?user_id=&goal_id?&task_type?
 */
export async function getContextChainPreview(
  userId: number,
  params?: { goal_id?: string; task_type?: string }
): Promise<ContextChainPreviewResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('user_id', String(userId));
  if (params?.goal_id) searchParams.set('goal_id', params.goal_id);
  if (params?.task_type) searchParams.set('task_type', params.task_type);
  const query = searchParams.toString();
  const endpoint = `/v1/context/chain?${query}`;
  return founderClient.get<ContextChainPreviewResponse>(endpoint);
}

/**
 * Get all context chains
 * GET /v1/context/chains
 */
export async function getContextChainsList(): Promise<ContextChainListResponse> {
  return founderClient.get<ContextChainListResponse>('/v1/context/chains');
}

/**
 * Get context chain by UUID (with nodes and edges)
 * GET /v1/context/chains/{uuid}
 */
export async function getContextChainByUuid(uuid: string): Promise<ContextChainDetailResponse> {
  return founderClient.get<ContextChainDetailResponse>(
    `/v1/context/chains/${encodeURIComponent(uuid)}`
  );
}

/**
 * Create context chain
 * POST /v1/context/chains
 */
export async function createContextChain(
  body: CreateContextChainRequest
): Promise<ContextChainResponse> {
  CreateContextChainRequestSchema.parse(body);
  return founderClient.post<ContextChainResponse>('/v1/context/chains', body);
}

/**
 * Update context chain
 * PUT /v1/context/chains/{uuid}
 */
export async function updateContextChain(
  uuid: string,
  body: UpdateContextChainRequest
): Promise<ContextChainResponse> {
  UpdateContextChainRequestSchema.parse(body);
  return founderClient.put<ContextChainResponse>(
    `/v1/context/chains/${encodeURIComponent(uuid)}`,
    body
  );
}

/**
 * Delete context chain
 * DELETE /v1/context/chains/{uuid}
 */
export async function deleteContextChain(uuid: string): Promise<void> {
  await founderClient.delete(`/v1/context/chains/${encodeURIComponent(uuid)}`);
}

/**
 * Get stored user ID for preview (current user)
 */
export function getCurrentUserId(): number | null {
  return getStoredUserId();
}
