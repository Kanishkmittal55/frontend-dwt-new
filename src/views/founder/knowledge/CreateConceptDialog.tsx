/**
 * CreateConceptDialog — Create a concept in a domain
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {
  CreateDomainKnowledgeConceptRequestSchema,
  type CreateDomainKnowledgeConceptRequest,
  type DomainKnowledgeDifficulty
} from '@/api/founder/schemas';

const DIFFICULTIES: DomainKnowledgeDifficulty[] = ['beginner', 'intermediate', 'advanced'];

export interface CreateConceptDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreateDomainKnowledgeConceptRequest) => Promise<void>;
}

export default function CreateConceptDialog({
  open,
  onClose,
  onCreate
}: CreateConceptDialogProps) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DomainKnowledgeDifficulty>('intermediate');
  const [subDomain, setSubDomain] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const result = CreateDomainKnowledgeConceptRequestSchema.safeParse({
      slug: slug.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      difficulty,
      sub_domain: subDomain.trim() || undefined,
      sequence_order: sequenceOrder
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
      setDifficulty('intermediate');
      setSubDomain('');
      setSequenceOrder(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create concept');
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
      <DialogTitle>New Concept</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Slug"
          fullWidth
          required
          placeholder="e.g. images"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          sx={{ mt: 1 }}
        />
        <TextField
          margin="dense"
          label="Name"
          fullWidth
          required
          placeholder="e.g. Docker Images"
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
        <TextField
          select
          margin="dense"
          label="Difficulty"
          fullWidth
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as DomainKnowledgeDifficulty)}
          sx={{ mt: 2 }}
        >
          {DIFFICULTIES.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="Sub-domain"
          fullWidth
          placeholder="e.g. fundamentals"
          value={subDomain}
          onChange={(e) => setSubDomain(e.target.value)}
          sx={{ mt: 2 }}
        />
        <TextField
          margin="dense"
          label="Sequence order"
          fullWidth
          type="number"
          inputProps={{ min: 1 }}
          value={sequenceOrder}
          onChange={(e) => setSequenceOrder(parseInt(e.target.value, 10) || 1)}
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
