/**
 * CreatePursuitDialog
 * Dialog to create a new pursuit
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { GOAL_TYPE_LABELS } from '../constants';
import type { GoalType, CreatePursuitRequest } from '@/api/founder/schemas';

const GOAL_TYPES: GoalType[] = [
  'job_search',
  'company_launch',
  'stock_investing',
  'personal_brand',
  'job_management',
  'resume_management'
];

export interface CreatePursuitDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreatePursuitRequest) => Promise<void>;
}

export default function CreatePursuitDialog({
  open,
  onClose,
  onCreate
}: CreatePursuitDialogProps) {
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('job_search');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        goal_type: goalType,
        title: title.trim(),
        description: description.trim() || undefined
      });
      setTitle('');
      setDescription('');
      setGoalType('job_search');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pursuit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setTitle('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Pursuit</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title"
          fullWidth
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mt: 1 }}
        />
        <TextField
          select
          margin="dense"
          label="Goal Type"
          fullWidth
          value={goalType}
          onChange={(e) => setGoalType(e.target.value as GoalType)}
          sx={{ mt: 2 }}
        >
          {GOAL_TYPES.map((gt) => (
            <MenuItem key={gt} value={gt}>
              {GOAL_TYPE_LABELS[gt]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
