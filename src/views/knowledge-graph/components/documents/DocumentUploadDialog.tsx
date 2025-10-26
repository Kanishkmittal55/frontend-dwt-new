// src/views/knowledge-graph/components/DocumentUploadDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Box,
  Typography
} from '@mui/material';
import { IconUpload } from '@tabler/icons-react';
import { documentAPI } from 'api/documentAPI';

interface DocumentUploadDialogProps {
  open: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentUploadDialog({
  open,
  workspaceId,
  workspaceName,
  onClose,
  onSuccess
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleClose = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
  
    setUploading(true);
    setError(null);
    setUploadProgress(0);
  
    try {
      // Step 1: Generate presigned URL
      setUploadProgress(10);
      const presignedResponse = await documentAPI.generatePresignedPost(
        file.name,
        workspaceId
      );
      
      const documentId = presignedResponse.fields['x-amz-meta-document-id'];
  
      // Step 2: Upload file to MinIO
      setUploadProgress(30);
      const formData = new FormData();
      Object.entries(presignedResponse.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);
  
      const uploadResponse = await fetch(presignedResponse.url, {
        method: 'POST',
        body: formData
      });
  
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
  
      setUploadProgress(100);
  
      // DO NOT CALL processDocument here anymore!
      // Remove these lines if they exist:
      // await documentAPI.processDocument(documentId);
  
      handleClose();
      onSuccess(); // This will refresh the document list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Document</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Workspace: <strong>{workspaceName}</strong>
          </Typography>
        </Box>

        <Button
          variant="outlined"
          component="label"
          fullWidth
          startIcon={<IconUpload />}
          sx={{ py: 2 }}
          disabled={uploading}
        >
          {file ? file.name : 'Select File'}
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.csv,.json,.txt"
          />
        </Button>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              {uploadProgress < 30 && 'Preparing upload...'}
              {uploadProgress >= 30 && uploadProgress < 70 && 'Uploading file...'}
              {uploadProgress >= 70 && 'Finalizing...'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}