import { useState, useEffect } from 'react';

// material-ui
import {
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';

// icons
import {
  IconSearch,
  IconTrash,
  IconChevronDown,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
  IconRefresh,
  IconDatabase
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { queryAPI } from 'api/queryAPI';
import { graphAPI } from 'api/graphAPI';

// ==============================|| QUERY HISTORY ||============================== //

const QueryStatusChip = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
      case 'success':
        return { color: 'success', icon: <IconCircleCheck size={14} /> };
      case 'processing':
      case 'in_progress':
        return { color: 'warning', icon: <IconClock size={14} /> };
      case 'failed':
        return { color: 'error', icon: <IconAlertCircle size={14} /> };
      default:
        return { color: 'default', icon: null };
    }
  };

  const config = getStatusConfig();
  return <Chip label={status} color={config.color} icon={config.icon} size="small" />;
};

export default function QueryHistory() {
  const [queries, setQueries] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuery, setExpandedQuery] = useState(null);

  useEffect(() => {
    fetchQueries();
    fetchGraphs();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await queryAPI.getQueries();
      setQueries(response.queries || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch queries');
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

  const handleDelete = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query?')) {
      return;
    }
    
    setError(null);
    try {
      await queryAPI.deleteQuery(queryId);
      fetchQueries();
    } catch (err) {
      setError(err.message || 'Failed to delete query');
    }
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

  const formatQuery = (queryParams) => {
    if (queryParams.content) return queryParams.content;
    if (queryParams.values?.length > 0) return `Search for: ${queryParams.values.join(', ')}`;
    if (queryParams.entities?.length > 0) return `Entity search: ${queryParams.entities.join(', ')}`;
    return 'Custom query';
  };

  return (
    <MainCard 
      title="Query History"
      secondary={
        <IconButton onClick={fetchQueries} size="small" color="primary">
          <IconRefresh />
        </IconButton>
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
      ) : queries.length === 0 ? (
        <Box textAlign="center" py={4}>
          <IconSearch size={48} stroke={1} />
          <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
            No Queries Yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Query history will appear here after you run queries on your graphs
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {queries.map((query) => (
            <Grid item xs={12} key={query._id}>
              <Accordion 
                expanded={expandedQuery === query._id}
                onChange={() => setExpandedQuery(expandedQuery === query._id ? null : query._id)}
              >
                <AccordionSummary expandIcon={<IconChevronDown />}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5">
                        {formatQuery(query.query)}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip 
                          icon={<IconDatabase size={14} />} 
                          label={getGraphName(query.graph)} 
                          size="small" 
                          variant="outlined" 
                        />
                        <QueryStatusChip status={query.status} />
                        <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'center' }}>
                          {formatDate(query.created_at)}
                        </Typography>
                      </Stack>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(query._id);
                      }}
                      color="error"
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  </Stack>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {/* Query Parameters */}
                    <Grid item xs={12} md={6}>
                      <SubCard title="Query Parameters">
                        <Stack spacing={1}>
                          {query.query.content && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Content</Typography>
                              <Typography variant="body2">{query.query.content}</Typography>
                            </Box>
                          )}
                          {query.query.values?.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Values</Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {query.query.values.map((value, idx) => (
                                  <Chip key={idx} label={value} size="small" />
                                ))}
                              </Stack>
                            </Box>
                          )}
                          {query.query.entities?.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Entities</Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {query.query.entities.map((entity, idx) => (
                                  <Chip key={idx} label={entity} size="small" variant="outlined" />
                                ))}
                              </Stack>
                            </Box>
                          )}
                          {query.query.relations?.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Relations</Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {query.query.relations.map((relation, idx) => (
                                  <Chip key={idx} label={relation} size="small" color="secondary" />
                                ))}
                              </Stack>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="caption" color="textSecondary">Options</Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip 
                                label={query.query.return_answer ? 'Answer' : 'No Answer'} 
                                size="small"
                                color={query.query.return_answer ? 'success' : 'default'}
                              />
                              <Chip 
                                label={query.query.include_chunks ? 'With Chunks' : 'No Chunks'} 
                                size="small"
                                color={query.query.include_chunks ? 'primary' : 'default'}
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </SubCard>
                    </Grid>

                    {/* Response */}
                    <Grid item xs={12} md={6}>
                      <SubCard title="Response">
                        {query.response ? (
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {query.response}
                            </Typography>
                          </Paper>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No response available
                          </Typography>
                        )}
                      </SubCard>
                    </Grid>

                    {/* Results */}
                    {(query.nodes?.length > 0 || query.triples?.length > 0) && (
                      <Grid item xs={12}>
                        <SubCard title="Results">
                          <Grid container spacing={2}>
                            {query.nodes?.length > 0 && (
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Nodes ({query.nodes.length})
                                </Typography>
                                <Stack spacing={1}>
                                  {query.nodes.slice(0, 5).map((node, idx) => (
                                    <Paper key={idx} variant="outlined" sx={{ p: 1 }}>
                                      <Typography variant="body2">
                                        <strong>{node.name || node.value}</strong> ({node.type})
                                      </Typography>
                                    </Paper>
                                  ))}
                                  {query.nodes.length > 5 && (
                                    <Typography variant="caption" color="textSecondary">
                                      ...and {query.nodes.length - 5} more
                                    </Typography>
                                  )}
                                </Stack>
                              </Grid>
                            )}
                            {query.triples?.length > 0 && (
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Relationships ({query.triples.length})
                                </Typography>
                                <Stack spacing={1}>
                                  {query.triples.slice(0, 5).map((triple, idx) => (
                                    <Paper key={idx} variant="outlined" sx={{ p: 1 }}>
                                      <Typography variant="body2">
                                        {triple.head_node.name} → {triple.relation.name} → {triple.tail_node.name}
                                      </Typography>
                                    </Paper>
                                  ))}
                                  {query.triples.length > 5 && (
                                    <Typography variant="caption" color="textSecondary">
                                      ...and {query.triples.length - 5} more
                                    </Typography>
                                  )}
                                </Stack>
                              </Grid>
                            )}
                          </Grid>
                        </SubCard>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}
    </MainCard>
  );
}
