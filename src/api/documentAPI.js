// Documents API operations
import { WhyHowClient } from './baseClient';

// Documents API methods
export const documentAPI = {
  // Get all documents
  getDocuments: async (params = {}) => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  // Get a specific document
  getDocument: async (documentId) => {
    const client = new WhyHowClient();
    return client.get(`/documents/${documentId}`);
  },

  // Delete a document
  deleteDocument: async (documentId) => {
    const client = new WhyHowClient();
    return client.delete(`/documents/${documentId}`);
  },

  // Process document
  processDocument: async (documentId) => {
    const client = new WhyHowClient();
    return client.post(`/documents/${documentId}/process`, {});
  },

  // Update document in workspace
  updateDocumentInWorkspace: async (documentId, workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/documents/${documentId}/${workspaceId}`, data);
  },

  // Assign documents to workspace
  assignDocumentsToWorkspace: async (workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/documents/assign/${workspaceId}`, data);
  },

  // Unassign documents from workspace
  unassignDocumentsFromWorkspace: async (workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/documents/unassign/${workspaceId}`, data);
  },

  // Generate presigned URL for upload
  generatePresignedPost: async (data) => {
    const client = new WhyHowClient();
    return client.post('/documents/generate_presigned', data);
  },

  // Generate presigned download URL
  generatePresignedDownload: async (documentId, data) => {
    const client = new WhyHowClient();
    return client.post(`/documents/${documentId}/download`, data);
  }
};

export default documentAPI;
