/**
 * Founder Context
 * Manages founder profile state throughout the app
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
import { useAuth } from './AuthContext';
import {
  getProfile,
  createProfile,
  updateProfile,
  completeOnboarding,
  type FounderProfile,
  type CreateFounderProfileRequest,
  type UpdateFounderProfileRequest
} from 'api/founder';

// ============================================================================
// Types
// ============================================================================

export interface FounderContextValue {
  // State
  founderProfile: FounderProfile | null;
  isProfileLoading: boolean;
  isProfileComplete: boolean;
  profileError: string | null;

  // Methods
  loadProfile: () => Promise<void>;
  saveProfile: (data: CreateFounderProfileRequest) => Promise<FounderProfile>;
  updateFounderProfile: (updates: UpdateFounderProfileRequest) => Promise<FounderProfile>;
  finishOnboarding: () => Promise<void>;
  clearProfileError: () => void;
}

interface FounderProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const FounderContext = createContext<FounderContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function FounderProvider({ children }: FounderProviderProps) {
  const { userId, isAuthenticated } = useAuth();

  // State
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Derived state
  const isProfileComplete = useMemo(() => {
    return founderProfile?.onboarding_completed === true;
  }, [founderProfile]);

  /**
   * Clear profile error
   */
  const clearProfileError = useCallback(() => {
    setProfileError(null);
  }, []);

  /**
   * Load founder profile from API
   */
  const loadProfile = useCallback(async () => {
    if (!userId) {
      setFounderProfile(null);
      return;
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const profile = await getProfile(userId);
      setFounderProfile(profile);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to load profile';
      setProfileError(errorMessage);
      setFounderProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

  /**
   * Create or save founder profile
   */
  const saveProfile = useCallback(async (data: CreateFounderProfileRequest): Promise<FounderProfile> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      // Ensure user_id is set
      const profileData: CreateFounderProfileRequest = {
        ...data,
        user_id: userId
      };

      const profile = await createProfile(profileData);
      setFounderProfile(profile);
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to save profile';
      setProfileError(errorMessage);
      throw error;
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

  /**
   * Update existing founder profile
   */
  const updateFounderProfile = useCallback(async (
    updates: UpdateFounderProfileRequest
  ): Promise<FounderProfile> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const profile = await updateProfile(userId, updates);
      setFounderProfile(profile);
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update profile';
      setProfileError(errorMessage);
      throw error;
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

  /**
   * Complete onboarding process
   */
  const finishOnboarding = useCallback(async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const profile = await completeOnboarding(userId);
      setFounderProfile(profile);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to complete onboarding';
      setProfileError(errorMessage);
      throw error;
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

  /**
   * Load profile when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadProfile();
    } else {
      setFounderProfile(null);
    }
  }, [isAuthenticated, userId, loadProfile]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<FounderContextValue>(
    () => ({
      founderProfile,
      isProfileLoading,
      isProfileComplete,
      profileError,
      loadProfile,
      saveProfile,
      updateFounderProfile,
      finishOnboarding,
      clearProfileError
    }),
    [
      founderProfile,
      isProfileLoading,
      isProfileComplete,
      profileError,
      loadProfile,
      saveProfile,
      updateFounderProfile,
      finishOnboarding,
      clearProfileError
    ]
  );

  return (
    <FounderContext.Provider value={value}>
      {children}
    </FounderContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access founder context
 * Must be used within FounderProvider
 */
export function useFounder(): FounderContextValue {
  const context = useContext(FounderContext);

  if (context === undefined) {
    throw new Error('useFounder must be used within a FounderProvider');
  }

  return context;
}

// ============================================================================
// Export
// ============================================================================

export { FounderContext };
export default FounderProvider;

