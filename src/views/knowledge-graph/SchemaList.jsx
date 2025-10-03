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
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';

// icons
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconSchema,
  IconEye,
  IconChevronDown,
  IconDatabase,
  IconArrowRight,
  IconCube,
  IconLink
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { schemaAPI } from 'api/schemaAPI';
import { workspaceAPI } from 'api/workspaceAPI';

// ==============================|| SCHEMA LIST ||============================== //

export default function SchemaList() {
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    workspace: '',
    entities: [],
    relations: [],
    patterns: []
  });

  // Fetch schemas and workspaces on component mount
  useEffect(() => {
    fetchSchemas();
    fetchWorkspaces();
  }, []);

  const fetchSchemas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schemaAPI.getSchemas();
      setSchemas(response.schemas || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch schemas');
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

  const handleOpenDialog = (schema = null) => {
    if (schema) {
      setEditMode(true);
      setSelectedSchema(schema);
      setFormData({
        name: schema.name,
        workspace: schema.workspace_id,
        entities: schema.entities || [],
        relations: schema.relations || [],
        patterns: schema.patterns || []
      });
    } else {
      setEditMode(false);
      setSelectedSchema(null);
      setFormData({
        name: '',
        workspace: '',
        entities: [{ name: '', description: '' }],
        relations: [{ name: '', description: '' }],
        patterns: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      workspace: '',
      entities: [],
      relations: [],
      patterns: []
    });
    setSelectedSchema(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEntityChange = (index, field, value) => {
    const newEntities = [...formData.entities];
    newEntities[index] = { ...newEntities[index], [field]: value };
    setFormData(prev => ({ ...prev, entities: newEntities }));
  };

  const handleRelationChange = (index, field, value) => {
    const newRelations = [...formData.relations];
    newRelations[index] = { ...newRelations[index], [field]: value };
    setFormData(prev => ({ ...prev, relations: newRelations }));
  };

  const handlePatternChange = (index, field, value) => {
    const newPatterns = [...formData.patterns];
    newPatterns[index] = { ...newPatterns[index], [field]: value };
    setFormData(prev => ({ ...prev, patterns: newPatterns }));
  };

  const addEntity = () => {
    setFormData(prev => ({
      ...prev,
      entities: [...prev.entities, { name: '', description: '' }]
    }));
  };

  const removeEntity = (index) => {
    setFormData(prev => ({
      ...prev,
      entities: prev.entities.filter((_, i) => i !== index)
    }));
  };

  const addRelation = () => {
    setFormData(prev => ({
      ...prev,
      relations: [...prev.relations, { name: '', description: '' }]
    }));
  };

  const removeRelation = (index) => {
    setFormData(prev => ({
      ...prev,
      relations: prev.relations.filter((_, i) => i !== index)
    }));
  };

  const addPattern = () => {
    if (formData.entities.length > 0 && formData.relations.length > 0) {
      setFormData(prev => ({
        ...prev,
        patterns: [...prev.patterns, { head: '', relation: '', tail: '', description: '' }]
      }));
    }
  };

  const removePattern = (index) => {
    setFormData(prev => ({
      ...prev,
      patterns: prev.patterns.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Clean up empty fields
    const cleanedData = {
      ...formData,
      entities: formData.entities.filter(e => e.name),
      relations: formData.relations.filter(r => r.name),
      patterns: formData.patterns.filter(p => p.head && p.relation && p.tail)
    };

    try {
      if (editMode && selectedSchema) {
        await schemaAPI.updateSchema(selectedSchema._id, { name: cleanedData.name });
      } else {
        await schemaAPI.createSchema(cleanedData);
      }
      handleCloseDialog();
      fetchSchemas();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (schemaId) => {
    if (!window.confirm('Are you sure you want to delete this schema? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    try {
      await schemaAPI.deleteSchema(schemaId);
      fetchSchemas();
    } catch (err) {
      setError(err.message || 'Failed to delete schema');
    }
  };

  const handleViewSchema = (schema) => {
    navigate(`/knowledge-graph/schemas/${schema._id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWorkspaceName = (workspaceId) => {
    const workspace = schemas.find(s => s._id === workspaceId)?.workspace;
    return workspace?.name || workspaceId;
  };

  return (
    <MainCard 
      title="Knowledge Graph Schemas"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Create Schema
          </Button>
          <IconButton onClick={fetchSchemas} size="small" color="primary">
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
          {schemas.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconSchema size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  No Schemas Found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create your first schema to define the structure of your knowledge graph
                </Typography>
              </Box>
            </Grid>
          ) : (
            schemas.map((schema) => (
              <Grid item xs={12} md={6} lg={4} key={schema._id}>
                <SubCard>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h4" gutterBottom>
                        {schema.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewSchema(schema)}
                        color="primary"
                      >
                        <IconEye />
                      </IconButton>
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={schema.workspace?.name || 'Unknown Workspace'} 
                        size="small" 
                        icon={<IconDatabase size={14} />}
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    {/* Schema Summary */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <Tooltip title="Entities">
                          <Chip
                            icon={<IconCube size={14} />}
                            label={schema.entities?.length || 0}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Relations">
                          <Chip
                            icon={<IconLink size={14} />}
                            label={schema.relations?.length || 0}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Patterns">
                          <Chip
                            icon={<IconArrowRight size={14} />}
                            label={schema.patterns?.length || 0}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      </Stack>
                    </Box>

                    {/* Show first few entities */}
                    {schema.entities && schema.entities.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Entities: {schema.entities.slice(0, 3).map(e => e.name).join(', ')}
                          {schema.entities.length > 3 && '...'}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                      Created: {formatDate(schema.created_at)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEye />}
                      onClick={() => handleViewSchema(schema)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<IconEdit />}
                      onClick={() => handleOpenDialog(schema)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<IconTrash />}
                      onClick={() => handleDelete(schema._id)}
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
          {editMode ? 'Edit Schema' : 'Create New Schema'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Schema Name"
                  fullWidth
                  variant="outlined"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Workspace</InputLabel>
                  <Select
                    name="workspace"
                    value={formData.workspace}
                    onChange={handleInputChange}
                    label="Workspace"
                    required
                    disabled={editMode}
                  >
                    {workspaces.map(ws => (
                      <MenuItem key={ws._id} value={ws._id}>
                        {ws.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Entities Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Entities</Divider>
                {formData.entities.map((entity, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <TextField
                      label="Entity Name"
                      value={entity.name}
                      onChange={(e) => handleEntityChange(index, 'name', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Description"
                      value={entity.description}
                      onChange={(e) => handleEntityChange(index, 'description', e.target.value)}
                      size="small"
                      sx={{ flex: 2 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeEntity(index)}
                      size="small"
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<IconPlus />}
                  onClick={addEntity}
                  size="small"
                >
                  Add Entity
                </Button>
              </Grid>

              {/* Relations Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Relations</Divider>
                {formData.relations.map((relation, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <TextField
                      label="Relation Name"
                      value={relation.name}
                      onChange={(e) => handleRelationChange(index, 'name', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Description"
                      value={relation.description}
                      onChange={(e) => handleRelationChange(index, 'description', e.target.value)}
                      size="small"
                      sx={{ flex: 2 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeRelation(index)}
                      size="small"
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<IconPlus />}
                  onClick={addRelation}
                  size="small"
                >
                  Add Relation
                </Button>
              </Grid>

              {/* Patterns Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Patterns</Divider>
                {formData.patterns.map((pattern, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Head Entity</InputLabel>
                          <Select
                            value={pattern.head}
                            onChange={(e) => handlePatternChange(index, 'head', e.target.value)}
                            label="Head Entity"
                          >
                            {formData.entities.filter(e => e.name).map((entity, i) => (
                              <MenuItem key={i} value={entity.name}>
                                {entity.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Relation</InputLabel>
                          <Select
                            value={pattern.relation}
                            onChange={(e) => handlePatternChange(index, 'relation', e.target.value)}
                            label="Relation"
                          >
                            {formData.relations.filter(r => r.name).map((relation, i) => (
                              <MenuItem key={i} value={relation.name}>
                                {relation.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Tail Entity</InputLabel>
                          <Select
                            value={pattern.tail}
                            onChange={(e) => handlePatternChange(index, 'tail', e.target.value)}
                            label="Tail Entity"
                          >
                            {formData.entities.filter(e => e.name).map((entity, i) => (
                              <MenuItem key={i} value={entity.name}>
                                {entity.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="Description"
                          value={pattern.description}
                          onChange={(e) => handlePatternChange(index, 'description', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => removePattern(index)}
                          size="small"
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button
                  startIcon={<IconPlus />}
                  onClick={addPattern}
                  size="small"
                  disabled={formData.entities.filter(e => e.name).length === 0 || formData.relations.filter(r => r.name).length === 0}
                >
                  Add Pattern
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.workspace || formData.entities.length === 0 || formData.relations.length === 0}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
