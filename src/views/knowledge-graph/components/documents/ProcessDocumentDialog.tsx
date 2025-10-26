import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { IconSettings } from '@tabler/icons-react';

interface ProcessDocumentDialogProps {
  open: boolean;
  documentName: string;
  documentFormat: string;
  onClose: () => void;
  onConfirm: (config: { chunk_size?: number; chunk_overlap?: number }) => void;
}

export default function ProcessDocumentDialog({
  open,
  documentName,
  documentFormat,
  onClose,
  onConfirm
}: ProcessDocumentDialogProps) {
  const [chunkSize, setChunkSize] = useState<string>('');
  const [chunkOverlap, setChunkOverlap] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isUnstructured = ['pdf', 'txt'].includes(documentFormat.toLowerCase());

  const handleConfirm = () => {
    setError(null);

    // Validate if values are provided
    if (chunkSize && (parseInt(chunkSize) < 100 || parseInt(chunkSize) > 50000)) {
      setError('Chunk size must be between 100 and 50,000 characters');
      return;
    }

    if (chunkOverlap && (parseInt(chunkOverlap) < 0 || parseInt(chunkOverlap) > 1000)) {
      setError('Chunk overlap must be between 0 and 1,000 characters');
      return;
    }

    if (chunkSize && chunkOverlap) {
      const cs = parseInt(chunkSize, 10);
      const co = parseInt(chunkOverlap, 10);
      if (co >= cs) {
        setError('Chunk overlap must be smaller than chunk size');
        return;
      }
    }

    const config: { chunk_size?: number; chunk_overlap?: number } = {};
    
    if (chunkSize) {
      config.chunk_size = parseInt(chunkSize);
    }
    
    if (chunkOverlap) {
      config.chunk_overlap = parseInt(chunkOverlap);
    }

    onConfirm(config);
    handleClose();
  };

  const handleClose = () => {
    setChunkSize('');
    setChunkOverlap('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconSettings size={24} />
          Process Document
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Document: <strong>{documentName}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Format: <strong>{documentFormat.toUpperCase()}</strong>
          </Typography>
        </Box>

        {!isUnstructured && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a structured file ({documentFormat.toUpperCase()}). Chunking is done by row/object. 
            The configuration below only applies to PDF and TXT files.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Chunking Configuration {!isUnstructured && '(Not Applicable)'}
        </Typography>

        <TextField
          fullWidth
          label="Chunk Size (characters)"
          type="number"
          value={chunkSize}
          onChange={(e) => setChunkSize(e.target.value)}
          placeholder="Default: System setting"
          disabled={!isUnstructured}
          helperText={
            isUnstructured 
              ? "Maximum characters per chunk (100-50,000). Leave empty for default."
              : "Not applicable for CSV/JSON files"
          }
          sx={{ mb: 2 }}
          InputProps={{
            inputProps: { min: 100, max: 50000 }
          }}
        />

        <TextField
          fullWidth
          label="Chunk Overlap (characters)"
          type="number"
          value={chunkOverlap}
          onChange={(e) => setChunkOverlap(e.target.value)}
          placeholder="Default: 0"
          disabled={!isUnstructured}
          helperText={
            isUnstructured
              ? "Character overlap between chunks (0-1,000). Leave empty for default."
              : "Not applicable for CSV/JSON files"
          }
          InputProps={{
            inputProps: { min: 0, max: 1000 }
          }}
        />

        {isUnstructured && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Leave fields empty to use default settings from your system configuration.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained">
          Start Processing
        </Button>
      </DialogActions>
    </Dialog>
  );
}