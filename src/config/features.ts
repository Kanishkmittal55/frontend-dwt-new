/**
 * Feature Flags Configuration
 * 
 * Centralized feature toggles for the application.
 * These can be controlled via environment variables or changed directly.
 * 
 * Usage:
 *   import { FEATURES } from '@/config/features';
 *   if (FEATURES.USE_CANVAS_VIEWER) { ... }
 */

// ============================================================================
// Course Viewer Mode
// ============================================================================

/**
 * Which course viewer to use:
 * - 'legacy' = CLRSCourse.tsx (original markdown-based viewer)
 * - 'canvas' = CourseViewer.tsx (new tldraw-based canvas viewer)
 * 
 * Can be overridden with VITE_COURSE_VIEWER_MODE env variable
 */
export type CourseViewerMode = 'legacy' | 'canvas';

export const COURSE_VIEWER_MODE: CourseViewerMode = 
  (import.meta.env.VITE_COURSE_VIEWER_MODE as CourseViewerMode) || 'canvas';

// ============================================================================
// Feature Flags Object
// ============================================================================

export const FEATURES = {
  /**
   * Use the new canvas-based course viewer (tldraw)
   * Set to true to enable CourseViewer.tsx
   * Set to false to use CLRSCourse.tsx (legacy)
   */
  USE_CANVAS_VIEWER: COURSE_VIEWER_MODE === 'canvas',

  /**
   * Enable AI tutor integration in course viewer
   */
  ENABLE_TUTOR_AGENT: true,

  /**
   * Enable handwriting mode in canvas viewer
   */
  ENABLE_HANDWRITING: true,

  /**
   * Enable debug mode for development
   */
  DEBUG_MODE: import.meta.env.DEV || false,
} as const;

// ============================================================================
// Helper function to check feature flags
// ============================================================================

/**
 * Check if a feature is enabled
 * @param feature - The feature key to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// ============================================================================
// For switching viewers programmatically (useful for A/B testing)
// ============================================================================

/**
 * Get the course viewer component based on current mode
 * Usage in routes:
 * 
 * import { getCourseViewerComponent } from '@/config/features';
 * const CourseComponent = getCourseViewerComponent();
 * 
 * <Route path="courses" element={<CourseComponent />} />
 */
export async function getCourseViewerComponent() {
  if (FEATURES.USE_CANVAS_VIEWER) {
    const { default: CourseViewer } = await import('@/views/founder/reader/CourseViewer');
    return CourseViewer;
  } else {
    const { default: CLRSCourse } = await import('@/views/founder/reader/CLRSCourse');
    return CLRSCourse;
  }
}

export default FEATURES;






