/**
 * Agents API (CoFounders dashboard)
 * HTTP client for agent list, config, prompts, sessions
 */
import { founderClient } from './founderClient';
import {
  AgentListResponseSchema,
  AgentDetailResponseSchema,
  AgentConfigResponseSchema,
  AgentPromptListResponseSchema,
  AgentSessionsListResponseSchema,
  AgentPromptResponseSchema,
  UpsertAgentConfigRequestSchema,
  CreateAgentPromptRequestSchema,
  UpdateAgentPromptRequestSchema,
  parseApiResponse,
  type AgentListResponse,
  type AgentDetailResponse,
  type AgentConfigResponse,
  type AgentPromptListResponse,
  type AgentSessionsListResponse,
  type AgentPromptResponse,
  type UpsertAgentConfigRequest,
  type CreateAgentPromptRequest,
  type UpdateAgentPromptRequest
} from './schemas';

// ============================================================================
// Re-export types
// ============================================================================

export type {
  AgentListResponse,
  AgentDetailResponse,
  AgentConfigResponse,
  AgentPromptListResponse,
  AgentSessionsListResponse,
  AgentPromptResponse,
  UpsertAgentConfigRequest,
  CreateAgentPromptRequest,
  UpdateAgentPromptRequest
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all agents
 * GET /v1/agents
 */
export async function getAgentsList(): Promise<AgentListResponse> {
  const response = await founderClient.get<AgentListResponse>('/v1/agents');
  return parseApiResponse(AgentListResponseSchema, response);
}

/**
 * Get agent by ID (detail with config)
 * GET /v1/agents/{agent_id}
 */
export async function getAgentById(agentId: string): Promise<AgentDetailResponse> {
  const response = await founderClient.get<AgentDetailResponse>(
    `/v1/agents/${encodeURIComponent(agentId)}`
  );
  return parseApiResponse(AgentDetailResponseSchema, response);
}

/**
 * Get agent config
 * GET /v1/agents/{agent_id}/config
 */
export async function getAgentConfig(agentId: string): Promise<AgentConfigResponse> {
  const response = await founderClient.get<AgentConfigResponse>(
    `/v1/agents/${encodeURIComponent(agentId)}/config`
  );
  return parseApiResponse(AgentConfigResponseSchema, response);
}

/**
 * Update agent config
 * PUT /v1/agents/{agent_id}/config
 * Note: Config changes require backend restart to take effect.
 */
export async function putAgentConfig(
  agentId: string,
  body: UpsertAgentConfigRequest
): Promise<AgentConfigResponse> {
  UpsertAgentConfigRequestSchema.parse(body);
  const response = await founderClient.put<AgentConfigResponse>(
    `/v1/agents/${encodeURIComponent(agentId)}/config`,
    body
  );
  return parseApiResponse(AgentConfigResponseSchema, response);
}

/**
 * Get agent prompts list
 * GET /v1/agents/prompts
 */
export async function getAgentPromptsList(params?: {
  agent_id?: string;
  task_type?: string;
}): Promise<AgentPromptListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.agent_id) searchParams.set('agent_id', params.agent_id);
  if (params?.task_type) searchParams.set('task_type', params.task_type);
  const query = searchParams.toString();
  const endpoint = query ? `/v1/agents/prompts?${query}` : '/v1/agents/prompts';
  const response = await founderClient.get<AgentPromptListResponse>(endpoint);
  return parseApiResponse(AgentPromptListResponseSchema, response);
}

/**
 * Search agent prompts
 * GET /v1/agents/prompts/search?q=
 */
export async function searchAgentPrompts(q: string): Promise<AgentPromptListResponse> {
  const response = await founderClient.get<AgentPromptListResponse>(
    `/v1/agents/prompts/search?q=${encodeURIComponent(q)}`
  );
  return parseApiResponse(AgentPromptListResponseSchema, response);
}

/**
 * Get agent prompt by key
 * GET /v1/agents/prompts/{prompt_key}
 */
export async function getAgentPromptByKey(promptKey: string): Promise<AgentPromptResponse> {
  const response = await founderClient.get<AgentPromptResponse>(
    `/v1/agents/prompts/${encodeURIComponent(promptKey)}`
  );
  return parseApiResponse(AgentPromptResponseSchema, response);
}

/**
 * Create agent prompt
 * POST /v1/agents/prompts
 */
export async function createAgentPrompt(body: CreateAgentPromptRequest): Promise<AgentPromptResponse> {
  CreateAgentPromptRequestSchema.parse(body);
  const response = await founderClient.post<AgentPromptResponse>('/v1/agents/prompts', body);
  return parseApiResponse(AgentPromptResponseSchema, response);
}

/**
 * Update agent prompt
 * PUT /v1/agents/prompts/{prompt_key}
 */
export async function putAgentPrompt(
  promptKey: string,
  body: UpdateAgentPromptRequest
): Promise<AgentPromptResponse> {
  UpdateAgentPromptRequestSchema.parse(body);
  const response = await founderClient.put<AgentPromptResponse>(
    `/v1/agents/prompts/${encodeURIComponent(promptKey)}`,
    body
  );
  return parseApiResponse(AgentPromptResponseSchema, response);
}

/**
 * Delete agent prompt
 * DELETE /v1/agents/prompts/{prompt_key}
 */
export async function deleteAgentPrompt(promptKey: string): Promise<void> {
  await founderClient.delete(`/v1/agents/prompts/${encodeURIComponent(promptKey)}`);
}

/**
 * Get active agent sessions
 * GET /v1/agents/sessions
 */
export async function getAgentSessions(): Promise<AgentSessionsListResponse> {
  const response = await founderClient.get<AgentSessionsListResponse>('/v1/agents/sessions');
  return parseApiResponse(AgentSessionsListResponseSchema, response);
}

/**
 * Get agent session by user
 * GET /v1/agents/sessions/{user_id}
 */
export async function getAgentSessionByUser(userId: number): Promise<AgentSessionsListResponse['sessions'][0] | null> {
  try {
    const response = await founderClient.get<AgentSessionsListResponse['sessions'][0]>(
      `/v1/agents/sessions/${userId}`
    );
    return response;
  } catch {
    return null;
  }
}
