/**
 * Founder OS Authentication API
 * Handles login, logout, and token management
 */

import { 
  founderClient,
  setStoredToken,
  setStoredUserId,
  setStoredUserUuid,
  clearStoredAuth,
  getStoredToken,
  getStoredUserUuid
} from './founderClient';
import { 
  LoginRequestSchema, 
  RegisterRequestSchema,
  UserBasicsSchema,
  type LoginRequest,
  type UserBasics 
} from './schemas';

import { z } from 'zod';

// Type for registration request
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ============================================================================
// Types
// ============================================================================

export interface LoginResponse {
  user: UserBasics;
  token: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  userUuid: string | null;
  token: string | null;
}

// ============================================================================
// Auth API Functions
// ============================================================================

/**
 * Login with username/email and password
 * POST /v1/users/login
 * 
 * @param usernameOrEmail - Username or email address
 * @param password - User password
 * @returns LoginResponse with user data and token
 */
export async function login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
  // Validate input
  const credentials: LoginRequest = LoginRequestSchema.parse({
    username_or_email: usernameOrEmail,
    password
  });

  // Make login request (skip auth since we're logging in)
  const response = await founderClient.post<UserBasics>(
    '/v1/users/login',
    credentials,
    true // skipAuth = true for login
  );

  // Validate response
  const user = UserBasicsSchema.parse(response);

  // Extract token (backend returns refresh_token)
  const token = user.refresh_token || null;

  // Store auth data
  if (token) {
    setStoredToken(token);
  }
  setStoredUserId(user.id);
  setStoredUserUuid(user.uuid);

  return { user, token };
}

/**
 * Logout - Clear all stored auth data
 */
export function logout(): void {
  clearStoredAuth();
}

/**
 * Get current auth state from localStorage
 */
export function getAuthState(): AuthState {
  const token = getStoredToken();
  const userUuid = getStoredUserUuid();
  
  // Try to get userId from localStorage
  const userIdStr = localStorage.getItem('founder_user_id');
  const userId = userIdStr ? parseInt(userIdStr, 10) : null;

  return {
    isAuthenticated: !!token && !!userId,
    userId,
    userUuid,
    token
  };
}

/**
 * Refresh session token
 * GET /v1/sessions/{uuid}/fetch
 * 
 * Note: This fetches the existing session. For actual token refresh,
 * the backend may need a dedicated endpoint.
 * 
 * @param uuid - Session UUID (defaults to stored userUuid)
 * @returns Session data if found
 */
export async function getSession(uuid?: string): Promise<unknown> {
  const sessionUuid = uuid || getStoredUserUuid();
  
  if (!sessionUuid) {
    throw new Error('No session UUID available');
  }

  const response = await founderClient.get(`/v1/sessions/${sessionUuid}/fetch`);
  return response;
}

/**
 * Create a new session for logged-in user
 * POST /v1/sessions/{username}/create
 * 
 * @param username - Username to create session for
 * @param consentDate - ISO date string of consent
 * @returns New session data
 */
export async function createSession(username: string, consentDate: string): Promise<unknown> {
  const response = await founderClient.post(
    `/v1/sessions/${username}/create?consent_date=${encodeURIComponent(consentDate)}`,
    undefined,
    true // skipAuth for session creation
  );
  return response;
}

/**
 * Check if current token is valid by making a test request
 * Uses the founder profile endpoint as a validation check
 * 
 * @returns true if authenticated, false otherwise
 */
export async function validateToken(): Promise<boolean> {
  const { userId, token } = getAuthState();
  
  if (!token || !userId) {
    return false;
  }

  try {
    // Try to fetch the user's founder profile as a validation check
    await founderClient.get(`/v1/founder/profile/${userId}`);
    return true;
  } catch (error) {
    // If we get a 401 or 404, token is invalid or user doesn't have profile yet
    // 404 is okay - means user exists but no profile
    const apiError = error as { status?: number };
    if (apiError.status === 404) {
      return true; // User exists, just no profile
    }
    return false;
  }
}

/**
 * Register a new user
 * POST /v1/users/register
 * 
 * @param userData - Registration data (email, username, password, names)
 * @returns LoginResponse with user data (no token - need to login after)
 */
export async function register(userData: RegisterRequest): Promise<{ user: UserBasics }> {
  // Validate input
  const validatedData = RegisterRequestSchema.parse(userData);

  // Build the payload matching backend's RegisterUserPayloadV1
  // Backend generates uuid and id, only send required fields
  // Note: hashed_password is actually the plain password - backend hashes it
  const payload: Record<string, unknown> = {
    username: validatedData.username,
    email: validatedData.email,
    hashed_password: validatedData.password, // Backend hashes this despite the name
    first_name: validatedData.first_name,
    last_name: validatedData.last_name,
    is_email_verified: false
  };

  // Add optional fields only if provided
  if (validatedData.phone_number) {
    payload.phone_number = validatedData.phone_number;
  }
  if (validatedData.country) {
    payload.country = validatedData.country;
  }
  if (validatedData.consent_date) {
    payload.consent_date = validatedData.consent_date;
  }

  // Make registration request (skipAuth = false because we need X-API-KEY)
  const response = await founderClient.post<UserBasics>(
    '/v1/users/register',
    payload,
    false // Need X-API-KEY header for registration
  );

  // Validate response
  const user = UserBasicsSchema.parse(response);

  return { user };
}

// ============================================================================
// Export
// ============================================================================

export const authAPI = {
  login,
  logout,
  register,
  getAuthState,
  getSession,
  createSession,
  validateToken
};

export default authAPI;

