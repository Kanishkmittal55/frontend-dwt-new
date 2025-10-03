// Triples API operations
import { WhyHowClient } from './baseClient';

// Triples API methods
export const tripleAPI = {
  // Get all triples
  getTriples: async (params = {}) => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/triples${queryString ? `?${queryString}` : ''}`);
  },

  // Create triples
  createTriples: async (data) => {
    const client = new WhyHowClient();
    return client.post('/triples', data);
  },

  // Get a specific triple
  getTriple: async (tripleId) => {
    const client = new WhyHowClient();
    return client.get(`/triples/${tripleId}`);
  },

  // Delete a triple
  deleteTriple: async (tripleId) => {
    const client = new WhyHowClient();
    return client.delete(`/triples/${tripleId}`);
  },

  // Get triple with chunks
  getTripleWithChunks: async (tripleId) => {
    const client = new WhyHowClient();
    return client.get(`/triples/${tripleId}/chunks`);
  },

  // Get public triple with chunks
  getPublicTripleWithChunks: async (tripleId) => {
    const client = new WhyHowClient();
    return client.get(`/triples/public/${tripleId}/chunks`);
  }
};

export default tripleAPI;
