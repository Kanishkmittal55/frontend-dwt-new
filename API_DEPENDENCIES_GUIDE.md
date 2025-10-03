# WhyHow Knowledge Graph API - Complete Integration Guide

## 🏗️ System Architecture & Dependencies

### Data Flow Hierarchy

The WhyHow Knowledge Graph follows a strict hierarchical dependency structure:

```
┌─────────────────────────────────────────────────────┐
│                    WORKSPACES                       │
│         (Top-level organizational units)            │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬─────────────┬──────────┐
        ▼                     ▼             ▼          ▼
   ┌─────────┐          ┌─────────┐   ┌─────────┐  ┌───────┐
   │ SCHEMAS │          │  GRAPHS │   │DOCUMENTS│  │ RULES │
   └────┬────┘          └────┬────┘   └────┬────┘  └───────┘
        │                    │              │
        └────────┬───────────┘              │
                 ▼                           ▼
           ┌─────────┐                ┌─────────┐
           │  NODES  │                │  CHUNKS │
           └────┬────┘                └─────────┘
                │                           ▲
                ▼                           │
           ┌─────────┐                      │
           │ TRIPLES │──────────────────────┘
           └────┬────┘
                │
                ▼
           ┌─────────┐
           │ QUERIES │
           └─────────┘
```

## 🔗 Complete Dependency Chain

### Core Entities

#### 1. **Workspaces** (Independent)
- **No dependencies**
- Root entity of the system
- All other entities belong to workspaces

#### 2. **Schemas** (Depends on Workspaces)
- **Requires**: Workspace ID
- Defines the structure for graphs
- Contains entity types and relation types

#### 3. **Graphs** (Depends on Workspaces & Schemas)
- **Requires**: 
  - Workspace ID
  - Schema ID
- Container for nodes and relationships
- Must be in "ready" status to be used

#### 4. **Documents** (Depends on Workspaces)
- **Requires**: Workspace ID
- Source of knowledge chunks
- Can be processed to extract chunks

#### 5. **Chunks** (Depends on Workspaces, optionally Documents)
- **Requires**: Workspace ID
- **Optional**: Document ID (if extracted from document)
- Raw knowledge fragments

#### 6. **Nodes** (Depends on Graphs)
- **Requires**: Graph ID (which implies workspace & schema)
- Entities in the knowledge graph
- Can be linked to chunks

#### 7. **Triples** (Depends on Graphs & Nodes)
- **Requires**: 
  - Graph ID
  - Head Node (existing or create new)
  - Tail Node (existing or create new)
- **Optional**: Chunk IDs
- Represents relationships between nodes

#### 8. **Queries** (Depends on Graphs)
- **Requires**: Graph ID
- Searches and retrieves information from graph
- Read-only operation, created by graph queries

#### 9. **Rules** (Depends on Workspaces)
- **Requires**: Workspace ID
- Defines merge rules for nodes
- Applied across all graphs in workspace

### Support Entities

#### 10. **Users** (Independent)
- Manages API keys and authentication
- Sets AI provider configurations

#### 11. **Tasks** (Reference Only)
- Created by async operations
- Tracks processing status
- Read-only via task ID

#### 12. **System** (Independent)
- Health checks and system info
- No dependencies

## 📝 Step-by-Step Data Entry Sequence

### Correct Order of Operations:

```javascript
// Step 1: Configure User Settings
const apiKey = await userAPI.getApiKey();
await userAPI.setProvidersDetails({
  providers: [{
    type: 'llm',
    value: 'byo-openai',
    api_key: 'sk-...',
    metadata: {
      'byo-openai': {
        language_model_name: 'gpt-4',
        embedding_name: 'text-embedding-ada-002'
      }
    }
  }]
});

// Step 2: Create Workspace (Required First)
const workspace = await workspaceAPI.createWorkspace({
  name: "My Knowledge Base",
  description: "Research workspace"
});

// Step 3: Create Schema (Requires Workspace)
const schema = await schemaAPI.createSchema({
  workspace: workspace._id,
  name: "Research Schema",
  entities: [
    { name: "Person", description: "A person entity" },
    { name: "Organization", description: "An organization" }
  ],
  relations: [
    { name: "works_at", description: "Employment relation" }
  ]
});

// Step 4: Create Graph (Requires Workspace & Schema)
const graph = await graphAPI.createGraph({
  workspace_id: workspace._id,
  name: "Research Graph",
  schema_id: schema._id
});

// Step 5a: Upload Documents (Optional - for automatic extraction)
const presigned = await documentAPI.generatePresignedPost({
  filename: "research.pdf",
  workspace_id: workspace._id
});

// Upload to S3
const formData = new FormData();
Object.entries(presigned.fields).forEach(([key, value]) => {
  formData.append(key, value);
});
formData.append('file', fileObject);
await fetch(presigned.url, { method: 'POST', body: formData });

// Process document
await documentAPI.processDocument(documentId);

// Step 5b: OR Create Chunks Manually
const chunk = await chunkAPI.addChunks(workspace._id, {
  chunks: [{
    content: "John Doe works at Acme Corp as CEO",
    tags: ["employment", "leadership"]
  }]
});

// Step 6: Create Nodes (Requires Graph)
const johnNode = await nodeAPI.createNode({
  graph: graph._id,
  name: "John Doe",
  type: "Person",
  properties: { title: "CEO" }
});

const acmeNode = await nodeAPI.createNode({
  graph: graph._id,
  name: "Acme Corp",
  type: "Organization",
  properties: { industry: "Technology" }
});

// Step 7: Create Triple (Requires Graph & Nodes)
const triple = await tripleAPI.createTriples({
  graph: graph._id,
  strict_mode: false,
  triples: [{
    head_node: johnNode._id,
    tail_node: acmeNode._id,
    type: "works_at",
    properties: { since: "2020" },
    chunks: [chunk._id]  // Optional: link to source
  }]
});

// Step 8: Query the Graph
const results = await graphAPI.queryGraph(graph._id, {
  query: {
    content: "Who works at Acme Corp?",
    return_answer: true
  }
});

// Step 9: Create Rules (Optional - for automatic merging)
await ruleAPI.createRule({
  workspace: workspace._id,
  rule: {
    rule_type: 'merge_nodes',
    from_node_names: ["Acme", "ACME Corp", "Acme Corporation"],
    to_node_name: "Acme Corp",
    node_type: "Organization"
  }
});
```

