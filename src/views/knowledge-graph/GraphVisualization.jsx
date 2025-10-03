import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';

// material-ui
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';

// icons
import {
  IconArrowLeft,
  IconRefresh,
  IconDatabase,
  IconSchema,
  IconNetwork,
  IconCube,
  IconLink,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconWorld,
  IconLock,
  IconDownload,
  IconSearch,
  IconPlus,
  IconMerge,
  IconTrash
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { graphAPI } from 'api/graphAPI';

// ==============================|| GRAPH VISUALIZATION ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`graph-tabpanel-${index}`}
      aria-labelledby={`graph-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function GraphVisualization() {
  const { graphId } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [graph, setGraph] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [triples, setTriples] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [queryDialog, setQueryDialog] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    fetchGraphData();
  }, [graphId]);

  useEffect(() => {
    if (nodes.length > 0 && triples.length > 0) {
      drawVisualization();
    }
  }, [nodes, triples, tabValue]);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch graph details
      const graphResponse = await graphAPI.getGraph(graphId);
      if (graphResponse.graphs && graphResponse.graphs.length > 0) {
        setGraph(graphResponse.graphs[0]);
      }

      // Fetch nodes
      const nodesResponse = await graphAPI.getGraphNodes(graphId);
      setNodes(nodesResponse.nodes || []);

      // Fetch triples
      const triplesResponse = await graphAPI.getGraphTriples(graphId);
      setTriples(triplesResponse.triples || []);

      // Fetch relations
      const relationsResponse = await graphAPI.getGraphRelations(graphId);
      setRelations(relationsResponse.relations || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch graph data');
    } finally {
      setLoading(false);
    }
  };

  const drawVisualization = () => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 900;
    const height = 600;
    const nodeRadius = 25;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Prepare nodes data
    const nodesData = nodes.map(node => ({
      id: node._id,
      label: node.name || node.value || 'Unknown',
      type: node.type || 'default',
      properties: node.properties || {},
      x: Math.random() * width,
      y: Math.random() * height
    }));

    // Prepare links data
    const linksData = triples.map(triple => ({
      source: triple.head_node,
      target: triple.tail_node,
      relation: triple.type || 'related',
      properties: triple.properties || {},
      id: triple._id
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodesData)
      .force('link', d3.forceLink(linksData)
        .id(d => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(nodeRadius + 10));

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const container = svg.append('g');

    // Add arrow markers
    container.append('defs').selectAll('marker')
      .data(['arrow'])
      .join('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', nodeRadius + 5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#666')
      .attr('d', 'M0,-5L10,0L0,5');

    // Create link elements
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Create link labels
    const linkLabel = container.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(linksData)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => d.relation);

    // Create node groups
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodesData)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      });

    // Add circles for nodes
    node.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => {
        // Color based on node type
        const colors = {
          'Person': '#1e88e5',
          'Organization': '#43a047',
          'Location': '#e53935',
          'default': '#757575'
        };
        return colors[d.type] || colors.default;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels for nodes
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '11px')
      .text(d => {
        const label = d.label;
        return label.length > 10 ? label.substring(0, 10) + '...' : label;
      });

    // Add tooltips
    node.append('title')
      .text(d => `${d.label}\nType: ${d.type}\nProperties: ${JSON.stringify(d.properties)}`);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNodes(prev => {
      const isSelected = prev.some(n => n.id === node.id);
      if (isSelected) {
        return prev.filter(n => n.id !== node.id);
      } else {
        return [...prev, node];
      }
    });
  };

  const handleMergeNodes = async () => {
    if (selectedNodes.length < 2 || !mergeTarget) return;

    try {
      const fromNodes = selectedNodes
        .filter(n => n.id !== mergeTarget)
        .map(n => n.id);

      await graphAPI.mergeNodes(graphId, {
        from_nodes: fromNodes,
        to_node: mergeTarget,
        save_as_rule: false
      });

      setMergeDialogOpen(false);
      setSelectedNodes([]);
      fetchGraphData();
    } catch (err) {
      setError(err.message || 'Merge failed');
    }
  };

  const handleQuery = async () => {
    try {
      const result = await graphAPI.queryGraph(graphId, {
        query: queryText,
        return_answer: true,
        include_chunks: false
      });
      setQueryResult(result);
    } catch (err) {
      setError(err.message || 'Query failed');
    }
  };

  const handleExportCypher = async () => {
    try {
      const result = await graphAPI.exportGraphToCypher(graphId);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <MainCard>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/knowledge-graph/graphs')} sx={{ mt: 2 }}>
          Back to Graphs
        </Button>
      </MainCard>
    );
  }

  if (!graph) {
    return (
      <MainCard>
        <Alert severity="warning">Graph not found</Alert>
        <Button onClick={() => navigate('/knowledge-graph/graphs')} sx={{ mt: 2 }}>
          Back to Graphs
        </Button>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate('/knowledge-graph/graphs')} size="small">
            <IconArrowLeft />
          </IconButton>
          <Typography variant="h3">{graph.name}</Typography>
          {graph.public ? (
            <Chip label="Public" icon={<IconWorld size={14} />} size="small" color="primary" />
          ) : (
            <Chip label="Private" icon={<IconLock size={14} />} size="small" />
          )}
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1}>
          <Chip
            label={graph.workspace?.name || 'Workspace'}
            icon={<IconDatabase size={14} />}
            size="small"
          />
          {graph.schema && (
            <Chip
              label={graph.schema.name || 'Schema'}
              icon={<IconSchema size={14} />}
              size="small"
              variant="outlined"
            />
          )}
          <IconButton onClick={fetchGraphData} size="small" color="primary">
            <IconRefresh />
          </IconButton>
          <IconButton onClick={handleExportCypher} size="small">
            <Tooltip title="Export as Cypher">
              <IconDownload />
            </Tooltip>
          </IconButton>
        </Stack>
      }
    >
      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconCube size={24} />
                <Box>
                  <Typography variant="h3">{nodes.length}</Typography>
                  <Typography variant="caption">Nodes</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconLink size={24} />
                <Box>
                  <Typography variant="h3">{triples.length}</Typography>
                  <Typography variant="caption">Relationships</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconNetwork size={24} />
                <Box>
                  <Typography variant="h3">{relations.length}</Typography>
                  <Typography variant="caption">Relation Types</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<IconSearch />}
                  onClick={() => setQueryDialog(true)}
                >
                  Query Graph
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Visualization" />
          <Tab label="Nodes" />
          <Tab label="Relationships" />
          <Tab label="Advanced" />
        </Tabs>
      </Box>

      {/* Visualization Tab */}
      <TabPanel value={tabValue} index={0}>
        <SubCard>
          {selectedNodes.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedNodes.length} nodes selected. 
              {selectedNodes.length >= 2 && (
                <Button
                  size="small"
                  startIcon={<IconMerge />}
                  onClick={() => setMergeDialogOpen(true)}
                  sx={{ ml: 2 }}
                >
                  Merge Nodes
                </Button>
              )}
            </Alert>
          )}
          
          <Paper 
            elevation={0} 
            sx={{ 
              border: '1px solid', 
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'background.default'
            }}
          >
            <svg ref={svgRef}></svg>
          </Paper>
          
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            Drag to pan, scroll to zoom, click nodes to select them.
          </Typography>
        </SubCard>
      </TabPanel>

      {/* Nodes Tab */}
      <TabPanel value={tabValue} index={1}>
        <SubCard title={`Nodes (${nodes.length})`}>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {nodes.map((node, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={node.name || node.value}
                  secondary={
                    <Box>
                      <Typography variant="caption">Type: {node.type || 'Unknown'}</Typography>
                      {node.properties && Object.keys(node.properties).length > 0 && (
                        <Typography variant="caption" display="block">
                          Properties: {JSON.stringify(node.properties)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </SubCard>
      </TabPanel>

      {/* Relationships Tab */}
      <TabPanel value={tabValue} index={2}>
        <SubCard title={`Relationships (${triples.length})`}>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {triples.map((triple, index) => {
              const headNode = nodes.find(n => n._id === triple.head_node);
              const tailNode = nodes.find(n => n._id === triple.tail_node);
              
              return (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Typography>
                        <strong>{headNode?.name || 'Unknown'}</strong>
                        {' → '}
                        <em>{triple.type}</em>
                        {' → '}
                        <strong>{tailNode?.name || 'Unknown'}</strong>
                      </Typography>
                    }
                    secondary={
                      triple.properties && Object.keys(triple.properties).length > 0 && (
                        <Typography variant="caption">
                          Properties: {JSON.stringify(triple.properties)}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </SubCard>
      </TabPanel>

      {/* Advanced Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SubCard title="Relation Types">
              <List>
                {relations.map((relation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={relation} />
                  </ListItem>
                ))}
              </List>
            </SubCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SubCard title="Graph Metadata">
              <Typography variant="body2">
                <strong>ID:</strong> {graph._id}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {graph.status}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {new Date(graph.created_at).toLocaleString()}
              </Typography>
              {graph.updated_at && (
                <Typography variant="body2">
                  <strong>Updated:</strong> {new Date(graph.updated_at).toLocaleString()}
                </Typography>
              )}
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Merge Nodes Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)}>
        <DialogTitle>Merge Selected Nodes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select the target node to merge all selected nodes into:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Target Node</InputLabel>
            <Select
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              label="Target Node"
            >
              {selectedNodes.map((node) => (
                <MenuItem key={node.id} value={node.id}>
                  {node.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMergeNodes} variant="contained" disabled={!mergeTarget}>
            Merge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Query Dialog */}
      <Dialog open={queryDialog} onClose={() => setQueryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Query Graph</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Enter your query"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            sx={{ mb: 2, mt: 2 }}
          />
          
          {queryResult && (
            <Alert severity="success">
              <Typography variant="body1">
                {queryResult.answer || 'Query processed successfully'}
              </Typography>
              {queryResult.nodes && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Found {queryResult.nodes.length} relevant nodes
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryDialog(false)}>Close</Button>
          <Button onClick={handleQuery} variant="contained" disabled={!queryText}>
            Query
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
