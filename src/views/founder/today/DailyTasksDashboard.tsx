/**
 * Daily Tasks Dashboard
 * Unified learning items management view with:
 * - All learning items with course/lesson/module context
 * - Filter by course
 * - Delete items
 * - Next review date, mastery state, and SM-2 stats
 * - Start review session for due items
 * - Calendar view for scheduled reviews
 */
import { useEffect, useState, useCallback, useMemo } from 'react';

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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FilterListIcon from '@mui/icons-material/FilterList';

// MUI Dialog
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import CircularProgress from '@mui/material/CircularProgress';

// Components
import ReviewCard, { type ReviewSubmitParams } from './components/ReviewCard';
import ReviewCalendar from './components/ReviewCalendar';

// Hooks
import useTutorAgent, {
  type LearningItemWithContext,
  type LearningItemDetailResponsePayload,
  type ScheduledReview,
} from '@/hooks/useTutorAgent';

// Constants
const API_KEY = import.meta.env.VITE_API_KEY || 'test-all-access-key';
const USER_ID = 1; // TODO: Get from auth context

// ============================================================================
// Helpers
// ============================================================================

/** Get a human-readable relative time for next review */
function formatNextReview(dateStr?: string): string {
  if (!dateStr) return 'Not scheduled';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
  return `In ${Math.ceil(diffDays / 30)} months`;
}

/** Get chip color for mastery state */
function masteryColor(state: string): 'default' | 'warning' | 'info' | 'success' | 'error' {
  switch (state) {
    case 'new': return 'default';
    case 'learning': return 'warning';
    case 'mastered': return 'success';
    case 'graduated': return 'info';
    default: return 'default';
  }
}

/** Get chip color for status */
function statusColor(status: string): 'default' | 'warning' | 'info' | 'success' | 'error' {
  switch (status) {
    case 'active': return 'success';
    case 'pending_review': return 'warning';
    case 'pending': return 'info';
    default: return 'default';
  }
}

/** Truncate text to a max length */
function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '…' : text;
}

/** Check if item is due today or overdue */
function isDueOrOverdue(nextReviewAt?: string): boolean {
  if (!nextReviewAt) return false;
  const reviewDate = new Date(nextReviewAt);
  const now = new Date();
  return reviewDate <= now || reviewDate.toDateString() === now.toDateString();
}

// ============================================================================
// Quality Rating Label
// ============================================================================
function qualityLabel(rating: number): { text: string; color: string } {
  switch (rating) {
    case 0: return { text: 'Blackout', color: '#f44336' };
    case 1: return { text: 'Again', color: '#f44336' };
    case 2: return { text: 'Hard', color: '#ff9800' };
    case 3: return { text: 'Good', color: '#4caf50' };
    case 4: return { text: 'Easy', color: '#2196f3' };
    case 5: return { text: 'Perfect', color: '#9c27b0' };
    default: return { text: `${rating}`, color: '#757575' };
  }
}

