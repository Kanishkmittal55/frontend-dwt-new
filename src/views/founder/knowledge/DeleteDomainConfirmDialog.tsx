/**
 * DeleteDomainConfirmDialog — Confirm deletion of a domain and its concepts/edges
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface DeleteDomainConfirmDialogProps {
  open: boolean;
  slug: string;
  name: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteDomainConfirmDialog({
  open,
  slug,
  name,
  onClose,
  onConfirm
}: DeleteDomainConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete domain');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Domain</DialogTitle>
      <DialogContent>
        <Typography>
          Delete <strong>{name}</strong> ({slug})? This will remove all concepts and edges in this
          domain. This action cannot be undone.
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
