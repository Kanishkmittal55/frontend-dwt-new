/**
 * Library Dashboard
 * Data source management for automated idea generation
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Skeleton from '@mui/material/Skeleton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';

// Icons
import { 
  IconBooks, 
  IconPlus,
  IconLink,
  IconRefresh,
  IconBulb,
  IconRocket
} from '@tabler/icons-react';

// Components
import AddUrlDialog from './components/AddUrlDialog';
import UrlSourceCard from './components/UrlSourceCard';
import TrendsChart from './components/TrendsChart';

// API & Context
import { 
  libraryAPI, 
  type UrlSource 
} from '@/api/founder/libraryAPI';
import { getStoredUserId } from '@/api/founder/founderClient';
import { useFounder } from '@/contexts/FounderContext';

// ============================================================================
// Component
// ============================================================================

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { founderProfile, isProfileLoading } = useFounder();
  
  // State
  const [sources, setSources] = useState<UrlSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const userId = getStoredUserId();

  // Fetch sources
  const fetchSources = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await libraryAPI.getUrlSources(userId);
      setSources(response.sources);
    } catch (err) {
      setError('Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Redirect if no profile
  useEffect(() => {
    if (!isProfileLoading && !founderProfile) {
      navigate('/founder/onboarding');
    }
  }, [isProfileLoading, founderProfile, navigate]);

  // Handle adding URLs
  const handleAddUrls = async (urls: string[]) => {
    if (!userId) return;
    
    try {
      const newSources = await libraryAPI.addUrlSources(userId, urls);
      setSources(prev => [...newSources, ...prev]);
      setSnackbar({ open: true, message: `Added ${urls.length} URL(s) to library`, severity: 'success' });
      
      // Start processing
      await processUrls(newSources);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add URLs', severity: 'error' });
      throw err;
    }
  };

  // Process URLs
  const processUrls = async (sourcesToProcess: UrlSource[]) => {
    if (!userId) return;

    // Update status to processing
    for (const source of sourcesToProcess) {
      await libraryAPI.updateSourceStatus(userId, source.id, 'processing');
    }
    
    // Refresh to show processing state
    fetchSources();

    try {
      // Submit to scraper
      await libraryAPI.submitUrlsForScraping(
        userId, 
        sourcesToProcess.map(s => s.url)
      );
      
      // Simulate completion after delay (replace with actual polling/webhooks)
      setTimeout(async () => {
        for (const source of sourcesToProcess) {
          await libraryAPI.updateSourceStatus(userId, source.id, 'completed');
        }
        fetchSources();
        setSnackbar({ 
          open: true, 
          message: 'URLs processed! Check Ideas for new suggestions.', 
          severity: 'success' 
        });
      }, 5000);
      
    } catch (err) {
      for (const source of sourcesToProcess) {
        await libraryAPI.updateSourceStatus(userId, source.id, 'failed', 'Processing failed');
      }
      fetchSources();
    }
  };

  // Handle delete
  const handleDelete = async (sourceId: string) => {
    if (!userId) return;
    
    await libraryAPI.deleteUrlSource(userId, sourceId);
    setSources(prev => prev.filter(s => s.id !== sourceId));
    setSnackbar({ open: true, message: 'Source deleted', severity: 'success' });
  };

  // Handle retry
  const handleRetry = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      await processUrls([source]);
    }
  };

  // Filter sources by tab
  const filteredSources = sources.filter(s => {
    if (activeTab === 0) return true; // All
    if (activeTab === 1) return s.status === 'pending' || s.status === 'processing';
    if (activeTab === 2) return s.status === 'completed';
    if (activeTab === 3) return s.status === 'failed';
    return true;
  });

  // Stats
  const stats = {
    total: sources.length,
    processing: sources.filter(s => s.status === 'pending' || s.status === 'processing').length,
    completed: sources.filter(s => s.status === 'completed').length,
    failed: sources.filter(s => s.status === 'failed').length,
    ideasGenerated: sources.reduce((sum, s) => sum + s.ideas_generated, 0)
  };

  if (isProfileLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={60} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconBooks size={32} />
          <Typography variant="h3">URL Library</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={18} />}
            onClick={fetchSources}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => setShowAddDialog(true)}
          >
            Add URLs
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconLink size={24} color="#666" />
              <Typography variant="h4" sx={{ mt: 1 }}>{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total Sources</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconRocket size={24} color="#1976d2" />
              <Typography variant="h4" sx={{ mt: 1 }}>{stats.processing}</Typography>
              <Typography variant="caption" color="text.secondary">Processing</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconBulb size={24} color="#2e7d32" />
              <Typography variant="h4" sx={{ mt: 1 }}>{stats.completed}</Typography>
              <Typography variant="caption" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconBulb size={24} color="#ed6c02" />
              <Typography variant="h4" sx={{ mt: 1 }}>{stats.ideasGenerated}</Typography>
              <Typography variant="caption" color="text.secondary">Ideas Generated</Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Trends Chart */}
      <Box sx={{ mb: 3 }}>
        <TrendsChart height={280} />
      </Box>

      {/* Tabs */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={<TabLabel label="All" count={stats.total} />} />
          <Tab label={<TabLabel label="Processing" count={stats.processing} />} />
          <Tab label={<TabLabel label="Completed" count={stats.completed} />} />
          <Tab label={<TabLabel label="Failed" count={stats.failed} />} />
        </Tabs>
      </Card>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid size={{ xs: 12 }} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && sources.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <IconLink size={64} color="#9e9e9e" />
            <Typography variant="h5" sx={{ mt: 2 }}>
              No data sources yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 400, mx: 'auto' }}>
              Add URLs from articles, blogs, and news sites. The system will automatically extract content and generate business ideas.
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => setShowAddDialog(true)}
            >
              Add Your First URLs
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sources List */}
      {!loading && filteredSources.length > 0 && (
        <Grid container spacing={2}>
          {filteredSources.map(source => (
            <Grid size={{ xs: 12 }} key={source.id}>
              <UrlSourceCard
                source={source}
                onDelete={handleDelete}
                onRetry={handleRetry}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* No results for filter */}
      {!loading && sources.length > 0 && filteredSources.length === 0 && (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No sources match this filter
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Add URL Dialog */}
      <AddUrlDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddUrls}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Tab label with count
function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {label}
      {count > 0 && (
        <Chip size="small" label={count} sx={{ height: 20, fontSize: '0.75rem' }} />
      )}
    </Box>
  );
}
