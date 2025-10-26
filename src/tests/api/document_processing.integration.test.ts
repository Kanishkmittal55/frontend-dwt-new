// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { workspaceAPI } from '../../api/workspaceAPI';
import { documentAPI } from '../../api/documentAPI';
import { chunkAPI } from '../../api/chunkAPI'
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integration: Document Processing with Configuration', () => {
  let testWorkspaceId: string;
  let documentId: string;

  beforeAll(async () => {
    const response = await workspaceAPI.createWorkspace({
      name: `Processing Config Test ${Date.now()}`,
      description: 'Testing processing with chunk configuration'
    });

    // Validate response structure
    if (!response.workspaces || response.workspaces.length ===0){
      throw new Error('API returned empty workspaces array');
    }

    const workspace = response.workspaces[0];
    if (!workspace?._id) {
      throw new Error('Failed to create workspace 1');    
    }
    
    testWorkspaceId = workspace._id
    console.log(`Created test workspace: ${testWorkspaceId}`);
  });

  afterAll(async () => {
    if (documentId) {
      try {
        await documentAPI.deleteDocument(documentId);
        console.log(`Deleted document: ${documentId}`);
      } catch (err) {
        console.log('Document cleanup skipped');
      }
    }

    if (testWorkspaceId) {
      await workspaceAPI.deleteWorkspace(testWorkspaceId);
      console.log(`Cleaned up workspace: ${testWorkspaceId}`);
    }
  });

  it('should upload document without auto-processing', async () => {
    const filename = `test-no-auto-process-${Date.now()}.txt`;
    const fileContent = 'This document should not be processed automatically after upload.';
    const tempFilePath = path.join(__dirname, filename);
    
    fs.writeFileSync(tempFilePath, fileContent);

    try {
      // Upload document
      const presignedResponse = await documentAPI.generatePresignedPost(
        filename,
        testWorkspaceId
      );

      console.log("The presigned response is : ", JSON.stringify(presignedResponse))
      
      documentId = presignedResponse.fields['x-amz-meta-document-id']; // user defined meta data being attached to an object which is the workspace_id this document belongs to 
      
      const formData = new FormData();
      Object.entries(presignedResponse.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      const fileBuffer = fs.readFileSync(tempFilePath);
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'text/plain'
      });

      // The frontend client uploads the file to minio a good architecture we dont need to go the backend
      // backend just generates a secure "pre-signed" url
      await axios.post(presignedResponse.url, formData, {
        headers: formData.getHeaders()
      });

      console.log('✓ File uploaded to MinIO');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check document status - should be 'uploaded', not 'processing'
      const docsResponse = await documentAPI.getDocuments({ 
        workspace_id: testWorkspaceId 
      });
      
      const uploadedDoc = docsResponse.documents.find(d => d._id === documentId);
      
      expect(uploadedDoc).toBeDefined();
      expect(uploadedDoc?.status).toBe('uploaded');
      console.log('✓ Document status is "uploaded" (not auto-processed)');

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it('should process document with default configuration', async () => {
    const processResponse = await documentAPI.processDocument(documentId);
    
    expect(processResponse.status).toBe('success');
    console.log('✓ Processing started with default config');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const docsResponse = await documentAPI.getDocuments({ 
      workspace_id: testWorkspaceId 
    });
    
    const processedDoc = docsResponse.documents.find(d => d._id === documentId);
    expect(['processing', 'processed']).toContain(processedDoc?.status);
    console.log(`✓ Document status: ${processedDoc?.status}`);
  });

  it('should process document with custom chunk configuration', async () => {
    const filename = `test-custom-config-${Date.now()}.txt`;
    const fileContent = 'A'.repeat(1000); // 1000 character file
    const tempFilePath = path.join(__dirname, filename);
    
    fs.writeFileSync(tempFilePath, fileContent);

    try {
      // Upload
      const presignedResponse = await documentAPI.generatePresignedPost(
        filename,
        testWorkspaceId
      );
      
      const customDocId = presignedResponse.fields['x-amz-meta-document-id'];
      
      const formData = new FormData();
      Object.entries(presignedResponse.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      const fileBuffer = fs.readFileSync(tempFilePath);
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'text/plain'
      });

      await axios.post(presignedResponse.url, formData, {
        headers: formData.getHeaders()
      });

      console.log('✓ File uploaded');

      // Process with custom config
      const processResponse = await documentAPI.processDocument(customDocId, {
        chunk_size: 200,
        chunk_overlap: 50
      });
      
      expect(processResponse.status).toBe('success');
      console.log('✓ Processing started with custom config (size: 200, overlap: 50)');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup
      await documentAPI.deleteDocument(customDocId);
      console.log('✓ Custom config document cleaned up');

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it('should reject invalid chunk configuration', async () => {
    try {
      await documentAPI.processDocument(documentId, {
        chunk_size: 50, // Too small (min is 100)
        chunk_overlap: 0
      });
      
      throw new Error('Should have rejected invalid config');
    } catch (err: any) {
      expect(err.message).toBeDefined();
      console.log('✓ Invalid config correctly rejected');
    }
  });

  it('should create chunks from a TXT document (size/overlap) and fetch them by workspace+document', async () => {
    // --- Test input (deterministic) ---
    const L = 8000; // total characters
    const config = { chunk_size: 200, chunk_overlap: 50 }; // step = 150
    const filename = `proc-${Date.now()}.txt`;
    const content = 'A'.repeat(L);
    const tempPath = path.join(__dirname, filename);
  
    // Helper to compute expected chunks like the splitter: start at 0; step=S-O while start < L
    // NOTE: Expected chunk count for a continuous string (e.g., 'A'.repeat(L)) using our
    // splitter that advances by (length - overlap):
    // - First chunk starts at 0 and can cover up to `chunk_size`.
    // - Each subsequent chunk advances by `step = chunk_size - chunk_overlap`.
    // - We need a final partial chunk to cover the tail; that’s why we use `ceil`.
    // - We subtract `chunk_overlap` once because the first chunk doesn’t “benefit” from a
    //   preceding overlap.
    // - Clamp to at least 1 for short texts.
    // Assumptions:
    //   * chunk_overlap < chunk_size (validated by the API).
    //   * Text is continuous; if you change separators or use natural text, LangChain’s
    //     splitter may wrap differently and counts can vary slightly.
        const step = config.chunk_size - config.chunk_overlap;
    const expectedCount = Math.ceil(
      (L - config.chunk_overlap) / step
    );
  
    // Small poller to wait for background processing
    const waitForProcessed = async (docId: string, maxMs = 30000, intervalMs = 500) => {
      const start = Date.now();
      // Narrow by filename to avoid scanning many docs
      while (true) {
        const docs = await documentAPI.getDocuments({
          workspace_id: testWorkspaceId,
          filename,
          limit: 1
        });
        const doc = docs.documents.find(d => d._id === docId);
        if (doc?.status === 'processed') return;
        if (doc?.status === 'failed') throw new Error(`processing failed for ${docId}`);
        if (Date.now() - start > maxMs) throw new Error(`timeout waiting for processed (status=${doc?.status})`);
        await new Promise(r => setTimeout(r, intervalMs));
      }
    };
  
    fs.writeFileSync(tempPath, content);
    let docId: string | null = null;
  
    try {
      // 1) Generate presigned, upload to object storage
      const presigned = await documentAPI.generatePresignedPost(filename, testWorkspaceId);
      docId = presigned.fields['x-amz-meta-document-id'];
  
      const formData = new (FormData as any)(); // keep compatibility with CJS/ESM typings
      Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v as string));
      formData.append('file', fs.readFileSync(tempPath), { filename, contentType: 'text/plain' });
      await axios.post(presigned.url, formData, { headers: formData.getHeaders() });
  
      // 2) Start processing with chunk config
      const startRes = await documentAPI.processDocument(docId, config);
      expect(startRes.status).toBe('success');
  
      // 3) Wait for background worker to finish
      await waitForProcessed(docId);
  
      // 4) Fetch chunks for THIS document in THIS workspace (return all: limit -1)
      const list = await chunkAPI.getChunks({
        workspace_id: testWorkspaceId,
        document_id: docId,
        include_embeddings: false,
        limit: -1,
        skip: 0,
        order: 1, 
      });
  
      // Count checks
      expect(Array.isArray(list.chunks)).toBe(true);
      expect(list.count).toBe(expectedCount);
      expect(list.chunks.length).toBe(expectedCount);
  
      // Boundary checks on a few representative chunks
      const c0 = list.chunks[0];
      expect(c0.document?._id).toBe(docId);
      expect(c0.document?.filename).toBe(filename);
      expect(c0.metadata.start).toBe(0);
      expect(c0.metadata.end).toBeLessThanOrEqual(config.chunk_size);
      expect(c0.metadata.data_source_type).toBe('automatic');
  
      if (list.chunks.length > 1) {
        const c1 = list.chunks[1];
        expect(c1.metadata.start).toBe(step); // 200 - 50 = 150
        expect(c1.metadata.end - c1.metadata.start).toBeLessThanOrEqual(config.chunk_size);
      }
  
      const cLast = list.chunks[list.chunks.length - 1];
      expect(cLast.metadata.end).toBe(L); // last chunk should end exactly at total length
  
      // Association + shape checks for all chunks (scoped read returns lists/objects)
      for (const ch of list.chunks) {
        // workspaces populated and includes our workspace
        expect(Array.isArray(ch.workspaces)).toBe(true);
        expect(ch.workspaces.some((w: any) => w._id === testWorkspaceId)).toBe(true);
  
        // tags/user_metadata are workspace-scoped when filtering by workspace_id
        expect(Array.isArray(ch.tags)).toBe(true); // list, not dict
        expect(typeof ch.user_metadata).toBe('object'); // object, not dict
      }
    } finally {
      // Cleanup document (deletes its chunks too)
      if (docId) {
        try { await documentAPI.deleteDocument(docId); } catch {}
      }
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  });
  
});