/**
 * HTILExerciseForm Component
 * Form for creating/editing an exercise
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useState } from 'react';

import {
  CreateHTILExerciseRequestSchema,
  UpdateHTILExerciseRequestSchema,
  type CreateHTILExerciseRequest,
  type UpdateHTILExerciseRequest
} from '@/api/founder/htilSchemas';

// ============================================================================
// Types
// ============================================================================

interface HTILExerciseFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateHTILExerciseRequest>;
  onSubmit: (data: CreateHTILExerciseRequest | UpdateHTILExerciseRequest) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function HTILExerciseForm({
  mode,
  initialData,
  onSubmit,
  onCancel
}: HTILExerciseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hintInput, setHintInput] = useState('');

  const schema = mode === 'create' ? CreateHTILExerciseRequestSchema : UpdateHTILExerciseRequestSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid }
  } = useForm<CreateHTILExerciseRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      exercise_id: initialData?.exercise_id || '',
      statement: initialData?.statement || '',
      hints: initialData?.hints || [],
      solution: initialData?.solution || '',
      explanation: initialData?.explanation || '',
      difficulty: initialData?.difficulty || 'intermediate',
      exercise_type: initialData?.exercise_type || 'practice',
      sequence_order: initialData?.sequence_order
    },
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: CreateHTILExerciseRequest) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save exercise');
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
          label="Exercise ID"
          placeholder="e.g., 2.2-1 or Problem 2-1"
          fullWidth
          required
          error={!!errors.exercise_id}
          helperText={errors.exercise_id?.message}
          {...register('exercise_id')}
        />

        <TextField
          label="Problem Statement"
          placeholder="Write the exercise question or problem..."
          fullWidth
          required
          multiline
          rows={4}
          error={!!errors.statement}
          helperText={errors.statement?.message}
          {...register('statement')}
        />

        {/* Hints */}
        <Controller
          name="hints"
          control={control}
          render={({ field }) => (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Hints (optional)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {field.value?.map((hint, idx) => (
                  <Chip
                    key={idx}
                    label={`Hint ${idx + 1}: ${hint.substring(0, 30)}...`}
                    onDelete={() => {
                      const newHints = field.value?.filter((_, i) => i !== idx);
                      field.onChange(newHints);
                    }}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add a hint..."
                  fullWidth
                  value={hintInput}
                  onChange={(e) => setHintInput(e.target.value)}
                />
                <Button
                  size="small"
                  onClick={() => {
                    if (hintInput.trim()) {
                      field.onChange([...(field.value || []), hintInput.trim()]);
                      setHintInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          )}
        />

        <TextField
          label="Solution"
          placeholder="The correct solution..."
          fullWidth
          multiline
          rows={3}
          error={!!errors.solution}
          helperText={errors.solution?.message}
          {...register('solution')}
        />

        <TextField
          label="Explanation"
          placeholder="Detailed explanation of the solution..."
          fullWidth
          multiline
          rows={3}
          error={!!errors.explanation}
          helperText={errors.explanation?.message}
          {...register('explanation')}
        />

        <Stack direction="row" spacing={2}>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select {...field} label="Difficulty">
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="exercise_type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select {...field} label="Type">
                  <MenuItem value="practice">Practice</MenuItem>
                  <MenuItem value="concept">Concept</MenuItem>
                  <MenuItem value="problem">Problem</MenuItem>
                  <MenuItem value="starred">Starred</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Stack>

        {mode === 'create' && (
          <TextField
            label="Sequence Order"
            type="number"
            placeholder="Auto-assigned if empty"
            error={!!errors.sequence_order}
            helperText={errors.sequence_order?.message}
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
            {submitting ? 'Saving...' : mode === 'create' ? 'Create Exercise' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
