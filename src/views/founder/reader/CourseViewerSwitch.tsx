/**
 * CourseViewerSwitch
 * 
 * Conditionally renders either the legacy CLRSCourse or the new CourseViewer
 * based on the FEATURES.USE_CANVAS_VIEWER flag.
 * 
 * This allows for easy switching between viewers without modifying routes.
 * 
 * To switch viewers:
 * 1. Set VITE_COURSE_VIEWER_MODE=canvas in .env (or .env.local)
 * 2. Or modify COURSE_VIEWER_MODE in src/config/features.ts directly
 * 
 * Usage in routes:
 *   import CourseViewerSwitch from 'views/founder/reader/CourseViewerSwitch';
 *   <Route path="courses" element={<CourseViewerSwitch />} />
 */
import { FEATURES } from '@/config/features';
import CLRSCourse from './CLRSCourse';
import CourseViewer from './CourseViewer';

export default function CourseViewerSwitch() {
  // Feature flag controlled switch
  if (FEATURES.USE_CANVAS_VIEWER) {
    return <CourseViewer />;
  }

  // Default: Legacy viewer
  return <CLRSCourse />;
}

/**
 * Hook to get current viewer mode (for debugging/display)
 */
export function useViewerMode(): 'legacy' | 'canvas' {
  return FEATURES.USE_CANVAS_VIEWER ? 'canvas' : 'legacy';
}

