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
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';

// icons
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconNetwork,
  IconEye,
  IconDatabase,
  IconSchema,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconWorld,
  IconLock,
  IconDownload,
  IconSearch
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { graphAPI } from 'api/graphAPI';
import { workspaceAPI } from 'api/workspaceAPI';
import { schemaAPI } from 'api/schemaAPI';

// ==============================|| GRAPH LIST ||============================== //

const GraphStatusChip = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return { color: 'success', icon: <IconCircleCheck size={14} />, label: 'Ready' };
      case 'processing':
        return { color: 'warning', icon: <IconClock size={14} />, label: 'Processing' };
      case 'failed':
        return { color: 'error', icon: <IconAlertCircle size={14} />, label: 'Failed' };
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

export default function GraphList() {
  const navigate = useNavigate();
  const [graphs, setGraphs] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openQueryDialog, setOpenQueryDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [queryFormData, setQueryFormData] = useState({
    query: '',
    return_answer: false,
    include_chunks: false
  });
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    workspace: '',
    schema: '',
    public: false
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchGraphs();
    fetchWorkspaces();
    fetchSchemas();
  }, []);

  const fetchGraphs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await graphAPI.getGraphs();
      setGraphs(response.graphs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch graphs');
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

  const fetchSchemas = async () => {
    try {
      const response = await schemaAPI.getSchemas();
      setSchemas(response.schemas || []);
    } catch (err) {
      console.error('Failed to fetch schemas:', err);
    }
  };

  const handleOpenDialog = (graph = null) => {
    if (graph) {
      setEditMode(true);
      setSelectedGraph(graph);
      setFormData({
        name: graph.name,
        workspace: graph.workspace_id,
        schema: graph.schema_id || '',
        public: graph.public || false
      });
    } else {
      setEditMode(false);
      setSelectedGraph(null);
      setFormData({
        name: '',
        workspace: '',
        schema: '',
        public: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      workspace: '',
      schema: '',
      public: false
    });
    setSelectedGraph(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'public' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (editMode && selectedGraph) {
        await graphAPI.updateGraph(selectedGraph._id, {
          name: formData.name,
          public: formData.public
        });
      } else {
        // Create a dummy triple for now (backend requires at least one)
        const dummyTriple = {
          head: { 
            name: "InitialNode", 
            type: "Entity",
            properties: {}
          },
          relation: "initialized",
          tail: { 
            name: "GraphCreated", 
            type: "Entity",
            properties: {}
          },
          properties: {}
        };
        
        await graphAPI.createGraphFromTriples({
          name: formData.name,
          workspace: formData.workspace,
          schema: formData.schema || null,
          triples: [dummyTriple]
        });
      }
      handleCloseDialog();
      fetchGraphs();
    } catch (err) {
      // console.log("The error is : ", err.message)
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (graphId) => {
    if (!window.confirm('Are you sure you want to delete this graph? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    try {
      await graphAPI.deleteGraph(graphId);
      fetchGraphs();
    } catch (err) {
      setError(err.message || 'Failed to delete graph');
    }
  };

  const handleViewGraph = (graph) => {
    navigate(`/knowledge-graph/graphs/${graph._id}`);
  };

  const handleOpenQueryDialog = (graph) => {
    setSelectedGraph(graph);
    setQueryFormData({
      query: '',
      return_answer: false,
      include_chunks: false
    });
    setQueryResult(null);
    setOpenQueryDialog(true);
  };

  const handleCloseQueryDialog = () => {
    setOpenQueryDialog(false);
    setSelectedGraph(null);
    setQueryResult(null);
  };

  const handleQueryInputChange = (e) => {
    const { name, value, checked } = e.target;
    setQueryFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleQuerySubmit = async () => {
    setQueryLoading(true);
    try {
      const result = await graphAPI.queryGraph(selectedGraph._id, queryFormData);
      setQueryResult(result);
    } catch (err) {
      setError(err.message || 'Query failed');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleExportCypher = async (graphId) => {
    try {
      const result = await graphAPI.exportGraphToCypher(graphId);
      // Create a download link
      const blob = new Blob([result.cypher_text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graph-${graphId}.cypher`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Export failed');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWorkspaceName = (workspaceId) => {
    const workspace = workspaces.find(ws => ws._id === workspaceId);
    return workspace?.name || 'Unknown';
  };

  const getSchemaName = (schemaId) => {
    if (!schemaId) return 'No Schema';
    const schema = schemas.find(s => s._id === schemaId);
    return schema?.name || 'Unknown';
  };

  return (
    <MainCard 
      title="Knowledge Graphs"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Create Graph
          </Button>
          <IconButton onClick={fetchGraphs} size="small" color="primary">
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {graphs.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconNetwork size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  No Graphs Found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create your first knowledge graph to start visualizing data relationships
                </Typography>
              </Box>
            </Grid>
          ) : (
            graphs.map((graph) => (
              <Grid item xs={12} md={6} lg={4} key={graph._id}>
                <SubCard>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Typography variant="h4">
                        {graph.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <GraphStatusChip status={graph.status} />
                        {graph.public ? (
                          <Tooltip title="Public Graph">
                            <IconWorld size={20} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Private Graph">
                            <IconLock size={20} />
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip 
                        label={getWorkspaceName(graph.workspace_id)} 
                        size="small" 
                        icon={<IconDatabase size={14} />}
                      />
                      <Chip 
                        label={getSchemaName(graph.schema_id)} 
                        size="small" 
                        icon={<IconSchema size={14} />}
                        variant="outlined"
                      />
                    </Stack>

                    {graph.errors && graph.errors.length > 0 && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {graph.errors[0].message || 'Error in graph'}
                      </Alert>
                    )}

                    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                      Created: {formatDate(graph.created_at)}
                    </Typography>
                    
                    {graph.updated_at && (
                      <Typography variant="caption" display="block">
                        Updated: {formatDate(graph.updated_at)}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEye />}
                      onClick={() => handleViewGraph(graph)}
                      disabled={graph.status !== 'ready'}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<IconSearch />}
                      onClick={() => handleOpenQueryDialog(graph)}
                      disabled={graph.status !== 'ready'}
                    >
                      Query
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleExportCypher(graph._id)}
                      disabled={graph.status !== 'ready'}
                    >
                      <Tooltip title="Export as Cypher">
                        <IconDownload size={18} />
                      </Tooltip>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(graph)}
                    >
                      <IconEdit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(graph._id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Graph' : 'Create New Graph'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              name="name"
              label="Graph Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            
            <FormControl fullWidth disabled={editMode}>
              <InputLabel>Workspace</InputLabel>
              <Select
                name="workspace"
                value={formData.workspace}
                onChange={handleInputChange}
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

            <FormControl fullWidth disabled={editMode}>
              <InputLabel>Schema (Optional)</InputLabel>
              <Select
                name="schema"
                value={formData.schema}
                onChange={handleInputChange}
                label="Schema (Optional)"
              >
                <MenuItem value="">
                  <em>No Schema</em>
                </MenuItem>
                {schemas
                  .filter(s => s.workspace_id === formData.workspace)
                  .map(schema => (
                    <MenuItem key={schema._id} value={schema._id}>
                      {schema.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.public}
                  onChange={handleInputChange}
                  name="public"
                />
              }
              label="Make graph public"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || (!editMode && !formData.workspace)}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Query Dialog */}
      <Dialog open={openQueryDialog} onClose={handleCloseQueryDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Query Graph: {selectedGraph?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              name="query"
              label="Enter your query"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={queryFormData.query}
              onChange={handleQueryInputChange}
              placeholder="e.g., Who is the CEO of Apple?"
            />
            
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={queryFormData.return_answer}
                    onChange={handleQueryInputChange}
                    name="return_answer"
                  />
                }
                label="Return natural language answer"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={queryFormData.include_chunks}
                    onChange={handleQueryInputChange}
                    name="include_chunks"
                  />
                }
                label="Include source chunks"
              />
            </Stack>

            {queryLoading && <LinearProgress />}
            
            {queryResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" gutterBottom>Results:</Typography>
                
                {queryResult.answer && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body1">{queryResult.answer}</Typography>
                  </Alert>
                )}
                
                {queryResult.nodes && queryResult.nodes.length > 0 && (
                  <Box>
                    <Typography variant="h6">Nodes Found: {queryResult.nodes.length}</Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                      {queryResult.nodes.map((node, index) => (
                        <Chip
                          key={index}
                          label={node.name || node.value}
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {queryResult.triples && queryResult.triples.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">Relationships Found: {queryResult.triples.length}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQueryDialog}>Close</Button>
          <Button 
            onClick={handleQuerySubmit} 
            variant="contained"
            disabled={!queryFormData.query || queryLoading}
          >
            Query
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
