/**
 * DeleteContextChainConfirmDialog — Confirm deletion of a context chain
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface DeleteContextChainConfirmDialogProps {
  open: boolean;
  chainName: string;
  chainUuid: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteContextChainConfirmDialog({
  open,
  chainName,
  chainUuid,
  onClose,
  onConfirm
}: DeleteContextChainConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chain');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Context Chain</DialogTitle>
      <DialogContent>
        <Typography>
          Delete <strong>{chainName || 'this chain'}</strong>? This will remove the chain and its
          nodes/edges. This action cannot be undone.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          UUID: {chainUuid}
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
