/**
 * LessonEndDialog Component
 * 
 * Modal displayed after ending a lesson session.
 * Shows understanding score, difficulty score, and SM-2 scheduling info.
 * Optionally allows user to set their energy level.
 */
import { useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconBrain,
  IconTrendingUp,
  IconCalendar,
  IconBulb,
  IconAlertTriangle,
  IconClock,
  IconBolt
} from '@tabler/icons-react';

import type { LessonScorePayload } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface LessonEndDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Lesson scores from server (null while loading) */
  lessonScore: LessonScorePayload | null;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback when user confirms and sets energy level */
  onConfirm?: (energyLevel: number) => void;
  /** Whether scores are still loading */
  isLoading?: boolean;
}

// ============================================================================
// Helper: Score color based on value
// ============================================================================

function getScoreColor(score: number, max: number = 10): 'success' | 'warning' | 'error' | 'info' {
  const percent = (score / max) * 100;
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
}

// ============================================================================
// Helper: Format next review date
// ============================================================================

function formatNextReview(intervalDays: number): string {
  if (intervalDays === 0) return 'Today';
  if (intervalDays === 1) return 'Tomorrow';
  if (intervalDays < 7) return `In ${intervalDays} days`;
  if (intervalDays < 30) return `In ${Math.round(intervalDays / 7)} weeks`;
  return `In ${Math.round(intervalDays / 30)} months`;
}

// ============================================================================
// Energy Level Marks
// ============================================================================

const energyMarks = [
  { value: 1, label: '😴' },
  { value: 2, label: '😐' },
  { value: 3, label: '🙂' },
  { value: 4, label: '😊' },
  { value: 5, label: '⚡' }
];

// ============================================================================
// Component
// ============================================================================

export default function LessonEndDialog({
  open,
  lessonScore,
  onClose,
  onConfirm,
  isLoading = false
}: LessonEndDialogProps) {
  const theme = useTheme();
  const [energyLevel, setEnergyLevel] = useState(3);
  
  const handleConfirm = useCallback(() => {
    onConfirm?.(energyLevel);
    onClose();
  }, [energyLevel, onConfirm, onClose]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <IconBrain size={24} color={theme.palette.primary.main} />
        <Typography variant="h6" fontWeight={700}>
          Lesson Complete
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {isLoading || !lessonScore ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Calculating your scores...
            </Typography>
            <LinearProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Main Scores */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2
              }}
            >
              {/* Understanding Score */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <IconTrendingUp size={18} color={theme.palette.success.main} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Understanding
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {lessonScore.understanding_score.toFixed(1)}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /10
                  </Typography>
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={lessonScore.understanding_score * 10}
                  color={getScoreColor(lessonScore.understanding_score)}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Box>
              
              {/* Difficulty Score */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <IconTrendingUp size={18} color={theme.palette.warning.main} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Difficulty
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {lessonScore.difficulty_score.toFixed(1)}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /10
                  </Typography>
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={lessonScore.difficulty_score * 10}
                  color={getScoreColor(lessonScore.difficulty_score)}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
            
            {/* SM-2 Info */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Spaced Repetition Schedule
              </Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconCalendar size={16} color={theme.palette.info.main} />
                  <Typography variant="body2">
                    Next Review: <strong>{formatNextReview(lessonScore.interval_days)}</strong>
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconBrain size={16} color={theme.palette.info.main} />
                  <Typography variant="body2">
                    Ease Factor: <strong>{lessonScore.ease_factor.toFixed(2)}</strong>
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            
            {/* Session Stats */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Session Stats
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip
                  icon={<IconBulb size={14} />}
                  label={`${lessonScore.concepts_captured} concepts`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<IconAlertTriangle size={14} />}
                  label={`${lessonScore.confusion_points} confusion points`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  icon={<IconClock size={14} />}
                  label={`${lessonScore.time_spent_minutes} min`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
            
            <Divider />
            
            {/* Energy Level */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <IconBolt size={18} color={theme.palette.secondary.main} />
                <Typography variant="subtitle2" fontWeight={600}>
                  How's your energy level?
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                This helps optimize your revision schedule
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={energyLevel}
                  onChange={(_, value) => setEnergyLevel(value as number)}
                  min={1}
                  max={5}
                  step={1}
                  marks={energyMarks}
                  valueLabelDisplay="off"
                  sx={{
                    '& .MuiSlider-mark': {
                      display: 'none'
                    },
                    '& .MuiSlider-markLabel': {
                      fontSize: '1.25rem'
                    }
                  }}
                />
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading || !lessonScore}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

