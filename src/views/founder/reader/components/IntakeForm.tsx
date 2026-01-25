/**
 * IntakeForm Component
 * Multi-step intake form to gather user's learning intent and preferences
 * Used by the tutor agent to personalize content
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconSparkles,
  IconArrowRight,
  IconChevronLeft,
  IconCheck,
  IconTargetArrow,
  IconClock,
  IconScale,
  IconBrain,
  IconMoodSmile,
  IconShield
} from '@tabler/icons-react';

import type { IntakeQuestion, IntakeProgress } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface IntakeFormProps {
  question: IntakeQuestion | null;
  progress: IntakeProgress | null;
  onAnswer: (questionId: string, answer: any) => void;
  onSkip: () => void;
  onComplete: () => void;
  loading?: boolean;
}

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  motivation: <IconTargetArrow size={20} />,
  urgency: <IconClock size={20} />,
  stakes: <IconScale size={20} />,
  context: <IconBrain size={20} />,
  identity: <IconMoodSmile size={20} />,
  emotion: <IconMoodSmile size={20} />,
  proof: <IconShield size={20} />
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  motivation: '#22c55e',
  urgency: '#f59e0b',
  stakes: '#ef4444',
  context: '#3b82f6',
  identity: '#8b5cf6',
  emotion: '#ec4899',
  proof: '#06b6d4'
};

// ============================================================================
// Component
// ============================================================================

export default function IntakeForm({
  question,
  progress,
  onAnswer,
  onSkip,
  onComplete,
  loading = false
}: IntakeFormProps) {
  const theme = useTheme();
  const [answer, setAnswer] = useState<string>('');
  const [scaleValue, setScaleValue] = useState<number>(5);
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Reset form when question changes
  useEffect(() => {
    setAnswer('');
    setScaleValue(5);
    setSelectedOption('');
  }, [question?.questionId]);

  // Track if we've auto-completed to prevent multiple calls - use ref to persist across re-renders
  const hasAutoCompletedRef = useRef(false);
  const autoCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // #region agent log - trace every progress update
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IntakeForm.tsx:progressEffect',message:'[DEBUG-B1] Progress prop changed',data:{completionPercent:progress?.completionPercent,hasAutoCompleted:hasAutoCompletedRef.current,questionId:question?.questionId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B1'})}).catch(()=>{});
  }, [progress, question]);
  // #endregion

  // Cleanup timer only on unmount
  useEffect(() => {
    return () => {
      if (autoCompleteTimerRef.current) {
        clearTimeout(autoCompleteTimerRef.current);
      }
    };
  }, []);

  // Auto-complete when progress reaches 100%
  useEffect(() => {
    // #region agent log - trace auto-complete evaluation
    fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IntakeForm.tsx:autoCompleteEval',message:'[DEBUG-B2] Auto-complete useEffect running',data:{completionPercent:progress?.completionPercent,hasAutoCompleted:hasAutoCompletedRef.current,willTrigger:progress?.completionPercent===100&&!hasAutoCompletedRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B2'})}).catch(()=>{});
    // #endregion
    if (progress?.completionPercent === 100 && !hasAutoCompletedRef.current) {
      // All questions answered, auto-complete after a brief delay to show completion
      console.log('[IntakeForm] Auto-completing intake at 100%');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IntakeForm.tsx:useEffect',message:'[DEBUG-B] Auto-complete triggered at 100%',data:{completionPercent:progress?.completionPercent},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      hasAutoCompletedRef.current = true;
      autoCompleteTimerRef.current = setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IntakeForm.tsx:timeout',message:'[DEBUG-B] Calling onComplete after 500ms delay',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        onComplete();
      }, 500); // Small delay so user sees 100%
      // NOTE: Timer is NOT cleared on re-renders, only on unmount
    }
  }, [progress?.completionPercent, onComplete]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!question) return;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5925181f-f3ab-4e65-9d22-4816135abe26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IntakeForm.tsx:handleSubmit',message:'[DEBUG-B3] handleSubmit called',data:{questionId:question.questionId,currentProgress:progress?.completionPercent},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B3'})}).catch(()=>{});
    // #endregion

    let value: any;
    switch (question.questionType) {
      case 'open_ended':
        value = answer.trim();
        break;
      case 'scale':
        value = scaleValue;
        break;
      case 'multiple_choice':
        value = selectedOption;
        break;
      default:
        value = answer;
    }

    if (!value && !question.skipAllowed) return;
    onAnswer(question.questionId, value);
  }, [question, answer, scaleValue, selectedOption, onAnswer]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (question?.skipAllowed) {
      onAnswer(question.questionId, null);
    }
  }, [question, onAnswer]);

  // Check if can submit
  const canSubmit = useCallback(() => {
    if (!question) return false;
    switch (question.questionType) {
      case 'open_ended':
        return answer.trim().length > 0;
      case 'scale':
        return true;
      case 'multiple_choice':
        return selectedOption.length > 0;
      default:
        return false;
    }
  }, [question, answer, selectedOption]);

  // No question state
  if (!question) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          p: 4,
          textAlign: 'center'
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}
        >
          <IconSparkles size={36} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
          Let's Personalize Your Learning
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
          Answer a few quick questions so we can tailor the content to your goals and learning style
        </Typography>
      </Box>
    );
  }

  const categoryColor = CATEGORY_COLORS[question.category] || theme.palette.primary.main;
  const categoryIcon = CATEGORY_ICONS[question.category] || <IconSparkles size={20} />;

  return (
    <Fade in key={question.questionId}>
      <Box
        sx={{
          maxWidth: 640,
          mx: 'auto',
          p: 4,
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Progress Header */}
        {progress && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Question {Math.min(progress.questionsAnswered + 1, progress.totalQuestions)} of {progress.totalQuestions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.completionPercent}% complete
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.completionPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(categoryColor, 0.15),
                '& .MuiLinearProgress-bar': {
                  bgcolor: categoryColor,
                  borderRadius: 3
                }
              }}
            />
          </Box>
        )}

        {/* Category Badge */}
        <Chip
          icon={categoryIcon}
          label={question.category.charAt(0).toUpperCase() + question.category.slice(1)}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            mb: 2,
            bgcolor: alpha(categoryColor, 0.1),
            color: categoryColor,
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            '& .MuiChip-icon': { color: categoryColor }
          }}
        />

        {/* Question */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 1,
            lineHeight: 1.4,
            color: theme.palette.text.primary
          }}
        >
          {question.questionText}
        </Typography>

        {/* Why We're Asking */}
        {question.whyAsking && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 3,
              fontStyle: 'italic'
            }}
          >
            {question.whyAsking}
          </Typography>
        )}

        {/* Answer Input */}
        <Box sx={{ flex: 1, my: 2 }}>
          {question.questionType === 'open_ended' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              variant="outlined"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: categoryColor,
                      borderWidth: 2
                    }
                  }
                }
              }}
            />
          )}

          {question.questionType === 'scale' && (
            <Box sx={{ px: 2, py: 3 }}>
              <Slider
                value={scaleValue}
                onChange={(_, value) => setScaleValue(value as number)}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
                valueLabelDisplay="on"
                disabled={loading}
                sx={{
                  color: categoryColor,
                  '& .MuiSlider-thumb': {
                    width: 24,
                    height: 24,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0 0 0 8px ${alpha(categoryColor, 0.16)}`
                    }
                  },
                  '& .MuiSlider-valueLabel': {
                    bgcolor: categoryColor
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Low
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  High
                </Typography>
              </Box>
            </Box>
          )}

          {question.questionType === 'multiple_choice' && question.options && (
            <FormControl component="fieldset" disabled={loading}>
              <RadioGroup
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              >
                <Stack spacing={1.5}>
                  {question.options.map((option, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={option}
                      control={
                        <Radio
                          sx={{
                            color: theme.palette.text.secondary,
                            '&.Mui-checked': { color: categoryColor }
                          }}
                        />
                      }
                      label={option}
                      sx={{
                        m: 0,
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${selectedOption === option ? categoryColor : theme.palette.divider}`,
                        bgcolor: selectedOption === option ? alpha(categoryColor, 0.05) : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha(categoryColor, 0.05)
                        },
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.9375rem',
                          color: selectedOption === option ? categoryColor : theme.palette.text.primary
                        }
                      }}
                    />
                  ))}
                </Stack>
              </RadioGroup>
            </FormControl>
          )}
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
          {question.skipAllowed ? (
            <Button
              variant="text"
              onClick={handleSkip}
              disabled={loading}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Skip this question
            </Button>
          ) : (
            <Box />
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit() || loading || progress?.completionPercent === 100}
            endIcon={<IconArrowRight size={18} />}
            sx={{
              bgcolor: categoryColor,
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: `0 4px 14px ${alpha(categoryColor, 0.35)}`,
              '&:hover': {
                bgcolor: alpha(categoryColor, 0.9),
                boxShadow: `0 6px 20px ${alpha(categoryColor, 0.4)}`
              }
            }}
          >
            Continue
          </Button>
        </Stack>

        {/* Complete Early Option */}
        {progress && progress.questionsAnswered >= 3 && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onComplete}
              startIcon={<IconCheck size={16} />}
              sx={{
                borderColor: theme.palette.divider,
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '0.8125rem',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              That's enough, start learning
            </Button>
          </Box>
        )}
      </Box>
    </Fade>
  );
}

