// Main API index file - imports and exports all API modules
// This provides a clean interface for importing APIs throughout the application

export { WhyHowClient } from './baseClient';
export { workspaceAPI } from './workspaceAPI';
export { schemaAPI } from './schemaAPI';
export { graphAPI } from './graphAPI';
export { nodeAPI } from './nodeAPI';
export { tripleAPI } from './tripleAPI';
export { chunkAPI } from './chunkAPI';
export { documentAPI } from './documentAPI';
export { userAPI } from './userAPI';
export { queryAPI } from './queryAPI';
export { ruleAPI } from './ruleAPI';
export { taskAPI } from './taskAPI';
export { systemAPI } from './systemAPI';

// You can also export a combined object if needed
const whyhowAPI = {
  workspace: workspaceAPI,
  schema: schemaAPI,
  graph: graphAPI,
  node: nodeAPI,
  triple: tripleAPI,
  chunk: chunkAPI,
  document: documentAPI,
  user: userAPI,
  query: queryAPI,
  rule: ruleAPI,
  task: taskAPI,
  system: systemAPI
};

export default whyhowAPI;
