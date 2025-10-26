import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Tooltip
} from '@mui/material';
import {
  IconEye,
  IconTrash,
  IconPlayerPlay,
  IconRefresh
} from '@tabler/icons-react';
import type { Document, DocumentCardProps } from '@/types/document';
import ProcessDocumentDialog from './ProcessDocumentDialog';
import { documentAPI } from '@/api/documentAPI';

export default function DocumentCard({
  document,
  onView,
  onDelete,
  onProcess
}: DocumentCardProps) {
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'uploaded':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleProcessClick = () => {
    setShowProcessDialog(true);
  };

//   const handleProcessConfirm = async (config: { chunk_size?: number; chunk_overlap?: number }) => {
//     try {
//         setProcessing(true);
//         await documentAPI.processDocument(document._id, config);
//         // Keep processing=true, parent refresh will update with real status
//     } catch (err) {
//         console.error('Failed to process document:', err);
//         setProcessing(false); // Only reset on error
//     }
// };

   const handleProcessConfirm = async (config: { chunk_size?: number; chunk_overlap?: number }) => {
      try {
        setProcessing(true); // optimistic
        await onProcess(document._id, config); // delegate to parent
        // parent polling will update status; keep spinner until update arrives
      } catch (err) {
        console.error('Failed to process document:', err);
        setProcessing(false);
      }
    };

  const displayStatus = processing ? 'processing' : document.status;
  const canProcess = ['uploaded', 'failed'].includes(document.status);
  const isProcessing = document.status === 'processing';

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" component="div" noWrap>
            {document.metadata.filename}
          </Typography>
          
          <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={displayStatus} 
              color={getStatusColor(displayStatus)}
              size="small"
            />
            <Typography variant="caption" color="textSecondary">
              {document.metadata.format.toUpperCase()}
            </Typography>
          </Box>

          {document.errors && document.errors.length > 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {document.errors[0].message}
            </Typography>
          )}
        </CardContent>

        <CardActions>
        <Tooltip title="View Details">
            <IconButton size="small" onClick={onView}>
            <IconEye />
            </IconButton>
        </Tooltip>

        {canProcess && !processing && (
            <Tooltip title="Process Document">
            <IconButton 
                size="small" 
                onClick={handleProcessClick}
                color="primary"
            >
                <IconPlayerPlay />
            </IconButton>
            </Tooltip>
        )}

        {isProcessing && (
            <Tooltip title="Processing">
            <IconButton size="small" disabled>
                <IconRefresh className="animate-spin" />
            </IconButton>
            </Tooltip>
        )}

        <Tooltip title="Delete">
            <IconButton 
            size="small" 
            onClick={() => onDelete(document._id)}
            color="error"
            >
            <IconTrash />
            </IconButton>
        </Tooltip>
        </CardActions>
      </Card>

      <ProcessDocumentDialog
        open={showProcessDialog}
        documentName={document.metadata.filename}
        documentFormat={document.metadata.format}
        onClose={() => setShowProcessDialog(false)}
        onConfirm={handleProcessConfirm}
      />
    </>
  );
}