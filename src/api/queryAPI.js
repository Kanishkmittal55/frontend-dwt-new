// Queries API operations
import { WhyHowClient } from './baseClient';

// Queries API methods
export const queryAPI = {
  // Get all queries
  getQueries: async (params = {}) => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/queries${queryString ? `?${queryString}` : ''}`);
  },

  // Get a specific query
  getQuery: async (queryId) => {
    const client = new WhyHowClient();
    return client.get(`/queries/${queryId}`);
  },

  // Delete a query
  deleteQuery: async (queryId) => {
    const client = new WhyHowClient();
    return client.delete(`/queries/${queryId}`);
  }
};

export default queryAPI;
