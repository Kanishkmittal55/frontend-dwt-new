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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Grid
} from '@mui/material';

// icons
import {
  IconArrowLeft,
  IconRefresh,
  IconChevronDown,
  IconCube,
  IconLink,
  IconArrowRight,
  IconDatabase
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { schemaAPI } from 'api/schemaAPI';

// ==============================|| SCHEMA VISUALIZATION ||============================== //

export default function SchemaVisualization() {
  const { schemaId } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchema();
  }, [schemaId]);

  useEffect(() => {
    if (schema) {
      drawVisualization();
    }
  }, [schema]);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schemaAPI.getSchema(schemaId);
      if (response.schemas && response.schemas.length > 0) {
        setSchema(response.schemas[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  };

  const drawVisualization = () => {
    if (!schema || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 800;
    const height = 600;
    const nodeRadius = 40;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create nodes data from entities
    const nodes = schema.entities.map((entity, i) => ({
      id: entity.name,
      label: entity.name,
      description: entity.description,
      type: 'entity',
      x: (width / (schema.entities.length + 1)) * (i + 1),
      y: height / 2
    }));

    // Create links data from patterns
    const links = schema.patterns.map(pattern => ({
      source: pattern.head.name || pattern.head,
      target: pattern.tail.name || pattern.tail,
      relation: pattern.relation.name || pattern.relation,
      description: pattern.description
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(nodeRadius + 10));

    // Add arrow markers for directed edges
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .join('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', nodeRadius + 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#999')
      .attr('d', 'M0,-5L10,0L0,5');

    // Create link elements
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Create link labels
    const linkLabel = svg.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(d => d.relation);

    // Create node groups
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', '#1e88e5')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels for nodes
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(d => d.label);

    // Add tooltips
    node.append('title')
      .text(d => `${d.label}\n${d.description || 'No description'}`);

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
        <Button onClick={() => navigate('/knowledge-graph/schemas')} sx={{ mt: 2 }}>
          Back to Schemas
        </Button>
      </MainCard>
    );
  }

  if (!schema) {
    return (
      <MainCard>
        <Alert severity="warning">Schema not found</Alert>
        <Button onClick={() => navigate('/knowledge-graph/schemas')} sx={{ mt: 2 }}>
          Back to Schemas
        </Button>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate('/knowledge-graph/schemas')} size="small">
            <IconArrowLeft />
          </IconButton>
          <Typography variant="h3">Schema: {schema.name}</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1}>
          <Chip
            label={schema.workspace?.name || 'Workspace'}
            icon={<IconDatabase size={14} />}
            size="small"
          />
          <IconButton onClick={fetchSchema} size="small" color="primary">
            <IconRefresh />
          </IconButton>
        </Stack>
      }
    >
      <Grid container spacing={3}>
        {/* Visualization Section */}
        <Grid item xs={12} lg={8}>
          <SubCard title="Schema Visualization">
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
              Drag nodes to reposition them. Arrows indicate relationship directions.
            </Typography>
          </SubCard>
        </Grid>

        {/* Details Section */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Statistics */}
            <SubCard>
              <Stack direction="row" spacing={2} justifyContent="space-around">
                <Box textAlign="center">
                  <IconCube size={24} />
                  <Typography variant="h4">{schema.entities?.length || 0}</Typography>
                  <Typography variant="caption">Entities</Typography>
                </Box>
                <Box textAlign="center">
                  <IconLink size={24} />
                  <Typography variant="h4">{schema.relations?.length || 0}</Typography>
                  <Typography variant="caption">Relations</Typography>
                </Box>
                <Box textAlign="center">
                  <IconArrowRight size={24} />
                  <Typography variant="h4">{schema.patterns?.length || 0}</Typography>
                  <Typography variant="caption">Patterns</Typography>
                </Box>
              </Stack>
            </SubCard>

            {/* Entities List */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography variant="h5">
                  <IconCube size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Entities
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {schema.entities.map((entity, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={entity.name}
                        secondary={entity.description || 'No description'}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Relations List */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography variant="h5">
                  <IconLink size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Relations
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {schema.relations.map((relation, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={relation.name}
                        secondary={relation.description || 'No description'}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Patterns List */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography variant="h5">
                  <IconArrowRight size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Patterns
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {schema.patterns.map((pattern, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            <strong>{pattern.head?.name || pattern.head}</strong>
                            {' → '}
                            <em>{pattern.relation?.name || pattern.relation}</em>
                            {' → '}
                            <strong>{pattern.tail?.name || pattern.tail}</strong>
                          </Typography>
                        }
                        secondary={pattern.description || 'No description'}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
}
