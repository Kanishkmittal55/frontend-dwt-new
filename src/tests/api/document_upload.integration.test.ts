// @vitest-environment node

// src/tests/api/document_complete_workflow.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { workspaceAPI } from '../../api/workspaceAPI';
import { documentAPI } from '../../api/documentAPI';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integration: Complete Document Workflow', () => {
  let testWorkspaceId: string;
  const uploadedDocIds: string[] = [];

  beforeAll(async () => {
    const response = await workspaceAPI.createWorkspace({
      name: `Complete Workflow Test ${Date.now()}`,
      description: 'Testing full document lifecycle'
    });
    
    testWorkspaceId = response.workspaces[0]._id;
    console.log(`Created test workspace: ${testWorkspaceId}`);
  });

  afterAll(async () => {
    // Clean up all uploaded documents
    for (const docId of uploadedDocIds) {
      try {
        await documentAPI.deleteDocument(docId);
        console.log(`Deleted document: ${docId}`);
      } catch (err) {
        console.error(`Failed to delete document ${docId}`);
      }
    }

    // Clean up workspace
    if (testWorkspaceId) {
      try {
        await workspaceAPI.deleteWorkspace(testWorkspaceId);
        console.log(`Cleaned up workspace: ${testWorkspaceId}`);
      } catch (err) {
        console.error('Failed to delete workspace');
      }
    }
  });

  it('should complete full upload workflow: generate URL -> upload -> process -> verify', async () => {
    const filename = `workflow-test-${Date.now()}.txt`;
    const fileContent = 'This is a complete workflow test document with some content.';
    const tempFilePath = path.join(__dirname, filename);
    
    fs.writeFileSync(tempFilePath, fileContent);

    try {
      // Step 1: Generate presigned URL
      console.log('Step 1: Generating presigned URL...');
      const presignedResponse = await documentAPI.generatePresignedPost(
        filename,
        testWorkspaceId
      );
      
      expect(presignedResponse.url).toBeDefined();
      expect(presignedResponse.fields['x-amz-meta-document-id']).toBeDefined();
      
      const documentId = presignedResponse.fields['x-amz-meta-document-id'];
      uploadedDocIds.push(documentId);
      console.log(`✓ Generated presigned URL with document ID: ${documentId}`);

      // Step 2: Upload file to MinIO
      console.log('Step 2: Uploading file to MinIO...');
      const formData = new FormData();
      Object.entries(presignedResponse.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      const fileBuffer = fs.readFileSync(tempFilePath);
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'text/plain'
      });

      const uploadResponse = await axios.post(presignedResponse.url, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      expect(uploadResponse.status).toBe(204);
      console.log('✓ File uploaded to MinIO successfully');

      // Step 3: Verify document record exists
      console.log('Step 3: Verifying document record...');
      const documentResponse = await documentAPI.getDocuments({ 
        workspace_id: testWorkspaceId 
      });
      
      const createdDoc = documentResponse.documents.find(d => d._id === documentId);
      expect(createdDoc).toBeDefined();
      expect(createdDoc?.metadata.filename).toBe(filename);
      expect(createdDoc?.status).toBe('uploaded');
      const workspaceIds = createdDoc?.workspaces.map((ws: any) => ws._id);
      expect(workspaceIds).toContain(testWorkspaceId);
      console.log(`✓ Document record verified with status: ${createdDoc?.status}`);

      // Step 4: Process document
      console.log('Step 4: Processing document...');
      const processResponse = await documentAPI.processDocument(documentId);
      
      expect(processResponse.status).toBe('success');
      console.log('✓ Document processing started');

      // Step 5: Wait for processing to complete
      console.log('Step 5: Waiting for processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 6: Verify final document state
      console.log('Step 6: Verifying final state...');
      const finalDocResponse = await documentAPI.getDocuments({ 
        workspace_id: testWorkspaceId 
      });
      
      const processedDoc = finalDocResponse.documents.find(d => d._id === documentId);
      expect(processedDoc).toBeDefined();
      expect(['processing', 'processed']).toContain(processedDoc?.status);
      console.log(`✓ Document final status: ${processedDoc?.status}`);

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it('should handle document deletion properly', async () => {
    const filename = `delete-test-${Date.now()}.txt`;
    const tempFilePath = path.join(__dirname, filename);
    
    fs.writeFileSync(tempFilePath, 'Document to be deleted');

    try {
      // Upload document
      const presignedResponse = await documentAPI.generatePresignedPost(
        filename,
        testWorkspaceId
      );
      
      const documentId = presignedResponse.fields['x-amz-meta-document-id'];
      
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

      // Verify document exists
      const docsBeforeDelete = await documentAPI.getDocuments({ 
        workspace_id: testWorkspaceId 
      });
      
      const docBeforeDelete = docsBeforeDelete.documents.find(d => d._id === documentId);
      expect(docBeforeDelete).toBeDefined();

      // Delete document
      const deleteResponse = await documentAPI.deleteDocument(documentId);
      expect(deleteResponse.status).toBe('success');
      console.log(`✓ Document deleted: ${documentId}`);

      // Verify document no longer exists
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const docsAfterDelete = await documentAPI.getDocuments({ 
        workspace_id: testWorkspaceId 
      });
      
      const docAfterDelete = docsAfterDelete.documents.find(d => d._id === documentId);
      expect(docAfterDelete).toBeUndefined();
      console.log('✓ Document verified as deleted');

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it('should list all documents in workspace correctly', async () => {
    const response = await documentAPI.getDocuments({ 
      workspace_id: testWorkspaceId 
    });

    expect(response.status).toBe('success');
    expect(Array.isArray(response.documents)).toBe(true);
    
    // All documents should belong to this workspace
    response.documents.forEach(doc => {
        const workspaceIds = doc.workspaces.map((ws: any) => ws._id);
        expect(workspaceIds).toContain(testWorkspaceId);
      });
    
    console.log(`✓ Found ${response.documents.length} documents in workspace`);
  });

  it('should prevent duplicate file uploads', async () => {
    const filename = `duplicate-prevention-${Date.now()}.txt`;
    const tempFilePath = path.join(__dirname, filename);
    
    fs.writeFileSync(tempFilePath, 'Original content');

    try {
      // First upload
      const firstPresignedResponse = await documentAPI.generatePresignedPost(
        filename,
        testWorkspaceId
      );
      
      const documentId = firstPresignedResponse.fields['x-amz-meta-document-id'];
      uploadedDocIds.push(documentId);
      
      const formData = new FormData();
      Object.entries(firstPresignedResponse.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      const fileBuffer = fs.readFileSync(tempFilePath);
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'text/plain'
      });

      await axios.post(firstPresignedResponse.url, formData, {
        headers: formData.getHeaders()
      });

      console.log('✓ First upload successful');

      // Try to upload same filename again (should fail)
      try {
        await documentAPI.generatePresignedPost(filename, testWorkspaceId);
        throw new Error('Should have thrown error for duplicate filename');
      } catch (err: any) {
        expect(err.message).toContain('already exists');
        console.log('✓ Duplicate upload correctly prevented');
      }

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it('should handle different file types', async () => {
    const testFiles = [
      { name: `test-${Date.now()}.txt`, content: 'Text file', type: 'text/plain' },
      { name: `test-${Date.now()}.json`, content: '{"key":"value"}', type: 'application/json' },
      { name: `test-${Date.now()}.csv`, content: 'col1,col2\nval1,val2', type: 'text/csv' }
    ];

    for (const file of testFiles) {
      const tempFilePath = path.join(__dirname, file.name);
      fs.writeFileSync(tempFilePath, file.content);

      try {
        const presignedResponse = await documentAPI.generatePresignedPost(
          file.name,
          testWorkspaceId
        );
        
        const documentId = presignedResponse.fields['x-amz-meta-document-id'];
        uploadedDocIds.push(documentId);
        
        const formData = new FormData();
        Object.entries(presignedResponse.fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        
        const fileBuffer = fs.readFileSync(tempFilePath);
        formData.append('file', fileBuffer, {
          filename: file.name,
          contentType: file.type
        });

        const uploadResponse = await axios.post(presignedResponse.url, formData, {
          headers: formData.getHeaders()
        });

        expect(uploadResponse.status).toBe(204);
        console.log(`✓ Uploaded ${file.name}`);

      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }
  });
});