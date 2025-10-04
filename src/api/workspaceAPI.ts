// src/api/workspaceAPI.ts
import { WhyHowClient } from './baseClient';
import type { 
  WorkspacesResponse, 
  WorkspaceCreateData, 
  WorkspaceUpdateData,
  WorkspaceTagsResponse 
} from 'types/api';

export const workspaceAPI = {
  // Get all workspaces
  getWorkspaces: async (): Promise<WorkspacesResponse> => {
    const client = new WhyHowClient();
    return client.get('/workspaces');
  },

  // Create a new workspace
  createWorkspace: async (data: WorkspaceCreateData): Promise<WorkspacesResponse> => {
    const client = new WhyHowClient();
    return client.post('/workspaces', data);
  },

  // Get a specific workspace
  getWorkspace: async (workspaceId: string): Promise<WorkspacesResponse> => {
    const client = new WhyHowClient();
    return client.get(`/workspaces/${workspaceId}`);
  },

  // Update a workspace
  updateWorkspace: async (
    workspaceId: string, 
    data: WorkspaceUpdateData
  ): Promise<WorkspacesResponse> => {
    const client = new WhyHowClient();
    return client.put(`/workspaces/${workspaceId}`, data);
  },

  // Delete a workspace
  deleteWorkspace: async (workspaceId: string): Promise<WorkspacesResponse> => {
    const client = new WhyHowClient();
    return client.delete(`/workspaces/${workspaceId}`);
  },

  // Get workspace tags
  getWorkspaceTags: async (workspaceId: string): Promise<WorkspaceTagsResponse> => {
    const client = new WhyHowClient();
    return client.get(`/workspaces/${workspaceId}/tags`);
  }
};

export default workspaceAPI;