/**
 * ReviewCard Component
 * Enhanced flashcard-style review with:
 * - Active recall questions for concepts
 * - Clarification UI for confusion points
 * - Time tracking (time_to_reveal_ms, time_to_rate_ms)
 * - Optional "Type your recall" input
 * - Confidence slider before/after reveal
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Fade from '@mui/material/Fade';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { RevisionQueueItem } from '@/hooks/useTutorAgent';

/** Review submission parameters */
export interface ReviewSubmitParams {
  quality: 1 | 2 | 3 | 4;
  timeSpentMs: number;
  timeToRevealMs: number;
  timeToRateMs: number;
  founderAnswer: string | undefined;  // What they typed (may be undefined)
  confidenceBefore: number;
  confidenceAfter: number;
  hintRequested: boolean;
  gaveUp: boolean;
}

interface ReviewCardProps {
  item: RevisionQueueItem;
  onSubmit: (params: ReviewSubmitParams) => void;
  loading?: boolean;
}

// Quality button configs
const qualityButtons = [
  { quality: 1 as const, label: 'Again', icon: <ReplayIcon />, color: '#f44336', description: 'Forgot completely' },
  { quality: 2 as const, label: 'Hard', icon: <ThumbDownIcon />, color: '#ff9800', description: 'Remembered with difficulty' },
  { quality: 3 as const, label: 'Good', icon: <ThumbUpIcon />, color: '#4caf50', description: 'Remembered correctly' },
  { quality: 4 as const, label: 'Easy', icon: <RocketLaunchIcon />, color: '#2196f3', description: 'Perfect recall' }
];

// Mastery state colors
const masteryColors: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
  'new': 'default',
  'learning': 'warning',
  'mastered': 'info',
  'graduated': 'success'
};

// Confidence marks for slider
const confidenceMarks = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' }
];

