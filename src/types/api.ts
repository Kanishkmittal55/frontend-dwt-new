// src/types/api.ts

// Import domain types from their respective files
import type { Document } from './document';
import type { Workspace } from './workspace';

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
// DOCUMENT API TYPES
// ============================================================================

export interface DocumentsResponse extends APIResponse {
  documents: Document[];
}

export interface PresignedPostResponse {
  url: string;
  fields: Record<string, string>;
}

export interface PresignedDownloadResponse {
  url: string;
}

export interface DocumentAssignmentRequest {
  document_ids: string[];
}

export interface DocumentUpdateRequest {
  tags?: string[];
  user_metadata?: Record<string, any>;
}