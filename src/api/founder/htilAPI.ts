/**
 * HTIL (How To Infuse Learning) API
 * Incremental course creation and management
 * 
 * This API supports building courses piece by piece:
 * 1. Create empty course
 * 2. Add modules one at a time
 * 3. Add lessons to modules
 * 4. Add exercises/quizzes to lessons
 */
import { founderClient } from './founderClient';
import type { components } from '@/types/api.gen';
import type {
  CreateHTILCourseRequest,
  UpdateHTILCourseRequest,
  CreateHTILModuleRequest,
  UpdateHTILModuleRequest,
  ReorderRequest,
  CreateHTILLessonRequest,
  UpdateHTILLessonRequest,
  CreateHTILExerciseRequest,
  UpdateHTILExerciseRequest,
  CompleteExerciseRequest,
  CreateHTILQuizRequest,
  UpdateHTILQuizRequest
} from './htilSchemas';

// ============================================================================
// Types from OpenAPI
// ============================================================================

export type Course = components['schemas']['Course'];
export type CourseModule = components['schemas']['CourseModule'];
export type CourseLesson = components['schemas']['CourseLesson'];
export type CourseExercise = components['schemas']['CourseExercise'];
export type CourseQuiz = components['schemas']['CourseQuiz'];
export type CourseDetailResponse = components['schemas']['CourseDetailResponse'];

// ============================================================================
// Course CRUD
// ============================================================================

/**
 * Create a new empty HTIL course
 * POST /v1/htil/courses
 */
export async function createHTILCourse(data: CreateHTILCourseRequest): Promise<Course> {
  console.log('[htilAPI] createHTILCourse request:', data);
  try {
    const response = await founderClient.post<Course>('/v1/htil/courses', data);
    console.log('[htilAPI] createHTILCourse response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] createHTILCourse error:', error);
    throw error;
  }
}

/**
 * Get course with all nested data (modules, lessons, exercises, quizzes)
 * GET /v1/htil/courses/{courseUUID}
 */
export async function getHTILCourse(courseUUID: string): Promise<CourseDetailResponse> {
  console.log('[htilAPI] getHTILCourse request:', courseUUID);
  try {
    const response = await founderClient.get<CourseDetailResponse>(`/v1/htil/courses/${courseUUID}`);
    console.log('[htilAPI] getHTILCourse response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] getHTILCourse error:', error);
    throw error;
  }
}

/**
 * Update course metadata
 * PUT /v1/htil/courses/{courseUUID}
 */
export async function updateHTILCourse(courseUUID: string, data: UpdateHTILCourseRequest): Promise<Course> {
  console.log('[htilAPI] updateHTILCourse request:', courseUUID, data);
  try {
    const response = await founderClient.put<Course>(`/v1/htil/courses/${courseUUID}`, data);
    console.log('[htilAPI] updateHTILCourse response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] updateHTILCourse error:', error);
    throw error;
  }
}

/**
 * Delete course and all children
 * DELETE /v1/htil/courses/{courseUUID}
 */
export async function deleteHTILCourse(courseUUID: string): Promise<void> {
  console.log('[htilAPI] deleteHTILCourse request:', courseUUID);
  try {
    await founderClient.delete(`/v1/htil/courses/${courseUUID}`);
    console.log('[htilAPI] deleteHTILCourse success');
  } catch (error) {
    console.error('[htilAPI] deleteHTILCourse error:', error);
    throw error;
  }
}

// ============================================================================
// Module CRUD
// ============================================================================

/**
 * Add module to course
 * POST /v1/htil/courses/{courseUUID}/modules
 */
export async function createHTILModule(courseUUID: string, data: CreateHTILModuleRequest): Promise<CourseModule> {
  console.log('[htilAPI] createHTILModule request:', courseUUID, data);
  try {
    const response = await founderClient.post<CourseModule>(`/v1/htil/courses/${courseUUID}/modules`, data);
    console.log('[htilAPI] createHTILModule response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] createHTILModule error:', error);
    throw error;
  }
}

/**
 * Update module
 * PUT /v1/htil/modules/{moduleUUID}
 */
