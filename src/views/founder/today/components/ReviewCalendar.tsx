/**
 * ReviewCalendar Component — Google Calendar-style Vertical Timeline
 *
 * Weekly view with 24-hour vertical timeline per day.
 * - Left gutter: time labels (12 AM → 11 PM)
 * - 7 day columns with zone backgrounds (Sleep / Work / Free)
 * - Booked slots as colored vertical bars positioned by time
 * - Current time red line indicator (updates every 60s)
 * - Auto-scroll to current time on mount
 * - View modes: Item | Lesson | Module | Course
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Popover from '@mui/material/Popover';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

// Icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import TextField from '@mui/material/TextField';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { CalendarDay, ScheduledReview, CalendarZone, LivingTimeStats } from '@/hooks/useTutorAgent';

// ============================================================================
// Constants
// ============================================================================

const PX_PER_MIN = 2;
const TOTAL_HEIGHT = 24 * 60 * PX_PER_MIN; // 2880px
const TIME_GUTTER_WIDTH = 56;

/** Default zone definitions (minutes since midnight) — used when no profile data */
const DEFAULT_ZONES: ZoneDef[] = [
  { label: 'Sleep', startMin: 0, endMin: 420, type: 'sleep' },
  { label: 'Morning', startMin: 420, endMin: 540, type: 'free' },
  { label: 'Work', startMin: 540, endMin: 1020, type: 'work' },
  { label: 'Evening', startMin: 1020, endMin: 1320, type: 'free' },
  { label: 'Sleep', startMin: 1320, endMin: 1440, type: 'sleep' },
];

type ZoneDef = { label: string; startMin: number; endMin: number; type: 'sleep' | 'work' | 'free' };

/** Convert CalendarZone[] from the server to ZoneDef[] with minute offsets */
function zonesToDefs(zones: CalendarZone[]): ZoneDef[] {
  if (!zones || zones.length === 0) return DEFAULT_ZONES;
  return zones.map(z => ({
    label: z.label,
    type: z.type,
    startMin: timeToMinutes(z.start),
    endMin: z.end === '24:00' ? 1440 : timeToMinutes(z.end),
  }));
}

/** Parse "HH:MM" → minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Convert minutes since midnight → "HH:MM" */
function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ============================================================================
// Types
// ============================================================================

type CalendarViewMode = 'item' | 'lesson' | 'module' | 'course';

interface ReviewCalendarProps {
  days: CalendarDay[];
  loading?: boolean;
  zones?: CalendarZone[];
  livingTimeStats?: LivingTimeStats | null;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onReschedule?: (slotUUID: string, newDate: string) => void;
  onReviewClick?: (review: ScheduledReview) => void;
  onUpdateSchedule?: (params: {
    workStart?: string;
    workEnd?: string;
    sleepStart?: string;
    sleepEnd?: string;
    workDays?: string[];
  }) => void;
}

/** Processed slot ready for timeline rendering */
interface TimelineSlot {
  startMin: number;
  endMin: number;
  status: ScheduledReview['status'];
  review: ScheduledReview;
  /** All reviews in this (possibly merged) slot */
  reviews: ScheduledReview[];
  groupKey: string;
  groupLabel: string;
  mergedCount: number;
}

// ============================================================================
// Color Palette — 20 distinct, accessible hues for entity color coding
// ============================================================================

