// Nodes API operations
import { WhyHowClient } from './baseClient';

// Nodes API methods
export const nodeAPI = {
  // Create a new node
  createNode: async (data) => {
    const client = new WhyHowClient();
    return client.post('/nodes', data);
  },

  // Get all nodes
  getNodes: async (params = {}) => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/nodes${queryString ? `?${queryString}` : ''}`);
  },

  // Get a specific node
  getNode: async (nodeId) => {
    const client = new WhyHowClient();
    return client.get(`/nodes/${nodeId}`);
  },

  // Update a node
  updateNode: async (nodeId, data) => {
    const client = new WhyHowClient();
    return client.put(`/nodes/${nodeId}`, data);
  },

  // Delete a node
  deleteNode: async (nodeId) => {
    const client = new WhyHowClient();
    return client.delete(`/nodes/${nodeId}`);
  },

  // Get node with chunks
  getNodeWithChunks: async (nodeId) => {
    const client = new WhyHowClient();
    return client.get(`/nodes/${nodeId}/chunks`);
  }
};

export default nodeAPI;
