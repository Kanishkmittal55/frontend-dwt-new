import { useState, useEffect } from 'react';

// material-ui
import {
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  LinearProgress,
  Checkbox
} from '@mui/material';

// icons
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconFileText,
  IconEye,
  IconSearch,
  IconFilter,
  IconTag,
  IconDatabase,
  IconDownload,
  IconUpload,
  IconPlayerPlay,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconFileTypePdf,
  IconFileTypeCsv,
  IconJson,
  IconFileTypeDoc,
  IconFile,
  IconLink
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { documentAPI } from 'api/documentAPI';
import { workspaceAPI } from 'api/workspaceAPI';

// ==============================|| DOCUMENT STATUS CHIP ||============================== //

const DocumentStatusChip = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
      case 'processed':
        return { color: 'success', icon: <IconCircleCheck size={14} />, label: 'Processed' };
      case 'processing':
        return { color: 'warning', icon: <IconClock size={14} />, label: 'Processing' };
      case 'failed':
        return { color: 'error', icon: <IconAlertCircle size={14} />, label: 'Failed' };
      case 'pending':
        return { color: 'default', icon: <IconClock size={14} />, label: 'Pending' };
      default:
        return { color: 'default', icon: null, label: status };
    }
  };

  const config = getStatusConfig();
  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size="small"
    />
  );
};

