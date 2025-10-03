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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Checkbox,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

// icons
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconLink,
  IconEye,
  IconSearch,
  IconFilter,
  IconArrowRight,
  IconCube,
  IconDatabase,
  IconFileText,
  IconChevronDown,
  IconCircleCheck,
  IconAlertCircle
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { tripleAPI } from 'api/tripleAPI';
import { nodeAPI } from 'api/nodeAPI';
import { graphAPI } from 'api/graphAPI';
import { chunkAPI } from 'api/chunkAPI';

// ==============================|| TRIPLE LIST ||============================== //

export default function TripleList() {
  const [triples, setTriples] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTriple, setSelectedTriple] = useState(null);
  const [tripleChunks, setTripleChunks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGraph, setFilterGraph] = useState('all');
  const [nodeCreationType, setNodeCreationType] = useState('existing');
  const [strictMode, setStrictMode] = useState(false);
  const [formData, setFormData] = useState({
    graph: '',
    head_node: '',
    tail_node: '',
    type: 'related_to',
    properties: {},
    chunks: [],
    head_node_new: { name: '', type: 'Entity', properties: {} },
    tail_node_new: { name: '', type: 'Entity', properties: {} }
  });
  const [propertyKey, setPropertyKey] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [selectedChunks, setSelectedChunks] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchTriples();
    fetchNodes();
    fetchGraphs();
    fetchChunks();
  }, []);

  const fetchTriples = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tripleAPI.getTriples();
      setTriples(response.triples || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch triples');
    } finally {
      setLoading(false);
    }
  };

  const fetchNodes = async () => {
    try {
      const response = await nodeAPI.getNodes();
      setNodes(response.nodes || []);
    } catch (err) {
      console.error('Failed to fetch nodes:', err);
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

  const fetchChunks = async () => {
    try {
      const response = await chunkAPI.getChunks();
      setChunks(response.chunks || []);
    } catch (err) {
      console.error('Failed to fetch chunks:', err);
    }
  };

  const fetchTripleChunks = async (tripleId) => {
    try {
      const response = await tripleAPI.getTripleWithChunks(tripleId);
      setTripleChunks(response.chunks || []);
    } catch (err) {
      console.error('Failed to fetch triple chunks:', err);
      setTripleChunks([]);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      graph: '',
      head_node: '',
      tail_node: '',
      type: 'related_to',
      properties: {},
      chunks: [],
      head_node_new: { name: '', type: 'Entity', properties: {} },
      tail_node_new: { name: '', type: 'Entity', properties: {} }
    });
    setNodeCreationType('existing');
    setStrictMode(false);
    setSelectedChunks([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      graph: '',
      head_node: '',
      tail_node: '',
      type: 'related_to',
      properties: {},
      chunks: [],
      head_node_new: { name: '', type: 'Entity', properties: {} },
      tail_node_new: { name: '', type: 'Entity', properties: {} }
    });
    setNodeCreationType('existing');
    setSelectedChunks([]);
    setPropertyKey('');
    setPropertyValue('');
  };

  const handleOpenViewDialog = async (triple) => {
    setSelectedTriple(triple);
    await fetchTripleChunks(triple._id);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedTriple(null);
    setTripleChunks([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewNodeChange = (nodeType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${nodeType}_new`]: {
        ...prev[`${nodeType}_new`],
        [field]: value
      }
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

  const handleChunkSelection = (chunk) => {
    setSelectedChunks(prev => {
      const isSelected = prev.some(c => c._id === chunk._id);
      if (isSelected) {
        return prev.filter(c => c._id !== chunk._id);
      } else {
        return [...prev, chunk];
      }
    });
    setFormData(prev => ({
      ...prev,
      chunks: selectedChunks.map(c => c._id)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.graph) {
      setError('Please select a graph');
      return;
    }

    setError(null);
    try {
      const triplesData = {
        graph: formData.graph,
        strict_mode: strictMode,
        triples: [{
          head_node: nodeCreationType === 'existing' 
            ? formData.head_node 
            : formData.head_node_new,
          tail_node: nodeCreationType === 'existing' 
            ? formData.tail_node 
            : formData.tail_node_new,
          type: formData.type,
          properties: formData.properties,
          chunks: selectedChunks.map(c => c._id)
        }]
      };

      await tripleAPI.createTriples(triplesData);
      handleCloseDialog();
      fetchTriples();
      if (nodeCreationType === 'new') {
        fetchNodes(); // Refresh nodes if new ones were created
      }
    } catch (err) {
      setError(err.message || 'Failed to create triple');
    }
  };

  const handleDelete = async (tripleId) => {
    if (!window.confirm('Are you sure you want to delete this triple? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    try {
      await tripleAPI.deleteTriple(tripleId);
      fetchTriples();
    } catch (err) {
      setError(err.message || 'Failed to delete triple');
    }
  };

  // Filter triples based on search term and graph
  const filteredTriples = triples.filter(triple => {
    const matchesSearch = !searchTerm || 
      triple.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (triple.properties && JSON.stringify(triple.properties).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGraph = filterGraph === 'all' || triple.graph === filterGraph;
    
    return matchesSearch && matchesGraph;
  });

  const getNodeName = (nodeId) => {
    const node = nodes.find(n => n._id === nodeId);
    return node?.name || node?.value || nodeId;
  };

  const getGraphName = (graphId) => {
    const graph = graphs.find(g => g._id === graphId);
    return graph?.name || 'Unknown Graph';
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

  const formatChunkContent = (content) => {
    if (typeof content === 'string') {
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    return JSON.stringify(content).substring(0, 100) + '...';
  };

  return (
    <MainCard 
      title="Knowledge Graph Triples"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={handleOpenDialog}
            size="small"
          >
            Create Triple
          </Button>
          <IconButton onClick={fetchTriples} size="small" color="primary">
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
            placeholder="Search triples by type or properties..."
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
            <InputLabel>Filter by Graph</InputLabel>
            <Select
              value={filterGraph}
              onChange={(e) => setFilterGraph(e.target.value)}
              label="Filter by Graph"
              startAdornment={
                <InputAdornment position="start">
                  <IconFilter size={20} />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Graphs</MenuItem>
              {graphs.filter(g => g.status === 'ready').map(graph => (
                <MenuItem key={graph._id} value={graph._id}>
                  {graph.name}
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
          {filteredTriples.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconLink size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  {searchTerm || filterGraph !== 'all' ? 'No Triples Found' : 'No Triples Created Yet'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm || filterGraph !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first triple to establish relationships between nodes'}
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredTriples.map((triple) => (
              <Grid item xs={12} md={6} lg={4} key={triple._id}>
                <SubCard>
                  <CardContent>
                    {/* Triple Visualization */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Chip
                          icon={<IconCube size={14} />}
                          label={getNodeName(triple.head_node)}
                          size="small"
                          color="primary"
                        />
                        <IconArrowRight size={20} />
                        <Chip
                          label={triple.type}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                        <IconArrowRight size={20} />
                        <Chip
                          icon={<IconCube size={14} />}
                          label={getNodeName(triple.tail_node)}
                          size="small"
                          color="primary"
                        />
                      </Stack>
                    </Box>

                    {/* Graph info */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        icon={<IconDatabase size={14} />}
                        label={getGraphName(triple.graph)}
                        size="small"
                        variant="outlined"
                      />
                      {triple.chunks && triple.chunks.length > 0 && (
                        <Chip
                          icon={<IconFileText size={14} />}
                          label={`${triple.chunks.length} chunks`}
                          size="small"
                        />
                      )}
                    </Stack>

                    {/* Properties */}
                    {triple.properties && Object.keys(triple.properties).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Properties: {Object.keys(triple.properties).join(', ')}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="caption" display="block">
                      Created: {formatDate(triple.created_at)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEye />}
                      onClick={() => handleOpenViewDialog(triple)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<IconTrash />}
                      onClick={() => handleDelete(triple._id)}
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

      {/* Create Triple Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Triple</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Graph Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Graph *</InputLabel>
                <Select
                  name="graph"
                  value={formData.graph}
                  onChange={handleInputChange}
                  label="Graph *"
                  required
                >
                  {graphs.filter(g => g.status === 'ready').map(graph => (
                    <MenuItem key={graph._id} value={graph._id}>
                      {graph.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Strict Mode */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={strictMode}
                    onChange={(e) => setStrictMode(e.target.checked)}
                  />
                }
                label="Strict Mode (Validate against graph schema)"
              />
            </Grid>

            {/* Node Creation Type */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Node Selection</FormLabel>
                <RadioGroup
                  row
                  value={nodeCreationType}
                  onChange={(e) => setNodeCreationType(e.target.value)}
                >
                  <FormControlLabel 
                    value="existing" 
                    control={<Radio />} 
                    label="Use Existing Nodes" 
                  />
                  <FormControlLabel 
                    value="new" 
                    control={<Radio />} 
                    label="Create New Nodes" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Node Selection/Creation */}
            {nodeCreationType === 'existing' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Head Node *</InputLabel>
                    <Select
                      name="head_node"
                      value={formData.head_node}
                      onChange={handleInputChange}
                      label="Head Node *"
                      required
                    >
                      {nodes.map(node => (
                        <MenuItem key={node._id} value={node._id}>
                          {node.name || node.value} ({node.type || 'Unknown'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tail Node *</InputLabel>
                    <Select
                      name="tail_node"
                      value={formData.tail_node}
                      onChange={handleInputChange}
                      label="Tail Node *"
                      required
                    >
                      {nodes.map(node => (
                        <MenuItem key={node._id} value={node._id}>
                          {node.name || node.value} ({node.type || 'Unknown'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Head Node (New)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Name"
                        fullWidth
                        value={formData.head_node_new.name}
                        onChange={(e) => handleNewNodeChange('head_node', 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Type"
                        fullWidth
                        value={formData.head_node_new.type}
                        onChange={(e) => handleNewNodeChange('head_node', 'type', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Tail Node (New)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Name"
                        fullWidth
                        value={formData.tail_node_new.name}
                        onChange={(e) => handleNewNodeChange('tail_node', 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Type"
                        fullWidth
                        value={formData.tail_node_new.type}
                        onChange={(e) => handleNewNodeChange('tail_node', 'type', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Relation Type */}
            <Grid item xs={12}>
              <TextField
                name="type"
                label="Relation Type"
                fullWidth
                value={formData.type}
                onChange={handleInputChange}
                placeholder="e.g., works_at, owns, related_to"
                required
              />
            </Grid>

            {/* Properties Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Properties</Divider>
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

            {/* Chunks Selection */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Associated Chunks (Optional)</Divider>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {chunks.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No chunks available
                  </Typography>
                ) : (
                  <List dense>
                    {chunks.slice(0, 10).map(chunk => (
                      <ListItem key={chunk._id}>
                        <Checkbox
                          checked={selectedChunks.some(c => c._id === chunk._id)}
                          onChange={() => handleChunkSelection(chunk)}
                        />
                        <ListItemText
                          primary={formatChunkContent(chunk.content)}
                          secondary={`Type: ${chunk.data_type}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={
              !formData.graph || 
              !formData.type ||
              (nodeCreationType === 'existing' && (!formData.head_node || !formData.tail_node)) ||
              (nodeCreationType === 'new' && (!formData.head_node_new.name || !formData.tail_node_new.name))
            }
          >
            Create Triple
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Triple Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Triple Details
        </DialogTitle>
        <DialogContent>
          {selectedTriple && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Triple Visualization */}
              <Grid item xs={12}>
                <SubCard title="Relationship">
                  <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 1, textAlign: 'center' }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                      <Box textAlign="center">
                        <IconCube size={32} />
                        <Typography variant="h5">{getNodeName(selectedTriple.head_node)}</Typography>
                        <Typography variant="caption" color="textSecondary">Head Node</Typography>
                      </Box>
                      <Box textAlign="center">
                        <IconArrowRight size={32} />
                        <Typography variant="h6" color="secondary">{selectedTriple.type}</Typography>
                        <Typography variant="caption" color="textSecondary">Relation</Typography>
                      </Box>
                      <Box textAlign="center">
                        <IconCube size={32} />
                        <Typography variant="h5">{getNodeName(selectedTriple.tail_node)}</Typography>
                        <Typography variant="caption" color="textSecondary">Tail Node</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </SubCard>
              </Grid>

              {/* Properties */}
              {selectedTriple.properties && Object.keys(selectedTriple.properties).length > 0 && (
                <Grid item xs={12}>
                  <SubCard title="Properties">
                    <List dense>
                      {Object.entries(selectedTriple.properties).map(([key, value]) => (
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

              {/* Associated Chunks */}
              {tripleChunks.length > 0 && (
                <Grid item xs={12}>
                  <SubCard title={`Associated Chunks (${tripleChunks.length})`}>
                    <Accordion>
                      {tripleChunks.map((chunk, index) => (
                        <Accordion key={index}>
                          <AccordionSummary expandIcon={<IconChevronDown />}>
                            <Typography>
                              Chunk {index + 1} - {chunk.data_type}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {typeof chunk.content === 'string' 
                                ? chunk.content 
                                : JSON.stringify(chunk.content, null, 2)}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Accordion>
                  </SubCard>
                </Grid>
              )}

              {/* Metadata */}
              <Grid item xs={12}>
                <SubCard title="Metadata">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Triple ID</Typography>
                      <Typography variant="body2">{selectedTriple._id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Graph</Typography>
                      <Typography variant="body2">{getGraphName(selectedTriple.graph)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Created</Typography>
                      <Typography variant="body2">{formatDate(selectedTriple.created_at)}</Typography>
                    </Grid>
                  </Grid>
                </SubCard>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
