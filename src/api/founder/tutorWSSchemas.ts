/**
 * Zod schemas for Tutor WebSocket message payloads
 * Matches backend definitions in: users/internal/course_creator/ws/payloads/payloads.go
 */
import { z } from 'zod';

// ============================================================================
// Server → Client Payloads
// ============================================================================

// Intake Question from server
export const IntakeQuestionSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  question_type: z.enum(['open_ended', 'multiple_choice', 'scale']),
  options: z.array(z.string()).optional(),
  target_field: z.string(),
  why_asking: z.string().optional(),
  skip_allowed: z.boolean().optional().default(true),
  category: z.string().optional().default('motivation'),
  sequence: z.number().optional().default(0)
});

// Intake Progress from server
export const IntakeProgressSchema = z.object({
  questions_answered: z.number(),
  total_questions: z.number(),
  completion_percent: z.number()
});

// Lesson from server
export const LessonPayloadSchema = z.object({
  lesson_uuid: z.string(),
  title: z.string(),
  hook: z.string().optional().default(''),
  content: z.string(),
  summary: z.string().optional().default(''),
  key_concepts: z.array(z.string()).optional().default([]),
  estimated_mins: z.number().optional().default(5),
  chunk_index: z.number().optional().default(0),
  sequence: z.number().optional().default(1)
});

// Quiz Question from server
export const QuizQuestionPayloadSchema = z.object({
  quiz_id: z.string(),
  question_id: z.string(),
  question_text: z.string(),
  options: z.array(z.string()),
  difficulty: z.string().optional()
});

// Quiz Result from server
export const QuizResultPayloadSchema = z.object({
  quiz_id: z.string(),
  score: z.number(),
  passed: z.boolean(),
  correct_count: z.number(),
  total_questions: z.number(),
  feedback: z.string().optional()
});

// Chat Response from server
export const ChatResponsePayloadSchema = z.object({
  message: z.string(),
  message_id: z.string().optional(),
  is_typing: z.boolean().optional()
});

// State Change from server
export const StateChangePayloadSchema = z.object({
  previous_state: z.string(),
  current_state: z.string(),
  reason: z.string().optional(),
  session_id: z.string().optional(),
  transition_at: z.string().optional()
});

// ============================================================================
// Types (camelCase for frontend use)
// ============================================================================

export type IntakeQuestionRaw = z.infer<typeof IntakeQuestionSchema>;
export type IntakeProgressRaw = z.infer<typeof IntakeProgressSchema>;
export type LessonPayloadRaw = z.infer<typeof LessonPayloadSchema>;
export type QuizQuestionPayloadRaw = z.infer<typeof QuizQuestionPayloadSchema>;
export type QuizResultPayloadRaw = z.infer<typeof QuizResultPayloadSchema>;

// ============================================================================
// Converters (snake_case → camelCase)
// ============================================================================

export interface IntakeQuestion {
  questionId: string;
  questionText: string;
  questionType: 'open_ended' | 'multiple_choice' | 'scale';
  options?: string[];
  targetField: string;
  whyAsking?: string;
  skipAllowed: boolean;
  category: string;
  sequence: number;
}

export interface IntakeProgress {
  questionsAnswered: number;
  totalQuestions: number;
  completionPercent: number;
}

export interface LessonPayload {
  lessonUUID: string;
  title: string;
  hook: string;
  content: string;
  summary: string;
  keyConcepts: string[];
  estimatedMins: number;
  chunkIndex: number;
  sequence: number;
}

export function parseIntakeQuestion(raw: unknown): IntakeQuestion {
  const parsed = IntakeQuestionSchema.parse(raw);
  return {
    questionId: parsed.question_id,
    questionText: parsed.question_text,
    questionType: parsed.question_type,
    options: parsed.options,
    targetField: parsed.target_field,
    whyAsking: parsed.why_asking,
    skipAllowed: parsed.skip_allowed ?? true,
    category: parsed.category ?? 'motivation',
    sequence: parsed.sequence ?? 0
  };
}

export function parseIntakeProgress(raw: unknown): IntakeProgress {
  const parsed = IntakeProgressSchema.parse(raw);
  return {
    questionsAnswered: parsed.questions_answered,
    totalQuestions: parsed.total_questions,
    completionPercent: parsed.completion_percent
  };
}

export function parseLessonPayload(raw: unknown): LessonPayload {
  const parsed = LessonPayloadSchema.parse(raw);
  return {
    lessonUUID: parsed.lesson_uuid,
    title: parsed.title,
    hook: parsed.hook ?? '',
    content: parsed.content,
    summary: parsed.summary ?? '',
    keyConcepts: parsed.key_concepts ?? [],
    estimatedMins: parsed.estimated_mins ?? 5,
    chunkIndex: parsed.chunk_index ?? 0,
    sequence: parsed.sequence ?? 1
  };
}






