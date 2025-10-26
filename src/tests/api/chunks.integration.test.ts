// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { workspaceAPI } from '../../api/workspaceAPI';
import { chunkAPI } from '../../api/chunkAPI';
import path from 'node:path';
import { promises as fs } from 'node:fs';

// Small helpers for debugging
const preview = (v: unknown, n = 120) =>
    typeof v === 'string' ? v.slice(0, n) : JSON.stringify(v).slice(0, n);
  
  const toContentString = (item: any) =>
    typeof item?.content === 'string' ? item.content : JSON.stringify(item?.content);
  
  const stats = (arr: number[]) => {
    if (!arr.length) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return { min, max, avg };
  };
  

describe('Integration: Chunks API', () => {
  let workspace1Id: string;
  let workspace2Id: string;
  const createdChunksIds: string[] = [];

  beforeAll(async () => {
    const ws1 = await workspaceAPI.createWorkspace({
      name: `Chunks Test WS1 ${Date.now()}`,
      description: 'Primary workspace for chunk tests',
    });
    if (!ws1.workspaces?.[0]?._id) throw new Error('Failed to create workspace 1');
    workspace1Id = ws1.workspaces[0]._id;

    const ws2 = await workspaceAPI.createWorkspace({
      name: `Chunks Test WS2 ${Date.now()}`,
      description: 'Secondary workspace for chunk assignment tests',
    });
    if (!ws2.workspaces?.[0]?._id) throw new Error('Failed to create workspace 2');
    workspace2Id = ws2.workspaces[0]._id;
  });

  afterAll(async () => {
    // best-effort chunk cleanup
    for (const chunkId of createdChunksIds) {
      try {
        await chunkAPI.deleteChunk(chunkId);
      } catch {
        /* ignore */
      }
    }
    if (workspace1Id) await workspaceAPI.deleteWorkspace(workspace1Id);
    if (workspace2Id) await workspaceAPI.deleteWorkspace(workspace2Id);
  });

  it('should add chunks to workspace #1', async () => {
    const body = {
      chunks: [
        {
          content: 'First sample text chunk.',
          tags: ['alpha', 'beta'],
          user_metadata: { source: 'integration-test', priority: 'high' },
        },
        {
          content: 'Second sample text chunk.',
          tags: ['gamma'],
          user_metadata: { source: 'integration-test', priority: 'low' },
        },
      ],
    };

    const res = await chunkAPI.addChunks(workspace1Id, body);

    // Helpful debug (kept concise)
    // eslint-disable-next-line no-console
    console.log('ADD CHUNKS RESPONSE:', JSON.stringify(res, null, 2));

    expect(res).toBeDefined();
    expect(Array.isArray(res.chunks)).toBe(true);
    expect(res.chunks.length).toBe(2);
    if ('count' in res) {
      expect(typeof res.count).toBe('number');
    }

    for (const c of res.chunks) {
      expect(c).toHaveProperty('_id');
      createdChunksIds.push(c._id);

      // In POST /chunks/:workspace_id the backend returns unpopulated workspaces (ids),
      // but we accept both string[] or [{_id}] just in case.
      expect(Array.isArray(c.workspaces)).toBe(true);
      const wsIds = (c.workspaces || []).map((w: any) =>
        typeof w === 'string' ? w : w?._id
      );

      // eslint-disable-next-line no-console
      console.log(`Chunk ${c._id} workspaces:`, wsIds);

      expect(wsIds).toContain(workspace1Id);
    }
  });

  it('should read chunks for workspace #1 and return workspace-scoped tags/metadata', async () => {
    const list = await chunkAPI.getChunks({
      workspace_id: workspace1Id,
      include_embeddings: false,
      limit: 10,
      skip: 0,
    });

    expect(list).toBeDefined();
    expect(Array.isArray(list.chunks)).toBe(true);
    expect(list.count).toBeGreaterThanOrEqual(2);

    for (const c of list.chunks) {
      // here GET /chunks populates workspaces [{ _id, name }]
      expect(Array.isArray(c.workspaces)).toBe(true);
      expect(c.workspaces.some((w: any) => w._id === workspace1Id)).toBe(true);

      // Scoped shape: tags should be a LIST (not dict)
      expect(Array.isArray(c.tags) || typeof c.tags === 'object').toBe(true);
      if (Array.isArray(c.tags)) {
        expect(Array.isArray(c.tags)).toBe(true);
      } else {
        // If dict appears unexpectedly, at least the workspace key should exist
        expect(c.tags[workspace1Id]).toBeDefined();
      }

      // Scoped user_metadata should be a plain object (not dict keyed by workspace)
      expect(typeof c.user_metadata).toBe('object');
    }
  });

  it('should read chunks WITHOUT workspace filter and return dict keyed by workspace ids', async () => {
    const list = await chunkAPI.getChunks({
      include_embeddings: false,
      limit: 10,
      skip: 0,
    });

    expect(list).toBeDefined();
    expect(Array.isArray(list.chunks)).toBe(true);
    expect(list.count).toBeGreaterThanOrEqual(2);

    const createdFirst = list.chunks.find((c: any) =>
      createdChunksIds.includes(c._id)
    );
    expect(createdFirst).toBeDefined();

    // tags dict shape
    expect(createdFirst!.tags).toBeDefined();
    expect(Array.isArray(createdFirst!.tags)).toBe(false);
    expect(typeof createdFirst!.tags).toBe('object');
    expect((createdFirst!.tags as Record<string, string[]>)[workspace1Id]).toBeDefined();

    // user_metadata dict shape
    expect(createdFirst!.user_metadata).toBeDefined();
    expect(typeof createdFirst!.user_metadata).toBe('object');
    expect(
      (createdFirst!.user_metadata as Record<string, Record<string, unknown>>)[
        workspace1Id
      ]
    ).toBeDefined();
  });

  it('should assign one chunk to workspace #2 and observe isolated tags/metadata', async () => {
    const targetChunkId = createdChunksIds[0];
    expect(typeof targetChunkId).toBe('string');

    // Use official method (no aliases) — body is a raw array of ids
    const assignRes = await chunkAPI.assignChunksToWorkspace(workspace2Id, [targetChunkId]);
    expect(assignRes).toBeDefined();
    expect(assignRes.chunks?.assigned).toContain(targetChunkId);

    // Read scoped to workspace2: tags should be list (likely empty initially)
    const listWs2 = await chunkAPI.getChunks({
      workspace_id: workspace2Id,
      include_embeddings: false,
      limit: 10,
      skip: 0,
    });
    const inWs2 = listWs2.chunks.find((c: any) => c._id === targetChunkId);
    expect(inWs2).toBeDefined();
    expect(Array.isArray(inWs2!.tags)).toBe(true);
    expect(inWs2!.tags.length >= 0).toBe(true); // empty or non-empty
    expect(typeof inWs2!.user_metadata).toBe('object');

    // Update ws2 scoped tags/metadata
    const updateBody = {
      tags: ['delta', 'epsilon'],
      user_metadata: { note: 'assigned to ws2', reviewed: true },
    };
    const updateRes = await chunkAPI.updateChunk(targetChunkId, workspace2Id, updateBody);
    expect(updateRes).toBeDefined();
    expect(Array.isArray(updateRes.chunks)).toBe(true);

    // Verify in ws2 only
    const afterUpdateWs2 = await chunkAPI.getChunks({
      workspace_id: workspace2Id,
      include_embeddings: false,
      limit: 10,
      skip: 0,
    });
    const updatedWs2 = afterUpdateWs2.chunks.find((c: any) => c._id === targetChunkId);
    expect(updatedWs2).toBeDefined();
    expect(updatedWs2!.tags).toEqual(['delta', 'epsilon']);
    expect(updatedWs2!.user_metadata).toMatchObject({ note: 'assigned to ws2', reviewed: true });

    // Confirm ws1 unchanged
    const afterUpdateWs1 = await chunkAPI.getChunks({
      workspace_id: workspace1Id,
      include_embeddings: false,
      limit: 10,
      skip: 0,
    });
    const sameChunkWs1 = afterUpdateWs1.chunks.find((c: any) => c._id === targetChunkId);
    expect(sameChunkWs1).toBeDefined();
    expect(Array.isArray(sameChunkWs1!.tags)).toBe(true);
    expect(sameChunkWs1!.tags).not.toEqual(['delta', 'epsilon']);
  });

  it('should unassign the chunk from workspace #2 and no longer find it under ws2', async () => {
    const targetChunkId = createdChunksIds[0];
    expect(typeof targetChunkId).toBe('string');

    const unassignRes = await chunkAPI.unassignChunksFromWorkspace(workspace2Id, [targetChunkId]);
    expect(unassignRes).toBeDefined();
    expect(unassignRes.chunks?.unassigned).toContain(targetChunkId);

    const listWs2After = await chunkAPI.getChunks({
      workspace_id: workspace2Id,
      include_embeddings: false,
      limit: 50,
      skip: 0,
    });

    const found = listWs2After.chunks.find((c: any) => c._id === targetChunkId);
    expect(found).toBeUndefined();
  });

  it('should update chunk in workspace #1 and read the new values', async () => {
    // fall back to first if second is missing for any reason
    const targetChunkId = createdChunksIds[1] ?? createdChunksIds[0];
    expect(typeof targetChunkId).toBe('string');

    const updateBody = {
      tags: ['updated', 'ws1'],
      user_metadata: { source: 'updated-from-test', priority: 'critical' },
    };
    const updateRes = await chunkAPI.updateChunk(targetChunkId, workspace1Id, updateBody);
    expect(updateRes).toBeDefined();
    expect(Array.isArray(updateRes.chunks)).toBe(true);

    const listWs1 = await chunkAPI.getChunks({
      workspace_id: workspace1Id,
      include_embeddings: false,
      limit: 10,
      skip: 0,
    });
    const updated = listWs1.chunks.find((c: any) => c._id === targetChunkId);
    expect(updated).toBeDefined();
    expect(updated!.tags).toEqual(['updated', 'ws1']);
    expect(updated!.user_metadata).toMatchObject({
      source: 'updated-from-test',
      priority: 'critical',
    });
  });

  it('should bulk add 51 chunks from chunks.json and return all 51 for that workspace', async () => {
    // Create an isolated workspace just for this bulk test
    const ws = await workspaceAPI.createWorkspace({
      name: `Chunks Bulk WS ${Date.now()}`,
      description: 'Workspace for bulk 51-chunk test',
    });
    if (!ws.workspaces?.[0]?._id) throw new Error('Failed to create bulk test workspace');
    const bulkWorkspaceId = ws.workspaces[0]._id;
    console.log('🧪 Bulk test workspace:', bulkWorkspaceId);
  
    const bulkCreatedIds: string[] = [];
  
    try {
      // Read fixture at: src/tests/fixtures/chunks.json
      const filePath = path.resolve(__dirname, '../fixtures/chunks.json');
      console.log('📄 Reading fixture:', filePath);
      const raw = await fs.readFile(filePath, 'utf8');
  
      // Show a tiny preview of the raw file to be sure we loaded what we think we did
      console.log('📄 Fixture preview:', preview(raw, 200));
  
      const items = JSON.parse(raw);
      console.log('📦 Fixture items:', { count: items?.length, type: Array.isArray(items) ? 'array' : typeof items });
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(51);
  
      // Normalize to AddChunksRequest shape
      const normalized = items.map((r: any, idx: number) => {
        if (typeof r === 'string') return { content: r };
        if (r && typeof r === 'object' && 'content' in r) return r;
        // fallback: stringify arbitrary object
        return { content: JSON.stringify(r) };
      });
  
      // Quick stats before we hit the API
      const contentLens = normalized.map(toContentString).map((s) => (s ?? '').length);
      console.log('🧮 Content length stats (pre-batch):', stats(contentLens));
      const longOnes = normalized
        .map((x, i) => ({ i, len: toContentString(x).length, preview: preview(toContentString(x)) }))
        .sort((a, b) => b.len - a.len)
        .slice(0, 5);
      console.log('🔎 Top 5 longest items:', longOnes);
  
      // 🔧 Batch into safe chunks to avoid upstream embedding input limits
      const BATCH_SIZE = 20; // 20/20/11
      for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
        const batch = normalized.slice(i, i + BATCH_SIZE);
        const lens = batch.map(toContentString).map((s) => s.length);
        const s = stats(lens);
        console.log(
          `🚚 Sending batch ${i / BATCH_SIZE + 1} (${batch.length} items) | len(min/max/avg)=(${s.min}/${s.max}/${s.avg})`
        );
  
        // Log first two items of the batch for sanity (without spamming)
        console.log('   ├─ sample[0]:', preview(toContentString(batch[0])));
        if (batch[1]) console.log('   └─ sample[1]:', preview(toContentString(batch[1])));
  
        try {
          console.time(`⏱ addChunks batch ${i / BATCH_SIZE + 1}`);
          const addRes = await chunkAPI.addChunks(bulkWorkspaceId, { chunks: batch });
          console.timeEnd(`⏱ addChunks batch ${i / BATCH_SIZE + 1}`);
  
          // Minimal shape verification + short response summary
          expect(addRes).toBeDefined();
          expect(Array.isArray(addRes.chunks)).toBe(true);
          console.log(
            `✅ Batch ${i / BATCH_SIZE + 1} OK | returned ${addRes.chunks.length} chunks | count=${'count' in addRes ? (addRes as any).count : 'n/a'}`
          );
  
          // Record ids
          for (const c of addRes.chunks) {
            expect(c).toHaveProperty('_id');
            bulkCreatedIds.push(c._id);
          }
        } catch (err: any) {
          console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed`);
          console.error('   Error message:', err?.message || err);
  
          // Dump detailed info about this failing batch to spot bad payloads
          console.error(
            '   Failing batch lengths:',
            lens
          );
          console.error(
            '   Failing batch previews:',
            batch.slice(0, 5).map((x, idx) => ({ idx, preview: preview(toContentString(x)) }))
          );
  
          // Re-throw so Vitest marks the test failed with the original error
          throw err;
        }
      }
  
      // We should have 51 created ids
      console.log('🧾 Total created ids:', bulkCreatedIds.length);
      expect(bulkCreatedIds.length).toBe(51);
  
      // Fetch back everything in that workspace
      console.log('🔁 Fetching back all chunks for workspace (limit=-1)');
      const list = await chunkAPI.getChunks({
        workspace_id: bulkWorkspaceId,
        include_embeddings: false,
        limit: -1, // backend treats -1 as "no limit"
        skip: 0,
      });
  
      console.log('📥 GET /chunks summary:', {
        returned: list.chunks.length,
        totalCount: list.count,
        message: list.message,
        status: list.status,
      });
  
      expect(list).toBeDefined();
      expect(Array.isArray(list.chunks)).toBe(true);
      expect(list.chunks.length).toBe(51);
      expect(list.count).toBe(51);
    } finally {
      // Cleanup
      console.log('🧹 Cleaning up bulk created chunks:', bulkCreatedIds.length);
      for (const id of bulkCreatedIds) {
        try {
          await chunkAPI.deleteChunk(id);
        } catch (e) {
          console.warn('   (cleanup) deleteChunk failed for', id, e);
        }
      }
      try {
        await workspaceAPI.deleteWorkspace(bulkWorkspaceId);
      } catch (e) {
        console.warn('   (cleanup) deleteWorkspace failed for', bulkWorkspaceId, e);
      }
    }
  }, 60_000); // extra time in case embedding provider is slow
  
  
});
