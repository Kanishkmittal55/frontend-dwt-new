/**
 * HTILCourseForm Component
 * Form for creating/editing a course
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { useState } from 'react';

import {
  CreateHTILCourseRequestSchema,
  UpdateHTILCourseRequestSchema,
  type CreateHTILCourseRequest,
  type UpdateHTILCourseRequest
} from '@/api/founder/htilSchemas';

// ============================================================================
// Types
// ============================================================================

interface HTILCourseFormProps {
  mode: 'create' | 'edit';
  userId: number;
  initialData?: Partial<CreateHTILCourseRequest>;
  onSubmit: (data: CreateHTILCourseRequest | UpdateHTILCourseRequest) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function HTILCourseForm({
  mode,
  userId,
  initialData,
  onSubmit,
  onCancel
}: HTILCourseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = mode === 'create' ? CreateHTILCourseRequestSchema : UpdateHTILCourseRequestSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CreateHTILCourseRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_id: userId,
      title: initialData?.title || '',
      description: initialData?.description || '',
      source_document_url: initialData?.source_document_url || ''
    },
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: CreateHTILCourseRequest) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save course');
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

        <input type="hidden" {...register('user_id', { valueAsNumber: true })} />

        <TextField
          label="Course Title"
          placeholder="e.g., Introduction to Algorithms"
          fullWidth
          required
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register('title')}
        />

        <TextField
          label="Description"
          placeholder="Brief description of what this course covers..."
          fullWidth
          multiline
          rows={3}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register('description')}
        />

        <TextField
          label="Source Document URL"
          placeholder="https://example.com/document.pdf"
          fullWidth
          error={!!errors.source_document_url}
          helperText={errors.source_document_url?.message || 'Optional: Link to reference material'}
          {...register('source_document_url')}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isValid}
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create Course' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