const COLOR_PALETTE = [
  '#1a73e8', '#e8710a', '#0d652d', '#9334e6', '#c5221f',
  '#137333', '#b06000', '#1967d2', '#d01884', '#188038',
  '#a50e0e', '#5b2c6f', '#0b57d0', '#ea8600', '#0d7377',
  '#6a1b9a', '#c62828', '#2e7d32', '#ad1457', '#00695c',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================================
// HSL helpers — same-hue shades for items in the same module
// ============================================================================

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100, lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateShades(baseHex: string, count: number): string[] {
  if (count <= 1) return [baseHex];
  const { h, s } = hexToHSL(baseHex);
  return Array.from({ length: count }, (_, i) => {
    const l = 30 + 35 * (i / (count - 1));
    return hslToHex(h, s, l);
  });
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
  return new Date(d.setDate(d.getDate() - day));
}

function isSameDay(d1: Date, d2: Date): boolean {
  return formatDate(d1) === formatDate(d2);
}

function normalizeTime(time: string): string {
  if (!time) return '00:00';
  const parts = time.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
}

/** Parse "HH:MM" to minutes since midnight */
function parseTimeToMinutes(time: string): number {
  const [h, m] = normalizeTime(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Convert minutes since midnight to 12-hour format */
function minutesToDisplay(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Convert 24h time string to 12h display */
function formatTimeWithAMPM(time: string): string {
  return minutesToDisplay(parseTimeToMinutes(time));
}

function getGroupKey(review: ScheduledReview, mode: CalendarViewMode): string {
  switch (mode) {
    case 'item': return review.itemUUID || 'unknown';
    case 'lesson': return review.lessonUUID || 'no-lesson';
    case 'module': return review.moduleUUID || 'no-module';
    case 'course': return review.courseUUID || 'no-course';
  }
}

function getGroupLabel(review: ScheduledReview, mode: CalendarViewMode): string {
  switch (mode) {
    case 'item': return review.itemTitle?.substring(0, 40) || 'Item';
    case 'lesson': return review.lessonTitle || 'Unlinked';
    case 'module': return review.moduleTitle || 'Unlinked';
    case 'course': return review.courseTitle || 'Unlinked';
  }
}

// ============================================================================
// Slot Processing — builds positioned timeline slots from reviews
// ============================================================================

function buildTimelineSlots(reviews: ScheduledReview[], viewMode: CalendarViewMode): TimelineSlot[] {
  if (!reviews.length) return [];

  if (viewMode === 'item') {
    return reviews.map(r => ({
      startMin: parseTimeToMinutes(r.slotStart),
      endMin: parseTimeToMinutes(r.slotEnd),
      status: r.status,
      review: r,
      reviews: [r],
      groupKey: getGroupKey(r, viewMode),
      groupLabel: getGroupLabel(r, viewMode),
      mergedCount: 1,
    }));
  }

  // lesson / module / course: merge consecutive same-group reviews
  const sorted = [...reviews].sort((a, b) =>
    normalizeTime(a.slotStart).localeCompare(normalizeTime(b.slotStart))
  );

  const result: TimelineSlot[] = [];
  let group: { key: string; label: string; reviews: ScheduledReview[] } | null = null;

  for (const review of sorted) {
    const key = getGroupKey(review, viewMode);
    const label = getGroupLabel(review, viewMode);

    if (group && group.key === key) {
      group.reviews.push(review);
    } else {
      if (group) result.push(flushGroup(group));
      group = { key, label, reviews: [review] };
    }
  }
  if (group) result.push(flushGroup(group));
  return result;
}

function flushGroup(g: { key: string; label: string; reviews: ScheduledReview[] }): TimelineSlot {
  const first = g.reviews[0]!;
  const last = g.reviews[g.reviews.length - 1]!;
  const allDone = g.reviews.every(r => r.status === 'completed');
  const anyDone = g.reviews.some(r => r.status === 'completed');
  const allSkipped = g.reviews.every(r => r.status === 'skipped');
  return {
    startMin: parseTimeToMinutes(first.slotStart),
    endMin: parseTimeToMinutes(last.slotEnd),
    status: allDone ? 'completed' : allSkipped ? 'skipped' : anyDone ? 'scheduled' : first.status,
    review: first,
    reviews: g.reviews,
    groupKey: g.key,
    groupLabel: g.label,
    mergedCount: g.reviews.length,
  };
}

// ============================================================================
// Current Time Indicator — red line, updates every 60 seconds
// ============================================================================

function CurrentTimeIndicator() {
  const [mins, setMins] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setMins(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: mins * PX_PER_MIN,
        left: -4,
        right: 0,
        zIndex: 8,
        pointerEvents: 'none',
      }}
    >
      {/* Red dot */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: -4,
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#ea4335',
        }}
      />
      {/* Red line */}
      <Box
        sx={{
          position: 'absolute',
          left: 8,
          right: 0,
          top: -1,
          height: 2,
          bgcolor: '#ea4335',
        }}
      />
    </Box>
  );
}

// ============================================================================
// Time Gutter — left column with hour labels
// ============================================================================

function TimeGutter({ zones }: { zones: ZoneDef[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <Box
      sx={{
        position: 'relative',
        width: TIME_GUTTER_WIDTH,
        height: TOTAL_HEIGHT,
        borderRight: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      {hours.map(h => (
        <Typography
          key={h}
          variant="caption"
          sx={{
            position: 'absolute',
            top: h * 60 * PX_PER_MIN - 8,
            right: 8,
            fontSize: 10,
            color: 'text.disabled',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {h === 0 ? '' : minutesToDisplay(h * 60)}
        </Typography>
      ))}

      {/* Zone labels */}
      {zones.map((zone, i) => (
        <Typography
          key={`${zone.label}-${i}`}
          variant="caption"
          sx={{
            position: 'absolute',
            top: zone.startMin * PX_PER_MIN + 4,
            left: 4,
            fontSize: 9,
            fontWeight: 600,
            color: zone.type === 'sleep' ? 'rgba(99,102,241,0.55)' : zone.type === 'work' ? 'rgba(217,119,6,0.55)' : 'primary.main',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            userSelect: 'none',
          }}
        >
          {zone.label}
        </Typography>
      ))}
    </Box>
  );
}

// ============================================================================
// Slot Popover Content — rich hover card for slot details
// ============================================================================

function SlotPopoverContent({ slot }: { slot: TimelineSlot }) {
  const r = slot.review;
  const statusColor =
    slot.status === 'completed' ? 'success' : slot.status === 'skipped' ? 'default' : 'primary';

  return (
    <Box sx={{ p: 2, minWidth: 220, maxWidth: 280 }}>
      {/* Title */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
        {slot.groupLabel}
      </Typography>

      {/* Hierarchy breadcrumb */}
      <Stack spacing={0.25} sx={{ mb: 1 }}>
        {r.courseTitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            🎓 {r.courseTitle}
          </Typography>
        )}
        {r.moduleTitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            📦 {r.moduleTitle}
          </Typography>
        )}
        {r.lessonTitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            📖 {r.lessonTitle}
          </Typography>
        )}
      </Stack>

      <Divider sx={{ my: 1 }} />

      {/* Time + Status */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="caption" fontWeight={500}>
          {formatTimeWithAMPM(r.slotStart)} – {formatTimeWithAMPM(r.slotEnd)}
        </Typography>
        <Chip
          label={slot.status}
          size="small"
          color={statusColor as any}
          sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
        />
      </Stack>

      {/* Review # + Mastery */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary">
          Review #{r.reviewNumber}
        </Typography>
        {r.masteryState && (
          <Typography variant="caption" color="text.secondary">
            {r.masteryState}
          </Typography>
        )}
      </Stack>

      {/* Merged count */}
      {slot.mergedCount > 1 && (
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, mt: 0.5, display: 'block' }}>
          {slot.mergedCount} items in this block
        </Typography>
      )}

      {/* Hint */}
      <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block', fontStyle: 'italic', fontSize: 10 }}>
        {slot.status === 'scheduled' ? 'Click to start review' : slot.status === 'completed' ? 'Click to view summary' : ''}
      </Typography>
    </Box>
  );
}

// ============================================================================
// Timeline Column — a single day's vertical strip
// ============================================================================

interface TimelineColumnProps {
  date: Date;
  dayData: CalendarDay | undefined;
  isToday: boolean;
  isPast: boolean;
  viewMode: CalendarViewMode;
  colorMap: Map<string, string>;
  zones: ZoneDef[];
  onSlotHover: (event: React.MouseEvent<HTMLElement>, slot: TimelineSlot) => void;
  onSlotHoverLeave: () => void;
  onSlotClick: (slot: TimelineSlot) => void;
}

function TimelineColumn({ date, dayData, isToday, isPast, viewMode, colorMap, zones, onSlotHover, onSlotHoverLeave, onSlotClick }: TimelineColumnProps) {
  const reviews = dayData?.scheduledReviews || [];
  const slots = useMemo(() => buildTimelineSlots(reviews, viewMode), [reviews, viewMode]);

  return (
    <Box
      sx={{
        position: 'relative',
        height: TOTAL_HEIGHT,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: isToday ? 'rgba(26, 115, 232, 0.03)' : 'transparent',
        opacity: isPast ? 0.65 : 1,
        minWidth: 0,
      }}
    >
      {/* ── Zone backgrounds ──────────────────────────────────────────── */}
      {zones.map((zone, i) => {
        const top = zone.startMin * PX_PER_MIN;
        const height = (zone.endMin - zone.startMin) * PX_PER_MIN;
        let bg: string;
        let backgroundImage: string | undefined;

        if (zone.type === 'sleep') {
          bg = 'rgba(99, 102, 241, 0.07)';   // soft indigo tint
          backgroundImage = 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(99,102,241,0.04) 6px, rgba(99,102,241,0.04) 7px)';
        } else if (zone.type === 'work') {
          bg = 'rgba(245, 158, 11, 0.06)';   // warm amber/sand tint
          backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(245,158,11,0.04) 4px, rgba(245,158,11,0.04) 5px)';
        } else {
          bg = 'transparent';
        }

        return (
          <Box
            key={`zone-${i}`}
            sx={{
              position: 'absolute',
              top,
              height,
              left: 0,
              right: 0,
              bgcolor: bg,
              backgroundImage,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* ── Hour grid lines ───────────────────────────────────────────── */}
      {Array.from({ length: 24 }, (_, h) => (
        <Box
          key={`h-${h}`}
          sx={{
            position: 'absolute',
            top: h * 60 * PX_PER_MIN,
            left: 0,
            right: 0,
            borderTop: '1px solid',
            borderColor: 'rgba(0,0,0,0.08)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Half-hour grid lines ──────────────────────────────────────── */}
      {Array.from({ length: 24 }, (_, h) => (
        <Box
          key={`hh-${h}`}
          sx={{
            position: 'absolute',
            top: (h * 60 + 30) * PX_PER_MIN,
            left: 0,
            right: 0,
            borderTop: '1px dashed',
            borderColor: 'rgba(0,0,0,0.04)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Slot slabs ────────────────────────────────────────────────── */}
      {slots.map((slot, idx) => {
        const top = slot.startMin * PX_PER_MIN;
        const height = Math.max((slot.endMin - slot.startMin) * PX_PER_MIN, 4);
        const isCompleted = slot.status === 'completed';
        const isSkipped = slot.status === 'skipped';
        const isClickable = slot.status === 'scheduled' || isCompleted;
        const color = colorMap.get(slot.groupKey) || '#9e9e9e';

        const bgColor = isCompleted ? '#34a853' : isSkipped ? '#bdbdbd' : color;
        const borderLeftColor = isCompleted ? '#1e8e3e' : isSkipped ? '#9e9e9e' : color;

        return (
          <Box
            key={idx}
            onMouseEnter={(e) => onSlotHover(e, slot)}
            onMouseLeave={onSlotHoverLeave}
            onClick={() => onSlotClick(slot)}
            sx={{
              position: 'absolute',
              top,
              left: 2,
              right: 2,
              height,
              bgcolor: bgColor,
              borderLeft: `3px solid ${borderLeftColor}`,
              borderRadius: '4px',
              cursor: isClickable ? 'pointer' : 'default',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 0.25,
              px: 0.5,
              zIndex: 3,
              opacity: isSkipped ? 0.55 : 1,
              transition: 'box-shadow 0.15s, transform 0.15s, opacity 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              // Skipped: diagonal strikethrough pattern overlay
              ...(isSkipped ? {
                backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
              } : {}),
              '&:hover': isClickable ? {
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                transform: 'scale(1.02)',
                zIndex: 6,
                opacity: 1,
              } : {},
            }}
          >
            {/* Status icon — inline, flex-shrink: 0 */}
            {isCompleted && height >= 14 && (
              <CheckCircleIcon sx={{ fontSize: 12, color: '#fff', flexShrink: 0 }} />
            )}
            {isSkipped && height >= 14 && (
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1, flexShrink: 0 }}>✕</Typography>
            )}

            {/* Title — fills remaining space */}
            {height >= 18 && (
              <Typography
                noWrap
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: '#fff',
                  flex: 1,
                  minWidth: 0,
                  ...(isSkipped ? { textDecoration: 'line-through' } : {}),
                }}
              >
                {slot.groupLabel}
                {/* Merged count inline */}
                {slot.mergedCount > 1 && (
                  <Typography
                    component="span"
                    sx={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.75)', ml: 0.5 }}
                  >
                    ({slot.mergedCount})
                  </Typography>
                )}
              </Typography>
            )}
          </Box>
        );
      })}

      {/* ── Current time indicator ────────────────────────────────────── */}
      {isToday && <CurrentTimeIndicator />}
    </Box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ReviewCalendar({
  days,
  loading = false,
  zones: propZones,
  livingTimeStats,
  onDateRangeChange,
  onReschedule,
  onReviewClick,
  onUpdateSchedule,
}: ReviewCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedReview, setSelectedReview] = useState<ScheduledReview | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('item');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Zone editing dialog state ──────────────────────────────────────
  const [zoneEditOpen, setZoneEditOpen] = useState(false);
  const [editSleepStart, setEditSleepStart] = useState('22:00');
  const [editSleepEnd, setEditSleepEnd] = useState('07:00');
  const [editWorkStart, setEditWorkStart] = useState('09:00');
  const [editWorkEnd, setEditWorkEnd] = useState('17:00');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  /** Validate schedule fields. Returns error message or null if valid. */
  const validateSchedule = useCallback((wakeUp: string, bedtime: string, workStart: string, workEnd: string): string | null => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const wakeMin = toMin(wakeUp);
    const bedMin = toMin(bedtime);
    const wsMin = toMin(workStart);
    const weMin = toMin(workEnd);

    // Work start must be before work end
    if (wsMin >= weMin) return 'Work start must be before work end.';
    // Wake-up must be before work start
    if (wakeMin > wsMin) return 'Wake-up time must be at or before work start.';
    // Bedtime must be after work end
    if (bedMin <= weMin) return 'Bedtime must be after work end.';
    // Sanity: at least 3 hours of sleep
    const sleepMins = (1440 - bedMin) + wakeMin;
    if (sleepMins < 180) return 'Sleep duration is less than 3 hours — please check.';
    // Sanity: at least 1 hour of work
    if (weMin - wsMin < 60) return 'Work duration is less than 1 hour.';
    return null;
  }, []);

  // ── Derive zone defs from backend zones or defaults ─────────────────
  const zones: ZoneDef[] = useMemo(() => zonesToDefs(propZones || []), [propZones]);

  // Sync the edit fields when propZones change
  useEffect(() => {
    if (propZones && propZones.length > 0) {
      // Server sends TWO sleep zones:
      //   { type: "sleep", start: "00:00", end: "07:00" }  — midnight → wake-up
      //   { type: "sleep", start: "22:00", end: "24:00" }  — bedtime → midnight
      // Wake-up time = end of FIRST sleep zone
      // Bedtime      = start of LAST sleep zone
      const sleepZones = propZones.filter(z => z.type === 'sleep');
      if (sleepZones.length >= 2) {
        // First sleep zone's end = wake-up, last sleep zone's start = bedtime
        setEditSleepEnd(sleepZones[0].end);        // e.g. "07:00"
        setEditSleepStart(sleepZones[sleepZones.length - 1].start); // e.g. "22:00"
      } else if (sleepZones.length === 1) {
        // Single sleep zone — interpret as start=bedtime, end=wake-up
        setEditSleepStart(sleepZones[0].start);
        setEditSleepEnd(sleepZones[0].end);
      }

      const work = propZones.find(z => z.type === 'work');
      if (work) {
        setEditWorkStart(work.start);
        setEditWorkEnd(work.end);
      }
    }
  }, [propZones]);

  // ── Hover popover state ────────────────────────────────────────────
  const [hoverState, setHoverState] = useState<{ anchorEl: HTMLElement; slot: TimelineSlot } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Completed slot summary state ───────────────────────────────────
  const [completedDetail, setCompletedDetail] = useState<TimelineSlot | null>(null);

  // ── Week range ───────────────────────────────────────────────────────
  const weekStart = useMemo(() => getWeekStart(viewDate), [viewDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = useMemo(() => new Date(), []);

  // ── Day data lookup ──────────────────────────────────────────────────
  const daysByDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    days.forEach(d => map.set(d.date, d));
    return map;
  }, [days]);

  // ── Color map (same logic as before) ─────────────────────────────────
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueEntities: string[] = [];
    const entitySeen = new Set<string>();

    for (const day of days) {
      for (const review of day.scheduledReviews) {
        const key = getGroupKey(review, viewMode);
        if (!entitySeen.has(key)) { entitySeen.add(key); uniqueEntities.push(key); }
      }
    }

    if (viewMode === 'item') {
      const moduleToItems = new Map<string, string[]>();
      const itemSeen = new Set<string>();
      for (const day of days) {
        for (const review of day.scheduledReviews) {
          const itemKey = review.itemUUID || 'unknown';
          if (itemSeen.has(itemKey)) continue;
          itemSeen.add(itemKey);
          const moduleKey = review.moduleUUID || 'no-module';
          if (!moduleToItems.has(moduleKey)) moduleToItems.set(moduleKey, []);
          moduleToItems.get(moduleKey)!.push(itemKey);
        }
      }
      let moduleIdx = 0;
      for (const [, items] of moduleToItems) {
        const baseColor = COLOR_PALETTE[moduleIdx % COLOR_PALETTE.length] ?? '#9e9e9e';
        moduleIdx++;
        items.sort();
        const shades = generateShades(baseColor, items.length);
        items.forEach((uuid, i) => map.set(uuid, shades[i]!));
      }
    } else {
      uniqueEntities.sort();
      uniqueEntities.forEach((key, idx) => {
        map.set(key, COLOR_PALETTE[idx % COLOR_PALETTE.length]!);
      });
    }
    return map;
  }, [days, viewMode]);

  // ── Legend entries ────────────────────────────────────────────────────
  const legendEntries = useMemo(() => {
    const entries: { key: string; label: string; color: string }[] = [];
    const seen = new Set<string>();
    for (const day of days) {
      for (const review of day.scheduledReviews) {
        const key = getGroupKey(review, viewMode);
        if (!seen.has(key)) {
          seen.add(key);
          entries.push({ key, label: getGroupLabel(review, viewMode), color: colorMap.get(key) || '#9e9e9e' });
        }
      }
    }
    return entries;
  }, [days, viewMode, colorMap]);

  // ── Navigation ───────────────────────────────────────────────────────
  const scrollToNow = useCallback(() => {
    if (!scrollRef.current) return;
    const n = new Date();
    const mins = n.getHours() * 60 + n.getMinutes();
    const viewportHeight = scrollRef.current.clientHeight || 600;
    const target = mins * PX_PER_MIN - viewportHeight / 3;
    scrollRef.current.scrollTop = Math.max(0, target);
  }, []);

  const goToPreviousWeek = useCallback(() => {
    const d = addDays(viewDate, -7);
    setViewDate(d);
    const s = getWeekStart(d);
    onDateRangeChange?.(formatDate(s), formatDate(addDays(s, 6)));
  }, [viewDate, onDateRangeChange]);

  const goToNextWeek = useCallback(() => {
    const d = addDays(viewDate, 7);
    setViewDate(d);
    const s = getWeekStart(d);
    onDateRangeChange?.(formatDate(s), formatDate(addDays(s, 6)));
  }, [viewDate, onDateRangeChange]);

  const goToToday = useCallback(() => {
    setViewDate(new Date());
    const s = getWeekStart(new Date());
    onDateRangeChange?.(formatDate(s), formatDate(addDays(s, 6)));
    setTimeout(scrollToNow, 100);
  }, [onDateRangeChange, scrollToNow]);

  const handleRescheduleConfirm = useCallback(() => {
    if (selectedReview && rescheduleDate) {
      onReschedule?.(selectedReview.slotUUID, rescheduleDate);
      setSelectedReview(null);
      setRescheduleDate(null);
    }
  }, [selectedReview, rescheduleDate, onReschedule]);

  // ── Hover popover handlers ─────────────────────────────────────────
  const handleSlotHover = useCallback((event: React.MouseEvent<HTMLElement>, slot: TimelineSlot) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverState({ anchorEl: event.currentTarget, slot });
  }, []);

  const handleSlotHoverLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setHoverState(null), 200);
  }, []);

  const handlePopoverMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handlePopoverMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setHoverState(null), 150);
  }, []);

  // ── Slot click handler ─────────────────────────────────────────────
  const handleSlotClick = useCallback((slot: TimelineSlot) => {
    setHoverState(null); // close popover
    if (slot.status === 'completed') {
      setCompletedDetail(slot);
    } else if (slot.status === 'scheduled') {
      onReviewClick?.(slot.review);
    }
  }, [onReviewClick]);

  // ── Cleanup hover timeout ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // ── Auto-scroll to current time on mount ─────────────────────────────
  useEffect(() => {
    // Small delay so layout is rendered before scrolling
    const id = setTimeout(scrollToNow, 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading && days.length === 0) {
    return (
      <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 1, flexShrink: 0 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: `${TIME_GUTTER_WIDTH}px repeat(7, 1fr)`, gap: 0.5, flex: 1 }}>
            <Skeleton variant="rectangular" sx={{ height: '100%' }} />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ height: '100%', borderRadius: 1 }} />
              ))}
            </Box>
        </CardContent>
      </Card>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <>
      <Card
        sx={{
        borderRadius: 3, 
        overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* ═══════════════ Toolbar ═══════════════ */}
        <Box
          sx={{
          px: 3, 
            py: 1.5,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* Left: navigation */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={goToPreviousWeek} size="small"><ChevronLeftIcon /></IconButton>
              <Button startIcon={<TodayIcon />} onClick={goToToday} size="small" variant="outlined">Today</Button>
              <IconButton onClick={goToNextWeek} size="small"><ChevronRightIcon /></IconButton>
            </Stack>

            {/* Center: month/year */}
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarViewWeekIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </Stack>

            {/* Right: view mode + settings + living time */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Living time stat */}
              {livingTimeStats && livingTimeStats.freeDisplay && (
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                  label={`Free: ${livingTimeStats.freeDisplay}`}
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
              )}

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v as CalendarViewMode)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, py: 0.5, fontSize: 12 } }}
              >
                <ToggleButton value="item">Item</ToggleButton>
                <ToggleButton value="lesson">Lesson</ToggleButton>
                <ToggleButton value="module">Module</ToggleButton>
                <ToggleButton value="course">Course</ToggleButton>
              </ToggleButtonGroup>

              {/* Zone settings button */}
              {onUpdateSchedule && (
                <Tooltip title="Edit sleep & work schedule">
                  <IconButton size="small" onClick={() => { setScheduleError(null); setZoneEditOpen(true); }}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* ═══════════════ Day Header Row (non-scrolling) ═══════════════ */}
        <Box
          sx={{
            display: 'grid', 
            gridTemplateColumns: `${TIME_GUTTER_WIDTH}px repeat(7, 1fr)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          {/* Gutter corner */}
          <Box sx={{ borderRight: '1px solid', borderColor: 'divider' }} />

          {/* Day headers */}
          {weekDays.map((date) => {
            const isToday = isSameDay(date, today);
            const dayStr = formatDate(date);
            const dayData = daysByDate.get(dayStr);
            const reviewCount = dayData?.scheduledReviews?.length || 0;

            return (
              <Box
                key={dayStr}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  bgcolor: isToday ? 'rgba(26, 115, 232, 0.04)' : 'transparent',
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: isToday ? 'primary.main' : 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                </Typography>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    mx: 'auto',
                    mt: 0.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 700 : 500,
                      fontSize: 14,
                      color: isToday ? '#fff' : 'text.primary',
                    }}
                  >
                    {date.getDate()}
                </Typography>
              </Box>
                {reviewCount > 0 && (
                  <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>
                    {reviewCount} review{reviewCount > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            );
          })}
          </Box>

        {/* ═══════════════ Scrollable Timeline Body ═══════════════ */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Box
            sx={{
            display: 'grid', 
              gridTemplateColumns: `${TIME_GUTTER_WIDTH}px repeat(7, 1fr)`,
              minHeight: TOTAL_HEIGHT,
            }}
          >
            {/* Time gutter */}
            <TimeGutter zones={zones} />

            {/* Day columns */}
            {weekDays.map((date) => {
              const dayStr = formatDate(date);
              return (
                <TimelineColumn
                  key={dayStr}
                  date={date}
                  dayData={daysByDate.get(dayStr)}
                  isToday={isSameDay(date, today)}
                  isPast={date < today && !isSameDay(date, today)}
                  viewMode={viewMode}
                  colorMap={colorMap}
                  zones={zones}
                  onSlotHover={handleSlotHover}
                  onSlotHoverLeave={handleSlotHoverLeave}
                  onSlotClick={handleSlotClick}
                />
              );
            })}
          </Box>
        </Box>

        {/* ═══════════════ Legend ═══════════════ */}
        {legendEntries.length > 0 && (
          <Box
            sx={{
              px: 3,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap" useFlexGap>
              {/* Fixed legend items */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'rgba(99,102,241,0.12)', backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(99,102,241,0.08) 3px, rgba(99,102,241,0.08) 4px)' }} />
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>Sleep</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'rgba(245,158,11,0.10)', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(245,158,11,0.08) 2px, rgba(245,158,11,0.08) 3px)' }} />
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>Work</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#34a853', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 8, color: '#fff' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>Done</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#bdbdbd', opacity: 0.55, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)' }} />
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>Skipped</Typography>
              </Stack>

              {/* Divider */}
              <Box sx={{ width: 1, height: 16, bgcolor: 'divider', mx: 0.5 }} />

              {/* Entity legend */}
              {legendEntries.map(entry => (
                <Stack key={entry.key} direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: entry.color, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Card>

      {/* ═══════════════ Hover Popover ═══════════════ */}
      <Popover
        open={!!hoverState}
        anchorEl={hoverState?.anchorEl}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        onClose={() => setHoverState(null)}
        disableRestoreFocus
        disableScrollLock
        sx={{ pointerEvents: 'none' }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: 'auto',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              border: '1px solid',
              borderColor: 'divider',
              maxWidth: 300,
            },
            onMouseEnter: handlePopoverMouseEnter,
            onMouseLeave: handlePopoverMouseLeave,
          },
        }}
      >
        {hoverState && <SlotPopoverContent slot={hoverState.slot} />}
      </Popover>

      {/* ═══════════════ Completed Slot Summary Dialog ═══════════════ */}
      <Dialog open={!!completedDetail} onClose={() => setCompletedDetail(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircleIcon sx={{ color: '#34a853' }} />
            <Typography variant="h6">Review Completed</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {completedDetail && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              {/* Entity name */}
              <Typography variant="subtitle1" fontWeight={600}>
                {completedDetail.groupLabel}
              </Typography>

              {/* Hierarchy */}
              <Box>
                {completedDetail.review.courseTitle && (
                  <Typography variant="body2" color="text.secondary">Course: {completedDetail.review.courseTitle}</Typography>
                )}
                {completedDetail.review.moduleTitle && (
                  <Typography variant="body2" color="text.secondary">Module: {completedDetail.review.moduleTitle}</Typography>
                )}
                {completedDetail.review.lessonTitle && (
                  <Typography variant="body2" color="text.secondary">Lesson: {completedDetail.review.lessonTitle}</Typography>
                )}
              </Box>

              <Divider />

              {/* Time info */}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Time</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatTimeWithAMPM(completedDetail.review.slotStart)} – {formatTimeWithAMPM(completedDetail.review.slotEnd)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Review #</Typography>
                <Typography variant="body2" fontWeight={500}>{completedDetail.review.reviewNumber}</Typography>
              </Stack>

              {completedDetail.review.masteryState && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Mastery</Typography>
                  <Chip
                    label={completedDetail.review.masteryState}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: 12 }}
                  />
                </Stack>
              )}

              {/* Merged items list */}
              {completedDetail.mergedCount > 1 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Items in this block ({completedDetail.mergedCount})
                  </Typography>
                  <Stack spacing={0.5}>
                    {completedDetail.reviews.map((r, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon sx={{ fontSize: 14, color: '#34a853' }} />
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {r.itemTitle}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {r.status === 'completed' ? 'Done' : r.status}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletedDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════ Reschedule Dialog ═══════════════ */}
      <Dialog open={!!selectedReview} onClose={() => setSelectedReview(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reschedule Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedReview.itemTitle}
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current: {formatTimeWithAMPM(selectedReview.slotStart)} on slot day
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">Move to:</Typography>
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
                    fontSize: 14,
                  }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReview(null)}>Cancel</Button>
          <Button onClick={handleRescheduleConfirm} variant="contained" disabled={!rescheduleDate}>
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════ Zone Editing Dialog ═══════════════ */}
      <Dialog open={zoneEditOpen} onClose={() => setZoneEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsIcon color="primary" />
            <Typography variant="h6">Schedule Settings</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Living time summary */}
            {livingTimeStats && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(46, 125, 50, 0.06)',
                  border: '1px solid',
                  borderColor: 'rgba(46, 125, 50, 0.2)',
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: 'success.dark' }}>
                  Today&apos;s Time Budget
        </Typography>
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Sleep</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {Math.floor(livingTimeStats.sleepMins / 60)}h {livingTimeStats.sleepMins % 60}m
          </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Work</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {Math.floor(livingTimeStats.workMins / 60)}h {livingTimeStats.workMins % 60}m
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Reviews</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {livingTimeStats.reviewMins}m
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={600} color="success.dark">Free Time</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.dark">
                      {livingTimeStats.freeDisplay || `${Math.floor(livingTimeStats.freeMins / 60)}h ${livingTimeStats.freeMins % 60}m`}
                    </Typography>
                  </Stack>
      </Stack>
    </Box>
            )}

            {/* Sleep schedule */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Sleep Schedule
        </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Bedtime"
                  type="time"
                  size="small"
                  value={editSleepStart}
                  onChange={(e) => { setEditSleepStart(e.target.value); setScheduleError(null); }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Wake up"
                  type="time"
                  size="small"
                  value={editSleepEnd}
                  onChange={(e) => { setEditSleepEnd(e.target.value); setScheduleError(null); }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
      </Stack>
            </Box>

            {/* Work schedule */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Work Schedule
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start"
                  type="time"
                  size="small"
                  value={editWorkStart}
                  onChange={(e) => { setEditWorkStart(e.target.value); setScheduleError(null); }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="End"
                  type="time"
                  size="small"
                  value={editWorkEnd}
                  onChange={(e) => { setEditWorkEnd(e.target.value); setScheduleError(null); }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
              </Stack>
      </Box>

            {/* Validation error */}
            {scheduleError && (
              <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                {scheduleError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setZoneEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const err = validateSchedule(editSleepEnd, editSleepStart, editWorkStart, editWorkEnd);
              if (err) {
                setScheduleError(err);
                return;
              }
              setScheduleError(null);
              if (onUpdateSchedule) {
                onUpdateSchedule({
                  sleepStart: editSleepStart,
                  sleepEnd: editSleepEnd,
                  workStart: editWorkStart,
                  workEnd: editWorkEnd,
                });
              }
              setZoneEditOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
