// src/contexts/WorkspaceContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { workspaceAPI } from 'api/workspaceAPI';
import { documentAPI } from 'api/documentAPI';
import { chunkAPI } from 'api/chunkAPI';
import { schemaAPI } from 'api/schemaAPI';
import { graphAPI } from 'api/graphAPI';
import type { Workspace, WorkspaceStats, WorkspaceContextValue } from 'types/workspace';

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) {
      setWorkspace(null);
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch workspace details
      const response = await workspaceAPI.getWorkspaces();
      const ws = response.workspaces.find((w) => w._id === workspaceId);
      
      if (!ws) {
        throw new Error(`Workspace ${workspaceId} not found`);
      }
      
      setWorkspace(ws);

      // Fetch counts using workspace_id query parameter
      const [documentsRes, chunksRes, schemasRes, graphsRes] = await Promise.allSettled([
        documentAPI.getDocuments({ workspace_id: workspaceId }),
        chunkAPI.getChunks({ workspace_id: workspaceId }),
        schemaAPI.getSchemas({ workspace_id: workspaceId }),
        graphAPI.getGraphs({ workspace_id: workspaceId })
      ]);

      // Use .count from API response if available, otherwise fallback to array length
      setStats({
        documents: documentsRes.status === 'fulfilled' 
          ? (documentsRes.value.count ?? documentsRes.value.documents?.length ?? 0) 
          : 0,
        chunks: chunksRes.status === 'fulfilled' 
          ? (chunksRes.value.count ?? chunksRes.value.chunks?.length ?? 0) 
          : 0,
        schemas: schemasRes.status === 'fulfilled' 
          ? (schemasRes.value.count ?? schemasRes.value.schemas?.length ?? 0) 
          : 0,
        graphs: graphsRes.status === 'fulfilled' 
          ? (graphsRes.value.count ?? graphsRes.value.graphs?.length ?? 0) 
          : 0
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workspace';
      setError(message);
      setWorkspace(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      workspaceId: workspaceId ?? null,
      stats,
      loading,
      error,
      refetch: fetchWorkspace
    }),
    [workspace, workspaceId, stats, loading, error, fetchWorkspace]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  
  return context;
}