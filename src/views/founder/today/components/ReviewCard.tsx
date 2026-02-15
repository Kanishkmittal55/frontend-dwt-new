/**
 * ReviewCard Component — Enhanced Multi-Step Review
 *
 * Flow for concepts (up to 3 question types):
 *   Show concept → Q1 (MCQ) → Feedback → Q2 (Recall) → Feedback
 *   → Q3 (Apply) → Feedback → Overall rating → Next concept
 *
 * Flow for confusion items:
 *   Show confusion → Reveal clarification → Rate
 *
 * Steps are conditional — only shown when the corresponding data exists.
 * A single overall SM-2 quality rating is submitted at the end.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Fade from '@mui/material/Fade';
import LinearProgress from '@mui/material/LinearProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

// Icons
import ReplayIcon from '@mui/icons-material/Replay';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QuizIcon from '@mui/icons-material/Quiz';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PsychologyIcon from '@mui/icons-material/Psychology';

import type { RevisionQueueItem } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

/** Review submission parameters */
export interface ReviewSubmitParams {
  quality: 1 | 2 | 3 | 4;
  timeSpentMs: number;
  timeToRevealMs: number;
  timeToRateMs: number;
  founderAnswer: string | undefined;
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

/** Types of steps in the multi-step review */
type StepKind = 'mcq' | 'recall' | 'apply' | 'rate';

interface StepDef {
  kind: StepKind;
  label: string;
  icon: React.ReactNode;
}

/** Per-step result tracked during review */
interface StepResult {
  correct: boolean | null; // null = not yet answered
  answerGiven: string;
  timeMs: number;
}

// ============================================================================
// Constants
// ============================================================================

const qualityButtons = [
  { quality: 1 as const, label: 'Again', icon: <ReplayIcon />, color: '#f44336', description: 'Forgot completely' },
  { quality: 2 as const, label: 'Hard', icon: <ThumbDownIcon />, color: '#ff9800', description: 'Remembered with difficulty' },
  { quality: 3 as const, label: 'Good', icon: <ThumbUpIcon />, color: '#4caf50', description: 'Remembered correctly' },
  { quality: 4 as const, label: 'Easy', icon: <RocketLaunchIcon />, color: '#2196f3', description: 'Perfect recall' },
];

const masteryColors: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
  new: 'default',
  learning: 'warning',
  mastered: 'info',
  graduated: 'success',
};

const confidenceMarks = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

// ============================================================================
// Component
// ============================================================================

