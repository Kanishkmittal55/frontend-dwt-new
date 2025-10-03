// Schema API operations
import { WhyHowClient } from './baseClient';

// Schema API methods
export const schemaAPI = {
  // Get all schemas
  getTriples: async () => {
    const client = new WhyHowClient();
    return client.get('/triples');
  },

  // Create a new schema
  createTriples: async (data) => {
    const client = new WhyHowClient();
    return client.post('/triples', data);
  },

  // Get a specific schema
  getSchema: async (schemaId) => {
    const client = new WhyHowClient();
    return client.get(`/schemas/${schemaId}`);
  },

  // Update a schema
  updateSchema: async (schemaId, data) => {
    const client = new WhyHowClient();
    return client.put(`/schemas/${schemaId}`, data);
  },

  // Delete a schema
  deleteSchema: async (schemaId) => {
    const client = new WhyHowClient();
    return client.delete(`/schemas/${schemaId}`);
  },

  // Generate schema from questions
  generateSchema: async (data) => {
    const client = new WhyHowClient();
    return client.post('/schemas/generate', data);
  }
};

export default schemaAPI;
