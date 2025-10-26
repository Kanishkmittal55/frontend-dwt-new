// src/views/knowledge-graph/components/DocumentViewDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Stack
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  IconDownload,
  IconTag,
  IconAlertCircle,
  IconCircleCheck,
  IconClock
} from '@tabler/icons-react';
import SubCard from 'ui-component/cards/SubCard';
import type { Document } from 'types/document';
import { documentAPI } from 'api/documentAPI';
import { useState } from 'react';

interface DocumentViewDialogProps {
  open: boolean;
  document: Document | null;
  onClose: () => void;
}

export default function DocumentViewDialog({ open, document, onClose }: DocumentViewDialogProps) {
  const [downloading, setDownloading] = useState(false);

  if (!document) return null;

  const getStatusConfig = () => {
    switch (document.status) {
      case 'ready':
      case 'processed':
        return { color: 'success' as const, icon: <IconCircleCheck size={14} />, label: 'Processed' };
      case 'processing':
        return { color: 'warning' as const, icon: <IconClock size={14} />, label: 'Processing' };
      case 'failed':
        return { color: 'error' as const, icon: <IconAlertCircle size={14} />, label: 'Failed' };
      case 'pending':
      case 'uploaded':
        return { color: 'default' as const, icon: <IconClock size={14} />, label: 'Pending' };
      default:
        return { color: 'default' as const, icon: null, label: document.status };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await documentAPI.generatePresignedDownload(document._id);
      window.open(response.url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const statusConfig = getStatusConfig();
  const allTags = Object.values(document.tags).flat();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Document Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={12}>
            <SubCard title="File Information">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">
                    Filename
                  </Typography>
                  <Typography variant="body2">{document.metadata.filename}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="caption" color="textSecondary">
                    Format
                  </Typography>
                  <Typography variant="body2">
                    {document.metadata.format.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="caption" color="textSecondary">
                    Size
                  </Typography>
                  <Typography variant="body2">
                    {formatFileSize(document.metadata.size)}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={statusConfig.label}
                      color={statusConfig.color}
                      icon={statusConfig.icon}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </SubCard>
          </Grid>

          {allTags.length > 0 && (
            <Grid size={12}>
              <SubCard title="Tags">
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {allTags.map((tag, index) => (
                    <Chip
                      key={index}
                      icon={<IconTag size={14} />}
                      label={tag}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </SubCard>
            </Grid>
          )}

          {document.user_metadata && Object.keys(document.user_metadata).length > 0 && (
            <Grid size={12}>
              <SubCard title="Custom Metadata">
                <List dense>
                  {Object.entries(document.user_metadata).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key}
                        secondary={String(value)}
                      />
                    </ListItem>
                  ))}
                </List>
              </SubCard>
            </Grid>
          )}

          {document.errors && document.errors.length > 0 && (
            <Grid size={12}>
              <SubCard title="Errors">
                <List dense>
                  {document.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <IconAlertCircle size={20} color="red" />
                      </ListItemIcon>
                      <ListItemText
                        primary={error.message}
                        secondary={error.details || ''}
                      />
                    </ListItem>
                  ))}
                </List>
              </SubCard>
            </Grid>
          )}

          <Grid size={12}>
            <SubCard title="Metadata">
              <Typography variant="body2">
                <strong>Document ID:</strong> {document._id}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {formatDate(document.created_at)}
              </Typography>
              {document.updated_at && (
                <Typography variant="body2">
                  <strong>Updated:</strong> {formatDate(document.updated_at)}
                </Typography>
              )}
            </SubCard>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleDownload}
          startIcon={<IconDownload />}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}