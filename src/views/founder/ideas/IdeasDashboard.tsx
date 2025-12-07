/**
 * Ideas Dashboard
 * Main view for managing and reviewing business ideas
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Snackbar from '@mui/material/Snackbar';

// Icons
import { 
  IconBulb, 
  IconPlus, 
  IconFileText, 
  IconRefresh,
  IconLayoutGrid,
  IconList
} from '@tabler/icons-react';

// Components
import MainCard from 'ui-component/cards/MainCard';
import IdeaCard from './components/IdeaCard';
import ScribeOcrDialog from './components/ScribeOcrDialog';
import IdeaSubmitDialog from './IdeaSubmitDialog';
import IdeaDetailDialog from './IdeaDetailDialog';

// API & Context
import { 
  getPendingIdeas, 
  approveIdea, 
  rejectIdea, 
  deferIdea,
  type IdeaResponse 
} from 'api/founder/ideasAPI';
import { getStoredUserId } from 'api/founder/founderClient';
import { useFounder } from 'contexts/FounderContext';

// ============================================================================
// Types
// ============================================================================

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected' | 'deferred';
type ViewMode = 'grid' | 'list';

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 12;

const TAB_FILTERS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All Ideas' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deferred', label: 'Deferred' }
];

// ============================================================================
// Component
// ============================================================================

export default function IdeasDashboard() {
  const navigate = useNavigate();
  const { founderProfile, isProfileLoading } = useFounder();

  // State
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog state
  const [showOcrDialog, setShowOcrDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaResponse | null>(null);
  const [ocrText, setOcrText] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get user ID
  const userId = getStoredUserId();

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    console.log('[IdeasDashboard] fetchIdeas called', { userId, page, filterTab });
    
    if (!userId) {
      console.log('[IdeasDashboard] No userId, setting error');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      console.log('[IdeasDashboard] Calling API', { userId, limit: ITEMS_PER_PAGE, offset });
      
      const response = await getPendingIdeas(userId, ITEMS_PER_PAGE, offset);
      
      console.log('[IdeasDashboard] API Response:', {
        total: response.total,
        ideasCount: response.ideas.length,
        ideas: response.ideas.map(i => ({ 
          id: i.id, 
          title: i.title, 
          workflow_stage: i.workflow_stage,
          review_decision: i.review_decision
        }))
      });
      
      // Apply client-side filter based on tab
      let filteredIdeas = response.ideas;
      if (filterTab !== 'all') {
        filteredIdeas = response.ideas.filter(idea => {
          switch (filterTab) {
            case 'pending':
              return idea.workflow_stage === 'ready_for_review' || idea.workflow_stage === 'enriched';
            case 'approved':
              return idea.workflow_stage === 'approved' || idea.review_decision === 'approved';
            case 'rejected':
              return idea.workflow_stage === 'rejected' || idea.review_decision === 'rejected';
            case 'deferred':
              return idea.workflow_stage === 'deferred' || idea.review_decision === 'deferred';
            default:
              return true;
          }
        });
      }

      console.log('[IdeasDashboard] After filter:', { filteredCount: filteredIdeas.length });
      
      setIdeas(filteredIdeas);
      setTotalItems(response.total);
    } catch (err) {
      console.error('[IdeasDashboard] Error fetching ideas:', err);
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  }, [userId, page, filterTab]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Redirect if no profile
  useEffect(() => {
    if (!isProfileLoading && !founderProfile) {
      navigate('/founder/onboarding');
    }
  }, [isProfileLoading, founderProfile, navigate]);

  // Handle view idea - open detail dialog
  const handleViewIdea = useCallback((idea: IdeaResponse) => {
    setSelectedIdea(idea);
    setShowDetailDialog(true);
  }, []);

  // Handle detail dialog close
  const handleDetailDialogClose = useCallback(() => {
    setShowDetailDialog(false);
    setSelectedIdea(null);
  }, []);

  // Handle review submitted from detail dialog
  const handleReviewSubmitted = useCallback(() => {
    setSnackbar({ open: true, message: 'Review submitted successfully!', severity: 'success' });
    fetchIdeas();
  }, [fetchIdeas]);

  // Handle quick approve
  const handleApprove = useCallback(async (idea: IdeaResponse) => {
    if (!userId) return;
    try {
      await approveIdea(userId, idea.uuid);
      setSnackbar({ open: true, message: 'Idea approved!', severity: 'success' });
      fetchIdeas();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to approve idea', severity: 'error' });
    }
  }, [userId, fetchIdeas]);

  // Handle quick reject
  const handleReject = useCallback(async (idea: IdeaResponse) => {
    if (!userId) return;
    try {
      await rejectIdea(userId, idea.uuid);
      setSnackbar({ open: true, message: 'Idea rejected', severity: 'success' });
      fetchIdeas();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to reject idea', severity: 'error' });
    }
  }, [userId, fetchIdeas]);

  // Handle quick defer
  const handleDefer = useCallback(async (idea: IdeaResponse) => {
    if (!userId) return;
    try {
      await deferIdea(userId, idea.uuid);
      setSnackbar({ open: true, message: 'Idea deferred', severity: 'success' });
      fetchIdeas();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to defer idea', severity: 'error' });
    }
  }, [userId, fetchIdeas]);

  // Handle OCR text extraction
  const handleOcrTextExtracted = useCallback((text: string) => {
    setOcrText(text);
    setShowOcrDialog(false);
    setShowSubmitDialog(true);
  }, []);

  // Handle submit success
  const handleSubmitSuccess = useCallback(() => {
    setShowSubmitDialog(false);
    setOcrText('');
    setSnackbar({ open: true, message: 'Idea submitted successfully!', severity: 'success' });
    fetchIdeas();
  }, [fetchIdeas]);

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Loading state
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
          <IconBulb size={32} />
          <Typography variant="h3">Ideas</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={18} />}
            onClick={fetchIdeas}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<IconFileText size={18} />}
            onClick={() => setShowOcrDialog(true)}
          >
            Extract from PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => setShowSubmitDialog(true)}
          >
            Submit New Idea
          </Button>
        </Box>
      </Box>

      {/* Filter Tabs and View Toggle */}
      <MainCard sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Tabs
            value={filterTab}
            onChange={(_, value) => { setFilterTab(value); setPage(1); }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TAB_FILTERS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="grid">
              <IconLayoutGrid size={18} />
            </ToggleButton>
            <ToggleButton value="list">
              <IconList size={18} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </MainCard>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <IconBulb size={64} color="#9e9e9e" />
            <Typography variant="h5" sx={{ mt: 2 }}>
              No ideas yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Submit your first idea to get started with market research and validation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<IconFileText size={18} />}
                onClick={() => setShowOcrDialog(true)}
              >
                Extract from PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => setShowSubmitDialog(true)}
              >
                Submit New Idea
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Ideas Grid/List */}
      {!loading && ideas.length > 0 && (
        <>
          <Grid container spacing={3}>
            {ideas.map((idea) => (
              <Grid 
                size={{ 
                  xs: 12, 
                  sm: viewMode === 'grid' ? 6 : 12, 
                  md: viewMode === 'grid' ? 4 : 12 
                }} 
                key={idea.uuid}
              >
                <IdeaCard
                  idea={idea}
                  onView={handleViewIdea}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDefer={handleDefer}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* ScribeOCR Dialog */}
      <ScribeOcrDialog
        open={showOcrDialog}
        onClose={() => setShowOcrDialog(false)}
        onTextExtracted={handleOcrTextExtracted}
      />

      {/* Submit Idea Dialog */}
      <IdeaSubmitDialog
        open={showSubmitDialog}
        onClose={() => { setShowSubmitDialog(false); setOcrText(''); }}
        onSuccess={handleSubmitSuccess}
        initialDescription={ocrText}
      />

      {/* Idea Detail Dialog */}
      <IdeaDetailDialog
        open={showDetailDialog}
        idea={selectedIdea}
        onClose={handleDetailDialogClose}
        onReviewSubmitted={handleReviewSubmitted}
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

