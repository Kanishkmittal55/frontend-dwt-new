// src/api/chunkAPI.ts
import { WhyHowClient } from './baseClient';
import type {
  GetChunksParams,
  GetChunksResponse,
  GetChunkResponse,
  DeleteChunkResponse,
  AddChunksRequest,
  AddChunksResponse,
  UpdateChunkRequest,
  UpdateChunkResponse,
  AssignChunksRequest,
  AssignChunksResponse,
  UnassignChunksRequest,
  UnassignChunksResponse
} from '../types/api';

// helper: allow array or { chunk_ids: [] }
const normalizeChunkIdsBody = (data: AssignChunksRequest | UnassignChunksRequest): string[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).chunk_ids)) return (data as any).chunk_ids;
  throw new Error('Invalid body: expected string[] or { chunk_ids: string[] }');
};

export const chunkAPI = {
  getChunks: async (params: GetChunksParams = {}): Promise<GetChunksResponse> => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return client.get(`/chunks${queryString ? `?${queryString}` : ''}`);
  },

  getChunk: async (chunkId: string): Promise<GetChunkResponse> => {
    const client = new WhyHowClient();
    return client.get(`/chunks/${chunkId}`);
  },

  deleteChunk: async (chunkId: string): Promise<DeleteChunkResponse> => {
    const client = new WhyHowClient();
    return client.delete(`/chunks/${chunkId}`);
  },

  addChunks: async (
    workspaceId: string,
    data: AddChunksRequest
  ): Promise<AddChunksResponse> => {
    const client = new WhyHowClient();
    return client.post(`/chunks/${workspaceId}`, data);
  },

  updateChunk: async (
    chunkId: string,
    workspaceId: string,
    data: UpdateChunkRequest
  ): Promise<UpdateChunkResponse> => {
    const client = new WhyHowClient();
    return client.put(`/chunks/${chunkId}/${workspaceId}`, data);
  },

  assignChunksToWorkspace: async (
    workspaceId: string,
    data: AssignChunksRequest
  ): Promise<AssignChunksResponse> => {
    const client = new WhyHowClient();
    return client.put(`/chunks/assign/${workspaceId}`, normalizeChunkIdsBody(data));
  },

  unassignChunksFromWorkspace: async (
    workspaceId: string,
    data: UnassignChunksRequest
  ): Promise<UnassignChunksResponse> => {
    const client = new WhyHowClient();
    return client.put(`/chunks/unassign/${workspaceId}`, normalizeChunkIdsBody(data));
  },
};

export default chunkAPI;
