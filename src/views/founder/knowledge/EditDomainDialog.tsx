/**
 * EditDomainDialog — Update domain metadata (slug is immutable)
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
  UpdateDomainKnowledgeRequestSchema,
  type UpdateDomainKnowledgeRequest
} from '@/api/founder/schemas';

export interface EditDomainDialogProps {
  open: boolean;
  slug: string;
  currentName: string;
  currentDescription?: string;
  onClose: () => void;
  onSave: (params: UpdateDomainKnowledgeRequest) => Promise<void>;
}

export default function EditDomainDialog({
  open,
  slug,
  currentName,
  currentDescription = '',
  onClose,
  onSave
}: EditDomainDialogProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setDescription(currentDescription ?? '');
      setError(null);
    }
  }, [open, currentName, currentDescription]);

  const handleSubmit = async () => {
    setError(null);
    const result = UpdateDomainKnowledgeRequestSchema.safeParse({
      name: name.trim() || undefined,
      description: description.trim() || undefined
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    if (!result.data.name && !result.data.description) {
      setError('Provide at least name or description');
      return;
    }
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update domain');
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
      <DialogTitle>Edit Domain — {slug}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
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
