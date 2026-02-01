/**
 * QuizView Component
 * Interactive quiz component with MCQ questions
 */
import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconCheck,
  IconX,
  IconChevronRight,
  IconArrowBack,
  IconBulb,
  IconTrophy,
  IconRefresh,
  IconClock
} from '@tabler/icons-react';

import type { CourseQuiz, QuizQuestion } from '@/api/founder/schemas';

// ============================================================================
// Types
// ============================================================================

interface QuizViewProps {
  quiz: CourseQuiz;
  open: boolean;
  onClose: () => void;
  onComplete: (score: number, passed: boolean) => void;
}

interface QuestionResult {
  questionIdx: number;
  selectedIdx: number;
  correctIdx: number;
  isCorrect: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function QuizView({
  quiz,
  open,
  onClose,
  onComplete
}: QuizViewProps) {
  const theme = useTheme();

  // State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Current question
  const currentQuestion = quiz.questions[currentQuestionIdx];
  const totalQuestions = quiz.questions.length;
  const progressPercent = ((currentQuestionIdx + 1) / totalQuestions) * 100;

  // Calculate score
  const score = useMemo(() => {
    if (results.length === 0) return 0;
    const correct = results.filter(r => r.isCorrect).length;
    return Math.round((correct / results.length) * 100);
  }, [results]);

  const passed = useMemo(() => {
    const passingScore = quiz.passing_score ?? 0.7;
    return score >= passingScore * 100;
  }, [score, quiz.passing_score]);

  // Handle answer selection
  const handleSelectAnswer = useCallback((idx: number) => {
    if (showExplanation) return; // Don't allow changing after reveal
    setSelectedAnswer(idx);
  }, [showExplanation]);

  // Handle check answer
  const handleCheckAnswer = useCallback(() => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_idx;
    const result: QuestionResult = {
      questionIdx: currentQuestionIdx,
      selectedIdx: selectedAnswer,
      correctIdx: currentQuestion.correct_idx,
      isCorrect
    };

    setResults(prev => [...prev, result]);
    setShowExplanation(true);
  }, [selectedAnswer, currentQuestion, currentQuestionIdx]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      onComplete(score, passed);
    }
  }, [currentQuestionIdx, totalQuestions, score, passed, onComplete]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setResults([]);
    setQuizCompleted(false);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    handleRestart();
    onClose();
  }, [handleRestart, onClose]);

  // Get difficulty color
  const getDifficultyColor = (difficulty: string | null | undefined) => {
    switch (difficulty) {
      case 'easy':
        return theme.palette.success.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'hard':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.default, 0.99)} 100%)`,
          backdropFilter: 'blur(20px)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleClose} size="small">
            <IconArrowBack size={20} />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>
            Quiz
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {quiz.time_limit_seconds && quiz.time_limit_seconds > 0 && (
            <Chip
              size="small"
              icon={<IconClock size={14} />}
              label={`${Math.floor(quiz.time_limit_seconds / 60)} min`}
              variant="outlined"
            />
          )}
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIdx + 1} of {totalQuestions}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Progress */}
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: quizCompleted
                ? (passed ? theme.palette.success.main : theme.palette.error.main)
                : theme.palette.primary.main
            }
          }}
        />

        {/* Quiz Completed View */}
        {quizCompleted ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 4
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: passed
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.error.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              {passed ? (
                <IconTrophy size={56} color={theme.palette.success.main} />
              ) : (
                <IconX size={56} color={theme.palette.error.main} />
              )}
            </Box>

            <Typography variant="h3" fontWeight={700} gutterBottom>
              {score}%
            </Typography>

            <Typography
              variant="h6"
              color={passed ? 'success.main' : 'error.main'}
              gutterBottom
            >
              {passed ? 'Congratulations! You passed!' : 'Keep practicing!'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You answered {results.filter(r => r.isCorrect).length} out of {totalQuestions} questions correctly
            </Typography>

            {/* Results Summary */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mb: 4
              }}
            >
              {results.map((result, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: result.isCorrect
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.error.main, 0.15),
                    color: result.isCorrect
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {idx + 1}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={handleRestart}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                onClick={handleClose}
              >
                Done
              </Button>
            </Box>
          </Box>
        ) : (
          /* Question View */
          <Box sx={{ p: 4 }}>
            {/* Question Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {currentQuestion.difficulty && (
                <Chip
                  size="small"
                  label={currentQuestion.difficulty}
                  sx={{
                    textTransform: 'capitalize',
                    bgcolor: alpha(getDifficultyColor(currentQuestion.difficulty), 0.1),
                    color: getDifficultyColor(currentQuestion.difficulty),
                    fontWeight: 500
                  }}
                />
              )}
              {currentQuestion.concept && (
                <Chip
                  size="small"
                  icon={<IconBulb size={14} />}
                  label={currentQuestion.concept}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Question Text */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              {currentQuestion.question}
            </Typography>

            {/* Options */}
            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => handleSelectAnswer(parseInt(e.target.value))}
            >
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentQuestion.correct_idx;
                const showResult = showExplanation;

                let borderColor = theme.palette.divider;
                let bgColor = 'transparent';

                if (showResult) {
                  if (isCorrect) {
                    borderColor = theme.palette.success.main;
                    bgColor = alpha(theme.palette.success.main, 0.08);
                  } else if (isSelected && !isCorrect) {
                    borderColor = theme.palette.error.main;
                    bgColor = alpha(theme.palette.error.main, 0.08);
                  }
                } else if (isSelected) {
                  borderColor = theme.palette.primary.main;
                  bgColor = alpha(theme.palette.primary.main, 0.04);
                }

                return (
                  <Card
                    key={idx}
                    variant="outlined"
                    sx={{
                      mb: 1.5,
                      cursor: showExplanation ? 'default' : 'pointer',
                      borderColor,
                      bgcolor: bgColor,
                      transition: 'all 0.2s',
                      '&:hover': !showExplanation ? {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                      } : {}
                    }}
                    onClick={() => handleSelectAnswer(idx)}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <FormControlLabel
                        value={idx}
                        control={
                          <Radio
                            disabled={showExplanation}
                            sx={{
                              '&.Mui-checked': {
                                color: showResult
                                  ? (isCorrect ? theme.palette.success.main : theme.palette.error.main)
                                  : theme.palette.primary.main
                              }
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {option}
                            </Typography>
                            {showResult && isCorrect && (
                              <IconCheck size={18} color={theme.palette.success.main} />
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <IconX size={18} color={theme.palette.error.main} />
                            )}
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </RadioGroup>

            {/* Explanation */}
            <Collapse in={showExplanation && !!currentQuestion.explanation}>
              <Alert
                severity="info"
                icon={<IconBulb size={20} />}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                <Typography variant="body2">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </Typography>
              </Alert>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      {!quizCompleted && (
        <DialogActions sx={{ px: 4, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          {!showExplanation ? (
            <Button
              variant="contained"
              onClick={handleCheckAnswer}
              disabled={selectedAnswer === null}
              fullWidth
            >
              Check Answer
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNextQuestion}
              endIcon={<IconChevronRight size={18} />}
              fullWidth
            >
              {currentQuestionIdx < totalQuestions - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}






