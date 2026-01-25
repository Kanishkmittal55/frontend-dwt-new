/**
 * Courses API
 * Handles course retrieval and management for Founder OS Learning
 */
import { founderClient } from './founderClient';
import {
  CourseListResponseSchema,
  CourseDetailResponseSchema,
  CourseLessonDetailResponseSchema,
  CourseLessonSchema,
  CourseQuizSchema,
  type CourseListResponse,
  type CourseDetailResponse,
  type CourseLessonDetailResponse,
  type Course,
  type CourseModule,
  type CourseLesson,
  type CourseQuiz,
  type CourseStatus,
  parseApiResponse
} from './schemas';

// ============================================================================
// Types
// ============================================================================

export type CourseFilter = 'all' | 'ready' | 'pending' | 'failed';

export interface GetCoursesParams {
  status?: CourseFilter;
  limit?: number;
  offset?: number;
}

// Re-export types for convenience
export type {
  Course,
  CourseModule,
  CourseLesson,
  CourseQuiz,
  CourseStatus,
  CourseListResponse,
  CourseDetailResponse,
  CourseLessonDetailResponse
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get list of courses for a user
 * GET /v1/courses/{userID}
 * 
 * @param userID - The user's ID
 * @param params - Optional filter parameters
 * @returns CourseListResponse with list of courses and total count
 */
export async function getCourses(
  userID: number,
  params: GetCoursesParams = {}
): Promise<CourseListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.status && params.status !== 'all') {
    queryParams.set('status', params.status);
  }
  if (params.limit) {
    queryParams.set('limit', params.limit.toString());
  }
  if (params.offset) {
    queryParams.set('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/v1/courses/${userID}${queryString ? `?${queryString}` : ''}`;
  
  console.log('[coursesAPI] getCourses calling:', endpoint);
  
  const response = await founderClient.get<CourseListResponse>(endpoint);
  const validated = parseApiResponse(CourseListResponseSchema, response);
  
  console.log('[coursesAPI] getCourses response:', validated.total, 'courses');
  return validated;
}

/**
 * Get course detail by UUID
 * GET /v1/courses/detail/{courseUUID}
 * 
 * @param courseUUID - The course UUID
 * @returns CourseDetailResponse with course and modules
 */
export async function getCourseByUUID(
  courseUUID: string
): Promise<CourseDetailResponse> {
  const endpoint = `/v1/courses/detail/${courseUUID}`;
  
  console.log('[coursesAPI] getCourseByUUID calling:', endpoint);
  
  const response = await founderClient.get<CourseDetailResponse>(endpoint);
  const validated = parseApiResponse(CourseDetailResponseSchema, response);
  
  console.log('[coursesAPI] getCourseByUUID response:', validated.course.title, validated.modules.length, 'modules');
  return validated;
}

/**
 * Get lessons for a module
 * GET /v1/courses/modules/{moduleUUID}/lessons
 * 
 * @param moduleUUID - The module UUID
 * @returns Array of CourseLesson
 */
export async function getLessonsByModule(
  moduleUUID: string
): Promise<CourseLesson[]> {
  const endpoint = `/v1/courses/modules/${moduleUUID}/lessons`;
  
  console.log('[coursesAPI] getLessonsByModule calling:', endpoint);
  
  // Backend returns { lessons: [...] }, extract the array
  const response = await founderClient.get<{ lessons: CourseLesson[] }>(endpoint);
  const lessons = response.lessons || [];
  
  // Validate each lesson
  const validated = lessons.map(lesson => parseApiResponse(CourseLessonSchema, lesson));
  
  console.log('[coursesAPI] getLessonsByModule response:', validated.length, 'lessons');
  return validated;
}

/**
 * Get lesson detail with quiz
 * GET /v1/courses/lessons/{lessonUUID}
 * 
 * @param lessonUUID - The lesson UUID
 * @returns CourseLessonDetailResponse with lesson and optional quiz
 */
export async function getLessonByUUID(
  lessonUUID: string
): Promise<CourseLessonDetailResponse> {
  const endpoint = `/v1/courses/lessons/${lessonUUID}`;
  
  console.log('[coursesAPI] getLessonByUUID calling:', endpoint);
  
  const response = await founderClient.get<CourseLessonDetailResponse>(endpoint);
  const validated = parseApiResponse(CourseLessonDetailResponseSchema, response);
  
  console.log('[coursesAPI] getLessonByUUID response:', validated.lesson.title, validated.quiz ? 'with quiz' : 'no quiz');
  return validated;
}

/**
 * Get quiz for a lesson
 * GET /v1/courses/lessons/{lessonUUID}/quiz
 * 
 * @param lessonUUID - The lesson UUID
 * @returns CourseQuiz or null if not found
 */
export async function getQuizByLesson(
  lessonUUID: string
): Promise<CourseQuiz | null> {
  const endpoint = `/v1/courses/lessons/${lessonUUID}/quiz`;
  
  console.log('[coursesAPI] getQuizByLesson calling:', endpoint);
  
  try {
    const response = await founderClient.get<CourseQuiz>(endpoint);
    const validated = parseApiResponse(CourseQuizSchema, response);
    
    console.log('[coursesAPI] getQuizByLesson response:', validated.questions.length, 'questions');
    return validated;
  } catch (error) {
    const apiError = error as { status?: number };
    if (apiError.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a course and all its content
 * DELETE /v1/courses/detail/{courseUUID}
 * 
 * @param courseUUID - The course UUID to delete
 */
export async function deleteCourse(courseUUID: string): Promise<void> {
  const endpoint = `/v1/courses/detail/${courseUUID}`;
  
  console.log('[coursesAPI] deleteCourse calling:', endpoint);
  
  await founderClient.delete(endpoint);
  
  console.log('[coursesAPI] deleteCourse success');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get human-readable status label
 */
export function getCourseStatusLabel(status: CourseStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing_chunks':
      return 'Processing...';
    case 'creating_modules':
      return 'Creating Modules...';
    case 'enriching':
      return 'Enriching Content...';
    case 'generating_quizzes':
      return 'Generating Quizzes...';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

/**
 * Get color for course status (for UI badges)
 */
export function getCourseStatusColor(status: CourseStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'pending':
      return 'default';
    case 'processing_chunks':
    case 'creating_modules':
    case 'enriching':
    case 'generating_quizzes':
      return 'info';
    case 'ready':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Check if course is still processing
 */
export function isCourseProcessing(course: Course): boolean {
  return ['pending', 'processing_chunks', 'creating_modules', 'enriching', 'generating_quizzes'].includes(course.status);
}

/**
 * Format estimated time
 */
export function formatEstimatedTime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format hours to readable string
 */
export function formatEstimatedHours(hours: number | null | undefined): string {
  if (!hours) return '';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return hours === 1 ? '1 hour' : `${hours.toFixed(1)} hours`;
}

// ============================================================================
// Export
// ============================================================================

export const coursesAPI = {
  getCourses,
  getCourseByUUID,
  getLessonsByModule,
  getLessonByUUID,
  getQuizByLesson,
  deleteCourse,
  // Helpers
  getCourseStatusLabel,
  getCourseStatusColor,
  isCourseProcessing,
  formatEstimatedTime,
  formatEstimatedHours
};

export default coursesAPI;

