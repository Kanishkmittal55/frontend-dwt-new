/**
 * HTILLessonForm Component
 * Form for creating/editing a lesson
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import {
  CreateHTILLessonRequestSchema,
  UpdateHTILLessonRequestSchema,
  type CreateHTILLessonRequest,
  type UpdateHTILLessonRequest
} from '@/api/founder/htilSchemas';

// ============================================================================
// Types
// ============================================================================

interface HTILLessonFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateHTILLessonRequest>;
  onSubmit: (data: CreateHTILLessonRequest | UpdateHTILLessonRequest) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function HTILLessonForm({
  mode,
  initialData,
  onSubmit,
  onCancel
}: HTILLessonFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conceptInput, setConceptInput] = useState('');

  const schema = mode === 'create' ? CreateHTILLessonRequestSchema : UpdateHTILLessonRequestSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid }
  } = useForm<CreateHTILLessonRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      summary: initialData?.summary || '',
      key_concepts: initialData?.key_concepts || [],
      sequence_order: initialData?.sequence_order,
      estimated_minutes: initialData?.estimated_minutes
    },
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: CreateHTILLessonRequest) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          label="Lesson Title"
          placeholder="e.g., 2.1 Insertion Sort"
          fullWidth
          required
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register('title')}
        />

        <TextField
          label="Content"
          placeholder="Write your lesson content here... (Markdown supported)"
          fullWidth
          required
          multiline
          rows={10}
          error={!!errors.content}
          helperText={errors.content?.message}
          {...register('content')}
        />

        <TextField
          label="Summary"
          placeholder="Brief summary of this lesson..."
          fullWidth
          multiline
          rows={2}
          error={!!errors.summary}
          helperText={errors.summary?.message}
          {...register('summary')}
        />

        {/* Key Concepts */}
        <Controller
          name="key_concepts"
          control={control}
          render={({ field }) => (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Key Concepts
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {field.value?.map((concept, idx) => (
                  <Chip
                    key={idx}
                    label={concept}
                    onDelete={() => {
                      const newConcepts = field.value?.filter((_, i) => i !== idx);
                      field.onChange(newConcepts);
                    }}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add a concept..."
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && conceptInput.trim()) {
                      e.preventDefault();
                      field.onChange([...(field.value || []), conceptInput.trim()]);
                      setConceptInput('');
                    }
                  }}
                />
                <Button
                  size="small"
                  onClick={() => {
                    if (conceptInput.trim()) {
                      field.onChange([...(field.value || []), conceptInput.trim()]);
                      setConceptInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          )}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Estimated Minutes"
            type="number"
            placeholder="15"
            error={!!errors.estimated_minutes}
            helperText={errors.estimated_minutes?.message}
            {...register('estimated_minutes', { valueAsNumber: true })}
          />
          {mode === 'create' && (
            <TextField
              label="Sequence Order"
              type="number"
              placeholder="Auto"
              error={!!errors.sequence_order}
              helperText={errors.sequence_order?.message}
              {...register('sequence_order', { valueAsNumber: true })}
            />
          )}
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isValid}
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create Lesson' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