export default function ReviewCard({ item, onSubmit, loading }: ReviewCardProps) {
  const isConfusion = item.itemType === 'confusion';

  // Build the list of steps available for this item
  const steps: StepDef[] = useMemo(() => {
    if (isConfusion) {
      // Confusion items: single reveal-and-rate flow (handled separately)
      return [{ kind: 'rate' as StepKind, label: 'Rate', icon: <LightbulbIcon /> }];
    }
    const s: StepDef[] = [];
    if (item.mcqQuestion && item.mcqOptions && item.mcqOptions.length > 0) {
      s.push({ kind: 'mcq', label: 'Multiple Choice', icon: <QuizIcon /> });
    }
    if (item.reviewQuestion) {
      s.push({ kind: 'recall', label: 'Recall', icon: <EditNoteIcon /> });
    }
    if (item.applicationQuestion) {
      s.push({ kind: 'apply', label: 'Apply', icon: <PsychologyIcon /> });
    }
    s.push({ kind: 'rate', label: 'Overall Rating', icon: <CheckCircleIcon /> });
    return s;
  }, [item, isConfusion]);

  // State
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  // MCQ state
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);

  // Recall state
  const [recallAnswer, setRecallAnswer] = useState('');
  const [recallRevealed, setRecallRevealed] = useState(false);

  // Apply state
  const [applyAnswer, setApplyAnswer] = useState('');
  const [applyRevealed, setApplyRevealed] = useState(false);
  const [applyHintShown, setApplyHintShown] = useState(false);

  // Confusion flow (legacy-ish)
  const [confusionRevealed, setConfusionRevealed] = useState(false);

  // Confidence
  const [confidenceBefore, setConfidenceBefore] = useState(3);
  const [confidenceAfter, setConfidenceAfter] = useState(3);

  // Give-up flag
  const [gaveUp, setGaveUp] = useState(false);

  // Step results
  const [stepResults, setStepResults] = useState<StepResult[]>([]);

  // Timing
  const cardShownAt = useRef<number>(Date.now());
  const stepStartAt = useRef<number>(Date.now());
  const firstRevealAt = useRef<number | null>(null);

  // Derived
  const currentStep: StepDef = steps[currentStepIdx] ?? steps[steps.length - 1]!;
  const isLastQuestionStep = currentStepIdx >= steps.length - 2; // last before 'rate'
  const progressPercent = ((currentStepIdx + (showFeedback ? 0.5 : 0)) / steps.length) * 100;

  // Has any enriched content at all?
  const hasEnrichedContent = !!(item.mcqQuestion || item.reviewQuestion || item.applicationQuestion);

  // Reset when item changes
  useEffect(() => {
    setCurrentStepIdx(0);
    setShowFeedback(false);
    setMcqSelected(null);
    setMcqSubmitted(false);
    setRecallAnswer('');
    setRecallRevealed(false);
    setApplyAnswer('');
    setApplyRevealed(false);
    setApplyHintShown(false);
    setConfusionRevealed(false);
    setConfidenceBefore(3);
    setConfidenceAfter(3);
    setGaveUp(false);
    setStepResults([]);
    cardShownAt.current = Date.now();
    stepStartAt.current = Date.now();
    firstRevealAt.current = null;
  }, [item.itemUUID]);

  // Record step result
  const recordStepResult = useCallback(
    (correct: boolean | null, answerGiven: string) => {
      const elapsed = Date.now() - stepStartAt.current;
      setStepResults((prev) => [...prev, { correct, answerGiven, timeMs: elapsed }]);
      if (!firstRevealAt.current) firstRevealAt.current = Date.now();
    },
    [],
  );

  // Advance to next step
  const advanceStep = useCallback(() => {
    setShowFeedback(false);
    setCurrentStepIdx((prev) => Math.min(prev + 1, steps.length - 1));
    stepStartAt.current = Date.now();
  }, [steps.length]);

  // --- MCQ handlers ---
  const handleMCQSubmit = useCallback(() => {
    if (mcqSelected === null) return;
    setMcqSubmitted(true);
    setShowFeedback(true);
    const isCorrect = mcqSelected === item.mcqCorrectIdx;
    recordStepResult(isCorrect, String(mcqSelected));
  }, [mcqSelected, item.mcqCorrectIdx, recordStepResult]);

  // --- Recall handlers ---
  const handleRecallReveal = useCallback(() => {
    setRecallRevealed(true);
    setShowFeedback(true);
    recordStepResult(null, recallAnswer); // self-assessed, no auto-grading
  }, [recallAnswer, recordStepResult]);

  // --- Apply handlers ---
  const handleApplyReveal = useCallback(() => {
    setApplyRevealed(true);
    setShowFeedback(true);
    recordStepResult(null, applyAnswer);
  }, [applyAnswer, recordStepResult]);

  // --- Confusion handlers ---
  const handleConfusionReveal = useCallback(() => {
    setConfusionRevealed(true);
    firstRevealAt.current = Date.now();
  }, []);

  // --- Final rating ---
  const handleRate = useCallback(
    (quality: 1 | 2 | 3 | 4) => {
      const now = Date.now();
      const timeToRevealMs = firstRevealAt.current ? firstRevealAt.current - cardShownAt.current : 0;
      const timeToRateMs = firstRevealAt.current ? now - firstRevealAt.current : 0;
      const totalTimeMs = now - cardShownAt.current;

      // Collect all typed answers
      const allAnswers = stepResults.map((r) => r.answerGiven).filter(Boolean);

      onSubmit({
        quality,
        timeSpentMs: totalTimeMs,
        timeToRevealMs,
        timeToRateMs,
        founderAnswer: allAnswers.join(' | ') || undefined,
        confidenceBefore,
        confidenceAfter,
        hintRequested: applyHintShown,
        gaveUp,
      });
    },
    [onSubmit, stepResults, confidenceBefore, confidenceAfter, applyHintShown, gaveUp],
  );

  // ============================================================================
  // Render helpers
  // ============================================================================

  /** Header with mastery chip, review count, progress bar */
  const renderHeader = () => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={isConfusion ? 'confusion' : item.masteryState}
            size="small"
            color={isConfusion ? 'warning' : masteryColors[item.masteryState] || 'default'}
          />
          {item.priority === 1 && <Chip label="First Review" size="small" color="error" variant="outlined" />}
          {hasEnrichedContent && (
            <Chip icon={<CheckCircleIcon />} label="AI Enhanced" size="small" color="success" variant="outlined" />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {item.totalReviews} reviews
        </Typography>
      </Box>

      {/* Step progress bar (only for multi-step concepts) */}
      {!isConfusion && steps.length > 2 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Step {currentStepIdx + 1} of {steps.length}: {currentStep.label}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {steps.map((s, i) => (
                <Box
                  key={s.kind + i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor:
                      i < currentStepIdx
                        ? 'success.main'
                        : i === currentStepIdx
                          ? 'primary.main'
                          : 'grey.300',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </Stack>
          </Box>
          <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 4, borderRadius: 2 }} />
        </Box>
      )}
    </Box>
  );

  /** Concept title shown at the top of every step */
  const renderConceptBanner = () => (
    <Box
      sx={{
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        px: 2,
        py: 1.5,
        mb: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Concept:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {item.itemTitle || item.conceptText}
      </Typography>
    </Box>
  );

  // --- MCQ Step ---
  const renderMCQStep = () => (
    <Fade in key="mcq">
      <Box>
        {renderConceptBanner()}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <QuizIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Multiple Choice
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
          {item.mcqQuestion}
        </Typography>

        <RadioGroup
          value={mcqSelected !== null ? String(mcqSelected) : ''}
          onChange={(e) => !mcqSubmitted && setMcqSelected(Number(e.target.value))}
        >
          {(item.mcqOptions || []).map((opt, idx) => {
            const isCorrect = idx === item.mcqCorrectIdx;
            const isSelected = mcqSelected === idx;
            let bgcolor = 'transparent';
            let borderColor = 'divider';
            if (mcqSubmitted) {
              if (isCorrect) {
                bgcolor = '#e8f5e9';
                borderColor = '#4caf50';
              } else if (isSelected && !isCorrect) {
                bgcolor = '#ffebee';
                borderColor = '#f44336';
              }
            }

            return (
              <Box
                key={idx}
                sx={{
                  border: '1px solid',
                  borderColor,
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  mb: 1,
                  bgcolor,
                  transition: 'all 0.2s',
                  cursor: mcqSubmitted ? 'default' : 'pointer',
                  '&:hover': mcqSubmitted ? {} : { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <FormControlLabel
                  value={String(idx)}
                  control={<Radio disabled={mcqSubmitted} size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{opt}</Typography>
                      {mcqSubmitted && isCorrect && <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />}
                      {mcqSubmitted && isSelected && !isCorrect && (
                        <CancelIcon sx={{ color: 'error.main', fontSize: 18 }} />
                      )}
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
            );
          })}
        </RadioGroup>

        {/* Submit / Feedback */}
        {!mcqSubmitted ? (
          <Button
            variant="contained"
            fullWidth
            disabled={mcqSelected === null}
            onClick={handleMCQSubmit}
            sx={{ mt: 1 }}
          >
            Check Answer
          </Button>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Feedback banner */}
            <Box
              sx={{
                bgcolor: mcqSelected === item.mcqCorrectIdx ? '#e8f5e9' : '#fff3e0',
                p: 2,
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ color: mcqSelected === item.mcqCorrectIdx ? 'success.dark' : 'warning.dark', mb: 0.5 }}
              >
                {mcqSelected === item.mcqCorrectIdx ? '✅ Correct!' : '❌ Not quite'}
              </Typography>
              {item.mcqExplanation && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.mcqExplanation}
                </Typography>
              )}
            </Box>
            <Button variant="contained" fullWidth endIcon={<ArrowForwardIcon />} onClick={advanceStep}>
              {isLastQuestionStep ? 'Rate Your Understanding' : 'Next Question'}
            </Button>
          </Box>
        )}
      </Box>
    </Fade>
  );

  // --- Recall Step ---
  const renderRecallStep = () => (
    <Fade in key="recall">
      <Box>
        {renderConceptBanner()}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EditNoteIcon sx={{ color: 'secondary.main', mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Active Recall
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
          {item.reviewQuestion}
        </Typography>

        {!recallRevealed && (
          <>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Type what you remember... (optional)"
              value={recallAnswer}
              onChange={(e) => setRecallAnswer(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" fullWidth onClick={handleRecallReveal} sx={{ flex: 2 }}>
                Reveal Answer
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setGaveUp(true);
                  handleRecallReveal();
                }}
              >
                Give Up
              </Button>
            </Stack>
          </>
        )}

        {recallRevealed && (
          <Box sx={{ mt: 2 }}>
            {/* Answer */}
            {item.reviewAnswer && (
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Expected Answer:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {item.reviewAnswer}
                </Typography>
              </Box>
            )}

            {/* Key Insight */}
            {item.keyInsight && (
              <Box sx={{ bgcolor: '#fff8e1', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', color: 'warning.dark' }}
                >
                  <LightbulbIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Key Insight
                </Typography>
                <Typography variant="body2" sx={{ color: 'warning.dark', fontStyle: 'italic', mt: 0.5 }}>
                  {item.keyInsight}
                </Typography>
              </Box>
            )}

            <Button variant="contained" fullWidth endIcon={<ArrowForwardIcon />} onClick={advanceStep}>
              {isLastQuestionStep ? 'Rate Your Understanding' : 'Next Question'}
            </Button>
          </Box>
        )}
      </Box>
    </Fade>
  );

  // --- Application Step ---
  const renderApplyStep = () => (
    <Fade in key="apply">
      <Box>
        {renderConceptBanner()}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PsychologyIcon sx={{ color: 'info.main', mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Apply It
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
          {item.applicationQuestion}
        </Typography>

        {!applyRevealed && (
          <>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Think through your answer... (optional)"
              value={applyAnswer}
              onChange={(e) => setApplyAnswer(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />

            {/* Hint toggle */}
            {item.applicationHint && !applyHintShown && (
              <Button
                variant="text"
                size="small"
                onClick={() => setApplyHintShown(true)}
                sx={{ mb: 1, textTransform: 'none' }}
              >
                💡 Show hint
              </Button>
            )}
            {applyHintShown && item.applicationHint && (
              <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'info.dark' }}>
                  Hint: {item.applicationHint}
                </Typography>
              </Box>
            )}

            <Button variant="contained" fullWidth onClick={handleApplyReveal}>
              Reveal Answer
            </Button>
          </>
        )}

        {applyRevealed && (
          <Box sx={{ mt: 2 }}>
            {item.applicationAnswer && (
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Model Answer:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {item.applicationAnswer}
                </Typography>
              </Box>
            )}

            <Button variant="contained" fullWidth endIcon={<ArrowForwardIcon />} onClick={advanceStep}>
              Rate Your Understanding
            </Button>
          </Box>
        )}
      </Box>
    </Fade>
  );

  // --- Rate Step ---
  const renderRateStep = () => {
    // Calculate a summary from step results
    const mcqResult = stepResults.find((_, i) => steps[i]?.kind === 'mcq');
    const totalQuestions = stepResults.length;
    const correctCount = stepResults.filter((r) => r.correct === true).length;

    return (
      <Fade in key="rate">
        <Box>
          {renderConceptBanner()}

          {/* Summary of question performance */}
          {totalQuestions > 0 && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Session Summary
              </Typography>
              <Stack direction="row" spacing={2}>
                {mcqResult && (
                  <Chip
                    icon={mcqResult.correct ? <CheckCircleIcon /> : <CancelIcon />}
                    label={`MCQ: ${mcqResult.correct ? 'Correct' : 'Incorrect'}`}
                    size="small"
                    color={mcqResult.correct ? 'success' : 'error'}
                    variant="outlined"
                  />
                )}
                {steps.some((s) => s.kind === 'recall') && (
                  <Chip label="Recall: Self-assessed" size="small" variant="outlined" />
                )}
                {steps.some((s) => s.kind === 'apply') && (
                  <Chip label="Apply: Self-assessed" size="small" variant="outlined" />
                )}
              </Stack>
              {mcqResult && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {correctCount} of {totalQuestions} auto-graded correct • Use your overall feel to rate below
                </Typography>
              )}
            </Box>
          )}

          {/* Confidence AFTER */}
          <Box sx={{ px: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
              How well do you understand this concept now?
            </Typography>
            <Slider
              value={confidenceAfter}
              onChange={(_e: Event, v: number | number[]) => setConfidenceAfter(v as number)}
              step={1}
              marks={confidenceMarks}
              min={1}
              max={5}
              valueLabelDisplay="auto"
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            Overall: how well did you know this?
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
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
                  '&:hover': { borderColor: color, bgcolor: `${color}15` },
                }}
              >
                {label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Fade>
    );
  };

  // --- Confusion flow (standalone, not multi-step) ---
  const renderConfusionFlow = () => (
    <Box>
      {/* Confusion header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
          mb: 2,
        }}
      >
        <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <HelpOutlineIcon sx={{ color: 'warning.main', mr: 1 }} />
          Your Confusion:
        </Typography>
        <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 500, lineHeight: 1.6, px: 2 }}>
          {item.conceptText}
        </Typography>
      </Box>

      {/* Pre-reveal confidence */}
      {!confusionRevealed && (
        <Fade in>
          <Box>
            <Box sx={{ px: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                How confident are you? (before seeing answer)
              </Typography>
              <Slider
                value={confidenceBefore}
                onChange={(_e: Event, v: number | number[]) => setConfidenceBefore(v as number)}
                step={1}
                marks={confidenceMarks}
                min={1}
                max={5}
                valueLabelDisplay="auto"
                sx={{ mt: 1 }}
              />
            </Box>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleConfusionReveal}
              sx={{ py: 1.5 }}
            >
              Show Clarification
            </Button>
          </Box>
        </Fade>
      )}

      {/* Post-reveal */}
      {confusionRevealed && (
        <Fade in>
          <Box>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {item.clarificationAnswer && (
                <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="success.dark" gutterBottom sx={{ fontWeight: 600 }}>
                    💡 Clarification:
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'success.dark' }}>
                    {item.clarificationAnswer}
                  </Typography>
                </Box>
              )}
              {item.followUpCheck && (
                <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="info.dark" gutterBottom sx={{ fontWeight: 600 }}>
                    ✅ Check Understanding:
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'info.dark' }}>
                    {item.followUpCheck}
                  </Typography>
                </Box>
              )}
              {item.relatedConcepts && item.relatedConcepts.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Related: {item.relatedConcepts.join(', ')}
                </Typography>
              )}
            </Stack>

            {/* Confidence after */}
            <Box sx={{ px: 2, mt: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                How confident now? (after clarification)
              </Typography>
              <Slider
                value={confidenceAfter}
                onChange={(_e: Event, v: number | number[]) => setConfidenceAfter(v as number)}
                step={1}
                marks={confidenceMarks}
                min={1}
                max={5}
                valueLabelDisplay="auto"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Rate */}
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mb: 1 }}
              >
                Did this clarify your confusion?
              </Typography>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
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
                      '&:hover': { borderColor: color, bgcolor: `${color}15` },
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );

  // --- Fallback: no enriched data (simple card) ---
  const renderSimpleFallback = () => (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, mb: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
          Concept:
        </Typography>
        <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 500, lineHeight: 1.6, px: 2 }}>
          {item.conceptText}
        </Typography>
      </Box>

      {/* Confidence before */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
          How confident are you?
        </Typography>
        <Slider
          value={confidenceBefore}
          onChange={(_e: Event, v: number | number[]) => setConfidenceBefore(v as number)}
          step={1}
          marks={confidenceMarks}
          min={1}
          max={5}
          valueLabelDisplay="auto"
          sx={{ mt: 1 }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
        How well do you know this?
      </Typography>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
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
              '&:hover': { borderColor: color, bgcolor: `${color}15` },
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Box>
  );

  // ============================================================================
  // Render the current step
  // ============================================================================

  const renderCurrentStep = () => {
    // Confusion items: use dedicated flow
    if (isConfusion) return renderConfusionFlow();

    // Concepts with no enriched content: simple fallback
    if (!hasEnrichedContent) return renderSimpleFallback();

    // Multi-step for enriched concepts
    switch (currentStep.kind) {
      case 'mcq':
        return renderMCQStep();
      case 'recall':
        return renderRecallStep();
      case 'apply':
        return renderApplyStep();
      case 'rate':
        return renderRateStep();
      default:
        return renderSimpleFallback();
    }
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
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderHeader()}
        {renderCurrentStep()}
      </CardContent>
    </Card>
  );
}
