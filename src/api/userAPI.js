// Users API operations
import { WhyHowClient } from './baseClient';

// Users API methods
export const userAPI = {
  // Get WhyHow API key
  getApiKey: async () => {
    const client = new WhyHowClient();
    return client.get('/users/api_key');
  },

  // Rotate API key
  rotateApiKey: async () => {
    const client = new WhyHowClient();
    return client.post('/users/rotate_api_key', {});
  },

  // Set provider details (OpenAI, Azure, etc.)
  setProvidersDetails: async (data) => {
    const client = new WhyHowClient();
    return client.put('/users/set_providers_details', data);
  },

  // Get provider details
  getProvidersDetails: async () => {
    const client = new WhyHowClient();
    return client.get('/users/providers_details');
  },

  // Delete user account
  deleteUser: async () => {
    const client = new WhyHowClient();
    return client.delete('/users');
  },

  // Get user status
  getUserStatus: async () => {
    const client = new WhyHowClient();
    return client.get('/users/status');
  }
};

export default userAPI;
