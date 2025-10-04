// src/views/knowledge-graph/components/DocumentCard.tsx
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    IconButton,
    Stack,
    Box,
    Chip,
    Alert
  } from '@mui/material';
  import {
    IconEye,
    IconPlayerPlay,
    IconDownload,
    IconTrash,
    IconCircleCheck,
    IconAlertCircle,
    IconClock,
    IconFileTypePdf,
    IconFileTypeCsv,
    IconJson,
    IconFileTypeDoc,
    IconFile
  } from '@tabler/icons-react';
  import type { Document } from 'types/document';
  import { documentAPI } from 'api/documentAPI';
  import { useState } from 'react';
  
  interface DocumentCardProps {
    document: Document;
    onView: () => void;
    onProcess: (documentId: string) => void;
    onDelete: (documentId: string) => void;
  }
  
  export default function DocumentCard({ document, onView, onProcess, onDelete }: DocumentCardProps) {
    const [downloading, setDownloading] = useState(false);
  
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
  
    const getFileIcon = (format: string) => {
      switch (format.toLowerCase()) {
        case 'pdf':
          return <IconFileTypePdf size={20} />;
        case 'csv':
          return <IconFileTypeCsv size={20} />;
        case 'json':
          return <IconJson size={20} />;
        case 'doc':
        case 'docx':
          return <IconFileTypeDoc size={20} />;
        default:
          return <IconFile size={20} />;
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
  
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                {getFileIcon(document.metadata.format)}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h5" noWrap title={document.metadata.filename}>
                    {document.metadata.filename}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatFileSize(document.metadata.size)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={statusConfig.label}
                color={statusConfig.color}
                icon={statusConfig.icon}
                size="small"
              />
            </Stack>
  
            {document.errors && document.errors.length > 0 && (
              <Alert severity="error" sx={{ py: 0 }}>
                <Typography variant="caption">
                  {document.errors[0].message}
                </Typography>
              </Alert>
            )}
  
            <Typography variant="caption" color="textSecondary">
              Uploaded: {formatDate(document.created_at)}
            </Typography>
          </Stack>
        </CardContent>
  
        <CardActions>
          <Button size="small" startIcon={<IconEye />} onClick={onView}>
            View
          </Button>
          {(document.status === 'pending' || document.status === 'uploaded' || document.status === 'failed') && (
            <Button
              size="small"
              startIcon={<IconPlayerPlay />}
              onClick={() => onProcess(document._id)}
            >
              Process
            </Button>
          )}
          <IconButton size="small" onClick={handleDownload} disabled={downloading}>
            <IconDownload size={18} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(document._id)}>
            <IconTrash size={18} />
          </IconButton>
        </CardActions>
      </Card>
    );
  }