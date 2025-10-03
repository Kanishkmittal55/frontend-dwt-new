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
  Stack
} from '@mui/material';

// icons
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconDatabase } from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { workspaceAPI } from 'api/workspaceAPI';

// ==============================|| WORKSPACE LIST ||============================== //

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch workspaces on component mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workspaceAPI.getWorkspaces();
      setWorkspaces(response.workspaces || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (workspace = null) => {
    if (workspace) {
      setEditMode(true);
      setSelectedWorkspace(workspace);
      setFormData({
        name: workspace.name,
        description: workspace.description || ''
      });
    } else {
      setEditMode(false);
      setSelectedWorkspace(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', description: '' });
    setSelectedWorkspace(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (editMode && selectedWorkspace) {
        await workspaceAPI.updateWorkspace(selectedWorkspace._id, formData);
      } else {
        await workspaceAPI.createWorkspace(formData);
      }
      handleCloseDialog();
      fetchWorkspaces();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (workspaceId) => {
    if (!window.confirm('Are you sure you want to delete this workspace?')) {
      return;
    }
    
    setError(null);
    try {
      await workspaceAPI.deleteWorkspace(workspaceId);
      fetchWorkspaces();
    } catch (err) {
      setError(err.message || 'Failed to delete workspace');
    }
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
      title="Knowledge Graph Workspaces"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Create Workspace
          </Button>
          <IconButton onClick={fetchWorkspaces} size="small" color="primary">
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
          {workspaces.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <IconDatabase size={48} stroke={1} />
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  No Workspaces Found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create your first workspace to start building knowledge graphs
                </Typography>
              </Box>
            </Grid>
          ) : (
            workspaces.map((workspace) => (
              <Grid item xs={12} sm={6} md={4} key={workspace._id}>
                <SubCard>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>
                      {workspace.name}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {workspace.description || 'No description provided'}
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={`ID: ${workspace._id}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                      Created: {formatDate(workspace.created_at)}
                    </Typography>
                    
                    {workspace.updated_at && (
                      <Typography variant="caption" display="block">
                        Updated: {formatDate(workspace.updated_at)}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<IconEdit />}
                      onClick={() => handleOpenDialog(workspace)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<IconTrash />}
                      onClick={() => handleDelete(workspace._id)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Workspace' : 'Create New Workspace'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Workspace Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
