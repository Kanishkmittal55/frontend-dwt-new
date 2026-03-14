/**
 * EditConceptDialog — Update a concept (slug is immutable)
 */
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {
  UpdateDomainKnowledgeConceptRequestSchema,
  type UpdateDomainKnowledgeConceptRequest,
  type DomainKnowledgeDifficulty
} from '@/api/founder/schemas';
import type { DomainKnowledgeConceptResponse } from '@/api/founder/knowledgeAPI';

const DIFFICULTIES: DomainKnowledgeDifficulty[] = ['beginner', 'intermediate', 'advanced'];

export interface EditConceptDialogProps {
  open: boolean;
  concept: DomainKnowledgeConceptResponse | null;
  onClose: () => void;
  onSave: (params: UpdateDomainKnowledgeConceptRequest) => Promise<void>;
}

export default function EditConceptDialog({
  open,
  concept,
  onClose,
  onSave
}: EditConceptDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DomainKnowledgeDifficulty>('intermediate');
  const [subDomain, setSubDomain] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && concept) {
      setName(concept.name);
      setDescription(concept.description ?? '');
      setDifficulty(concept.difficulty);

      setSubDomain(concept.sub_domain ?? '');
      setSequenceOrder(concept.sequence_order ?? 1);
      setError(null);
    }
  }, [open, concept]);

  const handleSubmit = async () => {
    if (!concept) return;
    setError(null);
    const result = UpdateDomainKnowledgeConceptRequestSchema.safeParse({
      name: name.trim() || undefined,
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
      await onSave(result.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update concept');
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

  if (!concept) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Concept — {concept.slug}</DialogTitle>
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
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
