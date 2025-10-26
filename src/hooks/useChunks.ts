// src/hooks/useChunks.ts
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { chunkAPI } from 'api/chunkAPI';
import { workspaceAPI } from 'api/workspaceAPI';

// ✅ Use API shapes as the single source of truth
import type { Chunk, WorkspaceRef, GetChunksParams } from 'types/api';

export interface ServerFilters {
  data_type?: 'string' | 'object';
  order?: 1 | -1;
  document_id?: string;
  document_filename?: string;
  seed_concept?: string;        // optional semantic search
  include_embeddings?: boolean; // careful with payload sizes
}

export const useChunks = (
  workspaceIdOverride?: string | null,
  serverFilters: ServerFilters = {}
) => {
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState(0);

  // Prefer explicit override (can be null -> no filtering), else URL param
  const workspaceId = workspaceIdOverride !== undefined ? workspaceIdOverride : urlWorkspaceId;

  const fetchChunks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const LIMIT = 50; // backend max page size
      let all: Chunk[] = [];
      let skip = 0;
      let total = 0;

      const base: GetChunksParams = {
        skip,
        limit: LIMIT,
        order: serverFilters.order ?? -1,
        data_type: serverFilters.data_type,
        document_id: serverFilters.document_id,
        document_filename: serverFilters.document_filename,
        include_embeddings: serverFilters.include_embeddings,
        seed_concept: serverFilters.seed_concept, // ignored if unsupported
        ...(workspaceId ? { workspace_id: workspaceId } : {})
      };

      while (true) {
        const page = await chunkAPI.getChunks({ ...base, skip });
        const batch = page.chunks || [];
        all = all.concat(batch);

        if (skip === 0) total = page.count ?? batch.length;
        if (batch.length < LIMIT || all.length >= total) break;

        skip += LIMIT;
      }

      setChunks(all);
      setTotalChunks(total || all.length);
    } catch (err: any) {
      console.error('Error fetching chunks:', err);
      setError(err.message || 'Failed to fetch chunks');
      setChunks([]);
      setTotalChunks(0);
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId,
    serverFilters.data_type,
    serverFilters.order,
    serverFilters.document_id,
    serverFilters.document_filename,
    serverFilters.include_embeddings,
    serverFilters.seed_concept
  ]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await workspaceAPI.getWorkspaces();
      // Normalize to WorkspaceRef (only what the UI needs)
      const ws: WorkspaceRef[] = (res.workspaces || []).map((w: any) => ({
        _id: w._id,
        name: w.name
      }));
      setWorkspaces(ws);
    } catch (e) {
      console.warn('Failed to fetch workspaces', e);
    }
  }, []);

  useEffect(() => {
    fetchChunks();
    fetchWorkspaces();
  }, [fetchChunks, fetchWorkspaces]);

  return {
    chunks,
    workspaces,           // WorkspaceRef[]
    loading,
    error,
    totalChunks,
    workspaceId,
    setError,
    refetch: fetchChunks
  };
};