export async function updateHTILModule(moduleUUID: string, data: UpdateHTILModuleRequest): Promise<CourseModule> {
  console.log('[htilAPI] updateHTILModule request:', moduleUUID, data);
  try {
    const response = await founderClient.put<CourseModule>(`/v1/htil/modules/${moduleUUID}`, data);
    console.log('[htilAPI] updateHTILModule response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] updateHTILModule error:', error);
    throw error;
  }
}

/**
 * Delete module and its lessons
 * DELETE /v1/htil/modules/{moduleUUID}
 */
export async function deleteHTILModule(moduleUUID: string): Promise<void> {
  console.log('[htilAPI] deleteHTILModule request:', moduleUUID);
  try {
    await founderClient.delete(`/v1/htil/modules/${moduleUUID}`);
    console.log('[htilAPI] deleteHTILModule success');
  } catch (error) {
    console.error('[htilAPI] deleteHTILModule error:', error);
    throw error;
  }
}

/**
 * Change module sequence order
 * PATCH /v1/htil/modules/{moduleUUID}/reorder
 */
export async function reorderHTILModule(moduleUUID: string, data: ReorderRequest): Promise<CourseModule> {
  console.log('[htilAPI] reorderHTILModule request:', moduleUUID, data);
  try {
    const response = await founderClient.patch<CourseModule>(`/v1/htil/modules/${moduleUUID}/reorder`, data);
    console.log('[htilAPI] reorderHTILModule response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] reorderHTILModule error:', error);
    throw error;
  }
}

// ============================================================================
// Lesson CRUD
// ============================================================================

/**
 * Add lesson to module
 * POST /v1/htil/modules/{moduleUUID}/lessons
 */
export async function createHTILLesson(moduleUUID: string, data: CreateHTILLessonRequest): Promise<CourseLesson> {
  console.log('[htilAPI] createHTILLesson request:', moduleUUID, data);
  try {
    const response = await founderClient.post<CourseLesson>(`/v1/htil/modules/${moduleUUID}/lessons`, data);
    console.log('[htilAPI] createHTILLesson response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] createHTILLesson error:', error);
    throw error;
  }
}

/**
 * Update lesson content
 * PUT /v1/htil/lessons/{lessonUUID}
 */
export async function updateHTILLesson(lessonUUID: string, data: UpdateHTILLessonRequest): Promise<CourseLesson> {
  console.log('[htilAPI] updateHTILLesson request:', lessonUUID, data);
  try {
    const response = await founderClient.put<CourseLesson>(`/v1/htil/lessons/${lessonUUID}`, data);
    console.log('[htilAPI] updateHTILLesson response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] updateHTILLesson error:', error);
    throw error;
  }
}

/**
 * Delete lesson and its exercises
 * DELETE /v1/htil/lessons/{lessonUUID}
 */
export async function deleteHTILLesson(lessonUUID: string): Promise<void> {
  console.log('[htilAPI] deleteHTILLesson request:', lessonUUID);
  try {
    await founderClient.delete(`/v1/htil/lessons/${lessonUUID}`);
    console.log('[htilAPI] deleteHTILLesson success');
  } catch (error) {
    console.error('[htilAPI] deleteHTILLesson error:', error);
    throw error;
  }
}

/**
 * Change lesson sequence order
 * PATCH /v1/htil/lessons/{lessonUUID}/reorder
 */
export async function reorderHTILLesson(lessonUUID: string, data: ReorderRequest): Promise<CourseLesson> {
  console.log('[htilAPI] reorderHTILLesson request:', lessonUUID, data);
  try {
    const response = await founderClient.patch<CourseLesson>(`/v1/htil/lessons/${lessonUUID}/reorder`, data);
    console.log('[htilAPI] reorderHTILLesson response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] reorderHTILLesson error:', error);
    throw error;
  }
}

// ============================================================================
// Exercise CRUD
// ============================================================================

/**
 * Add exercise to lesson
 * POST /v1/htil/lessons/{lessonUUID}/exercises
 */
export async function createHTILExercise(lessonUUID: string, data: CreateHTILExerciseRequest): Promise<CourseExercise> {
  console.log('[htilAPI] createHTILExercise request:', lessonUUID, data);
  try {
    const response = await founderClient.post<CourseExercise>(`/v1/htil/lessons/${lessonUUID}/exercises`, data);
    console.log('[htilAPI] createHTILExercise response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] createHTILExercise error:', error);
    throw error;
  }
}

