// src/types/document.ts

// --- Common/base ---
export type ApiStatus = 'success' | 'error';

// Matches backend File_Extensions literal
export type FileExtension = 'csv' | 'json' | 'pdf' | 'txt';

// Matches backend Document_Status (UI also shows 'pending'/'ready')
export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'pending'
  | 'ready';

// Backend ErrorDetails
export interface ErrorDetails {
  message: string;
  level?: 'info' | 'warning' | 'critical' | 'error';
  details?: string;
}

// From backend schemas.workspaces.WorkspaceDetails
export interface WorkspaceDetails {
  _id: string;
  name: string;
}

// --- Document shapes (mirror Pydantic) ---

export interface DocumentMetadata {
  size: number;
  format: FileExtension; // stricter than plain string, matches backend
  filename: string;
}

// AllowedUserMetadataTypes (frontend-safe)
export type AllowedUserMetadataPrimitive = string | number | boolean | null;
export type AllowedUserMetadataValue =
  | AllowedUserMetadataPrimitive
  | AllowedUserMetadataPrimitive[];

// user_metadata is workspace-scoped
export type DocumentUserMetadata = Record<
  string, // workspaceId
  Record<string, AllowedUserMetadataValue>
>;

// tags are workspace-scoped
export type DocumentTags = Record<string, string[]>;

/**
 * This matches backend DocumentOutWithWorkspaceDetails.
 * NOTE: `workspaces` are full objects (id+name), not just ids.
 */
export interface Document {
  _id: string;
  created_by: string;
  workspaces: WorkspaceDetails[]; // previously string[] in your local type; components don't rely on it, so this is safe
  status: DocumentStatus;
  errors: ErrorDetails[];
  metadata: DocumentMetadata;
  tags: DocumentTags;
  user_metadata: DocumentUserMetadata;
  created_at: string;
  updated_at?: string;
}

// Upload form type (used by your dialog)
export interface DocumentUploadForm {
  file: File | null;
  tags: string[];
  user_metadata: Record<string, string>;
}

// --- Responses ---

export interface DocumentsResponseWithWorkspaceDetails {
  message: string;
  status: ApiStatus;
  documents: Document[];
  count: number;
}

// Alias to avoid breaking any places that imported `DocumentsResponse`
export type DocumentsResponse = DocumentsResponseWithWorkspaceDetails;

export interface PresignedPostResponse {
  url: string;
  fields: Record<string, string>;
}

export interface PresignedDownloadResponse {
  url: string;
}

// --- Requests ---

export interface ProcessDocumentConfig {
  chunk_size?: number;   // 100..50000 (validated server-side)
  chunk_overlap?: number; // 0..1000 (validated server-side)
}

// (component prop typing)
export interface DocumentCardProps {
  document: Document;
  onView: () => void;
  onProcess: (
    id: string,
    config?: ProcessDocumentConfig
  ) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
}
