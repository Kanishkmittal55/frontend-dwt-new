import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconDatabase } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { workspaceAPI } from 'api/workspaceAPI';
import type { Workspace } from 'types/workspace';

export default function WorkspaceList() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

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
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (workspace: Workspace | null = null) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDelete = async (workspaceId: string) => {
    if (!window.confirm('Are you sure you want to delete this workspace?')) {
      return;
    }
    
    setError(null);
    try {
      await workspaceAPI.deleteWorkspace(workspaceId);
      fetchWorkspaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
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
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => navigate(`/knowledge-graph/workspaces/${workspace._id}`)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h4">{workspace.name}</Typography>
                      
                      <Typography variant="body2" color="textSecondary">
                        {workspace.description || 'No description'}
                      </Typography>

                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption">
                          {workspace.documents?.length || 0} docs
                        </Typography>
                        <Typography variant="caption">
                          {workspace.graphs?.length || 0} graphs
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(workspace)}
                        >
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(workspace._id)}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

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
            sx={{ mt: 1, mb: 2 }}
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