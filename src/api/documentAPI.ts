// src/api/documentAPI.ts
import { WhyHowClient } from './baseClient';
import type { 
  DocumentsResponse, 
  PresignedPostResponse, 
  PresignedDownloadResponse 
} from 'types/api';

export const documentAPI = {
  // Get all documents
  getDocuments: async (params: Record<string, any> = {}): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  // Get a specific document
  getDocument: async (documentId: string): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.get(`/documents/${documentId}`);
  },

  // Delete a document
  deleteDocument: async (documentId: string): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.delete(`/documents/${documentId}`);
  },

  // Process document
  processDocument: async (documentId: string): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.post(`/documents/${documentId}/process`, {});
  },

  // Update document in workspace
  updateDocumentInWorkspace: async (
    documentId: string, 
    workspaceId: string, 
    data: Record<string, any>
  ): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.put(`/documents/${documentId}/${workspaceId}`, data);
  },

  // Assign documents to workspace
  assignDocumentsToWorkspace: async (
    workspaceId: string, 
    documentIds: string[]
  ): Promise<DocumentsResponse> => {
    const client = new WhyHowClient();
    return client.put(`/documents/assign/${workspaceId}`, documentIds);
  },

  // Unassign documents from workspace
  unassignDocumentsFromWorkspace: async (
    workspaceId: string, 
    documentIds: string[]
  ): Promise<DocumentsResponse> => {
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
  generatePresignedDownload: async (documentId: string): Promise<PresignedDownloadResponse> => {
    const client = new WhyHowClient();
    return client.post(`/documents/${documentId}/download`, {});
  }
};

export default documentAPI;