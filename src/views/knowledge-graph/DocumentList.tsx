import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import {
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  IconPlus,
  IconRefresh,
  IconFileText,
  IconSearch
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { documentAPI } from 'api/documentAPI';
import { useWorkspace } from 'contexts/WorkspaceContext';
import type { Document } from 'types/document';
import DocumentCard from './components/documents/DocumentCard';
import DocumentUploadDialog from './components/documents/DocumentUploadDialog';
import DocumentViewDialog from './components/documents/DocumentViewDialog';

export default function DocumentList() {
  const { workspaceId, workspace, loading: workspaceLoading } = useWorkspace();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchDocuments();
    }
  }, [workspaceId]);

  const fetchDocuments = async () => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await documentAPI.getDocuments({ workspace_id: workspaceId });
      setDocuments(response.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await documentAPI.deleteDocument(documentId);
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleProcess = async (
       documentId: string,
       config?: { chunk_size?: number; chunk_overlap?: number }
     ) => {
       try {
         await documentAPI.processDocument(documentId, config);
         console.log('🔵 Processing API call succeeded for document:', documentId);
    
         // poll until processed/failed (mirrors your test logic)
         const maxMs = 60_000; // Increased to 60s
         const intervalMs = 1000; // Check every 1s
         const started = Date.now();
         let pollCount = 0;
    
         while (true) {
          pollCount++;
          const single = await documentAPI.getDocument(documentId);
          const doc = single.documents?.[0];
          const elapsed = Math.round((Date.now() - started) / 1000);
          
          console.log(`📊 Poll #${pollCount} (${elapsed}s): Document status = "${doc?.status}"`);
          
           if (doc?.status === 'processed' || doc?.status === 'failed') {
             console.log(`✅ Processing ${doc.status === 'processed' ? 'completed' : 'failed'} after ${elapsed}s`);
             await fetchDocuments();
             break;
           }
           if (Date.now() - started > maxMs) {
             console.warn(`⚠️ Processing timeout after ${elapsed}s - status still "${doc?.status}"`);
             setError(`Processing timeout: Document status is still "${doc?.status}". Check backend logs.`);
             await fetchDocuments();
             break;
           }
           await new Promise(r => setTimeout(r, intervalMs));
         }
       } catch (err) {
         console.error('❌ Processing failed:', err);
         setError(err instanceof Error ? err.message : 'Failed to process document');
         await fetchDocuments();
       }
     };

  const filteredDocuments = documents.filter(doc =>
    doc.metadata.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (workspaceLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!workspace) {
    return (
      <MainCard>
        <Alert severity="warning">Workspace not found</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard 
      title={`Documents - ${workspace.name}`}
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => setOpenUploadDialog(true)}
            size="small"
          >
            Upload
          </Button>
        </Stack>
      }
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size={20} />
            </InputAdornment>
          )
        }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDocuments.length === 0 ? (
            <Grid size={12}>
              <Box textAlign="center" py={4}>
                <IconFileText size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  No Documents Found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Upload your first document to get started
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredDocuments.map((document) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={document._id}>
                <DocumentCard
                  document={document}
                  onView={() => {
                    setSelectedDocument(document);
                    setOpenViewDialog(true);
                  }}
                  onProcess={handleProcess}
                  onDelete={handleDelete}
                />
              </Grid>
            ))
          )}
        </Grid>
      )}

      <DocumentUploadDialog
        open={openUploadDialog}
        workspaceId={workspaceId!}
        workspaceName={workspace.name}
        onClose={() => setOpenUploadDialog(false)}
        onSuccess={fetchDocuments}
      />

      <DocumentViewDialog
        open={openViewDialog}
        document={selectedDocument}
        onClose={() => {
          setOpenViewDialog(false);
          setSelectedDocument(null);
        }}
      />
    </MainCard>
  );
}