// Tasks API operations
import { WhyHowClient } from './baseClient';

// Tasks API methods
export const taskAPI = {
  // Get task status
  getTask: async (taskId) => {
    const client = new WhyHowClient();
    return client.get(`/tasks/${taskId}`);
  }
};

export default taskAPI;
