/**
 * Founder OS API - Main Export
 * 
 * Usage:
 *   import { founderClient, authAPI, schemas } from 'api/founder';
 *   import type { FounderProfile, IdeaResponse } from 'api/founder';
 */

// Client
export { 
  founderClient, 
  default as FounderClient,
  // Token management
  getStoredToken,
  setStoredToken,
  getStoredUserId,
  setStoredUserId,
  getStoredUserUuid,
  setStoredUserUuid,
  clearStoredAuth,
  isAuthenticated
} from './founderClient';

export type { ApiError, RequestOptions } from './founderClient';

// Auth API
export { 
  authAPI,
  login,
  logout,
  register,
  getAuthState,
  getSession,
  createSession,
  validateToken
} from './authAPI';

export type { LoginResponse, AuthState, RegisterRequest } from './authAPI';

// Founder Profile API
export {
  founderProfileAPI,
  createProfile,
  getProfile,
  hasProfile,
  updateProfile,
  completeOnboarding,
  deleteProfile,
  calculateFitScore
} from './founderProfileAPI';

export type { 
  FounderProfile, 
  CreateFounderProfileRequest, 
  UpdateFounderProfileRequest,
  FitScoreRequest,
  FitScoreResponse
} from './founderProfileAPI';

// Ideas API
export {
  ideasAPI,
  getPendingIdeas,
  submitReview,
  approveIdea,
  rejectIdea,
  deferIdea,
  submitTextForIdeas,
  getIdeaByUuid,
  getPendingIdeasCount,
  // Helpers
  isReviewable,
  isEnriching,
  getIdeaStatusLabel,
  getWorkflowStageColor,
  getFitScoreColor
} from './ideasAPI';

export type {
  IdeaResponse,
  PendingIdeasResponse,
  ReviewDecision,
  ReviewIdeaRequest,
  SubmitIdeaRequest,
  SubmitTextRequest,
  ChunksResponse
} from './ideasAPI';

// Upload API
export {
  uploadAPI,
  getUploadUrl,
  uploadFileToS3,
  startProcessingJob,
  uploadAndProcess,
  submitTextForProcessing,
  getMimeType,
  isValidFileType
} from './uploadAPI';

export type {
  PresignedUploadResponse,
  ScraperJobResponse
} from './uploadAPI';

// Schemas & Types
export * from './schemas';

// Re-export schemas as a namespace for convenience
import * as schemas from './schemas';
export { schemas };

