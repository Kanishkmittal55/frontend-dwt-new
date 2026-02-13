/**
 * TodaySchedule Component
 * Shows today's scheduled reviews with time slots
 * Integrates with the daily tasks dashboard
 */
import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';

// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import type { CalendarDay, ScheduledReview } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface TodayScheduleProps {
  calendarDay: CalendarDay | null;
  loading?: boolean;
  onReviewClick?: (review: ScheduledReview) => void;
  compact?: boolean; // For embedding in dashboard
}

// Status colors
const statusColors: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  scheduled: 'info',
  completed: 'success',
  skipped: 'default',
  rescheduled: 'warning'
};

// Status icons
const statusIcons: Record<string, React.ReactNode> = {
  scheduled: <ScheduleIcon fontSize="small" />,
  completed: <CheckCircleOutlineIcon fontSize="small" />,
  skipped: null,
  rescheduled: null
};

// ============================================================================
// Helpers
// ============================================================================

/** Convert 24h time string (HH:MM) to 12h format with AM/PM */
function formatTimeWithAMPM(time: string): string {
  if (!time) return '';
  const [hoursStr, minutes] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

// ============================================================================
// Component
// ============================================================================

export default function TodaySchedule({ 
  calendarDay, 
  loading = false, 
  onReviewClick,
  compact = false 
}: TodayScheduleProps) {
  // Calculate progress
  const { completedCount, totalCount, progressPercent } = useMemo(() => {
    if (!calendarDay?.scheduledReviews) {
      return { completedCount: 0, totalCount: 0, progressPercent: 0 };
    }
    const reviews = calendarDay.scheduledReviews;
    const completed = reviews.filter(r => r.status === 'completed').length;
    const total = reviews.filter(r => r.status !== 'rescheduled').length;
    return {
      completedCount: completed,
      totalCount: total,
      progressPercent: total > 0 ? (completed / total) * 100 : 0
    };
  }, [calendarDay]);

  // Get upcoming reviews (not completed)
  const upcomingReviews = useMemo(() => {
    if (!calendarDay?.scheduledReviews) return [];
    return calendarDay.scheduledReviews
      .filter(r => r.status === 'scheduled')
      .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  }, [calendarDay]);

  // Get completed reviews
  const completedReviews = useMemo(() => {
    if (!calendarDay?.scheduledReviews) return [];
    return calendarDay.scheduledReviews
      .filter(r => r.status === 'completed')
      .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  }, [calendarDay]);

  // Loading skeleton
  if (loading) {
    return (
      <Card sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="text" width={180} height={28} />
            <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
            <Stack spacing={1.5}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // No data
  if (!calendarDay) {
    return (
      <Card sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <CardContent>
          <Stack spacing={2} alignItems="center" py={3}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography color="text.secondary">
              No schedule data available
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        px: 3, 
        py: 2, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccessTimeIcon />
            <Typography variant="h6" fontWeight={600}>
              Today's Schedule
            </Typography>
          </Stack>
          <Chip 
            label={calendarDay.dayOfWeek}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 500
            }}
          />
        </Stack>
        
        {/* Progress bar */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Progress
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {completedCount} / {totalCount} reviews
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={progressPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'white'
              }
            }}
          />
        </Box>
      </Box>

      <CardContent sx={{ px: 3, py: 2 }}>
        {/* Available time info */}
        {!compact && (
          <Stack 
            direction="row" 
            spacing={3} 
            sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">Available</Typography>
              <Typography variant="body2" fontWeight={600}>
                {calendarDay.totalMinutes} min
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Scheduled</Typography>
              <Typography variant="body2" fontWeight={600}>
                {calendarDay.bookedMinutes} min
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Free</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {calendarDay.totalMinutes - calendarDay.bookedMinutes} min
              </Typography>
            </Box>
          </Stack>
        )}

        {/* Upcoming reviews */}
        {upcomingReviews.length > 0 && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Up Next
            </Typography>
            <Stack spacing={1.5} sx={{ mb: completedReviews.length > 0 ? 2 : 0 }}>
              {(compact ? upcomingReviews.slice(0, 3) : upcomingReviews).map((review, idx) => (
                <ReviewSlotCard 
                  key={review.slotUUID}
                  review={review}
                  isNext={idx === 0}
                  onClick={() => onReviewClick?.(review)}
                />
              ))}
              {compact && upcomingReviews.length > 3 && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  +{upcomingReviews.length - 3} more reviews
                </Typography>
              )}
            </Stack>
          </>
        )}

        {/* Completed reviews */}
        {completedReviews.length > 0 && !compact && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Completed
            </Typography>
            <Stack spacing={1}>
              {completedReviews.map(review => (
                <ReviewSlotCard 
                  key={review.slotUUID}
                  review={review}
                  isNext={false}
                />
              ))}
            </Stack>
          </>
        )}

        {/* No reviews */}
        {upcomingReviews.length === 0 && completedReviews.length === 0 && (
          <Stack spacing={2} alignItems="center" py={3}>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main' }} />
            <Typography color="text.secondary">
              All caught up for today! 🎉
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Review Slot Card
// ============================================================================

interface ReviewSlotCardProps {
  review: ScheduledReview;
  isNext?: boolean;
  onClick?: () => void;
}

function ReviewSlotCard({ review, isNext = false, onClick }: ReviewSlotCardProps) {
  const isCompleted = review.status === 'completed';
  
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: isNext ? 'primary.50' : 'background.default',
        border: '1px solid',
        borderColor: isNext ? 'primary.200' : 'divider',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        opacity: isCompleted ? 0.7 : 1,
        '&:hover': onClick ? {
          borderColor: 'primary.main',
          bgcolor: isNext ? 'primary.100' : 'action.hover'
        } : {}
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Time */}
        <Box sx={{ minWidth: 80, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            fontWeight={600}
            color={isNext ? 'primary.main' : 'text.secondary'}
          >
            {formatTimeWithAMPM(review.slotStart)}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {formatTimeWithAMPM(review.slotEnd)}
          </Typography>
        </Box>
        
        {/* Icon */}
        <Avatar
          sx={{ 
            width: 36, 
            height: 36,
            bgcolor: review.itemType === 'concept' ? 'primary.100' : 'warning.100',
            color: review.itemType === 'concept' ? 'primary.main' : 'warning.main'
          }}
        >
          {review.itemType === 'concept' ? (
            <SchoolIcon fontSize="small" />
          ) : (
            <HelpOutlineIcon fontSize="small" />
          )}
        </Avatar>
        
        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body2" 
            fontWeight={500}
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: isCompleted ? 'line-through' : 'none'
            }}
          >
            {review.itemTitle || 'Review'}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Review #{review.reviewNumber}
            </Typography>
            <Chip 
              label={review.status}
              size="small"
              color={statusColors[review.status] || 'default'}
              icon={statusIcons[review.status]}
              sx={{ height: 20, fontSize: 11 }}
            />
          </Stack>
        </Box>
        
        {/* Action */}
        {isNext && !isCompleted && (
          <PlayArrowIcon color="primary" />
        )}
      </Stack>
    </Box>
  );
}

