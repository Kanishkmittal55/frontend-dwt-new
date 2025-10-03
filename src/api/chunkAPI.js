// Chunks API operations
import { WhyHowClient } from './baseClient';

// Chunks API methods
export const chunkAPI = {
  // Get all chunks
  getChunks: async (params = {}) => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/chunks${queryString ? `?${queryString}` : ''}`);
  },

  // Get a specific chunk
  getChunk: async (chunkId) => {
    const client = new WhyHowClient();
    return client.get(`/chunks/${chunkId}`);
  },

  // Delete a chunk
  deleteChunk: async (chunkId) => {
    const client = new WhyHowClient();
    return client.delete(`/chunks/${chunkId}`);
  },

  // Add chunks to workspace
  addChunks: async (workspaceId, data) => {
    const client = new WhyHowClient();
    return client.post(`/chunks/${workspaceId}`, data);
  },

  // Update chunk
  updateChunk: async (chunkId, workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/chunks/${chunkId}/${workspaceId}`, data);
  },

  // Assign chunks to workspace
  assignChunksToWorkspace: async (workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/chunks/assign/${workspaceId}`, data);
  },

  // Unassign chunks from workspace
  unassignChunksFromWorkspace: async (workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/chunks/unassign/${workspaceId}`, data);
  }
};

export default chunkAPI;
