/**
 * DeleteEdgeConfirmDialog — Confirm deletion of an edge
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { DomainKnowledgeEdgeResponse } from '@/api/founder/knowledgeAPI';

export interface DeleteEdgeConfirmDialogProps {
  open: boolean;
  edge: DomainKnowledgeEdgeResponse | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteEdgeConfirmDialog({
  open,
  edge,
  onClose,
  onConfirm
}: DeleteEdgeConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete edge');
    } finally {
      setDeleting(false);
    }
  };

  if (!edge) return null;

  const fromLabel = edge.from_concept_slug ?? edge.from_concept_uuid;
  const toLabel = edge.to_concept_slug ?? edge.to_concept_uuid;

  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Edge</DialogTitle>
      <DialogContent>
        <Typography>
          Delete the edge from <strong>{fromLabel}</strong> to <strong>{toLabel}</strong> (
          {edge.relationship})? This action cannot be undone.
        </Typography>
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
