/**
 * Founder OS Authentication Context
 * Provides authentication state and methods throughout the app
 */
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  type ReactNode 
} from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  getAuthState,
  validateToken
} from 'api/founder';
import type { UserBasics } from 'api/founder';

// ============================================================================
// Types
// ============================================================================

export interface AuthContextValue {
  // State
  user: UserBasics | null;
  userId: number | null;
  founderToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  loginFounder: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<UserBasics | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [founderToken, setFounderToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation (may be null if outside Router)
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch {
    // Not inside a Router - navigation will be handled differently
  }

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if user is authenticated and token is valid
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get stored auth state
      const authState = getAuthState();
      
      if (!authState.isAuthenticated || !authState.token) {
        setIsAuthenticated(false);
        setUser(null);
        setUserId(null);
        setFounderToken(null);
        return false;
      }

      // Set state from localStorage
      setUserId(authState.userId);
      setFounderToken(authState.token);

      // Validate token by making a test request
      const isValid = await validateToken();
      
      if (isValid) {
        setIsAuthenticated(true);
        return true;
      } else {
        // Token invalid - clear auth
        apiLogout();
        setIsAuthenticated(false);
        setUser(null);
        setUserId(null);
        setFounderToken(null);
        return false;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
      setUser(null);
      setUserId(null);
      setFounderToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with username/email and password
   */
  const loginFounder = useCallback(async (
    usernameOrEmail: string, 
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { user: loggedInUser, token } = await apiLogin(usernameOrEmail, password);
      
      setUser(loggedInUser);
      setUserId(loggedInUser.id);
      setFounderToken(token);
      setIsAuthenticated(true);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { message?: string })?.message || 'Login failed';
      
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      setUserId(null);
      setFounderToken(null);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout - clear all auth state
   */
  const logout = useCallback(() => {
    // Clear API storage
    apiLogout();
    
    // Clear context state
    setUser(null);
    setUserId(null);
    setFounderToken(null);
    setIsAuthenticated(false);
    setError(null);

    // Redirect to login using base URL
    const baseUrl = import.meta.env.VITE_APP_BASE_NAME || '';
    if (navigate) {
      navigate('/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = `${baseUrl}/login`;
    }
  }, [navigate]);

  /**
   * Check auth on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId,
      founderToken,
      isAuthenticated,
      isLoading,
      error,
      loginFounder,
      logout,
      checkAuth,
      clearError
    }),
    [
      user,
      userId,
      founderToken,
      isAuthenticated,
      isLoading,
      error,
      loginFounder,
      logout,
      checkAuth,
      clearError
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================================================
// Export
// ============================================================================

export { AuthContext };
export default AuthProvider;

