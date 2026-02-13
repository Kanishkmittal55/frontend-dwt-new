/**
 * ReviewCalendar Component
 * Week view showing ALL available slots per day as a visual grid
 * Filled slots are colored, empty slots are visible - complete capacity view
 */
import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';

import type { CalendarDay, ScheduledReview, CalendarTimeSlot } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface ReviewCalendarProps {
  days: CalendarDay[];
  loading?: boolean;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onReschedule?: (slotUUID: string, newDate: string) => void;
  onReviewClick?: (review: ScheduledReview) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

/** Convert 24h time string (HH:MM or HH:MM:SS) to 12h format with AM/PM */
function formatTimeWithAMPM(time: string): string {
  if (!time) return '';
  const [hoursStr, minutes] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

/** Normalize time to HH:MM format (strips seconds if present) */
function normalizeTime(time: string): string {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

// ============================================================================
// Component
// ============================================================================

export default function ReviewCalendar({
  days,
  loading = false,
  onDateRangeChange,
  onReschedule,
  onReviewClick
}: ReviewCalendarProps) {
  // State
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedReview, setSelectedReview] = useState<ScheduledReview | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);

  // Calculate week range
  const weekStart = useMemo(() => getWeekStart(viewDate), [viewDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Map days by date for quick lookup
  const daysByDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    days.forEach(day => map.set(day.date, day));
    return map;
  }, [days]);

  // Today
  const today = new Date();

  // Navigation
  const goToPreviousWeek = useCallback(() => {
    const newDate = addDays(viewDate, -7);
    setViewDate(newDate);
    const start = getWeekStart(newDate);
    onDateRangeChange?.(formatDate(start), formatDate(addDays(start, 6)));
  }, [viewDate, onDateRangeChange]);

  const goToNextWeek = useCallback(() => {
    const newDate = addDays(viewDate, 7);
    setViewDate(newDate);
    const start = getWeekStart(newDate);
    onDateRangeChange?.(formatDate(start), formatDate(addDays(start, 6)));
  }, [viewDate, onDateRangeChange]);

  const goToToday = useCallback(() => {
    setViewDate(new Date());
    const start = getWeekStart(new Date());
    onDateRangeChange?.(formatDate(start), formatDate(addDays(start, 6)));
  }, [onDateRangeChange]);

  // Handle reschedule
  const handleRescheduleConfirm = useCallback(() => {
    if (selectedReview && rescheduleDate) {
      onReschedule?.(selectedReview.slotUUID, rescheduleDate);
      setSelectedReview(null);
      setRescheduleDate(null);
    }
  }, [selectedReview, rescheduleDate, onReschedule]);

  // Loading skeleton
  if (loading && days.length === 0) {
    return (
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {/* Header */}
        <Box sx={{ 
          px: 3, 
          py: 2, 
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* Navigation */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={goToPreviousWeek} size="small">
                <ChevronLeftIcon />
              </IconButton>
              <Button 
                startIcon={<TodayIcon />}
                onClick={goToToday}
                size="small"
                variant="outlined"
              >
                Today
              </Button>
              <IconButton onClick={goToNextWeek} size="small">
                <ChevronRightIcon />
              </IconButton>
            </Stack>

            {/* Current week */}
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarViewWeekIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </Stack>

            {/* Legend */}
            <Stack direction="row" spacing={2}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#e8eaed', border: '1px solid #dadce0' }} />
                <Typography variant="caption">Free</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#1a73e8' }} />
                <Typography variant="caption">Concept</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#f9ab00' }} />
                <Typography variant="caption">Confusion</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#34a853' }} />
                <Typography variant="caption">Done</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ p: 2 }}>
          {/* Day headers */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 1,
            mb: 1
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
                <Typography 
                  variant="caption" 
                  fontWeight={600}
                  color={i === 0 || i === 6 ? 'text.disabled' : 'text.secondary'}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Day cells */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 1
          }}>
            {weekDays.map(date => {
              const dateStr = formatDate(date);
              const dayData = daysByDate.get(dateStr);
              const isToday = isSameDay(date, today);
              const isPast = date < today && !isToday;

              return (
                <DayCell
                  key={dateStr}
                  date={date}
                  dayData={dayData}
                  isToday={isToday}
                  isPast={isPast}
                  onReviewClick={onReviewClick}
                />
              );
            })}
          </Box>
        </Box>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog 
        open={!!selectedReview} 
        onClose={() => setSelectedReview(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reschedule Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedReview.itemTitle}
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current: {selectedReview.slotStart} on slot day
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">
                  Move to:
                </Typography>
                <input
                  type="date"
                  value={rescheduleDate || ''}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={formatDate(new Date())}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginTop: 8,
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    fontSize: 14
                  }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReview(null)}>Cancel</Button>
          <Button 
            onClick={handleRescheduleConfirm}
            variant="contained"
            disabled={!rescheduleDate}
          >
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ============================================================================
// Slot Grid Component - Shows ALL slots as visual boxes
// ============================================================================

interface SlotGridProps {
  availableSlots: CalendarTimeSlot[];
  scheduledReviews: ScheduledReview[];
  onReviewClick?: (review: ScheduledReview) => void;
  isPast: boolean;
}

/**
 * Renders a grid of ALL slots for a day (available + scheduled combined)
 * Each slot is a small colored box:
 * - Free slot: light gray border
 * - Concept review: blue fill
 * - Confusion review: amber fill  
 * - Completed: green fill
 */
/** Combined slot for rendering - merges available + scheduled */
interface CombinedSlot {
  start: string;
  end: string;
  type: 'free' | 'concept' | 'confusion';
  status?: 'scheduled' | 'completed' | 'skipped';
  review?: ScheduledReview;
}

function SlotGrid({ availableSlots, scheduledReviews, onReviewClick, isPast }: SlotGridProps) {
  // Combine available slots and scheduled reviews into one unified grid
  // Available slots are FREE, scheduled reviews are BOOKED - they don't overlap!
  const combinedSlots = useMemo((): CombinedSlot[] => {
    const slots: CombinedSlot[] = [];
    
    // Add available (free) slots
    for (const slot of availableSlots) {
      slots.push({
        start: normalizeTime(slot.start),
        end: normalizeTime(slot.end),
        type: 'free'
      });
    }
    
    // Add scheduled reviews (booked slots)
    for (const review of scheduledReviews) {
      slots.push({
        start: normalizeTime(review.slotStart),
        end: normalizeTime(review.slotEnd),
        type: review.itemType === 'concept' ? 'concept' : 'confusion',
        status: review.status,
        review
      });
    }
    
    // Sort by start time
    slots.sort((a, b) => a.start.localeCompare(b.start));
    
    return slots;
  }, [availableSlots, scheduledReviews]);

  // If no slots at all, generate defaults
  const slots = useMemo((): CombinedSlot[] => {
    if (combinedSlots.length > 0) return combinedSlots;
    
    // Default: create 42 slots (7 hours available * 6 slots/hour = 42)
    const defaultSlots: CombinedSlot[] = [];
    // Morning: 7am-9am (12 slots)
    for (let h = 7; h < 9; h++) {
      for (let m = 0; m < 60; m += 10) {
        defaultSlots.push({
          start: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          end: `${h.toString().padStart(2, '0')}:${(m + 10).toString().padStart(2, '0')}`,
          type: 'free'
        });
      }
    }
    // Evening: 5pm-10pm (30 slots)
    for (let h = 17; h < 22; h++) {
      for (let m = 0; m < 60; m += 10) {
        const endH = m === 50 ? h + 1 : h;
        const endM = m === 50 ? 0 : m + 10;
        defaultSlots.push({
          start: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          end: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
          type: 'free'
        });
      }
    }
    return defaultSlots;
  }, [combinedSlots]);

  const filledCount = slots.filter(s => s.type !== 'free' && s.status === 'scheduled').length;
  const completedCount = slots.filter(s => s.status === 'completed').length;
  const totalSlots = slots.length;

  return (
    <Box>
      {/* Slot grid - compact visual representation */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '3px',
        justifyContent: 'flex-start',
        alignContent: 'flex-start'
      }}>
        {slots.map((slot, idx) => {
          const isScheduled = slot.status === 'scheduled';
          const isCompleted = slot.status === 'completed';
          const isFree = slot.type === 'free';
          
          // Determine slot color - use stronger colors for visibility
          let bgcolor = '#e8eaed'; // Light gray for free
          let borderColor = '#dadce0';
          
          if (isCompleted) {
            bgcolor = '#34a853'; // Google green
            borderColor = '#1e8e3e';
          } else if (slot.type === 'concept') {
            bgcolor = '#1a73e8'; // Google blue
            borderColor = '#1557b0';
          } else if (slot.type === 'confusion') {
            bgcolor = '#f9ab00'; // Google yellow/amber
            borderColor = '#e37400';
          }
          
          const tooltipContent = slot.review 
            ? `${formatTimeWithAMPM(slot.start)} - ${slot.review.itemTitle?.substring(0, 30) || 'Review'}...`
            : `${formatTimeWithAMPM(slot.start)} - Available`;

          return (
            <Tooltip key={idx} title={tooltipContent} arrow placement="top">
              <Box
                onClick={() => slot.review && isScheduled ? onReviewClick?.(slot.review) : undefined}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '2px',
                  bgcolor,
                  border: '1px solid',
                  borderColor,
                  cursor: slot.review && isScheduled ? 'pointer' : 'default',
                  opacity: isPast && isFree ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                  '&:hover': slot.review && isScheduled ? {
                    transform: 'scale(1.4)',
                    zIndex: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  } : {}
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      
      {/* Stats row */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          {filledCount + completedCount}/{totalSlots}
        </Typography>
        {completedCount > 0 && (
          <Typography variant="caption" sx={{ fontSize: 11, color: '#34a853', fontWeight: 600 }}>
            ✓{completedCount}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

// ============================================================================
// Day Cell Component - Compact with slot grid
// ============================================================================

interface DayCellProps {
  date: Date;
  dayData?: CalendarDay;
  isToday: boolean;
  isPast: boolean;
  onReviewClick?: (review: ScheduledReview) => void;
}

function DayCell({
  date,
  dayData,
  isToday,
  isPast,
  onReviewClick
}: DayCellProps) {
  const availableSlots = dayData?.availableSlots || [];
  const scheduledReviews = dayData?.scheduledReviews || [];
  const bookedMinutes = dayData?.bookedMinutes || 0;
  const totalMinutes = dayData?.totalMinutes || 420; // Default 7 hours
  const fillPercent = totalMinutes > 0 ? (bookedMinutes / totalMinutes) * 100 : 0;

  return (
    <Box
      sx={{
        minHeight: 140,
        p: 1.5,
        borderRadius: 2,
        bgcolor: isToday ? 'primary.50' : isPast ? 'action.disabledBackground' : 'background.paper',
        border: '1px solid',
        borderColor: isToday ? 'primary.300' : 'divider',
        opacity: isPast ? 0.7 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Date header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography
          variant="body1"
          fontWeight={isToday ? 700 : 500}
          sx={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: isToday ? 'primary.main' : 'transparent',
            color: isToday ? 'white' : 'text.primary',
            fontSize: 14
          }}
        >
          {date.getDate()}
        </Typography>
      </Stack>

      {/* Capacity bar */}
      <LinearProgress 
        variant="determinate" 
        value={Math.min(fillPercent, 100)}
        sx={{ 
          height: 4, 
          borderRadius: 2, 
          mb: 1,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: fillPercent > 80 ? 'warning.main' : 'primary.main'
          }
        }}
      />

      {/* Slot grid - flex to take remaining space */}
      <Box sx={{ flex: 1 }}>
        <SlotGrid
          availableSlots={availableSlots}
          scheduledReviews={scheduledReviews}
          onReviewClick={onReviewClick}
          isPast={isPast}
        />
      </Box>
    </Box>
  );
}

