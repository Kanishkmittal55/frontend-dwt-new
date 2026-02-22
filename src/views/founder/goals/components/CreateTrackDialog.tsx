/**
 * CreateTrackDialog
 * Dialog to create a new track for a pursuit
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { TRACK_TYPE_LABELS } from '../constants';
import type { CreateTrackRequest } from '@/api/founder/schemas';

const TRACK_TYPES = ['learn', 'execute', 'discover'] as const;

export interface CreateTrackDialogProps {
  open: boolean;
  pursuitTitle: string;
  onClose: () => void;
  onCreate: (params: CreateTrackRequest) => Promise<void>;
}

export default function CreateTrackDialog({
  open,
  pursuitTitle,
  onClose,
  onCreate
}: CreateTrackDialogProps) {
  const [title, setTitle] = useState('');
  const [trackType, setTrackType] = useState<'learn' | 'execute' | 'discover'>('learn');
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
        track_type: trackType,
        title: title.trim(),
        description: description.trim() || undefined
      });
      setTitle('');
      setDescription('');
      setTrackType('learn');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create track');
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
      <DialogTitle>Add Track to &quot;{pursuitTitle}&quot;</DialogTitle>
      <DialogContent>
        <TextField
          select
          margin="dense"
          label="Track Type"
          fullWidth
          value={trackType}
          onChange={(e) => setTrackType(e.target.value as 'learn' | 'execute' | 'discover')}
          sx={{ mt: 1 }}
        >
          {TRACK_TYPES.map((tt) => (
            <MenuItem key={tt} value={tt}>
              {TRACK_TYPE_LABELS[tt]}
            </MenuItem>
          ))}
        </TextField>
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
          sx={{ mt: 2 }}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={2}
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
