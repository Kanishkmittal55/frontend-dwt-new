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

// Enrichment API
export {
  enrichmentAPI,
  getEnrichmentStatus,
  getEnrichmentResult,
  triggerEnrichment,
  // Helpers
  isEnrichmentComplete,
  isEnrichmentProcessing,
  getEnrichmentStateLabel,
  getEnrichmentStateColor,
  interpretFitScore
} from './enrichmentAPI';

export type {
  EnrichmentStatus,
  EnrichmentResult,
  EnrichmentState,
  EnrichmentProgress
} from './enrichmentAPI';

// Library API
export {
  libraryAPI,
  submitUrlsForScraping,
  getUrlSources,
  addUrlSources,
  updateSourceStatus,
  deleteUrlSource
} from './libraryAPI';

export type {
  UrlSource,
  UrlSourcesResponse,
  ScrapeJobResponse
} from './libraryAPI';

// Trends API
export {
  trendsAPI,
  getTrendingEntities,
  getEntityTrendHistory
} from './trendsAPI';

export type {
  EntityType,
  PeriodType,
  EntityTrend,
  TrendingEntitiesResponse,
  TrendHistoryPoint,
  EntityTrendHistoryResponse
} from './trendsAPI';

// Agent API (WebSocket)
export {
  founderAgentClient,
  default as FounderAgentClient
} from './agentAPI';

export type {
  ConnectionState,
  AgentSession,
  AgentEventHandlers
} from './agentAPI';

// Courses API
export {
  coursesAPI,
  getCourses,
  getCourseByUUID,
  getLessonsByModule,
  getLessonByUUID,
  getQuizByLesson,
  // Helpers
  getCourseStatusLabel,
  getCourseStatusColor,
  isCourseProcessing,
  formatEstimatedTime,
  formatEstimatedHours
} from './coursesAPI';

export type {
  Course,
  CourseModule,
  CourseLesson,
  CourseQuiz,
  CourseStatus,
  CourseListResponse,
  CourseDetailResponse,
  CourseLessonDetailResponse,
  CourseFilter,
  GetCoursesParams
} from './coursesAPI';

// Schemas & Types
export * from './schemas';

// Re-export schemas as a namespace for convenience
import * as schemas from './schemas';
export { schemas };

