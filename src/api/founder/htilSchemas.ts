/**
 * HTIL (How To Infuse Learning) Validation Schemas
 * Zod schemas for form validation
 */
import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const HTILDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type HTILDifficulty = z.infer<typeof HTILDifficultySchema>;

export const HTILExerciseTypeSchema = z.enum(['practice', 'concept', 'problem', 'starred']);
export type HTILExerciseType = z.infer<typeof HTILExerciseTypeSchema>;

export const HTILQuizDifficultySchema = z.enum(['easy', 'medium', 'hard', 'mixed']);
export type HTILQuizDifficulty = z.infer<typeof HTILQuizDifficultySchema>;

// ============================================================================
// Course Schemas
// ============================================================================

export const CreateHTILCourseRequestSchema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  source_document_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
});

export type CreateHTILCourseRequest = z.infer<typeof CreateHTILCourseRequestSchema>;

export const UpdateHTILCourseRequestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  source_document_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
});

export type UpdateHTILCourseRequest = z.infer<typeof UpdateHTILCourseRequestSchema>;

// ============================================================================
// Module Schemas
// ============================================================================

export const CreateHTILModuleRequestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  cluster_label: z.string().max(100, 'Label must be less than 100 characters').optional(),
  sequence_order: z.number().int().min(1, 'Sequence must be at least 1').optional()
});

export type CreateHTILModuleRequest = z.infer<typeof CreateHTILModuleRequestSchema>;

export const UpdateHTILModuleRequestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  cluster_label: z.string().max(100, 'Label must be less than 100 characters').optional()
});

export type UpdateHTILModuleRequest = z.infer<typeof UpdateHTILModuleRequestSchema>;

// ============================================================================
// Lesson Schemas
// ============================================================================

export const CreateHTILLessonRequestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content must be less than 100,000 characters'),
  summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
  key_concepts: z.array(z.string().max(100)).max(20, 'Maximum 20 key concepts').optional(),
  sequence_order: z.number().int().min(1, 'Sequence must be at least 1').optional(),
  estimated_minutes: z.number().int().min(1).max(600, 'Maximum 10 hours').optional()
});

export type CreateHTILLessonRequest = z.infer<typeof CreateHTILLessonRequestSchema>;

export const UpdateHTILLessonRequestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content must be less than 100,000 characters')
    .optional(),
  canvas_content: z.string()
    .max(5000000, 'Canvas content must be less than 5MB')
    .optional(),
  summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
  key_concepts: z.array(z.string().max(100)).max(20, 'Maximum 20 key concepts').optional(),
  estimated_minutes: z.number().int().min(1).max(600, 'Maximum 10 hours').optional()
});

export type UpdateHTILLessonRequest = z.infer<typeof UpdateHTILLessonRequestSchema>;

// ============================================================================
// Exercise Schemas
// ============================================================================

export const CreateHTILExerciseRequestSchema = z.object({
  exercise_id: z.string()
    .min(1, 'Exercise ID is required')
    .max(50, 'Exercise ID must be less than 50 characters'),
  statement: z.string()
    .min(1, 'Problem statement is required')
    .max(10000, 'Statement must be less than 10,000 characters'),
  hints: z.array(z.string().max(1000)).max(10, 'Maximum 10 hints').optional(),
  solution: z.string().max(10000, 'Solution must be less than 10,000 characters').optional(),
  explanation: z.string().max(10000, 'Explanation must be less than 10,000 characters').optional(),
  difficulty: HTILDifficultySchema.default('intermediate'),
  exercise_type: HTILExerciseTypeSchema.default('practice'),
  sequence_order: z.number().int().min(1, 'Sequence must be at least 1').optional()
});

export type CreateHTILExerciseRequest = z.infer<typeof CreateHTILExerciseRequestSchema>;

export const UpdateHTILExerciseRequestSchema = z.object({
  exercise_id: z.string()
    .min(1, 'Exercise ID is required')
    .max(50, 'Exercise ID must be less than 50 characters')
    .optional(),
  statement: z.string()
    .min(1, 'Problem statement is required')
    .max(10000, 'Statement must be less than 10,000 characters')
    .optional(),
  hints: z.array(z.string().max(1000)).max(10, 'Maximum 10 hints').optional(),
  solution: z.string().max(10000, 'Solution must be less than 10,000 characters').optional(),
  explanation: z.string().max(10000, 'Explanation must be less than 10,000 characters').optional(),
  difficulty: HTILDifficultySchema.optional(),
  exercise_type: HTILExerciseTypeSchema.optional()
});

export type UpdateHTILExerciseRequest = z.infer<typeof UpdateHTILExerciseRequestSchema>;

export const CompleteExerciseRequestSchema = z.object({
  founder_notes: z.string().max(5000, 'Notes must be less than 5000 characters').optional()
});

export type CompleteExerciseRequest = z.infer<typeof CompleteExerciseRequestSchema>;

// ============================================================================
// Quiz Schemas
// ============================================================================

export const QuizQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required').max(1000),
  options: z.array(z.string().max(500)).min(2, 'At least 2 options required').max(6, 'Maximum 6 options'),
  correct_index: z.number().int().min(0, 'Correct answer index required'),
  explanation: z.string().max(2000).optional()
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const CreateHTILQuizRequestSchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  questions: z.array(QuizQuestionSchema).min(1, 'At least one question required').max(50, 'Maximum 50 questions'),
  passing_score: z.number().min(0).max(1).default(0.7),
  difficulty: HTILQuizDifficultySchema.default('mixed'),
  time_limit_minutes: z.number().int().min(1).max(180).optional()
});

export type CreateHTILQuizRequest = z.infer<typeof CreateHTILQuizRequestSchema>;

export const UpdateHTILQuizRequestSchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  questions: z.array(QuizQuestionSchema).min(1, 'At least one question required').max(50, 'Maximum 50 questions').optional(),
  passing_score: z.number().min(0).max(1).optional(),
  difficulty: HTILQuizDifficultySchema.optional(),
  time_limit_minutes: z.number().int().min(1).max(180).optional()
});

export type UpdateHTILQuizRequest = z.infer<typeof UpdateHTILQuizRequestSchema>;

// ============================================================================
// Reorder Schema
// ============================================================================

export const ReorderRequestSchema = z.object({
  new_sequence: z.number().int().min(1, 'Sequence must be at least 1')
});

export type ReorderRequest = z.infer<typeof ReorderRequestSchema>;