export default function ReviewCard({ item, onSubmit, loading }: ReviewCardProps) {
  // State
  const [showAnswer, setShowAnswer] = useState(false);
  const [founderAnswer, setFounderAnswer] = useState('');
  const [confidenceBefore, setConfidenceBefore] = useState(3);
  const [confidenceAfter, setConfidenceAfter] = useState(3);
  const [gaveUp, setGaveUp] = useState(false);
  
  // Timing refs
  const cardShownAt = useRef<number>(Date.now());
  const answerRevealedAt = useRef<number | null>(null);
  
  // Reset state when item changes
  useEffect(() => {
    setShowAnswer(false);
    setFounderAnswer('');
    setConfidenceBefore(3);
    setConfidenceAfter(3);
    setGaveUp(false);
    cardShownAt.current = Date.now();
    answerRevealedAt.current = null;
  }, [item.itemUUID]);

  const isConfusion = item.itemType === 'confusion';
  const hasLLMContent = item.reviewQuestion || item.clarificationAnswer;

  // Calculate what to show on the front of the card
  const getFrontContent = () => {
    if (isConfusion) {
      // Confusion: Show the confusion point text
      return {
        label: 'Your Confusion:',
        content: item.conceptText,
        icon: <HelpOutlineIcon sx={{ color: 'warning.main', mr: 1 }} />
      };
    }
    // Concept: Show active recall question if available
    if (item.reviewQuestion) {
      return {
        label: 'Recall Question:',
        content: item.reviewQuestion,
        icon: <LightbulbIcon sx={{ color: 'primary.main', mr: 1 }} />
      };
    }
    // Fallback: Show raw concept text
    return {
      label: 'Concept:',
      content: item.conceptText,
      icon: null
    };
  };

  const frontContent = getFrontContent();

  const handleShowAnswer = useCallback(() => {
    answerRevealedAt.current = Date.now();
    setShowAnswer(true);
  }, []);

  const handleGiveUp = useCallback(() => {
    setGaveUp(true);
    handleShowAnswer();
  }, [handleShowAnswer]);

  const handleRate = useCallback((quality: 1 | 2 | 3 | 4) => {
    const now = Date.now();
    const timeToRevealMs = answerRevealedAt.current 
      ? answerRevealedAt.current - cardShownAt.current 
      : 0;
    const timeToRateMs = answerRevealedAt.current 
      ? now - answerRevealedAt.current 
      : 0;
    const totalTimeMs = now - cardShownAt.current;

    onSubmit({
      quality,
      timeSpentMs: totalTimeMs,
      timeToRevealMs,
      timeToRateMs,
      founderAnswer: founderAnswer.trim() || undefined,
      confidenceBefore,
      confidenceAfter,
      hintRequested: false, // Future: add hint button
      gaveUp
    });
  }, [onSubmit, founderAnswer, confidenceBefore, confidenceAfter, gaveUp]);

  // Render answer section based on item type
  const renderAnswerSection = () => {
    if (isConfusion) {
      return (
        <Stack spacing={2}>
          {/* Clarification */}
          {item.clarificationAnswer && (
            <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1, opacity: 0.9 }}>
              <Typography variant="body2" color="success.dark" gutterBottom sx={{ fontWeight: 600 }}>
                💡 Clarification:
              </Typography>
              <Typography variant="body1" sx={{ color: 'success.dark' }}>
                {item.clarificationAnswer}
              </Typography>
            </Box>
          )}
          
          {/* Follow-up check */}
          {item.followUpCheck && (
            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1, opacity: 0.9 }}>
              <Typography variant="body2" color="info.dark" gutterBottom sx={{ fontWeight: 600 }}>
                ✅ Check Your Understanding:
              </Typography>
              <Typography variant="body1" sx={{ color: 'info.dark' }}>
                {item.followUpCheck}
              </Typography>
            </Box>
          )}

          {/* Related concepts */}
          {item.relatedConcepts && item.relatedConcepts.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Related: {item.relatedConcepts.join(', ')}
              </Typography>
            </Box>
          )}
        </Stack>
      );
    }

    // Concept card answer section
    return (
      <Stack spacing={2}>
        {/* Review Answer */}
        {item.reviewAnswer && (
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Answer:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {item.reviewAnswer}
            </Typography>
          </Box>
        )}

        {/* Key Insight */}
        {item.keyInsight && (
          <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1, opacity: 0.9 }}>
            <Typography variant="body2" color="warning.dark" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <LightbulbIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Key Insight:
            </Typography>
            <Typography variant="body1" sx={{ color: 'warning.dark', fontStyle: 'italic' }}>
              {item.keyInsight}
            </Typography>
          </Box>
        )}

        {/* Fallback: show title if no LLM content */}
        {!item.reviewAnswer && item.itemTitle && (
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Concept Title:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {item.itemTitle}
            </Typography>
          </Box>
        )}

        {/* Show original concept text if we showed a question */}
        {item.reviewQuestion && (
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Original Concept:
            </Typography>
            <Typography variant="body2">
              {item.conceptText}
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Card 
      sx={{ 
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: isConfusion ? 'warning.main' : 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: isConfusion ? 'warning.dark' : 'primary.main',
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={isConfusion ? 'confusion' : item.masteryState} 
              size="small" 
              color={isConfusion ? 'warning' : masteryColors[item.masteryState] || 'default'}
            />
            {item.priority === 1 && (
              <Chip label="First Review" size="small" color="error" variant="outlined" />
            )}
            {hasLLMContent && (
              <Chip 
                icon={<CheckCircleIcon />} 
                label="AI Enhanced" 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {item.totalReviews} reviews
          </Typography>
        </Box>

        {/* Front Content (Question/Confusion) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
          {frontContent.label && (
            <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {frontContent.icon}
              {frontContent.label}
            </Typography>
          )}
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              fontWeight: 500,
              lineHeight: 1.6,
              maxHeight: 180,
              overflow: 'auto',
              px: 2
            }}
          >
            {frontContent.content}
          </Typography>
        </Box>

        {/* Pre-reveal section: Confidence & Optional Recall Input */}
        {!showAnswer && (
          <Fade in={!showAnswer}>
            <Box sx={{ mt: 2 }}>
              {/* Confidence BEFORE reveal */}
              <Box sx={{ px: 2, mb: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                  How confident are you? (before seeing answer)
                </Typography>
                <Slider
                  value={confidenceBefore}
                  onChange={(_event: Event, value: number | number[]) => setConfidenceBefore(value as number)}
                  step={1}
                  marks={confidenceMarks}
                  min={1}
                  max={5}
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Optional: Type your recall (only for concepts with questions) */}
              {!isConfusion && item.reviewQuestion && (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="(Optional) Type your recall before revealing..."
                  value={founderAnswer}
                  onChange={(e) => setFounderAnswer(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
          </Fade>
        )}

        {/* Answer Section */}
        <Collapse in={showAnswer}>
          <Divider sx={{ my: 2 }} />
          {renderAnswerSection()}
          
          {/* Confidence AFTER reveal */}
          <Box sx={{ px: 2, mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
              How confident are you now? (after seeing answer)
            </Typography>
            <Slider
              value={confidenceAfter}
              onChange={(_event: Event, value: number | number[]) => setConfidenceAfter(value as number)}
              step={1}
              marks={confidenceMarks}
              min={1}
              max={5}
              valueLabelDisplay="auto"
              sx={{ mt: 1 }}
            />
          </Box>
        </Collapse>

        {/* Actions */}
        <Box sx={{ mt: 3 }}>
          {!showAnswer ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<VisibilityIcon />}
                onClick={handleShowAnswer}
                disabled={!!loading}
                sx={{ py: 1.5, flex: 2 }}
              >
                Show Answer
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleGiveUp}
                disabled={!!loading}
                sx={{ py: 1.5 }}
              >
                Give Up
              </Button>
            </Stack>
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
                {isConfusion ? 'Did this clarify your confusion?' : 'How well did you recall this?'}
              </Typography>
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                {qualityButtons.map(({ quality, label, icon, color }) => (
                  <Button
                    key={quality}
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : icon}
                    onClick={() => handleRate(quality)}
                    disabled={!!loading}
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      borderColor: color,
                      color: color,
                      '&:hover': {
                        borderColor: color,
                        bgcolor: `${color}15`
                      }
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
