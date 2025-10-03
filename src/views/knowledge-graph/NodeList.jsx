import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  InputAdornment
} from '@mui/material';

// icons
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconCube,
  IconEye,
  IconSearch,
  IconFilter,
  IconFileText,
  IconTag,
  IconLink,
  IconDatabase
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { nodeAPI } from 'api/nodeAPI';
import { graphAPI } from 'api/graphAPI';

// ==============================|| NODE LIST ||============================== //

export default function NodeList() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeChunks, setNodeChunks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    value: '',
    properties: {},
    graph_id: ''
  });
  const [propertyKey, setPropertyKey] = useState('');
  const [propertyValue, setPropertyValue] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchNodes();
    fetchGraphs();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await nodeAPI.getNodes();
      setNodes(response.nodes || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch nodes');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphs = async () => {
    try {
      const response = await graphAPI.getGraphs();
      setGraphs(response.graphs || []);
    } catch (err) {
      console.error('Failed to fetch graphs:', err);
    }
  };

  const fetchNodeChunks = async (nodeId) => {
    try {
      const response = await nodeAPI.getNodeWithChunks(nodeId);
      setNodeChunks(response.chunks || []);
    } catch (err) {
      console.error('Failed to fetch node chunks:', err);
      setNodeChunks([]);
    }
  };

  const handleOpenDialog = (node = null) => {
    if (node) {
      setEditMode(true);
      setSelectedNode(node);
      setFormData({
        name: node.name || '',
        type: node.type || '',
        value: node.value || '',
        properties: node.properties || {},
        graph_id: node.graph_id || ''
      });
    } else {
      setEditMode(false);
      setSelectedNode(null);
      setFormData({
        name: '',
        type: '',
        value: '',
        properties: {},
        graph_id: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      type: '',
      value: '',
      properties: {},
      graph_id: ''
    });
    setSelectedNode(null);
    setEditMode(false);
    setPropertyKey('');
    setPropertyValue('');
  };

  const handleOpenViewDialog = async (node) => {
    setSelectedNode(node);
    await fetchNodeChunks(node._id);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedNode(null);
    setNodeChunks([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProperty = () => {
    if (propertyKey && propertyValue) {
      setFormData(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [propertyKey]: propertyValue
        }
      }));
      setPropertyKey('');
      setPropertyValue('');
    }
  };

  const handleRemoveProperty = (key) => {
    setFormData(prev => {
      const newProperties = { ...prev.properties };
      delete newProperties[key];
      return {
        ...prev,
        properties: newProperties
      };
    });
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const nodeData = {
        ...formData,
        // Ensure properties is always an object
        properties: formData.properties || {}
      };

      if (editMode && selectedNode) {
        await nodeAPI.updateNode(selectedNode._id, nodeData);
      } else {
        await nodeAPI.createNode(nodeData);
      }
      handleCloseDialog();
      fetchNodes();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (nodeId) => {
    if (!window.confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    try {
      await nodeAPI.deleteNode(nodeId);
      fetchNodes();
    } catch (err) {
      setError(err.message || 'Failed to delete node');
    }
  };

  // Filter nodes based on search term and type
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = !searchTerm || 
      (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.value && node.value.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.type && node.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || node.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get unique node types for filter
  const nodeTypes = [...new Set(nodes.map(node => node.type).filter(Boolean))];

  const getGraphName = (graphId) => {
    const graph = graphs.find(g => g._id === graphId);
    return graph?.name || 'Unknown Graph';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <MainCard 
      title="Knowledge Graph Nodes"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Create Node
          </Button>
          <IconButton onClick={fetchNodes} size="small" color="primary">
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
            placeholder="Search nodes by name, value, or type..."
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
              {nodeTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
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
          {filteredNodes.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconCube size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  {searchTerm || filterType !== 'all' ? 'No Nodes Found' : 'No Nodes Created Yet'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first node to start building your knowledge graph'}
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredNodes.map((node) => (
              <Grid item xs={12} md={6} lg={4} key={node._id}>
                <SubCard>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h4" gutterBottom>
                          {node.name || node.value || 'Unnamed Node'}
                        </Typography>
                        {node.type && (
                          <Chip
                            label={node.type}
                            size="small"
                            color="primary"
                            sx={{ mb: 1 }}
                          />
                        )}
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenViewDialog(node)}
                        color="primary"
                      >
                        <IconEye />
                      </IconButton>
                    </Stack>

                    {node.value && node.value !== node.name && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Value: {node.value}
                      </Typography>
                    )}

                    {node.graph_id && (
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          icon={<IconLink size={14} />}
                          label={getGraphName(node.graph_id)}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    )}

                    {node.properties && Object.keys(node.properties).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Properties: {Object.keys(node.properties).length}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="caption" display="block">
                      Created: {formatDate(node.created_at)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEye />}
                      onClick={() => handleOpenViewDialog(node)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<IconEdit />}
                      onClick={() => handleOpenDialog(node)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<IconTrash />}
                      onClick={() => handleDelete(node._id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Node' : 'Create New Node'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Node Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="type"
                label="Node Type"
                fullWidth
                variant="outlined"
                value={formData.type}
                onChange={handleInputChange}
                placeholder="e.g., Person, Organization, Location"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="value"
                label="Node Value"
                fullWidth
                variant="outlined"
                value={formData.value}
                onChange={handleInputChange}
                multiline
                rows={2}
                placeholder="Additional value or description"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Graph (Optional)</InputLabel>
                <Select
                  name="graph_id"
                  value={formData.graph_id}
                  onChange={handleInputChange}
                  label="Graph (Optional)"
                >
                  <MenuItem value="">
                    <em>No Graph</em>
                  </MenuItem>
                  {graphs
                    .filter(g => g.status === 'ready')
                    .map(graph => (
                      <MenuItem key={graph._id} value={graph._id}>
                        {graph.name}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Properties Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Properties</Divider>
              
              {/* Add Property */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <TextField
                    label="Property Key"
                    fullWidth
                    size="small"
                    value={propertyKey}
                    onChange={(e) => setPropertyKey(e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    label="Property Value"
                    fullWidth
                    size="small"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddProperty}
                    disabled={!propertyKey || !propertyValue}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              {/* Display Properties */}
              {Object.keys(formData.properties).length > 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {Object.entries(formData.properties).map(([key, value]) => (
                      <ListItem key={key}>
                        <ListItemText
                          primary={key}
                          secondary={value}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            size="small"
                            onClick={() => handleRemoveProperty(key)}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name && !formData.value}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Node Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Node Details: {selectedNode?.name || selectedNode?.value}
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <SubCard title="Basic Information">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">ID</Typography>
                      <Typography variant="body2">{selectedNode._id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">Type</Typography>
                      <Typography variant="body2">{selectedNode.type || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">Name</Typography>
                      <Typography variant="body2">{selectedNode.name || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">Graph</Typography>
                      <Typography variant="body2">
                        {selectedNode.graph_id ? getGraphName(selectedNode.graph_id) : 'Not assigned'}
                      </Typography>
                    </Grid>
                    {selectedNode.value && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Value</Typography>
                        <Typography variant="body2">{selectedNode.value}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </SubCard>
              </Grid>

              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Properties">
                    <List dense>
                      {Object.entries(selectedNode.properties).map(([key, value]) => (
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

              {nodeChunks.length > 0 && (
                <Grid item xs={12}>
                  <SubCard title={`Associated Chunks (${nodeChunks.length})`}>
                    <List>
                      {nodeChunks.map((chunk, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`Chunk ${index + 1}`}
                            secondary={chunk.content || chunk.text || 'No content available'}
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
                    <strong>Created:</strong> {formatDate(selectedNode.created_at)}
                  </Typography>
                  {selectedNode.updated_at && (
                    <Typography variant="body2">
                      <strong>Updated:</strong> {formatDate(selectedNode.updated_at)}
                    </Typography>
                  )}
                </SubCard>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button 
            variant="contained"
            startIcon={<IconEdit />}
            onClick={() => {
              handleCloseViewDialog();
              handleOpenDialog(selectedNode);
            }}
          >
            Edit Node
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
