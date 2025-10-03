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
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  TextareaAutosize,
  Checkbox,
  FormControlLabel
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
  IconLink,
  IconCopy,
  IconJson,
  IconCode,
  IconFileTypeCsv
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { chunkAPI } from 'api/chunkAPI';
import { workspaceAPI } from 'api/workspaceAPI';

// ==============================|| CHUNK LIST ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chunk-tabpanel-${index}`}
      aria-labelledby={`chunk-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ChunkList() {
  const [chunks, setChunks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    content: '',
    contentType: 'text',
    tags: [],
    user_metadata: {}
  });
  const [tagInput, setTagInput] = useState('');
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [targetWorkspace, setTargetWorkspace] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchChunks();
    fetchWorkspaces();
  }, []);

  const fetchChunks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chunkAPI.getChunks();
      setChunks(response.chunks || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch chunks');
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

  const handleOpenDialog = () => {
    setFormData({
      content: '',
      contentType: 'text',
      tags: [],
      user_metadata: {}
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      content: '',
      contentType: 'text',
      tags: [],
      user_metadata: {}
    });
    setSelectedWorkspace('');
    setTagInput('');
    setMetadataKey('');
    setMetadataValue('');
  };

  const handleOpenViewDialog = (chunk) => {
    setSelectedChunk(chunk);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedChunk(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddMetadata = () => {
    if (metadataKey && metadataValue) {
      setFormData(prev => ({
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
    setFormData(prev => {
      const newMetadata = { ...prev.user_metadata };
      delete newMetadata[key];
      return {
        ...prev,
        user_metadata: newMetadata
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedWorkspace) {
      setError('Please select a workspace');
      return;
    }

    setError(null);
    try {
      let content = formData.content;
      
      // Parse content if it's JSON
      if (formData.contentType === 'json') {
        try {
          content = JSON.parse(formData.content);
        } catch (e) {
          setError('Invalid JSON content');
          return;
        }
      }

      const chunkData = {
        chunks: [{
          content: content,
          tags: formData.tags.length > 0 ? formData.tags : null,
          user_metadata: Object.keys(formData.user_metadata).length > 0 
            ? formData.user_metadata 
            : null
        }]
      };

      await chunkAPI.addChunks(selectedWorkspace, chunkData);
      handleCloseDialog();
      fetchChunks();
    } catch (err) {
      setError(err.message || 'Failed to create chunk');
    }
  };

  const handleDelete = async (chunkId) => {
    if (!window.confirm('Are you sure you want to delete this chunk? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    try {
      await chunkAPI.deleteChunk(chunkId);
      fetchChunks();
    } catch (err) {
      setError(err.message || 'Failed to delete chunk');
    }
  };

  const handleUpdateChunk = async (chunkId, workspaceId, updateData) => {
    try {
      await chunkAPI.updateChunk(chunkId, workspaceId, updateData);
      fetchChunks();
    } catch (err) {
      setError(err.message || 'Failed to update chunk');
    }
  };

  const handleSelectChunk = (chunk) => {
    setSelectedChunks(prev => {
      const isSelected = prev.some(c => c._id === chunk._id);
      if (isSelected) {
        return prev.filter(c => c._id !== chunk._id);
      } else {
        return [...prev, chunk];
      }
    });
  };

  const handleAssignChunks = async () => {
    if (!targetWorkspace || selectedChunks.length === 0) return;

    try {
      const chunkIds = selectedChunks.map(c => c._id);
      await chunkAPI.assignChunksToWorkspace(targetWorkspace, {
        chunk_ids: chunkIds
      });
      
      setAssignDialogOpen(false);
      setSelectedChunks([]);
      setTargetWorkspace('');
      fetchChunks();
    } catch (err) {
      setError(err.message || 'Failed to assign chunks');
    }
  };

  const handleUnassignChunk = async (chunkId, workspaceId) => {
    try {
      await chunkAPI.unassignChunksFromWorkspace(workspaceId, {
        chunk_ids: [chunkId]
      });
      fetchChunks();
    } catch (err) {
      setError(err.message || 'Failed to unassign chunk');
    }
  };

  // Filter chunks based on search term and type
  const filteredChunks = chunks.filter(chunk => {
    const matchesSearch = !searchTerm || 
      (typeof chunk.content === 'string' && chunk.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chunk.tags && chunk.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesType = filterType === 'all' || chunk.data_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getWorkspaceName = (workspaceId) => {
    const workspace = workspaces.find(ws => ws._id === workspaceId);
    return workspace?.name || 'Unknown';
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

  const getChunkIcon = (dataType) => {
    switch (dataType) {
      case 'json':
        return <IconJson size={20} />;
      case 'csv':
        return <IconFileTypeCsv size={20} />;
      case 'code':
        return <IconCode size={20} />;
      default:
        return <IconFileText size={20} />;
    }
  };

  const formatContent = (content) => {
    if (typeof content === 'string') {
      return content.length > 150 ? content.substring(0, 150) + '...' : content;
    }
    return JSON.stringify(content).substring(0, 150) + '...';
  };

  return (
    <MainCard 
      title="Knowledge Chunks"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={handleOpenDialog}
            size="small"
          >
            Add Chunk
          </Button>
          {selectedChunks.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<IconLink />}
              onClick={() => setAssignDialogOpen(true)}
              size="small"
            >
              Assign ({selectedChunks.length})
            </Button>
          )}
          <IconButton onClick={fetchChunks} size="small" color="primary">
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
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Search chunks by content or tags..."
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
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filter by Type"
              startAdornment={
                <InputAdornment position="start">
                  <IconFilter size={20} />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="code">Code</MenuItem>
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
          {filteredChunks.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconFileText size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  {searchTerm || filterType !== 'all' ? 'No Chunks Found' : 'No Chunks Created Yet'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Add your first chunk to start organizing knowledge'}
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredChunks.map((chunk) => (
              <Grid item xs={12} md={6} lg={4} key={chunk._id}>
                <SubCard>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={selectedChunks.some(c => c._id === chunk._id)}
                          onChange={() => handleSelectChunk(chunk)}
                          size="small"
                        />
                        {getChunkIcon(chunk.data_type)}
                        <Chip
                          label={chunk.data_type}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenViewDialog(chunk)}
                        color="primary"
                      >
                        <IconEye />
                      </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ mb: 2, minHeight: '3em' }}>
                      {formatContent(chunk.content)}
                    </Typography>

                    {/* Workspaces */}
                    {chunk.workspaces && chunk.workspaces.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
                        {chunk.workspaces.map(ws => (
                          <Chip
                            key={ws}
                            icon={<IconDatabase size={14} />}
                            label={getWorkspaceName(ws)}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    )}

                    {/* Tags */}
                    {chunk.tags && chunk.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
                        {chunk.tags.map((tag, index) => (
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

                    {/* Metadata info */}
                    {chunk.metadata && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Language: {chunk.metadata.language || 'en'} | 
                        Length: {chunk.metadata.length || 'N/A'}
                      </Typography>
                    )}

                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Created: {formatDate(chunk.created_at)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEye />}
                      onClick={() => handleOpenViewDialog(chunk)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<IconTrash />}
                      onClick={() => handleDelete(chunk._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </SubCard>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Add Chunk Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Chunk</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Content" />
              <Tab label="Metadata" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Workspace</InputLabel>
                    <Select
                      value={selectedWorkspace}
                      onChange={(e) => setSelectedWorkspace(e.target.value)}
                      label="Workspace"
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
                  <FormControl fullWidth>
                    <InputLabel>Content Type</InputLabel>
                    <Select
                      name="contentType"
                      value={formData.contentType}
                      onChange={handleInputChange}
                      label="Content Type"
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="content"
                    label="Content"
                    fullWidth
                    multiline
                    rows={8}
                    variant="outlined"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder={formData.contentType === 'json' 
                      ? '{"key": "value"}' 
                      : 'Enter your text content here...'}
                    required
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2}>
                {/* Tags Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
                  {formData.tags.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {formData.tags.map((tag, index) => (
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

                {/* User Metadata Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Custom Metadata</Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
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

                  {Object.keys(formData.user_metadata).length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <List dense>
                        {Object.entries(formData.user_metadata).map(([key, value]) => (
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
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.content || !selectedWorkspace}
          >
            Add Chunk
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Chunk Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Chunk Details
        </DialogTitle>
        <DialogContent>
          {selectedChunk && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <SubCard title="Content">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                      icon={getChunkIcon(selectedChunk.data_type)}
                      label={selectedChunk.data_type}
                      color="primary"
                    />
                    <IconButton 
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          typeof selectedChunk.content === 'string' 
                            ? selectedChunk.content 
                            : JSON.stringify(selectedChunk.content, null, 2)
                        );
                      }}
                    >
                      <Tooltip title="Copy content">
                        <IconCopy size={18} />
                      </Tooltip>
                    </IconButton>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {typeof selectedChunk.content === 'string' 
                        ? selectedChunk.content 
                        : JSON.stringify(selectedChunk.content, null, 2)}
                    </Typography>
                  </Paper>
                </SubCard>
              </Grid>

              <Grid item xs={12}>
                <SubCard title="Workspaces">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedChunk.workspaces && selectedChunk.workspaces.map(ws => (
                      <Chip
                        key={ws}
                        icon={<IconDatabase size={14} />}
                        label={getWorkspaceName(ws)}
                        onDelete={() => handleUnassignChunk(selectedChunk._id, ws)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </SubCard>
              </Grid>

              {selectedChunk.tags && selectedChunk.tags.length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Tags">
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedChunk.tags.map((tag, index) => (
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

              {selectedChunk.user_metadata && Object.keys(selectedChunk.user_metadata).length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Custom Metadata">
                    <List dense>
                      {Object.entries(selectedChunk.user_metadata).map(([key, value]) => (
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

              <Grid item xs={12}>
                <SubCard title="System Metadata">
                  {selectedChunk.metadata && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Language</Typography>
                        <Typography variant="body2">{selectedChunk.metadata.language || 'en'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Length</Typography>
                        <Typography variant="body2">{selectedChunk.metadata.length || 'N/A'}</Typography>
                      </Grid>
                      {selectedChunk.metadata.size && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Size</Typography>
                          <Typography variant="body2">{selectedChunk.metadata.size} bytes</Typography>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Chunk ID</Typography>
                        <Typography variant="body2">{selectedChunk._id}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Created</Typography>
                        <Typography variant="body2">{formatDate(selectedChunk.created_at)}</Typography>
                      </Grid>
                    </Grid>
                  )}
                </SubCard>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Chunks Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Chunks to Workspace</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Assign {selectedChunks.length} selected chunk(s) to workspace:
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
            onClick={handleAssignChunks} 
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
