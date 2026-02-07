/**
 * Daily Tasks Dashboard
 * Revision system UI for spaced repetition learning
 */
import { useEffect, useState, useCallback } from 'react';

// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Components
import QueueStats from './components/QueueStats';
import ReviewCard, { type ReviewSubmitParams } from './components/ReviewCard';

// Hooks
import useTutorAgent, { RevisionQueueItem } from '@/hooks/useTutorAgent';

// Constants - Get API key from env, fallback to test-all-access-key (matches backend dev config)
const API_KEY = import.meta.env.VITE_API_KEY || 'test-all-access-key';
const USER_ID = 1; // TODO: Get from auth context

// ============================================================================
// Component
// ============================================================================

export default function DailyTasksDashboard() {
  // Tutor agent for WebSocket communication
  const tutor = useTutorAgent({
    apiKey: API_KEY,
    userId: USER_ID,
    autoConnect: true
  });

  // Local state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Current card being reviewed
  const currentCard = tutor.revisionQueue[currentCardIndex] || null;
  const totalCards = tutor.revisionQueue.length;
  const hasCards = totalCards > 0;

  // Load queue and stats on mount/connect
  useEffect(() => {
    if (tutor.isConnected) {
      tutor.getRevisionQueue(20);
      tutor.getRevisionStats();
    }
  }, [tutor.isConnected]);

  // Handle review result
  useEffect(() => {
    if (tutor.revisionReviewResult) {
      setCompletedCount(prev => prev + 1);
      setNotification({
        type: 'success',
        message: tutor.revisionReviewResult.message || `Next review in ${tutor.revisionReviewResult.newInterval} days`
      });
      
      // Move to next card
      if (currentCardIndex >= tutor.revisionQueue.length) {
        setCurrentCardIndex(0);
        setIsReviewing(false);
      }
      
      tutor.clearRevisionReviewResult();
    }
  }, [tutor.revisionReviewResult, currentCardIndex, tutor.revisionQueue.length]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    tutor.getRevisionQueue(20);
    tutor.getRevisionStats();
    setCurrentCardIndex(0);
    setCompletedCount(0);
  }, [tutor]);

  // Start review session
  const handleStartReview = useCallback(() => {
    setIsReviewing(true);
    setCurrentCardIndex(0);
    setReviewStartTime(Date.now());
    setCompletedCount(0);
  }, []);

  // Handle review submission with full session data (using ReviewSubmitParams from ReviewCard)
  const handleSubmitReview = useCallback((params: ReviewSubmitParams) => {
    if (!currentCard) return;
    
    tutor.submitRevisionReview({
      itemUUID: currentCard.itemUUID,
      quality: params.quality,
      timeSpentMs: params.timeSpentMs,
      timeToRevealMs: params.timeToRevealMs,
      timeToRateMs: params.timeToRateMs,
      founderAnswer: params.founderAnswer,
      confidenceBefore: params.confidenceBefore,
      confidenceAfter: params.confidenceAfter,
      hintRequested: params.hintRequested,
      gaveUp: params.gaveUp
    });
    setReviewStartTime(Date.now()); // Reset for next card
  }, [currentCard, tutor]);

  // End review session
  const handleEndSession = useCallback(() => {
    setIsReviewing(false);
    setNotification({
      type: 'info',
      message: `Session complete! Reviewed ${completedCount} cards.`
    });
    handleRefresh();
  }, [completedCount, handleRefresh]);

  // Loading state
  if (!tutor.isConnected) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Daily Review</Typography>
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            Daily Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Strengthen your understanding through spaced repetition
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={tutor.isLoadingRevision}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats */}
      <QueueStats stats={tutor.revisionStats} loading={tutor.isLoadingRevision} />

      {/* Review Session or Start Button */}
      {isReviewing && hasCards ? (
        <Box sx={{ mt: 3 }}>
          {/* Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Card {currentCardIndex + 1} of {totalCards}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed: {completedCount}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(completedCount / Math.max(totalCards, 1)) * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Current Card */}
          {currentCard ? (
            <ReviewCard
              item={currentCard}
              onSubmit={handleSubmitReview}
              loading={tutor.isLoadingRevision}
            />
          ) : (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  All done for now! 🎉
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  You've reviewed all {completedCount} cards in this session.
                </Typography>
                <Button variant="contained" onClick={handleEndSession}>
                  Finish Session
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Session Controls */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleEndSession}
              disabled={tutor.isLoadingRevision}
            >
              End Session Early
            </Button>
          </Box>
        </Box>
      ) : (
        <Card sx={{ mt: 3, textAlign: 'center', py: 4 }}>
          <CardContent>
            {hasCards ? (
              <>
                <Typography variant="h5" gutterBottom>
                  Ready to Review?
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  You have {totalCards} concepts due for review
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                  {tutor.revisionStats?.firstReviews ? (
                    <Chip 
                      icon={<AccessTimeIcon />} 
                      label={`${tutor.revisionStats.firstReviews} first reviews`}
                      color="warning"
                      size="small"
                    />
                  ) : null}
                  {tutor.revisionStats?.masteredItems ? (
                    <Chip 
                      icon={<TrendingUpIcon />} 
                      label={`${tutor.revisionStats.masteredItems} mastered`}
                      color="success"
                      size="small"
                    />
                  ) : null}
                </Stack>
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<SchoolIcon />}
                  onClick={handleStartReview}
                  disabled={tutor.isLoadingRevision}
                >
                  Start Review Session
                </Button>
              </>
            ) : tutor.isLoadingRevision ? (
              <Box>
                <Skeleton variant="text" width={200} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width={300} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="rounded" width={200} height={40} sx={{ mx: 'auto' }} />
              </Box>
            ) : (
              <>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  All caught up! 🎉
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No concepts due for review right now.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep learning and saving concepts from your courses.
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>How it works:</strong> Rate each concept based on how easily you recalled it.
          The system will schedule your next review based on your response.
        </Typography>
      </Alert>

      {/* Notification */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={notification?.type || 'info'} 
          onClose={() => setNotification(null)}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

