/**
 * CourseSelector Component
 * Card-based course selection view
 */
import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconBook2,
  IconClock,
  IconLayout,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconLoader,
  IconTrash
} from '@tabler/icons-react';

import type { Course, CourseFilter } from '@/api/founder/coursesAPI';
import {
  getCourses,
  getCourseStatusLabel,
  getCourseStatusColor,
  isCourseProcessing,
  formatEstimatedHours,
  deleteCourse
} from '@/api/founder/coursesAPI';
import { getStoredUserId } from '@/api/founder/founderClient';

// ============================================================================
// Types
// ============================================================================

interface CourseSelectorProps {
  onSelectCourse: (course: Course) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function CourseSelector({ onSelectCourse }: CourseSelectorProps) {
  const theme = useTheme();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CourseFilter>('all');
  const [total, setTotal] = useState(0);
  
  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get user ID
  const userId = getStoredUserId();

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getCourses(userId, {
        status: filter,
        limit: 50
      });
      setCourses(response.courses);
      setTotal(response.total);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  // Fetch on mount and filter change
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Auto-refresh for processing courses
  useEffect(() => {
    const hasProcessing = courses.some(isCourseProcessing);
    if (!hasProcessing) return;

    const interval = setInterval(fetchCourses, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [courses, fetchCourses]);

  // Get status icon
  const getStatusIcon = (course: Course) => {
    if (course.status === 'ready') {
      return <IconCheck size={16} />;
    }
    if (course.status === 'failed') {
      return <IconAlertCircle size={16} />;
    }
    if (isCourseProcessing(course)) {
      return <IconLoader size={16} className="animate-spin" />;
    }
    return null;
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.uuid);
      setDeleteTarget(null);
      fetchCourses();
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            My Courses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total} courses available
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<IconRefresh size={18} />}
          onClick={fetchCourses}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onChange={(_, value) => setFilter(value)}
        sx={{ mb: 3 }}
      >
        <Tab value="all" label="All" />
        <Tab value="ready" label="Ready" />
        <Tab value="pending" label="Processing" />
        <Tab value="failed" label="Failed" />
      </Tabs>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchCourses}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <Card
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: alpha(theme.palette.background.default, 0.5)
          }}
        >
          <CardContent>
            <IconBook2 size={64} color={theme.palette.text.disabled} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              No courses found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {filter === 'all'
                ? 'Upload a document to create your first course'
                : `No ${filter} courses available`}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Courses Grid */}
      {!loading && courses.length > 0 && (
        <Grid container spacing={3}>
          {courses.map((course) => {
            const isProcessing = isCourseProcessing(course);
            const statusColor = getCourseStatusColor(course.status);

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.uuid}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    border: `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': !isProcessing ? {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                    } : {}
                  }}
                >
                  {/* Processing Overlay */}
                  {isProcessing && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite linear',
                        '@keyframes shimmer': {
                          '0%': { backgroundPosition: '200% 0' },
                          '100%': { backgroundPosition: '-200% 0' }
                        }
                      }}
                    />
                  )}

                  {/* Delete Button - Outside CardActionArea to avoid nested buttons */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(course);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      opacity: 0.6,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      '&:hover': { opacity: 1, color: 'error.main', bgcolor: theme.palette.background.paper }
                    }}
                  >
                    <IconTrash size={18} />
                  </IconButton>

                  <CardActionArea
                    onClick={() => !isProcessing && onSelectCourse(course)}
                    disabled={isProcessing || course.status === 'failed'}
                    sx={{ height: '100%' }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconBook2 size={24} color={theme.palette.primary.main} />
                        </Box>
                        <Chip
                          size="small"
                          icon={getStatusIcon(course)}
                          label={getCourseStatusLabel(course.status)}
                          color={statusColor}
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {course.title}
                      </Typography>

                      {/* Description */}
                      {course.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {course.description}
                        </Typography>
                      )}

                      {/* Stats */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mt: 'auto',
                          pt: 2,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                        }}
                      >
                        {course.total_modules && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconLayout size={14} color={theme.palette.text.secondary} />
                            <Typography variant="caption" color="text.secondary">
                              {course.total_modules} modules
                            </Typography>
                          </Box>
                        )}
                        {course.total_lessons && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconBook2 size={14} color={theme.palette.text.secondary} />
                            <Typography variant="caption" color="text.secondary">
                              {course.total_lessons} lessons
                            </Typography>
                          </Box>
                        )}
                        {course.estimated_hours && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconClock size={14} color={theme.palette.text.secondary} />
                            <Typography variant="caption" color="text.secondary">
                              {formatEstimatedHours(course.estimated_hours)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Course?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteTarget?.title}"? This will permanently remove all modules, lessons, and quizzes. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


