// src/tests/api/load_data.integration.test.js
import { describe, it, expect, afterAll } from 'vitest';
import { WhyHowClient } from '../../api/baseClient';
import { workspaceAPI } from '../../api/workspaceAPI';

describe('Integration: Demo Data Loading', () => {
  const createdWorkspaceIds = [];

  afterAll(async () => {
    // Cleanup: delete all demo workspaces created during tests
    for (const id of createdWorkspaceIds) {
      try {
        await workspaceAPI.deleteWorkspace(id);
        console.log(`Cleaned up demo workspace: ${id}`);
      } catch (error) {
        console.error(`Failed to cleanup workspace ${id}:`, error.message);
      }
    }
  });

  it('should load demo workspace with all data', async () => {
    const client = new WhyHowClient();
    const response = await client.loadDemoData();

    expect(response.status).toBe('success');
    expect(response.message).toBe('Demo workspace successfully created.');
    expect(response.count).toBe(1);
  });

  it('should verify demo workspace exists in workspace list', async () => {
    const response = await workspaceAPI.getWorkspaces();

    expect(response.status).toBe('success');
    expect(response.workspaces).toBeDefined();
    
    // Find all demo workspaces
    const demoWorkspaces = response.workspaces.filter(w => 
      w.name.toLowerCase().includes('demo')
    );
    
    expect(demoWorkspaces.length).toBeGreaterThan(0);
    
    // Track for cleanup
    demoWorkspaces.forEach(ws => {
      if (!createdWorkspaceIds.includes(ws._id)) {
        createdWorkspaceIds.push(ws._id);
      }
    });
  });

  it('should verify demo workspace has tags', async () => {
    const response = await workspaceAPI.getWorkspaces();
    const demoWorkspace = response.workspaces.find(w => 
      w.name.toLowerCase().includes('demo')
    );

    if (!demoWorkspace) {
      throw new Error('Demo workspace not found');
    }

    const tagsResponse = await workspaceAPI.getWorkspaceTags(demoWorkspace._id);

    expect(tagsResponse.status).toBe('success');
    expect(tagsResponse.workspace_id).toBe(demoWorkspace._id);
    expect(Array.isArray(tagsResponse.tags)).toBe(true);
    // Demo data has empty tags by default
  });

  it.skip('should allow creating multiple demo workspaces', async () => {
    // Skipping - requires unique workspace names or backend fix
  });
});