// ============================================================================
// Item Detail Content (rendered inside Dialog)
// ============================================================================
function ItemDetailContent({
  detail,
  onClose,
}: {
  detail: LearningItemDetailResponsePayload;
  onClose: () => void;
}) {
  const sched = detail.scheduling;

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="h6">
              {detail.item_title || truncate(detail.concept_text, 80)}
            </Typography>
            {detail.course_title && (
              <Typography variant="body2" color="text.secondary">
                {detail.course_title}
                {detail.module_title ? ` › ${detail.module_title}` : ''}
                {detail.lesson_title ? ` › ${detail.lesson_title}` : ''}
              </Typography>
            )}
          </Box>
          <Chip label={sched.mastery_state || 'new'} color={masteryColor(sched.mastery_state)} size="small" />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Concept Text */}
        {detail.concept_text && detail.concept_text !== detail.item_title && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {detail.concept_text}
            </Typography>
            {detail.annotation && (
              <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
                Note: {detail.annotation}
              </Typography>
            )}
          </Paper>
        )}

        {/* Scheduling Strategy (SM-2 Parameters) */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>Scheduling Strategy</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Mastery State</Typography>
                <Typography variant="body2" fontWeight={600}>
                  <Chip label={sched.mastery_state || 'new'} color={masteryColor(sched.mastery_state)} size="small" />
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Ease Factor</Typography>
                <Typography variant="body2" fontWeight={600}>{sched.ease_factor.toFixed(2)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Interval</Typography>
                <Typography variant="body2" fontWeight={600}>{sched.interval_days} days</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Repetitions</Typography>
                <Typography variant="body2" fontWeight={600}>{sched.repetition_count}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Reviews</Typography>
                <Typography variant="body2" fontWeight={600}>{sched.total_reviews}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Difficulty Rating</Typography>
                <Typography variant="body2" fontWeight={600}>{sched.difficulty_rating.toFixed(2)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Next Review</Typography>
                <Typography variant="body2" fontWeight={600} color={isDueOrOverdue(sched.next_review_at) ? 'error.main' : 'text.primary'}>
                  {sched.next_review_at ? formatNextReview(sched.next_review_at) : 'Not scheduled'}
                </Typography>
                {sched.next_review_at && (
                  <Typography variant="caption" color="text.disabled">
                    {new Date(sched.next_review_at).toLocaleString()}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Last Reviewed</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {sched.last_reviewed_at ? new Date(sched.last_reviewed_at).toLocaleString() : 'Never'}
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Review History */}
        <Accordion defaultExpanded={detail.reviews.length > 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <HistoryIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Review History ({detail.reviews.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {detail.reviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No review sessions yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Answer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Reveal (ms)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Hint / Gave Up</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.reviews.map((rev, idx) => {
                    const q = qualityLabel(rev.quality_rating);
                    return (
                      <TableRow key={rev.session_uuid || idx}>
                        <TableCell>{rev.session_number || idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(rev.started_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(rev.started_at).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={q.text}
                            size="small"
                            sx={{ bgcolor: q.color, color: '#fff', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {rev.founder_answer || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {rev.confidence_before > 0 || rev.confidence_after > 0 ? (
                            <Typography variant="body2">
                              {rev.confidence_before} → {rev.confidence_after}
                            </Typography>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{rev.time_to_reveal_ms || '—'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {rev.hint_requested && <Chip label="Hint" size="small" color="warning" variant="outlined" />}
                            {rev.gave_up && <Chip label="Gave Up" size="small" color="error" variant="outlined" />}
                            {!rev.hint_requested && !rev.gave_up && <Typography variant="body2" color="text.disabled">—</Typography>}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Exercises */}
        {detail.exercises.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <AssignmentIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Exercises ({detail.exercises.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {detail.exercises.map((ex, idx) => (
                  <Paper key={ex.exercise_id || idx} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip label={ex.exercise_type} size="small" color="primary" variant="outlined" />
                      <Chip label={ex.difficulty} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      {ex.statement}
                    </Typography>
                    {ex.solution && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Solution:</Typography>
                        <Typography variant="body2">{ex.solution}</Typography>
                      </Box>
                    )}
                    {ex.explanation && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Explanation:</Typography>
                        <Typography variant="body2">{ex.explanation}</Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Quizzes */}
        {detail.quizzes.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <QuizIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Quizzes ({detail.quizzes.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {detail.quizzes.map((qz, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">{qz.quiz_title || 'MCQ Quiz'}</Typography>
                      <Chip label={`${qz.question_count} questions`} size="small" variant="outlined" />
                      <Chip label={qz.difficulty} size="small" variant="outlined" />
                    </Stack>
                    {qz.questions && (() => {
                      try {
                        const questions = JSON.parse(qz.questions);
                        if (Array.isArray(questions)) {
                          return questions.map((q: any, qIdx: number) => (
                            <Box key={qIdx} sx={{ mt: 1, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
                              <Typography variant="body2" fontWeight={600}>
                                Q{qIdx + 1}: {q.question || q.mcq_question || ''}
                              </Typography>
                              {q.options && Array.isArray(q.options) && (
                                <Box sx={{ ml: 2, mt: 0.5 }}>
                                  {q.options.map((opt: string, oIdx: number) => (
                                    <Typography key={oIdx} variant="body2" color={oIdx === q.correct_idx ? 'success.main' : 'text.secondary'}>
                                      {oIdx === q.correct_idx ? '✓ ' : '  '}{String.fromCharCode(65 + oIdx)}. {opt}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          ));
                        }
                      } catch { /* ignore parse errors */ }
                      return null;
                    })()}
                  </Paper>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function DailyTasksDashboard() {
  const tutor = useTutorAgent({
    apiKey: API_KEY,
    userId: USER_ID,
    autoConnect: true
  });

  // ---- Local state ----
  const [activeTab, setActiveTab] = useState(0); // 0 = Items, 1 = Review, 2 = Calendar
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LearningItemWithContext | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Review session state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // Current card
  const currentCard = tutor.revisionQueue[currentCardIndex] || null;
  const totalCards = tutor.revisionQueue.length;

  // ---- Derived data ----
  const dueItems = useMemo(() => {
    return tutor.learningItems.filter(i => isDueOrOverdue(i.next_review_at));
  }, [tutor.learningItems]);

  const filteredItems = useMemo(() => {
    if (courseFilter === 'all') return tutor.learningItems;
    return tutor.learningItems.filter(i => i.course_uuid === courseFilter);
  }, [tutor.learningItems, courseFilter]);

  // ---- Effects ----
  useEffect(() => {
    if (tutor.isConnected) {
      tutor.getLearningItems();
      tutor.getRevisionStats();
      tutor.getRevisionQueue(20);
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
      if (currentCardIndex >= tutor.revisionQueue.length) {
        setCurrentCardIndex(0);
        setIsReviewing(false);
      }
      tutor.clearRevisionReviewResult();
    }
  }, [tutor.revisionReviewResult, currentCardIndex, tutor.revisionQueue.length]);

  // Handle delete result
  useEffect(() => {
    if (tutor.learningItemDeleteResult) {
      if (tutor.learningItemDeleteResult.success) {
        setNotification({ type: 'success', message: 'Learning item deleted.' });
      } else {
        setNotification({ type: 'error', message: 'Failed to delete item.' });
      }
      tutor.clearLearningItemDeleteResult();
    }
  }, [tutor.learningItemDeleteResult]);

  // ---- Handlers ----
  const handleRefresh = useCallback(() => {
    tutor.getLearningItems(courseFilter !== 'all' ? { courseUUID: courseFilter } : undefined);
    tutor.getRevisionStats();
    tutor.getRevisionQueue(20);
  }, [tutor, courseFilter]);

  const handleCourseFilterChange = useCallback((value: string) => {
    setCourseFilter(value);
    if (value === 'all') {
      tutor.getLearningItems();
    } else {
      tutor.getLearningItems({ courseUUID: value });
    }
  }, [tutor]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm) return;
    tutor.deleteLearningItem(deleteConfirm.item_uuid);
    setDeleteConfirm(null);
  }, [deleteConfirm, tutor]);

  const handleItemClick = useCallback((item: LearningItemWithContext) => {
    setDetailOpen(true);
    tutor.getLearningItemDetail(item.item_uuid);
  }, [tutor]);

  const handleDetailClose = useCallback(() => {
    setDetailOpen(false);
    tutor.clearLearningItemDetail();
  }, [tutor]);

  const handleStartReview = useCallback(() => {
    setActiveTab(1);
    setIsReviewing(true);
    setCurrentCardIndex(0);
    setReviewStartTime(Date.now());
    setCompletedCount(0);
  }, []);

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
    setReviewStartTime(Date.now());
  }, [currentCard, tutor]);

  const handleEndSession = useCallback(() => {
    setIsReviewing(false);
    setActiveTab(0);
    setNotification({
      type: 'info',
      message: `Session complete! Reviewed ${completedCount} cards.`
    });
    handleRefresh();
  }, [completedCount, handleRefresh]);

  const handleCalendarDateChange = useCallback((startDate: string, endDate: string) => {
    tutor.getCalendar(startDate, endDate);
  }, [tutor]);

  const handleReschedule = useCallback((slotUUID: string, newDate: string) => {
    tutor.rescheduleSlot(slotUUID, newDate);
  }, [tutor]);

  const handleScheduledReviewClick = useCallback((review: ScheduledReview) => {
    const queueItem = tutor.revisionQueue.find(item => item.itemUUID === review.itemUUID);
    if (queueItem) {
      const index = tutor.revisionQueue.indexOf(queueItem);
      setCurrentCardIndex(index);
      setActiveTab(1);
      setIsReviewing(true);
      setReviewStartTime(Date.now());
    }
  }, [tutor.revisionQueue]);

  // ---- Loading ----
  if (!tutor.isConnected) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: 3, py: 2 }}>
        <Typography variant="h4" gutterBottom>Daily Review</Typography>
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  // ---- Render ----
  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: 3, py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            Learning Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tutor.learningItemsTotal} items · {dueItems.length} due today
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {dueItems.length > 0 && activeTab !== 1 && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartReview}
              size="small"
            >
              Start Review ({dueItems.length} due)
            </Button>
          )}
          <IconButton onClick={handleRefresh} disabled={tutor.learningItemsLoading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => {
          setActiveTab(v);
          if (v === 2) tutor.getWeekSchedule();
        }}
        sx={{ mt: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All Items" icon={<ListAltIcon />} iconPosition="start" />
        <Tab
          label={`Review${totalCards > 0 ? ` (${totalCards})` : ''}`}
          icon={<AccessTimeIcon />}
          iconPosition="start"
        />
        <Tab label="Calendar" icon={<CalendarMonthIcon />} iconPosition="start" />
      </Tabs>

      {/* ================================================================== */}
      {/* TAB 0: All Learning Items */}
      {/* ================================================================== */}
      {activeTab === 0 && (
        <>
          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <FilterListIcon color="action" />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={courseFilter}
                label="Course"
                onChange={e => handleCourseFilterChange(e.target.value)}
              >
                <MenuItem value="all">All Courses</MenuItem>
                {tutor.learningItemsCourses.map(c => (
                  <MenuItem key={c.course_uuid} value={c.course_uuid}>
                    {c.course_title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredItems.length} items
            </Typography>
          </Box>

          {/* Items Table */}
          {tutor.learningItemsLoading ? (
            <Box>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : filteredItems.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No learning items yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Save concepts from your courses to start building your review queue.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Concept</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Course / Lesson</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mastery</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Next Review</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Reviews</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Interval</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map(item => {
                    const due = isDueOrOverdue(item.next_review_at);
                    return (
                      <TableRow
                        key={item.item_uuid}
                        onClick={() => handleItemClick(item)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: due ? 'action.hover' : 'transparent',
                          '&:hover': { bgcolor: 'action.selected' }
                        }}
                      >
                        {/* Concept */}
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Tooltip title={item.concept_text} arrow>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {item.item_title || truncate(item.concept_text, 60)}
                            </Typography>
                          </Tooltip>
                          {item.annotation && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 300 }}>
                              {truncate(item.annotation, 50)}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Course / Lesson */}
                        <TableCell sx={{ maxWidth: 220 }}>
                          {item.course_title ? (
                            <Box>
                              <Typography variant="caption" color="primary.main" noWrap sx={{ display: 'block', maxWidth: 220 }}>
                                {item.course_title}
                              </Typography>
                              {item.lesson_title && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 220 }}>
                                  {item.module_title ? `${item.module_title} › ` : ''}{item.lesson_title}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip label={item.status} size="small" color={statusColor(item.status)} variant="outlined" />
                        </TableCell>

                        {/* Mastery */}
                        <TableCell>
                          <Chip label={item.mastery_state || 'new'} size="small" color={masteryColor(item.mastery_state)} />
                        </TableCell>

                        {/* Next Review */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={due ? 'error.main' : 'text.secondary'}
                            fontWeight={due ? 600 : 400}
                          >
                            {formatNextReview(item.next_review_at)}
                          </Typography>
                          {item.next_review_at && (
                            <Typography variant="caption" color="text.disabled">
                              {new Date(item.next_review_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Reviews */}
                        <TableCell align="center">
                          <Typography variant="body2">{item.total_reviews}</Typography>
                        </TableCell>

                        {/* Interval */}
                        <TableCell align="center">
                          <Typography variant="body2">
                            {item.interval_days}d
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Tooltip title="Delete item">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ================================================================== */}
      {/* TAB 1: Review Session */}
      {/* ================================================================== */}
      {activeTab === 1 && (
        <Box>
          {isReviewing && totalCards > 0 ? (
            <Box>
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
                    <Typography variant="h5" gutterBottom>All done! 🎉</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      You've reviewed all {completedCount} cards.
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
            <Card sx={{ textAlign: 'center', py: 4 }}>
              <CardContent>
                {totalCards > 0 ? (
                  <>
                    <Typography variant="h5" gutterBottom>Ready to Review?</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      You have {totalCards} concepts due for review
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                      {tutor.revisionStats?.firstReviews ? (
                        <Chip icon={<AccessTimeIcon />} label={`${tutor.revisionStats.firstReviews} first reviews`} color="warning" size="small" />
                      ) : null}
                      {tutor.revisionStats?.masteredItems ? (
                        <Chip icon={<TrendingUpIcon />} label={`${tutor.revisionStats.masteredItems} mastered`} color="success" size="small" />
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
                    <Typography variant="h5" gutterBottom>All caught up! 🎉</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      No concepts due for review right now.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check the Items tab to see all your learning items and their next review dates.
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ================================================================== */}
      {/* TAB 2: Calendar */}
      {/* ================================================================== */}
      {activeTab === 2 && (
        <Box>
          <ReviewCalendar
            days={tutor.calendarDays}
            loading={tutor.calendarLoading}
            onDateRangeChange={handleCalendarDateChange}
            onReschedule={handleReschedule}
            onReviewClick={handleScheduledReviewClick}
          />
        </Box>
      )}

      {/* ================================================================== */}
      {/* Item Detail Dialog */}
      {/* ================================================================== */}
      <Dialog
        open={detailOpen}
        onClose={handleDetailClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '85vh' } }}
      >
        {tutor.learningItemDetailLoading || !tutor.learningItemDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ItemDetailContent detail={tutor.learningItemDetail} onClose={handleDetailClose} />
        )}
      </Dialog>

      {/* ================================================================== */}
      {/* Delete Confirmation Dialog */}
      {/* ================================================================== */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Delete Learning Item?</DialogTitle>
        <DialogContent>
          {deleteConfirm && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                This will permanently delete this learning item and all associated exercises and quizzes.
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2">
                  {deleteConfirm.item_title || truncate(deleteConfirm.concept_text, 80)}
                </Typography>
                {deleteConfirm.course_title && (
                  <Typography variant="caption" color="text.secondary">
                    {deleteConfirm.course_title}
                    {deleteConfirm.lesson_title && ` › ${deleteConfirm.lesson_title}`}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
