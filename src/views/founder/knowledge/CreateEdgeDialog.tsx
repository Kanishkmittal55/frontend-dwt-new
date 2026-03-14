/**
 * CreateEdgeDialog — Create an edge between two concepts
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
  CreateDomainKnowledgeEdgeRequestSchema,
  type CreateDomainKnowledgeEdgeRequest,
  type DomainKnowledgeRelationship
} from '@/api/founder/schemas';
import type { DomainKnowledgeConceptResponse } from '@/api/founder/knowledgeAPI';

const RELATIONSHIPS: DomainKnowledgeRelationship[] = ['prerequisite', 'builds_on', 'related'];

export interface CreateEdgeDialogProps {
  open: boolean;
  concepts: DomainKnowledgeConceptResponse[];
  onClose: () => void;
  onCreate: (params: CreateDomainKnowledgeEdgeRequest) => Promise<void>;
}

export default function CreateEdgeDialog({
  open,
  concepts,
  onClose,
  onCreate
}: CreateEdgeDialogProps) {
  const [fromConceptSlug, setFromConceptSlug] = useState('');
  const [toConceptSlug, setToConceptSlug] = useState('');
  const [relationship, setRelationship] = useState<DomainKnowledgeRelationship>('prerequisite');
  const [strength, setStrength] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const result = CreateDomainKnowledgeEdgeRequestSchema.safeParse({
      from_concept_slug: fromConceptSlug,
      to_concept_slug: toConceptSlug,
      relationship,
      strength
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(result.data);
      setFromConceptSlug('');
      setToConceptSlug('');
      setRelationship('prerequisite');
      setStrength(0.5);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create edge');
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
      <DialogTitle>New Edge</DialogTitle>
      <DialogContent>
        <TextField
          select
          autoFocus
          margin="dense"
          label="From concept"
          fullWidth
          required
          value={fromConceptSlug}
          onChange={(e) => setFromConceptSlug(e.target.value)}
          sx={{ mt: 1 }}
        >
          {concepts.map((c) => (
            <MenuItem key={c.uuid} value={c.slug}>
              {c.name} ({c.slug})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          margin="dense"
          label="To concept"
          fullWidth
          required
          value={toConceptSlug}
          onChange={(e) => setToConceptSlug(e.target.value)}
          sx={{ mt: 2 }}
        >
          {concepts.map((c) => (
            <MenuItem key={c.uuid} value={c.slug}>
              {c.name} ({c.slug})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          margin="dense"
          label="Relationship"
          fullWidth
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as DomainKnowledgeRelationship)}
          sx={{ mt: 2 }}
        >
          {RELATIONSHIPS.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="Strength (0–1)"
          fullWidth
          type="number"
          inputProps={{ min: 0, max: 1, step: 0.1 }}
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value) || 0.5)}
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
