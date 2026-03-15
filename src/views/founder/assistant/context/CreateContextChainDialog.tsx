/**
 * CreateContextChainDialog — Create a new context chain
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  CreateContextChainRequestSchema,
  type CreateContextChainRequest
} from '@/api/founder/schemas';

export interface CreateContextChainDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreateContextChainRequest) => Promise<void>;
}

export default function CreateContextChainDialog({
  open,
  onClose,
  onCreate
}: CreateContextChainDialogProps) {
  const [name, setName] = useState('');
  const [taskType, setTaskType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const result = CreateContextChainRequestSchema.safeParse({
      name: name.trim(),
      task_type: taskType.trim(),
      description: description.trim() || undefined
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(result.data);
      setName('');
      setTaskType('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setName('');
      setTaskType('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Context Chain</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          required
          placeholder="e.g. Domain Knowledge Chat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
        />
        <TextField
          margin="dense"
          label="Task Type"
          fullWidth
          required
          placeholder="e.g. domain_knowledge_assessment, pursuit_chat"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          helperText="Task type identifier used for binding to agents"
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
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