## 🔧 API Parameter Patterns

### How Parameters are Sent:

1. **Query Parameters (GET requests)**:
```javascript
// Using URLSearchParams in the API client
const params = { skip: 0, limit: 10, type: 'Person' };
const queryString = new URLSearchParams(params).toString();
client.get(`/nodes${queryString ? `?${queryString}` : ''}`);
```

2. **Body Parameters (POST/PUT requests)**:
```javascript
// JSON body for POST/PUT
client.post('/triples', {
  graph: graphId,
  strict_mode: false,
  triples: [...]
});
```

3. **Path Parameters**:
```javascript
// ID in URL path
client.get(`/graphs/${graphId}`);
client.put(`/documents/${documentId}/${workspaceId}`, data);
```

## 🚨 Important Constraints

### Entity Dependencies:
1. **Cannot create** a Graph without a Schema
2. **Cannot create** Nodes without a Graph
3. **Cannot create** Triples without Nodes (or ability to create new ones)
4. **Cannot query** without a Graph
5. **Cannot process** Documents without uploading first

### Status Requirements:
- Graphs must be in **"ready"** status to be used
- Documents must be **"processed"** to have chunks extracted
- Schemas must be **"ready"** before creating graphs

### Workspace Isolation:
- Entities cannot be moved between workspaces
- Chunks/Documents can be assigned to multiple workspaces
- Rules apply to all graphs within a workspace

## 📊 Complete API Coverage

### Implemented Components:
✅ **Workspaces** - Full CRUD
✅ **Schemas** - Create, Read, Update, Delete, Generate
✅ **Graphs** - Full management, query, export, visualization
✅ **Nodes** - CRUD, merge, chunks association
✅ **Triples** - Create (batch), Read, Delete, chunks
✅ **Chunks** - CRUD, workspace assignment
✅ **Documents** - Upload, process, download, manage
✅ **Queries** - History view, delete
✅ **Rules** - Create merge rules, manage
✅ **Settings** - User, API keys, providers, system info

### API Methods by Module:

Total: **60+ API endpoints** fully integrated

- **Workspace**: 6 endpoints
- **Schema**: 6 endpoints
- **Graph**: 18 endpoints
- **Node**: 6 endpoints
- **Triple**: 6 endpoints
- **Chunk**: 7 endpoints
- **Document**: 9 endpoints
- **Query**: 3 endpoints
- **Rule**: 3 endpoints
- **User**: 6 endpoints
- **Task**: 1 endpoint
- **System**: 3 endpoints

## 🎯 Testing Sequence

To test the complete system:

1. **Start with Settings** → Configure API provider
2. **Create Workspace** → Foundation for everything
3. **Create Schema** → Define structure
4. **Create Graph** → Container for knowledge
5. **Upload Document** → Source data (optional)
6. **Create/Import Chunks** → Knowledge fragments
7. **Create Nodes** → Entities
8. **Create Triples** → Relationships
9. **Query Graph** → Retrieve information
10. **View Query History** → See past queries
11. **Create Rules** → Automate merging

## 🔐 Authentication

All API calls include the WhyHow API key in headers:
```javascript
headers: {
  'X-API-KEY': import.meta.env.VITE_WHYHOW_API_KEY,
  'Content-Type': 'application/json'
}
```

## 📝 Notes

- The system is designed for incremental data building
- Each level depends on the previous level being set up
- Bulk operations are supported for efficiency
- Error handling is implemented at each level
- Loading states are managed for all async operations
