/**
 * Founder OS API Client
 * Base HTTP client for Go backend integration
 */

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_FOUNDER_API_URL || 'http://localhost:8000';
// Default to dev write key for local development (from users/internal/config/config.development.yaml)
const API_KEY = import.meta.env.VITE_FOUNDER_API_KEY || 'test-all-access-key';

// LocalStorage keys
const TOKEN_KEY = 'founder_token';
const USER_ID_KEY = 'founder_user_id';
const USER_UUID_KEY = 'founder_user_uuid';

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  status: number;
  message: string;
  isAuthError: boolean;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

// ============================================================================
// Token Management
// ============================================================================

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUserId(): number | null {
  const id = localStorage.getItem(USER_ID_KEY);
  return id ? parseInt(id, 10) : null;
}

export function setStoredUserId(userId: number): void {
  localStorage.setItem(USER_ID_KEY, userId.toString());
}

export function getStoredUserUuid(): string | null {
  return localStorage.getItem(USER_UUID_KEY);
}

export function setStoredUserUuid(uuid: string): void {
  localStorage.setItem(USER_UUID_KEY, uuid);
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_UUID_KEY);
  localStorage.removeItem('founder_remember');
}

export function isAuthenticated(): boolean {
  return !!getStoredToken() && !!getStoredUserId();
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Parse error response from Go backend
 * Backend returns: { "error": "string" }
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    // Go backend format
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
    // Fallback formats
    if (data.message) {
      return data.message;
    }
    if (data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    return JSON.stringify(data);
  } catch {
    return `HTTP Error: ${response.status} ${response.statusText}`;
  }
}

/**
 * Create ApiError from response
 */
async function createApiError(response: Response): Promise<ApiError> {
  const message = await parseErrorResponse(response);
  return {
    status: response.status,
    message,
    isAuthError: response.status === 401 || response.status === 403
  };
}

/**
 * Handle 401 Unauthorized - redirect to login
 */
function handleAuthError(): void {
  clearStoredAuth();
  // Only redirect if we're in a browser context and not already on login page
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    // Use the app's base URL from env
    const baseUrl = import.meta.env.VITE_APP_BASE_NAME || '';
    window.location.href = `${baseUrl}/login`;
  }
}

// ============================================================================
// Founder API Client Class
// ============================================================================

class FounderClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  /**
   * Get default headers for requests
   */
  private getHeaders(skipAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add API key if configured
    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    // Add Bearer token if authenticated and not skipping auth
    if (!skipAuth) {
      const token = getStoredToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Make HTTP request to Founder OS API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false } = options;

    const url = `${this.baseURL}${endpoint}`;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.getHeaders(skipAuth),
        ...headers
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const error = await createApiError(response);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          handleAuthError();
        }
        
        throw error;
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error) {
      // Re-throw ApiError as-is
      if ((error as ApiError).status !== undefined) {
        throw error;
      }
      
      // Network errors
      console.error('Founder API Request Failed:', error);
      throw {
        status: 0,
        message: error instanceof Error ? error.message : 'Network error',
        isAuthError: false
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', skipAuth });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data, skipAuth });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const founderClient = new FounderClient();
export default founderClient;

