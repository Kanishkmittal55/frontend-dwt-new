/**
 * HTILModuleForm Component
 * Form for creating/editing a module
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
  CreateHTILModuleRequestSchema,
  UpdateHTILModuleRequestSchema,
  type CreateHTILModuleRequest,
  type UpdateHTILModuleRequest
} from '@/api/founder/htilSchemas';

// ============================================================================
// Types
// ============================================================================

interface HTILModuleFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateHTILModuleRequest>;
  onSubmit: (data: CreateHTILModuleRequest | UpdateHTILModuleRequest) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function HTILModuleForm({
  mode,
  initialData,
  onSubmit,
  onCancel
}: HTILModuleFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = mode === 'create' ? CreateHTILModuleRequestSchema : UpdateHTILModuleRequestSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CreateHTILModuleRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      cluster_label: initialData?.cluster_label || '',
      sequence_order: initialData?.sequence_order
    },
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: CreateHTILModuleRequest) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save module');
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
          label="Module Title"
          placeholder="e.g., Chapter 2: Getting Started"
          fullWidth
          required
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register('title')}
        />

        <TextField
          label="Description"
          placeholder="What this module covers..."
          fullWidth
          multiline
          rows={2}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register('description')}
        />

        <TextField
          label="Cluster Label"
          placeholder="e.g., Fundamentals, Advanced Topics"
          fullWidth
          error={!!errors.cluster_label}
          helperText={errors.cluster_label?.message || 'Optional: For grouping related modules'}
          {...register('cluster_label')}
        />

        {mode === 'create' && (
          <TextField
            label="Sequence Order"
            type="number"
            placeholder="Auto-assigned if empty"
            fullWidth
            error={!!errors.sequence_order}
            helperText={errors.sequence_order?.message || 'Position within the course'}
            {...register('sequence_order', { valueAsNumber: true })}
          />
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isValid}
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create Module' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
