/**
 * CreateDomainDialog — Create a new domain knowledge graph
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
  CreateDomainKnowledgeRequestSchema,
  type CreateDomainKnowledgeRequest
} from '@/api/founder/schemas';

export interface CreateDomainDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreateDomainKnowledgeRequest) => Promise<void>;
}

export default function CreateDomainDialog({
  open,
  onClose,
  onCreate
}: CreateDomainDialogProps) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const result = CreateDomainKnowledgeRequestSchema.safeParse({
      slug: slug.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim() || undefined
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(result.data);
      setSlug('');
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create domain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSlug('');
      setName('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Domain</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Slug"
          fullWidth
          required
          placeholder="e.g. docker, golang"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          helperText="Lowercase letters, numbers, hyphens only (e.g. docker)"
          sx={{ mt: 1 }}
        />
        <TextField
          margin="dense"
          label="Name"
          fullWidth
          required
          placeholder="e.g. Docker"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
