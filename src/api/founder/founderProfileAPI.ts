/**
 * Founder Profile API
 * Handles founder profile CRUD operations
 */
import { founderClient } from './founderClient';
import type { components } from '@/types/api.gen';

// ============================================================================
// Types from OpenAPI
// ============================================================================

export type FounderProfile = components['schemas']['FounderProfile'];
export type CreateFounderProfileRequest = components['schemas']['CreateFounderProfileRequest'];
export type UpdateFounderProfileRequest = components['schemas']['UpdateFounderProfileRequest'];

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new founder profile
 * POST /v1/founder/profile
 * 
 * @param profileData - Profile data including user_id
 * @returns Created FounderProfile
 */
export async function createProfile(profileData: CreateFounderProfileRequest): Promise<FounderProfile> {
  const response = await founderClient.post<FounderProfile>(
    '/v1/founder/profile',
    profileData
  );
  return response;
}

/**
 * Get founder profile by user ID
 * GET /v1/founder/profile/{userID}
 * 
 * @param userID - The user's ID
 * @returns FounderProfile or null if not found
 */
export async function getProfile(userID: number): Promise<FounderProfile | null> {
  try {
    const response = await founderClient.get<FounderProfile>(
      `/v1/founder/profile/${userID}`
    );
    return response;
  } catch (error) {
    // Return null for 404 (profile not found)
    const apiError = error as { status?: number };
    if (apiError.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a founder profile exists for a user
 * 
 * @param userID - The user's ID
 * @returns true if profile exists
 */
export async function hasProfile(userID: number): Promise<boolean> {
  const profile = await getProfile(userID);
  return profile !== null;
}

/**
 * Update founder profile
 * PUT /v1/founder/profile/{userID}/update
 * 
 * @param userID - The user's ID
 * @param updates - Fields to update (partial)
 * @returns Updated FounderProfile
 */
export async function updateProfile(
  userID: number, 
  updates: UpdateFounderProfileRequest
): Promise<FounderProfile> {
  const response = await founderClient.put<FounderProfile>(
    `/v1/founder/profile/${userID}/update`,
    updates
  );
  return response;
}

/**
 * Complete founder onboarding
 * POST /v1/founder/profile/{userID}/complete-onboarding
 * 
 * @param userID - The user's ID
 * @returns Updated FounderProfile with onboarding_completed = true
 */
export async function completeOnboarding(userID: number): Promise<FounderProfile> {
  const response = await founderClient.post<FounderProfile>(
    `/v1/founder/profile/${userID}/complete-onboarding`,
    {}
  );
  return response;
}

/**
 * Delete founder profile
 * DELETE /v1/founder/profile/{userID}/delete
 * 
 * @param userID - The user's ID
 */
export async function deleteProfile(userID: number): Promise<void> {
  await founderClient.delete(`/v1/founder/profile/${userID}/delete`);
}

// ============================================================================
// Fit Score
// ============================================================================

export type FitScoreRequest = components['schemas']['FitScoreRequest'];
export type FitScoreResponse = components['schemas']['FitScoreResponse'];

/**
 * Calculate fit score for an idea
 * POST /v1/founder/profile/{userID}/fit-score
 * 
 * @param userID - The user's ID
 * @param ideaParams - Parameters to calculate fit score
 * @returns FitScoreResponse with breakdown
 */
export async function calculateFitScore(
  userID: number,
  ideaParams: FitScoreRequest
): Promise<FitScoreResponse> {
  const response = await founderClient.post<FitScoreResponse>(
    `/v1/founder/profile/${userID}/fit-score`,
    ideaParams
  );
  return response;
}

// ============================================================================
// Export
// ============================================================================

export const founderProfileAPI = {
  createProfile,
  getProfile,
  hasProfile,
  updateProfile,
  completeOnboarding,
  deleteProfile,
  calculateFitScore
};

export default founderProfileAPI;














