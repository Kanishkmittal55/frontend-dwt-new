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
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

// icons
import {
  IconPlus,
  IconTrash,
  IconRefresh,
  IconArrowMerge,
  IconDatabase,
  IconCube,
  IconArrowRight
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { ruleAPI } from 'api/ruleAPI';
import { workspaceAPI } from 'api/workspaceAPI';

// ==============================|| RULES LIST ||============================== //

export default function RulesList() {
  const [rules, setRules] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    workspace: '',
    from_node_names: [],
    to_node_name: '',
    node_type: ''
  });
  const [fromNodeInput, setFromNodeInput] = useState('');

  useEffect(() => {
    fetchRules();
    fetchWorkspaces();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ruleAPI.getRules();
      setRules(response.rules || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch rules');
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
      workspace: '',
      from_node_names: [],
      to_node_name: '',
      node_type: ''
    });
    setFromNodeInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddFromNode = () => {
    if (fromNodeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        from_node_names: [...prev.from_node_names, fromNodeInput.trim()]
      }));
      setFromNodeInput('');
    }
  };

  const handleRemoveFromNode = (index) => {
    setFormData(prev => ({
      ...prev,
      from_node_names: prev.from_node_names.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.workspace || !formData.to_node_name || !formData.node_type || formData.from_node_names.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);
    try {
      await ruleAPI.createRule({
        workspace: formData.workspace,
        rule: {
          rule_type: 'merge_nodes',
          from_node_names: formData.from_node_names,
          to_node_name: formData.to_node_name,
          node_type: formData.node_type
        }
      });
      handleCloseDialog();
      fetchRules();
    } catch (err) {
      setError(err.message || 'Failed to create rule');
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    
    setError(null);
    try {
      await ruleAPI.deleteRule(ruleId);
      fetchRules();
    } catch (err) {
      setError(err.message || 'Failed to delete rule');
    }
  };

  const getWorkspaceName = (workspaceId) => {
    const workspace = workspaces.find(ws => ws._id === workspaceId);
    return workspace?.name || 'Unknown';
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
      title="Merge Rules"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={handleOpenDialog}
            size="small"
          >
            Create Rule
          </Button>
          <IconButton onClick={fetchRules} size="small" color="primary">
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
          {rules.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconArrowMerge size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  No Rules Created
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create merge rules to automatically combine duplicate nodes
                </Typography>
              </Box>
            </Grid>
          ) : (
            rules.map((rule) => (
              <Grid item xs={12} md={6} lg={4} key={rule._id}>
                <SubCard>
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Rule Type */}
                      <Chip
                        icon={<IconArrowMerge size={14} />}
                        label="Merge Nodes Rule"
                        color="primary"
                        size="small"
                      />

                      {/* Workspace */}
                      <Box>
                        <Chip
                          icon={<IconDatabase size={14} />}
                          label={getWorkspaceName(rule.workspace_id)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* Rule Details */}
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Merge Pattern:
                        </Typography>
                        
                        <Stack spacing={1}>
                          <Box>
                            <Typography variant="caption" color="textSecondary">From:</Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {rule.rule.from_node_names.map((name, idx) => (
                                <Chip key={idx} label={name} size="small" />
                              ))}
                            </Stack>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconArrowRight size={20} />
                          </Box>

                          <Box>
                            <Typography variant="caption" color="textSecondary">To:</Typography>
                            <Chip 
                              label={rule.rule.to_node_name} 
                              size="small" 
                              color="secondary" 
                            />
                          </Box>

                          <Box>
                            <Typography variant="caption" color="textSecondary">Type:</Typography>
                            <Chip 
                              icon={<IconCube size={14} />}
                              label={rule.rule.node_type} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Stack>
                      </Paper>

                      <Typography variant="caption" color="textSecondary">
                        Created: {formatDate(rule.created_at)}
                      </Typography>
                    </Stack>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<IconTrash />}
                      onClick={() => handleDelete(rule._id)}
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

      {/* Create Rule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Merge Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                This rule will automatically merge nodes with the specified names into a single node.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Workspace *</InputLabel>
                <Select
                  value={formData.workspace}
                  onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
                  label="Workspace *"
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
              <Typography variant="subtitle2" gutterBottom>
                Nodes to Merge (From) *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Node Name"
                  size="small"
                  value={fromNodeInput}
                  onChange={(e) => setFromNodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFromNode())}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddFromNode}
                  disabled={!fromNodeInput.trim()}
                >
                  Add
                </Button>
              </Box>
              {formData.from_node_names.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {formData.from_node_names.map((name, index) => (
                    <Chip
                      key={index}
                      label={name}
                      onDelete={() => handleRemoveFromNode(index)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Merge To Node Name *"
                value={formData.to_node_name}
                onChange={(e) => setFormData({ ...formData, to_node_name: e.target.value })}
                placeholder="e.g., Apple Inc."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Node Type *"
                value={formData.node_type}
                onChange={(e) => setFormData({ ...formData, node_type: e.target.value })}
                placeholder="e.g., Organization, Person"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={
              !formData.workspace || 
              !formData.to_node_name || 
              !formData.node_type || 
              formData.from_node_names.length === 0
            }
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
