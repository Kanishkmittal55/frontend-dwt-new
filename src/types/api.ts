// src/types/api.ts

// Import domain types from their respective files
import type { Document } from './document';
import type { Workspace } from './workspace';
// import { Chunk } from './chunk';

// ============================================================================
// BASE API TYPES
// ============================================================================

export interface APIResponse<T = any> {
  message?: string;
  status?: string;
  count?: number;
  data?: T;
}

// ============================================================================
// WORKSPACE API TYPES
// ============================================================================

export interface WorkspaceCreateData {
  name: string;
  description?: string;
}

export interface WorkspaceUpdateData {
  name?: string;
  description?: string;
}

export interface WorkspacesResponse extends APIResponse {
  workspaces: Workspace[];
}

export interface WorkspaceTagsResponse extends APIResponse {
  workspace_id: string;
  tags: string[];
}

// ============================================================================
// CHUNK API TYPES
// ============================================================================

export type ApiStatus = 'success' | 'error';

export interface ChunkBaseResponse {
  message: string;
  status: ApiStatus;
  count: number;
}

/**
 * When workspace_id is supplied in GET /chunks:
 *   - tags: string[]
 *   - user_metadata: Record<string, unknown>
 *
 * Without workspace_id:
 *   - tags: Record<workspaceId, string[]>
 *   - user_metadata: Record<workspaceId, Record<string, unknown>>
 */
export type ChunkTags = string[] | Record<string, string[]>;
export type ChunkUserMetadata =
  | Record<string, unknown>
  | Record<string, Record<string, unknown>>;

export interface WorkspaceRef {
  _id: string;
  name: string;
}

export interface DocumentRef {
  _id: string;
  filename: string;
}

export interface Chunk {
  _id: string;
  workspaces: WorkspaceRef[];
  document?: DocumentRef | null;
  data_type: 'string' | 'object';
  content: string | Record<string, unknown>;
  metadata: {
    language?: string;
    length?: number | null;
    size?: number | null;
    data_source_type?: 'manual' | 'automatic' | 'external' | null;
    index?: number | null;
    page?: number | null;
    start?: number | null;
    end?: number | null;
  };
  tags: ChunkTags;                 // list OR dict (depends on filter)
  user_metadata: ChunkUserMetadata; // object OR dict (depends on filter)
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface GetChunksParams {
  skip?: number;
  limit?: number;                 // -1 allowed for "no limit" (backend treats it specially)
  order?: 1 | -1;
  data_type?: 'string' | 'object';
  workspace_id?: string;
  workspace_name?: string;
  document_id?: string;
  document_filename?: string;
  include_embeddings?: boolean;
}

export interface GetChunksResponse extends ChunkBaseResponse {
  chunks: Chunk[];
}

export interface GetChunkResponse extends ChunkBaseResponse {
  // Backend wraps single chunk in a list
  chunks: Chunk[];
}

export interface AddChunksRequest {
  chunks: Array<{
    content: string | Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    // When creating, tags are a *list* (scoped to the provided workspace)
    tags?: string[];
  }>;
}

export interface AddChunksResponse extends ChunkBaseResponse {
  chunks: Chunk[];
}

/**
 * Only workspace-level fields (tags, user_metadata) are updatable;
 * not content.
 */
export interface UpdateChunkRequest {
  tags?: string[];
  user_metadata?: Record<string, unknown>;
}

export interface UpdateChunkResponse extends ChunkBaseResponse {
  // Backend returns list even for single update
  chunks: Chunk[];
}

export interface DeleteChunkResponse extends ChunkBaseResponse {
  // Backend returns deleted chunk in list
  chunks: Chunk[];
}

// ---------------------------
// Assign / Unassign
// ---------------------------
// ✅ Backend expects a raw array of chunk IDs as the request body.
export type AssignChunksRequest = string[];
export type UnassignChunksRequest = string[];

export interface ChunkAssignments {
  assigned: string[];
  already_assigned: string[];
  not_found: string[];
}

export interface ChunkUnassignments {
  unassigned: string[];
  not_found: string[];
  not_found_in_workspace: string[];
}

export interface AssignChunksResponse extends ChunkBaseResponse {
  chunks: ChunkAssignments;
}

export interface UnassignChunksResponse extends ChunkBaseResponse {
  chunks: ChunkUnassignments;
}

export interface GetChunksParams {
  skip?: number;
  limit?: number;                  // -1 allowed for "no limit" (backend treats specially)
  order?: 1 | -1;                  // 1=ascending, -1=descending
  data_type?: 'string' | 'object';
  workspace_id?: string;
  workspace_name?: string;
  document_id?: string;
  document_filename?: string;
  include_embeddings?: boolean;
  /** Optional: backend will ignore if not supported yet */
  seed_concept?: string;
}

export type ServerFilters = Omit<GetChunksParams,
  'skip' | 'limit' | 'workspace_id'
> & {
  order?: 1 | -1;
  seed_concept?: string;
};