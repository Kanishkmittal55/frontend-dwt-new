// Graph API operations
import { WhyHowClient } from './baseClient';

// Graph API methods - Complete implementation
export const graphAPI = {
  // Get all graphs
  getGraphs: async () => {
    const client = new WhyHowClient();
    return client.get('/graphs');
  },

  // Get a specific graph
  getGraph: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}`);
  },

  // Update a graph
  updateGraph: async (graphId, data) => {
    const client = new WhyHowClient();
    return client.put(`/graphs/${graphId}`, data);
  },

  // Delete a graph
  deleteGraph: async (graphId) => {
    const client = new WhyHowClient();
    return client.delete(`/graphs/${graphId}`);
  },

  // Get graph nodes
  getGraphNodes: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/nodes`);
  },

  // Get graph triples
  getGraphTriples: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/triples`);
  },

  // Get graph relations
  getGraphRelations: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/relations`);
  },

  // Get graph chunks
  getGraphChunks: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/chunks`);
  },

  // Get graph rules
  getGraphRules: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/rules`);
  },

  // Query a graph
  queryGraph: async (graphId, queryData) => {
    const client = new WhyHowClient();
    return client.post(`/graphs/${graphId}/query`, queryData);
  },

  // Create graph from triples
  createGraphFromTriples: async (data) => {
    const client = new WhyHowClient();
    return client.post('/graphs/from_triples', data);
  },

  // Get graph creation details
  getGraphCreateDetails: async (data) => {
    const client = new WhyHowClient();
    return client.post('/graphs/create_details', data);
  },

  // Add chunks to graph
  addChunksToGraph: async (data) => {
    const client = new WhyHowClient();
    return client.put('/graphs/add_chunks', data);
  },

  // Merge nodes
  mergeNodes: async (graphId, data) => {
    const client = new WhyHowClient();
    return client.post(`/graphs/${graphId}/merge_nodes`, data);
  },

  // Get similar nodes
  getSimilarNodes: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/resolve`);
  },

  // Export graph to Cypher
  exportGraphToCypher: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/${graphId}/export/cypher`);
  },

  // Public graph endpoints
  getPublicGraph: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/public/${graphId}`);
  },

  getPublicGraphNodes: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/public/${graphId}/nodes`);
  },

  getPublicGraphTriples: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/public/${graphId}/triples`);
  },

  getPublicGraphRelations: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/public/${graphId}/relations`);
  },

  getPublicGraphChunks: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/public/${graphId}/chunks`);
  },

  getPublicGraphRules: async (graphId) => {
    const client = new WhyHowClient();
    return client.get(`/graphs/public/${graphId}/rules`);
  }
};

export default graphAPI;
