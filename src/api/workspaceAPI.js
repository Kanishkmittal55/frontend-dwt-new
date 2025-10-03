// Workspace API operations
import { WhyHowClient } from './baseClient';

// Workspace API methods
export const workspaceAPI = {
  // Get all workspaces
  getWorkspaces: async () => {
    const client = new WhyHowClient();
    return client.get('/workspaces');
  },

  // Create a new workspace
  createWorkspace: async (data) => {
    const client = new WhyHowClient();
    return client.post('/workspaces', data);
  },

  // Get a specific workspace
  getWorkspace: async (workspaceId) => {
    const client = new WhyHowClient();
    return client.get(`/workspaces/${workspaceId}`);
  },

  // Update a workspace
  updateWorkspace: async (workspaceId, data) => {
    const client = new WhyHowClient();
    return client.put(`/workspaces/${workspaceId}`, data);
  },

  // Delete a workspace
  deleteWorkspace: async (workspaceId) => {
    const client = new WhyHowClient();
    return client.delete(`/workspaces/${workspaceId}`);
  },

  // Get workspace tags
  getWorkspaceTags: async (workspaceId) => {
    const client = new WhyHowClient();
    return client.get(`/workspaces/${workspaceId}/tags`);
  }
};

export default workspaceAPI;