// ==============================|| DOCUMENT LIST ||============================== //

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [targetWorkspace, setTargetWorkspace] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFormData, setUploadFormData] = useState({
    tags: [],
    user_metadata: {}
  });
  const [tagInput, setTagInput] = useState('');
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchDocuments();
    fetchWorkspaces();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentAPI.getDocuments();
      setDocuments(response.documents || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await workspaceAPI.getWorkspaces();
      setWorkspaces(response.workspaces || []);
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
  };

  const handleOpenUploadDialog = () => {
    setUploadFormData({
      tags: [],
      user_metadata: {}
    });
    setUploadFile(null);
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setUploadFile(null);
    setSelectedWorkspace('');
    setUploadFormData({
      tags: [],
      user_metadata: {}
    });
    setTagInput('');
    setMetadataKey('');
    setMetadataValue('');
  };

  const handleOpenViewDialog = (document) => {
    setSelectedDocument(document);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedDocument(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setUploadFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setUploadFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddMetadata = () => {
    if (metadataKey && metadataValue) {
      setUploadFormData(prev => ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          [metadataKey]: metadataValue
        }
      }));
      setMetadataKey('');
      setMetadataValue('');
    }
  };

  const handleRemoveMetadata = (key) => {
    setUploadFormData(prev => {
      const newMetadata = { ...prev.user_metadata };
      delete newMetadata[key];
      return {
        ...prev,
        user_metadata: newMetadata
      };
    });
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedWorkspace) {
      setError('Please select a file and workspace');
      return;
    }

    setUploadLoading(true);
    setError(null);
    
    try {
      // Step 1: Generate presigned URL
      const presignedResponse = await documentAPI.generatePresignedPost({
        filename: uploadFile.name,
        workspace_id: selectedWorkspace
      });

      // Step 2: Upload file to S3 using presigned URL
      const formData = new FormData();
      Object.entries(presignedResponse.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', uploadFile);

      const uploadResponse = await fetch(presignedResponse.url, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Update document metadata if needed
      // Note: The backend might handle this automatically after upload
      
      handleCloseUploadDialog();
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleProcessDocument = async (documentId) => {
    try {
      await documentAPI.processDocument(documentId);
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to process document');
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentAPI.generatePresignedDownload(document._id, {
        filename: document.metadata.filename
      });
      
      // Open download URL in new tab
      window.open(response.url, '_blank');
    } catch (err) {
      setError(err.message || 'Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    try {
      await documentAPI.deleteDocument(documentId);
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleSelectDocument = (document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(d => d._id === document._id);
      if (isSelected) {
        return prev.filter(d => d._id !== document._id);
      } else {
        return [...prev, document];
      }
    });
  };

  const handleAssignDocuments = async () => {
    if (!targetWorkspace || selectedDocuments.length === 0) return;

    try {
      const documentIds = selectedDocuments.map(d => d._id);
      await documentAPI.assignDocumentsToWorkspace(targetWorkspace, {
        document_ids: documentIds
      });
      
      setAssignDialogOpen(false);
      setSelectedDocuments([]);
      setTargetWorkspace('');
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to assign documents');
    }
  };

  const handleUnassignDocument = async (documentId, workspaceId) => {
    try {
      await documentAPI.unassignDocumentsFromWorkspace(workspaceId, {
        document_ids: [documentId]
      });
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to unassign document');
    }
  };

  const handleUpdateDocument = async (documentId, workspaceId, updateData) => {
    try {
      await documentAPI.updateDocumentInWorkspace(documentId, workspaceId, updateData);
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to update document');
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = !searchTerm || 
      document.metadata.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (document.tags && Object.values(document.tags).flat().some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesStatus = filterStatus === 'all' || document.status === filterStatus;
    const matchesFormat = filterFormat === 'all' || document.metadata.format === filterFormat;
    
    return matchesSearch && matchesStatus && matchesFormat;
  });

  const getWorkspaceName = (workspaceId) => {
    const workspace = workspaces.find(ws => ws._id === workspaceId);
    return workspace?.name || 'Unknown';
  };

  const getFileIcon = (format) => {
    switch (format) {
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MainCard 
      title="Documents"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconUpload />}
            onClick={handleOpenUploadDialog}
            size="small"
          >
            Upload Document
          </Button>
          {selectedDocuments.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<IconLink />}
              onClick={() => setAssignDialogOpen(true)}
              size="small"
            >
              Assign ({selectedDocuments.length})
            </Button>
          )}
          <IconButton onClick={fetchDocuments} size="small" color="primary">
            <IconRefresh />
          </IconButton>
        </Stack>
      }
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search documents by name or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={20} />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="processed">Processed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Filter by Format</InputLabel>
            <Select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              label="Filter by Format"
            >
              <MenuItem value="all">All Formats</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="txt">Text</MenuItem>
              <MenuItem value="doc">Document</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDocuments.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconFileText size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  {searchTerm || filterStatus !== 'all' || filterFormat !== 'all' 
                    ? 'No Documents Found' 
                    : 'No Documents Uploaded Yet'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm || filterStatus !== 'all' || filterFormat !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Upload your first document to start extracting knowledge'}
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredDocuments.map((document) => (
              <Grid item xs={12} md={6} lg={4} key={document._id}>
                <SubCard>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={selectedDocuments.some(d => d._id === document._id)}
                          onChange={() => handleSelectDocument(document)}
                          size="small"
                        />
                        {getFileIcon(document.metadata.format)}
                        <Box>
                          <Typography variant="h5" noWrap sx={{ maxWidth: 200 }}>
                            {document.metadata.filename}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatFileSize(document.metadata.size)}
                          </Typography>
                        </Box>
                      </Box>
                      <DocumentStatusChip status={document.status} />
                    </Stack>

                    {/* Workspaces */}
                    {document.workspaces && document.workspaces.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
                        {document.workspaces.map(ws => (
                          <Chip
                            key={ws}
                            icon={<IconDatabase size={14} />}
                            label={getWorkspaceName(ws)}
                            size="small"
                            variant="outlined"
                            onDelete={() => handleUnassignDocument(document._id, ws)}
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    )}

                    {/* Tags */}
                    {document.tags && Object.values(document.tags).flat().length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
                        {Object.values(document.tags).flat().map((tag, index) => (
                          <Chip
                            key={index}
                            icon={<IconTag size={14} />}
                            label={tag}
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    )}

                    {/* Errors */}
                    {document.errors && document.errors.length > 0 && (
                      <Alert severity="error" sx={{ mb: 1, py: 0 }}>
                        <Typography variant="caption">
                          {document.errors[0].message || 'Processing error'}
                        </Typography>
                      </Alert>
                    )}

                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Uploaded: {formatDate(document.created_at)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEye />}
                      onClick={() => handleOpenViewDialog(document)}
                    >
                      View
                    </Button>
                    {document.status === 'pending' && (
                      <Button
                        size="small"
                        startIcon={<IconPlayerPlay />}
                        onClick={() => handleProcessDocument(document._id)}
                      >
                        Process
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(document)}
                    >
                      <Tooltip title="Download">
                        <IconDownload size={18} />
                      </Tooltip>
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(document._id)}
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  </CardActions>
                </SubCard>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Workspace *</InputLabel>
                <Select
                  value={selectedWorkspace}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  label="Workspace *"
                  required
                >
                  {workspaces.map(ws => (
                    <MenuItem key={ws._id} value={ws._id}>
                      {ws.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<IconUpload />}
                sx={{ py: 2 }}
              >
                {uploadFile ? uploadFile.name : 'Select File'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.csv,.json,.txt,.doc,.docx"
                />
              </Button>
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Tags (Optional)</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Add Tag"
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </Box>
              {uploadFormData.tags.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {uploadFormData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(index)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              )}
            </Grid>

            {/* Metadata */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Custom Metadata (Optional)</Typography>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={5}>
                  <TextField
                    label="Key"
                    fullWidth
                    size="small"
                    value={metadataKey}
                    onChange={(e) => setMetadataKey(e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    label="Value"
                    fullWidth
                    size="small"
                    value={metadataValue}
                    onChange={(e) => setMetadataValue(e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddMetadata}
                    disabled={!metadataKey || !metadataValue}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              {Object.keys(uploadFormData.user_metadata).length > 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {Object.entries(uploadFormData.user_metadata).map(([key, value]) => (
                      <ListItem key={key}>
                        <ListItemText
                          primary={key}
                          secondary={value}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveMetadata(key)}
                          >
                            <IconTrash size={16} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Grid>
          </Grid>

          {uploadLoading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={!uploadFile || !selectedWorkspace || uploadLoading}
            startIcon={uploadLoading && <CircularProgress size={16} />}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Document Details
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <SubCard title="File Information">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">Filename</Typography>
                      <Typography variant="body2">{selectedDocument.metadata.filename}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="textSecondary">Format</Typography>
                      <Typography variant="body2">{selectedDocument.metadata.format.toUpperCase()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="textSecondary">Size</Typography>
                      <Typography variant="body2">{formatFileSize(selectedDocument.metadata.size)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Status</Typography>
                      <Box sx={{ mt: 1 }}>
                        <DocumentStatusChip status={selectedDocument.status} />
                      </Box>
                    </Grid>
                  </Grid>
                </SubCard>
              </Grid>

              <Grid item xs={12}>
                <SubCard title="Workspaces">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedDocument.workspaces && selectedDocument.workspaces.map(ws => (
                      <Chip
                        key={ws}
                        icon={<IconDatabase size={14} />}
                        label={getWorkspaceName(ws)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                    {(!selectedDocument.workspaces || selectedDocument.workspaces.length === 0) && (
                      <Typography variant="body2" color="textSecondary">
                        No workspaces assigned
                      </Typography>
                    )}
                  </Stack>
                </SubCard>
              </Grid>

              {selectedDocument.tags && Object.values(selectedDocument.tags).flat().length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Tags">
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {Object.values(selectedDocument.tags).flat().map((tag, index) => (
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

              {selectedDocument.user_metadata && Object.keys(selectedDocument.user_metadata).length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Custom Metadata">
                    <List dense>
                      {Object.entries(selectedDocument.user_metadata).map(([key, value]) => (
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

              {selectedDocument.errors && selectedDocument.errors.length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Errors">
                    <List dense>
                      {selectedDocument.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <IconAlertCircle size={20} color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary={error.message || 'Unknown error'}
                            secondary={error.details || ''}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </SubCard>
                </Grid>
              )}

              <Grid item xs={12}>
                <SubCard title="Metadata">
                  <Typography variant="body2">
                    <strong>Document ID:</strong> {selectedDocument._id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {formatDate(selectedDocument.created_at)}
                  </Typography>
                  {selectedDocument.updated_at && (
                    <Typography variant="body2">
                      <strong>Updated:</strong> {formatDate(selectedDocument.updated_at)}
                    </Typography>
                  )}
                </SubCard>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDownload(selectedDocument)} startIcon={<IconDownload />}>
            Download
          </Button>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Documents Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Documents to Workspace</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Assign {selectedDocuments.length} selected document(s) to workspace:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Target Workspace</InputLabel>
            <Select
              value={targetWorkspace}
              onChange={(e) => setTargetWorkspace(e.target.value)}
              label="Target Workspace"
            >
              {workspaces.map(ws => (
                <MenuItem key={ws._id} value={ws._id}>
                  {ws.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignDocuments} 
            variant="contained" 
            disabled={!targetWorkspace}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
