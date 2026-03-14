/**
 * DeleteConceptConfirmDialog — Confirm deletion of a concept and its edges
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { DomainKnowledgeConceptResponse } from '@/api/founder/knowledgeAPI';

export interface DeleteConceptConfirmDialogProps {
  open: boolean;
  concept: DomainKnowledgeConceptResponse | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConceptConfirmDialog({
  open,
  concept,
  onClose,
  onConfirm
}: DeleteConceptConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete concept');
    } finally {
      setDeleting(false);
    }
  };

  if (!concept) return null;

  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Concept</DialogTitle>
      <DialogContent>
        <Typography>
          Delete <strong>{concept.name}</strong> ({concept.slug})? This will remove all edges
          connected to this concept. This action cannot be undone.
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
