/**
 * Idea Submit Dialog
 * 
 * Form for submitting new business ideas.
 * Two entry points:
 * 1. From ScribeOCR: Pre-populated description from extracted PDF text
 * 2. Manual entry: User types idea directly
 * 
 * Submits text to S3, then triggers scraper/start to process and extract ideas.
 */
import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';

import { IconBulb, IconX, IconChevronDown, IconChevronUp, IconSend } from '@tabler/icons-react';
import { submitTextForProcessing } from 'api/founder/uploadAPI';
import { getStoredUserId } from 'api/founder/founderClient';

// ============================================================================
// Types
// ============================================================================

interface IdeaSubmitDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-filled description from ScribeOCR */
  initialDescription?: string;
}

interface IdeaFormData {
  title: string;
  description: string;
  problem_statement: string;
  target_audience: string;
  industry: string;
  priority: number;
}

// ============================================================================
// Constants
// ============================================================================

const INDUSTRY_OPTIONS = [
  'Tech/Software',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Education',
  'Marketing',
  'Media/Content',
  'Real Estate',
  'Food & Beverage',
  'Retail',
  'Manufacturing',
  'Consulting',
  'SaaS',
  'Mobile Apps',
  'AI/ML',
  'Crypto/Web3',
  'Gaming',
  'Travel',
  'Fashion',
  'Fitness',
  'Other'
];

const PRIORITY_MARKS = [
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' }
];

const INITIAL_FORM_DATA: IdeaFormData = {
  title: '',
  description: '',
  problem_statement: '',
  target_audience: '',
  industry: '',
  priority: 5
};

// ============================================================================
// Validation
// ============================================================================

interface ValidationErrors {
  title?: string;
  description?: string;
}

function validateForm(data: IdeaFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (data.title.length > 255) {
    errors.title = 'Title must be less than 255 characters';
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  return errors;
}

// ============================================================================
// Component
// ============================================================================

export default function IdeaSubmitDialog({
  open,
  onClose,
  onSuccess,
  initialDescription = ''
}: IdeaSubmitDialogProps) {
  const [formData, setFormData] = useState<IdeaFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when dialog opens with new initialDescription
  useEffect(() => {
    if (open) {
      setFormData({
        ...INITIAL_FORM_DATA,
        description: initialDescription
      });
      setErrors({});
      setSubmitError(null);
      setShowAdvanced(false);
    }
  }, [open, initialDescription]);

  // Update single field
  const updateField = useCallback(<K extends keyof IdeaFormData>(
    field: K,
    value: IdeaFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!submitting) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setSubmitError(null);
      onClose();
    }
  }, [submitting, onClose]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    // Validate
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const userId = getStoredUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Build the text content for processing
      // Include all form fields as structured text
      const textContent = buildIdeaText(formData);

      // Upload text to S3 and start processing job
      // This triggers: S3 upload → scraper/start → worker → idea generation
      await submitTextForProcessing(userId, textContent, formData.title || 'idea');

      // Success
      handleClose();
      onSuccess();
    } catch (err) {
      const apiError = err as { message?: string };
      setSubmitError(apiError.message || 'Failed to submit idea');
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleClose, onSuccess]);

  // Character counts
  const titleCharCount = formData.title.length;
  const descCharCount = formData.description.length;
  const wordCount = formData.description.trim() 
    ? formData.description.trim().split(/\s+/).length 
    : 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconBulb size={24} />
          <Typography variant="h4">Submit New Idea</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={submitting}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {initialDescription && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Description pre-filled from extracted text ({wordCount} words). Feel free to edit it.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Title - Required */}
          <TextField
            label="Idea Title"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g., AI-Powered Personal Finance Assistant"
            fullWidth
            required
            error={!!errors.title}
            helperText={errors.title || `${titleCharCount}/255 characters`}
            disabled={submitting}
            inputProps={{ maxLength: 255 }}
          />

          {/* Description - Required */}
          <Box>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your idea in detail. What is it? How does it work? What makes it unique?"
              fullWidth
              required
              multiline
              rows={6}
              error={!!errors.description}
              helperText={errors.description || `${descCharCount} characters · ${wordCount} words (min 10 chars)`}
              disabled={submitting}
            />
          </Box>

          {/* Advanced Fields Toggle */}
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            endIcon={showAdvanced ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            sx={{ alignSelf: 'flex-start' }}
            size="small"
          >
            {showAdvanced ? 'Hide' : 'Show'} Additional Details (Optional)
          </Button>

          <Collapse in={showAdvanced}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Problem Statement - Optional */}
              <TextField
                label="Problem Statement"
                value={formData.problem_statement}
                onChange={(e) => updateField('problem_statement', e.target.value)}
                placeholder="What specific problem does this idea solve?"
                fullWidth
                multiline
                rows={3}
                disabled={submitting}
              />

              {/* Target Audience - Optional */}
              <TextField
                label="Target Audience"
                value={formData.target_audience}
                onChange={(e) => updateField('target_audience', e.target.value)}
                placeholder="Who are the intended users or customers?"
                fullWidth
                disabled={submitting}
              />

              <Grid container spacing={2}>
                {/* Industry - Optional */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth disabled={submitting}>
                    <InputLabel>Industry (Optional)</InputLabel>
                    <Select
                      value={formData.industry}
                      label="Industry (Optional)"
                      onChange={(e) => updateField('industry', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Not specified</em>
                      </MenuItem>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <MenuItem key={industry} value={industry.toLowerCase().replace(/[^a-z0-9]/g, '_')}>
                          {industry}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Priority - Optional */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Priority
                      <Chip
                        size="small"
                        label={formData.priority}
                        color={formData.priority >= 7 ? 'error' : formData.priority >= 4 ? 'warning' : 'default'}
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Slider
                      value={formData.priority}
                      onChange={(_, value) => updateField('priority', value as number)}
                      min={1}
                      max={10}
                      step={1}
                      marks={PRIORITY_MARKS}
                      disabled={submitting}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Higher priority ideas are processed first
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !formData.title.trim() || !formData.description.trim()}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
        >
          {submitting ? 'Submitting...' : 'Submit Idea'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build structured text content from form data for the chunks API
 */
function buildIdeaText(data: IdeaFormData): string {
  const sections: string[] = [];

  // Always include title and description
  sections.push(`# ${data.title}`);
  sections.push('');
  sections.push(data.description);

  // Add optional fields if provided
  if (data.problem_statement.trim()) {
    sections.push('');
    sections.push('## Problem Statement');
    sections.push(data.problem_statement);
  }

  if (data.target_audience.trim()) {
    sections.push('');
    sections.push('## Target Audience');
    sections.push(data.target_audience);
  }

  if (data.industry) {
    sections.push('');
    sections.push(`## Industry: ${data.industry}`);
  }

  // Add metadata at the end
  sections.push('');
  sections.push('---');
  sections.push(`Priority: ${data.priority}/10`);

  return sections.join('\n');
}

