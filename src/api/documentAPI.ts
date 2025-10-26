// src/api/documentAPI.ts
import { WhyHowClient } from './baseClient';
import type {
  DocumentsResponseWithWorkspaceDetails,
  DocumentsResponse,
  PresignedPostResponse,
  PresignedDownloadResponse,
  ProcessDocumentConfig
} from 'types/document';

export const documentAPI = {
  // Get all documents (optionally filtered via query params)
  getDocuments: async (
    params: Record<string, any> = {}
  ): Promise<DocumentsResponseWithWorkspaceDetails> => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  // Get a specific document by id
  getDocument: async (documentId: string): Promise<DocumentsResponseWithWorkspaceDetails> => {
    const client = new WhyHowClient();
    return client.get(`/documents/${documentId}`);
  },

  // Delete a document
  deleteDocument: async (documentId: string): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.delete(`/documents/${documentId}`);
  },

  // Process a document (optionally with chunk config)
  processDocument: async (
    documentId: string,
    config?: ProcessDocumentConfig
  ): Promise<DocumentsResponseWithWorkspaceDetails> => {
    const client = new WhyHowClient();
    // Send null body when no config (backend accepts null)
    return client.post(`/documents/${documentId}/process`, config ?? null);
  },

  // Update document (workspace-scoped metadata/tags)
  updateDocumentInWorkspace: async (
    documentId: string,
    workspaceId: string,
    data: Record<string, any>
  ): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.put(`/documents/${documentId}/${workspaceId}`, data);
  },

  // Assign documents to workspace
  // (Return type not currently used by your UI; keep it broad to avoid breakage.)
  assignDocumentsToWorkspace: async (
    workspaceId: string,
    documentIds: string[]
  ): Promise<any> => {
    const client = new WhyHowClient();
    return client.put(`/documents/assign/${workspaceId}`, documentIds);
  },

  // Unassign documents from workspace
  unassignDocumentsFromWorkspace: async (
    workspaceId: string,
    documentIds: string[]
  ): Promise<any> => {
    const client = new WhyHowClient();
    return client.put(`/documents/unassign/${workspaceId}`, documentIds);
  },

  // Generate presigned URL for upload
  generatePresignedPost: async (
    filename: string,
    workspaceId: string
  ): Promise<PresignedPostResponse> => {
    const client = new WhyHowClient();
    return client.post('/documents/generate_presigned', {
      filename,
      workspace_id: workspaceId
    });
  },

  // Generate presigned download URL
  generatePresignedDownload: async (
    documentId: string
  ): Promise<PresignedDownloadResponse> => {
    const client = new WhyHowClient();
    return client.post(`/documents/${documentId}/download`, {});
  }
};

export default documentAPI;
