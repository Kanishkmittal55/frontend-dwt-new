// System API operations (root, db, settings)
import { WhyHowClient } from './baseClient';

// System API methods
export const systemAPI = {
  // Get root/health check
  getRoot: async () => {
    const client = new WhyHowClient();
    return client.get('/');
  },

  // Get database info
  getDatabase: async () => {
    const client = new WhyHowClient();
    return client.get('/db');
  },

  // Get system settings
  getSettings: async () => {
    const client = new WhyHowClient();
    return client.get('/settings');
  }
};

export default systemAPI;
