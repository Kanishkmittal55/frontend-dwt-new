// src/tests/api/workspaceAPI/workspace.integration.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { workspaceAPI } from '../../api/workspaceAPI';

describe('Integration: Workspace API', () => {
  let createdWorkspaceId;
  const testWorkspaceName = `Test-Workspace-${Date.now()}`;

  describe('Create Workspace', () => {
    it('should create a new workspace', async () => {
      const response = await workspaceAPI.createWorkspace({
        name: testWorkspaceName
      });

      expect(response.status).toBe('success');
      expect(response.message).toBe('Workspace created successfully.');
      expect(response.workspaces[0]._id).toBeDefined();
      expect(response.workspaces[0].name).toBe(testWorkspaceName);
      
      createdWorkspaceId = response.workspaces[0]._id;
    });

    it('should fail to create duplicate workspace', async () => {
      await expect(workspaceAPI.createWorkspace({ name: testWorkspaceName }))
        .rejects.toThrow(/already exists/);
    });
  });

  describe('Get Workspaces', () => {
    it('should retrieve all workspaces', async () => {
      const response = await workspaceAPI.getWorkspaces();

      expect(response.status).toBe('success');
      expect(response.workspaces).toBeDefined();
      expect(Array.isArray(response.workspaces)).toBe(true);
      expect(response.count).toBeGreaterThan(0);
    });
  });

  describe('Get Single Workspace', () => {
    it('should retrieve workspace by id', async () => {
      const response = await workspaceAPI.getWorkspace(createdWorkspaceId);

      expect(response.status).toBe('success');
      expect(response.workspaces[0]._id).toBe(createdWorkspaceId);
      expect(response.workspaces[0].name).toBe(testWorkspaceName);
    });

    it('should fail with invalid workspace id', async () => {
      await expect(workspaceAPI.getWorkspace('invalid-id'))
        .rejects.toThrow(/Invalid workspace id/);
    });

    it('should fail with non-existent workspace id', async () => {
      await expect(workspaceAPI.getWorkspace('507f1f77bcf86cd799439011'))
        .rejects.toThrow(/Workspace not found/);
    });
  });

  describe('Update Workspace', () => {
    const updatedName = `Updated-${testWorkspaceName}`;

    it('should update workspace name', async () => {
      const response = await workspaceAPI.updateWorkspace(createdWorkspaceId, {
        name: updatedName
      });

      expect(response.status).toBe('success');
      expect(response.message).toBe('Workspace updated successfully.');
      expect(response.workspaces[0].name).toBe(updatedName);
    });

    it('should fail to update with invalid id', async () => {
      await expect(workspaceAPI.updateWorkspace('invalid-id', { name: 'Test' }))
        .rejects.toThrow(/Invalid workspace id|Workspace not found/);
    });
  });

  describe('Get Workspace Tags', () => {
    it('should retrieve workspace tags', async () => {
      const response = await workspaceAPI.getWorkspaceTags(createdWorkspaceId);

      console.log("Workspace tags: ", JSON.stringify(response, null, 2))

      expect(response.status).toBe('success');
      expect(response.workspace_id).toBe(createdWorkspaceId);
      expect(Array.isArray(response.tags)).toBe(true);
    });

    it('should fail with invalid workspace id', async () => {
      await expect(workspaceAPI.getWorkspaceTags('invalid-id'))
        .rejects.toThrow();
    });
  });

  describe('Delete Workspace', () => {
    it('should delete workspace', async () => {
      const response = await workspaceAPI.deleteWorkspace(createdWorkspaceId);

      expect(response.status).toBe('success');
      expect(response.message).toBe('Workspace deleted successfully.');
    });

    it('should confirm workspace is deleted', async () => {
      await expect(workspaceAPI.getWorkspace(createdWorkspaceId))
        .rejects.toThrow(/Workspace not found|Invalid workspace id/);
    });

    it('should fail to delete already deleted workspace', async () => {
      await expect(workspaceAPI.deleteWorkspace(createdWorkspaceId))
        .rejects.toThrow(/Workspace not found|Invalid workspace id/);
    });
  });
});