# WhyHow API Client Structure

## Overview
The API client is organized into separate modules for better maintainability and separation of concerns.

## File Structure

```
src/api/
├── baseClient.js       # Base HTTP client with authentication
├── workspaceAPI.js     # Workspace-related endpoints
├── schemaAPI.js        # Schema-related endpoints
├── graphAPI.js         # Graph-related endpoints
├── nodeAPI.js          # Node-related endpoints
├── chunkAPI.js         # Chunk-related endpoints
├── tripleAPI.js        # Triple-related endpoints
├── documentAPI.js      # Document-related endpoints
├── index.js            # Main export file
├── menu.js             # Legacy menu API (original file)
└── README.md           # This file
```

## Usage

### Import individual APIs:
```javascript
import { workspaceAPI } from 'api/workspaceAPI';
import { schemaAPI } from 'api/schemaAPI';
import { graphAPI } from 'api/graphAPI';
import { nodeAPI } from 'api/nodeAPI';
import { tripleAPI } from 'api/tripleAPI';
import { chunkAPI } from 'api/chunkAPI';
import { documentAPI } from 'api/documentAPI';
```

### Or import everything from index:
```javascript
import { workspaceAPI, schemaAPI, graphAPI, nodeAPI, tripleAPI, chunkAPI, documentAPI } from 'api';
```

### Or import as a single object:
```javascript
import whyhowAPI from 'api';
// Usage: whyhowAPI.workspace.getWorkspaces()
```

## Available Methods

### Workspace API
- `getWorkspaces()` - Get all workspaces
- `createWorkspace(data)` - Create new workspace
- `getWorkspace(workspaceId)` - Get specific workspace
- `updateWorkspace(workspaceId, data)` - Update workspace
- `deleteWorkspace(workspaceId)` - Delete workspace
- `getWorkspaceTags(workspaceId)` - Get workspace tags

### Schema API
- `getSchemas()` - Get all schemas
- `createSchema(data)` - Create new schema
- `getSchema(schemaId)` - Get specific schema
- `updateSchema(schemaId, data)` - Update schema
- `deleteSchema(schemaId)` - Delete schema
- `generateSchema(data)` - Generate schema from questions

### Graph API
- `getGraphs()` - Get all graphs
- `getGraph(graphId)` - Get specific graph
- `updateGraph(graphId, data)` - Update graph
- `deleteGraph(graphId)` - Delete graph
- `getGraphNodes(graphId)` - Get graph nodes
- `getGraphTriples(graphId)` - Get graph relationships
- `getGraphRelations(graphId)` - Get relation types
- `queryGraph(graphId, queryData)` - Query a graph
- `exportGraphToCypher(graphId)` - Export as Cypher
- `mergeNodes(graphId, data)` - Merge nodes
- Plus many more...

### Node API
- `createNode(data)` - Create new node
- `getNodes(params)` - Get all nodes with optional filters
- `getNode(nodeId)` - Get specific node
- `updateNode(nodeId, data)` - Update node
- `deleteNode(nodeId)` - Delete node
- `getNodeWithChunks(nodeId)` - Get node with associated chunks

### Chunk API
- `getChunks(params)` - Get all chunks with optional filters
- `getChunk(chunkId)` - Get specific chunk
- `deleteChunk(chunkId)` - Delete chunk
- `addChunks(workspaceId, data)` - Add chunks to workspace
- `updateChunk(chunkId, workspaceId, data)` - Update chunk
- `assignChunksToWorkspace(workspaceId, data)` - Assign chunks to workspace
- `unassignChunksFromWorkspace(workspaceId, data)` - Unassign chunks from workspace

### Triple API
- `getTriples(params)` - Get all triples with optional filters
- `createTriples(data)` - Create new triples (supports batch creation)
- `getTriple(tripleId)` - Get specific triple
- `deleteTriple(tripleId)` - Delete triple
- `getTripleWithChunks(tripleId)` - Get triple with associated chunks
- `getPublicTripleWithChunks(tripleId)` - Get public triple with chunks

### Document API
- `getDocuments(params)` - Get all documents with optional filters
- `getDocument(documentId)` - Get specific document
- `deleteDocument(documentId)` - Delete document
- `processDocument(documentId)` - Process document for knowledge extraction
- `updateDocumentInWorkspace(documentId, workspaceId, data)` - Update document metadata
- `assignDocumentsToWorkspace(workspaceId, data)` - Assign documents to workspace
- `unassignDocumentsFromWorkspace(workspaceId, data)` - Unassign documents
- `generatePresignedPost(data)` - Generate upload URL
- `generatePresignedDownload(documentId, data)` - Generate download URL

## Configuration

API URL and key are configured via environment variables in `.env`:

```env
# WhyHow Knowledge Graph API
VITE_WHYHOW_API_URL=http://localhost:8000
VITE_WHYHOW_API_KEY=your-api-key-here

# Founder OS API
VITE_FOUNDER_API_URL=http://localhost:8000
VITE_FOUNDER_API_KEY=your-founder-api-key-here
```

---

# Founder OS API Client

## Overview
The Founder OS API client provides integration with the Go-based backend for founder profile management, idea review, daily tasks, and progress tracking.

## File Structure

```
src/api/founder/
├── founderClient.ts    # Base HTTP client with auth & error handling
├── schemas.ts          # Zod validation schemas for all types
└── index.ts            # Main export file
```

## Usage

```typescript
import { founderClient, schemas } from 'api/founder';
import type { FounderProfile, IdeaResponse } from 'api/founder';

// Make API calls
const profile = await founderClient.get<FounderProfile>('/v1/founder/profile/123');

// Validate responses
const validated = schemas.FounderProfileSchema.parse(profile);
```

## Token Management

```typescript
import { 
  setStoredToken, 
  getStoredUserId, 
  clearStoredAuth,
  isAuthenticated 
} from 'api/founder';

// After login
setStoredToken(response.refresh_token);
setStoredUserId(response.id);

// Check auth state
if (isAuthenticated()) {
  // User is logged in
}

// Logout
clearStoredAuth();
```

## Error Handling

The client automatically:
- Parses `{ "error": "string" }` responses from Go backend
- Redirects to `/login` on 401 Unauthorized
- Clears stored tokens on auth errors