/**
 * Update exercise
 * PUT /v1/htil/exercises/{exerciseUUID}
 */
export async function updateHTILExercise(exerciseUUID: string, data: UpdateHTILExerciseRequest): Promise<CourseExercise> {
  console.log('[htilAPI] updateHTILExercise request:', exerciseUUID, data);
  try {
    const response = await founderClient.put<CourseExercise>(`/v1/htil/exercises/${exerciseUUID}`, data);
    console.log('[htilAPI] updateHTILExercise response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] updateHTILExercise error:', error);
    throw error;
  }
}

/**
 * Delete exercise
 * DELETE /v1/htil/exercises/{exerciseUUID}
 */
export async function deleteHTILExercise(exerciseUUID: string): Promise<void> {
  console.log('[htilAPI] deleteHTILExercise request:', exerciseUUID);
  try {
    await founderClient.delete(`/v1/htil/exercises/${exerciseUUID}`);
    console.log('[htilAPI] deleteHTILExercise success');
  } catch (error) {
    console.error('[htilAPI] deleteHTILExercise error:', error);
    throw error;
  }
}

/**
 * Mark exercise as complete with optional notes
 * PATCH /v1/htil/exercises/{exerciseUUID}/complete
 */
export async function completeHTILExercise(exerciseUUID: string, data: CompleteExerciseRequest): Promise<CourseExercise> {
  console.log('[htilAPI] completeHTILExercise request:', exerciseUUID, data);
  try {
    const response = await founderClient.patch<CourseExercise>(`/v1/htil/exercises/${exerciseUUID}/complete`, data);
    console.log('[htilAPI] completeHTILExercise response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] completeHTILExercise error:', error);
    throw error;
  }
}

// ============================================================================
// Quiz CRUD
// ============================================================================

/**
 * Create quiz for a lesson
 * POST /v1/htil/lessons/{lessonUUID}/quiz
 */
export async function createHTILQuiz(lessonUUID: string, data: CreateHTILQuizRequest): Promise<CourseQuiz> {
  console.log('[htilAPI] createHTILQuiz request:', lessonUUID, data);
  try {
    const response = await founderClient.post<CourseQuiz>(`/v1/htil/lessons/${lessonUUID}/quiz`, data);
    console.log('[htilAPI] createHTILQuiz response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] createHTILQuiz error:', error);
    throw error;
  }
}

/**
 * Update quiz questions
 * PUT /v1/htil/quizzes/{quizUUID}
 */
export async function updateHTILQuiz(quizUUID: string, data: UpdateHTILQuizRequest): Promise<CourseQuiz> {
  console.log('[htilAPI] updateHTILQuiz request:', quizUUID, data);
  try {
    const response = await founderClient.put<CourseQuiz>(`/v1/htil/quizzes/${quizUUID}`, data);
    console.log('[htilAPI] updateHTILQuiz response:', response);
    return response;
  } catch (error) {
    console.error('[htilAPI] updateHTILQuiz error:', error);
    throw error;
  }
}

/**
 * Delete quiz
 * DELETE /v1/htil/quizzes/{quizUUID}
 */
export async function deleteHTILQuiz(quizUUID: string): Promise<void> {
  console.log('[htilAPI] deleteHTILQuiz request:', quizUUID);
  try {
    await founderClient.delete(`/v1/htil/quizzes/${quizUUID}`);
    console.log('[htilAPI] deleteHTILQuiz success');
  } catch (error) {
    console.error('[htilAPI] deleteHTILQuiz error:', error);
    throw error;
  }
}

// ============================================================================
// Convenience Types
// ============================================================================

export interface HTILCourseTree {
  course: Course;
  modules: Array<{
    module: CourseModule;
    lessons: Array<{
      lesson: CourseLesson;
      exercises: CourseExercise[];
      quiz?: CourseQuiz;
    }>;
  }>;
}

/**
 * Build a complete course tree from flat course detail response
 * Useful for rendering the course structure in the UI
 */
export function buildCourseTree(detail: CourseDetailResponse): HTILCourseTree {
  return {
    course: detail.course,
    modules: detail.modules.map(module => ({
      module,
      lessons: [] // Lessons need to be fetched separately or included in module
    }))
  };
}
