/**
 * EditContextChainDialog — Edit an existing context chain
 */
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  UpdateContextChainRequestSchema,
  type UpdateContextChainRequest
} from '@/api/founder/schemas';
import type { ContextChainResponse } from '@/api/founder';

export interface EditContextChainDialogProps {
  open: boolean;
  chain: ContextChainResponse | null;
  onClose: () => void;
  onSave: (params: UpdateContextChainRequest) => Promise<void>;
}

export default function EditContextChainDialog({
  open,
  chain,
  onClose,
  onSave
}: EditContextChainDialogProps) {
  const [name, setName] = useState('');
  const [taskType, setTaskType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chain) {
      setName(chain.name ?? '');
      setTaskType(chain.task_type ?? '');
      setDescription(chain.description ?? '');
    }
  }, [chain]);

  const handleSubmit = async () => {
    setError(null);
    const result = UpdateContextChainRequestSchema.safeParse({
      name: name.trim() || undefined,
      task_type: taskType.trim() || undefined,
      description: description.trim() || undefined
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    const payload = { ...result.data };
    if (payload.name === '') delete payload.name;
    if (payload.task_type === '') delete payload.task_type;
    if (Object.keys(payload).length === 0) {
      setError('At least one field must be changed');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Context Chain</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          placeholder="e.g. Domain Knowledge Chat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
        />
        <TextField
          margin="dense"
          label="Task Type"
          fullWidth
          placeholder="e.g. domain_knowledge_assessment"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
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
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
