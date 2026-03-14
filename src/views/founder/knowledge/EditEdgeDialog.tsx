/**
 * EditEdgeDialog — Update an edge
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
  UpdateDomainKnowledgeEdgeRequestSchema,
  type UpdateDomainKnowledgeEdgeRequest,
  type DomainKnowledgeRelationship
} from '@/api/founder/schemas';
import type { DomainKnowledgeEdgeResponse } from '@/api/founder/knowledgeAPI';

const RELATIONSHIPS: DomainKnowledgeRelationship[] = ['prerequisite', 'builds_on', 'related'];

export interface EditEdgeDialogProps {
  open: boolean;
  edge: DomainKnowledgeEdgeResponse | null;
  onClose: () => void;
  onSave: (params: UpdateDomainKnowledgeEdgeRequest) => Promise<void>;
}

export default function EditEdgeDialog({
  open,
  edge,
  onClose,
  onSave
}: EditEdgeDialogProps) {
  const [relationship, setRelationship] = useState<DomainKnowledgeRelationship>('prerequisite');
  const [strength, setStrength] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && edge) {
      setRelationship(edge.relationship);
      setStrength(edge.strength);
      setError(null);
    }
  }, [open, edge]);

  const handleSubmit = async () => {
    setError(null);
    const result = UpdateDomainKnowledgeEdgeRequestSchema.safeParse({
      relationship,
      strength
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
      setError(err instanceof Error ? err.message : 'Failed to update edge');
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

  if (!edge) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit Edge — {edge.from_concept_slug ?? edge.from_concept_uuid} →{' '}
        {edge.to_concept_slug ?? edge.to_concept_uuid}
      </DialogTitle>
      <DialogContent>
        <TextField
          select
          autoFocus
          margin="dense"
          label="Relationship"
          fullWidth
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as DomainKnowledgeRelationship)}
          sx={{ mt: 1 }}
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
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
