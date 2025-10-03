// Rules API operations
import { WhyHowClient } from './baseClient';

// Rules API methods
export const ruleAPI = {
  // Create a new rule
  createRule: async (data) => {
    const client = new WhyHowClient();
    return client.post('/rules', data);
  },

  // Get all rules
  getRules: async (params = {}) => {
    const client = new WhyHowClient();
    const queryString = new URLSearchParams(params).toString();
    return client.get(`/rules${queryString ? `?${queryString}` : ''}`);
  },

  // Delete a rule
  deleteRule: async (ruleId) => {
    const client = new WhyHowClient();
    return client.delete(`/rules/${ruleId}`);
  }
};

export default ruleAPI;
