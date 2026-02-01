/**
 * HTILQuizForm Component
 * Form for creating/editing a quiz
 */
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useState } from 'react';
import { IconTrash, IconPlus } from '@tabler/icons-react';

import {
  CreateHTILQuizRequestSchema,
  UpdateHTILQuizRequestSchema,
  type CreateHTILQuizRequest,
  type UpdateHTILQuizRequest
} from '@/api/founder/htilSchemas';

// ============================================================================
// Types
// ============================================================================

interface HTILQuizFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateHTILQuizRequest>;
  onSubmit: (data: CreateHTILQuizRequest | UpdateHTILQuizRequest) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function HTILQuizForm({
  mode,
  initialData,
  onSubmit,
  onCancel
}: HTILQuizFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = mode === 'create' ? CreateHTILQuizRequestSchema : UpdateHTILQuizRequestSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid }
  } = useForm<CreateHTILQuizRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      questions: initialData?.questions || [
        { question: '', options: ['', ''], correct_index: 0, explanation: '' }
      ],
      passing_score: initialData?.passing_score ?? 0.7,
      difficulty: initialData?.difficulty || 'mixed',
      time_limit_minutes: initialData?.time_limit_minutes
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions'
  });

  const handleFormSubmit = async (data: CreateHTILQuizRequest) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to save quiz');
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
          label="Quiz Title"
          placeholder="e.g., Chapter 2 Review Quiz"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register('title')}
        />

        <Stack direction="row" spacing={2}>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select {...field} label="Difficulty">
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                  <MenuItem value="mixed">Mixed</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <TextField
            label="Passing Score (%)"
            type="number"
            inputProps={{ min: 0, max: 100, step: 5 }}
            error={!!errors.passing_score}
            helperText={errors.passing_score?.message}
            {...register('passing_score', { 
              valueAsNumber: true,
              setValueAs: (v) => v / 100 
            })}
            defaultValue={70}
          />

          <TextField
            label="Time Limit (min)"
            type="number"
            placeholder="No limit"
            error={!!errors.time_limit_minutes}
            helperText={errors.time_limit_minutes?.message}
            {...register('time_limit_minutes', { valueAsNumber: true })}
          />
        </Stack>

        <Divider />

        {/* Questions */}
        <Typography variant="h6">Questions</Typography>

        {fields.map((field, questionIndex) => (
          <Card key={field.id} variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Question {questionIndex + 1}
                  </Typography>
                  {fields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(questionIndex)}
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  )}
                </Stack>

                <TextField
                  label="Question"
                  placeholder="Enter your question..."
                  fullWidth
                  required
                  multiline
                  rows={2}
                  error={!!errors.questions?.[questionIndex]?.question}
                  helperText={errors.questions?.[questionIndex]?.question?.message}
                  {...register(`questions.${questionIndex}.question`)}
                />

                {/* Options with Radio for correct answer */}
                <Controller
                  name={`questions.${questionIndex}.correct_index`}
                  control={control}
                  render={({ field: correctField }) => (
                    <RadioGroup
                      value={correctField.value}
                      onChange={(e) => correctField.onChange(parseInt(e.target.value))}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Options (select the correct answer)
                      </Typography>
                      {[0, 1, 2, 3].map((optionIndex) => (
                        <Stack key={optionIndex} direction="row" spacing={1} alignItems="center">
                          <FormControlLabel
                            value={optionIndex}
                            control={<Radio size="small" />}
                            label=""
                            sx={{ mr: 0 }}
                          />
                          <TextField
                            size="small"
                            placeholder={`Option ${optionIndex + 1}`}
                            fullWidth
                            {...register(`questions.${questionIndex}.options.${optionIndex}`)}
                          />
                        </Stack>
                      ))}
                    </RadioGroup>
                  )}
                />

                <TextField
                  label="Explanation"
                  placeholder="Explain why the correct answer is right..."
                  fullWidth
                  multiline
                  rows={2}
                  {...register(`questions.${questionIndex}.explanation`)}
                />
              </Stack>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outlined"
          startIcon={<IconPlus size={18} />}
          onClick={() =>
            append({ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' })
          }
        >
          Add Question
        </Button>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isValid}
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create Quiz' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
