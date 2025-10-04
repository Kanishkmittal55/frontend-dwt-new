import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography,
  Stack,
  Box,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  IconFile,
  IconFileText,
  IconSchema,
  IconNetwork,
  IconArrowLeft
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { useWorkspace } from 'contexts/WorkspaceContext';

export default function WorkspaceDetail() {
  const navigate = useNavigate();
  const { workspace, stats, loading, error } = useWorkspace();

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
      </MainCard>
    );
  }

  if (!workspace) {
    return (
      <MainCard>
        <Alert severity="warning">Workspace not found</Alert>
      </MainCard>
    );
  }

  const cards = [
    {
      title: 'Documents',
      count: stats?.documents || 0,
      icon: IconFile,
      path: 'documents',
      color: '#1e88e5'
    },
    {
      title: 'Chunks',
      count: stats?.chunks || 0,
      icon: IconFileText,
      path: 'chunks',
      color: '#43a047'
    },
    {
      title: 'Schemas',
      count: stats?.schemas || 0,
      icon: IconSchema,
      path: 'schemas',
      color: '#fb8c00'
    },
    {
      title: 'Graphs',
      count: stats?.graphs || 0,
      icon: IconNetwork,
      path: 'graphs',
      color: '#e53935'
    }
  ];

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate('/knowledge-graph/workspaces')} size="small">
            <IconArrowLeft />
          </IconButton>
          <Typography variant="h3">{workspace.name}</Typography>
        </Stack>
      }
    >
      {workspace.description && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {workspace.description}
        </Typography>
      )}

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ color: card.color }}>
                    <card.icon size={32} />
                  </Box>
                  <Typography variant="h2">{card.count}</Typography>
                  <Typography variant="h5" color="textSecondary">
                    {card.title}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </MainCard>
  );
}