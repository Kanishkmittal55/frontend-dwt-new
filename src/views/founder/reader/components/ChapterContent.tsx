/**
 * ChapterContent Component
 * Displays chapter details with chat integration
 */
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { IconBook, IconClock, IconTarget, IconMessageCircle, IconCheck, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';

import type { CLRSChapter } from '../data/chapters';
import { getNextChapter, getPrevChapter } from '../data/chapters';
import type { LearningItem } from '../hooks/useLearningItems';

interface ChapterContentProps {
  chapter: CLRSChapter;
  learningItem?: LearningItem;
  onStartReading: () => void;
  onMarkComplete: () => void;
  onAskAgent: (question: string) => void;
  onNavigate: (chapterId: string) => void;
}

export default function ChapterContent({
  chapter,
  learningItem,
  onStartReading,
  onMarkComplete,
  onAskAgent,
  onNavigate
}: ChapterContentProps) {
  const theme = useTheme();

  // Calculate progress
  const progress = learningItem
    ? Math.min((learningItem.repetition_count / 5) * 100, 100)
    : 0;

  // Get difficulty color
  const getDifficultyColor = () => {
    switch (chapter.difficulty) {
      case 'beginner': return theme.palette.success;
      case 'intermediate': return theme.palette.warning;
      case 'advanced': return theme.palette.error;
    }
  };

  const difficultyColor = getDifficultyColor();

  const prevChapter = getPrevChapter(chapter.id);
  const nextChapter = getNextChapter(chapter.id);

  // Quick questions for the agent
  const quickQuestions = [
    `Explain the main concepts of Chapter ${chapter.number}`,
    `What are the key algorithms in "${chapter.title}"?`,
    `Give me a summary of ${chapter.sections[0]?.title}`,
    `What exercises should I focus on in Chapter ${chapter.number}?`
  ];

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          size="small"
          startIcon={<IconChevronLeft size={16} />}
          disabled={!prevChapter}
          onClick={() => prevChapter && onNavigate(prevChapter.id)}
        >
          {prevChapter?.title || 'Previous'}
        </Button>
        <Button
          size="small"
          endIcon={<IconChevronRight size={16} />}
          disabled={!nextChapter}
          onClick={() => nextChapter && onNavigate(nextChapter.id)}
        >
          {nextChapter?.title || 'Next'}
        </Button>
      </Box>

      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Part Label */}
          <Typography variant="overline" color="text.secondary">
            Part {chapter.part}: {chapter.partTitle}
          </Typography>

          {/* Title */}
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Chapter {chapter.number}: {chapter.title}
          </Typography>

          {/* Meta Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<IconClock size={14} />}
              label={`~${chapter.estimatedHours} hours`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<IconTarget size={14} />}
              label={chapter.difficulty}
              size="small"
              sx={{
                bgcolor: alpha(difficultyColor.main, 0.1),
                color: difficultyColor.main,
                borderColor: difficultyColor.main
              }}
              variant="outlined"
            />
            <Chip
              icon={<IconBook size={14} />}
              label={`${chapter.exercises} exercises`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Learning Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<IconBook size={18} />}
              onClick={onStartReading}
            >
              Start Reading
            </Button>
            {learningItem && (
              <Button
                variant="outlined"
                startIcon={<IconCheck size={18} />}
                onClick={onMarkComplete}
                disabled={progress >= 100}
              >
                Mark Complete
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Due Alert */}
      {learningItem?.is_due && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This chapter is due for review! Test your recall to strengthen memory.
        </Alert>
      )}

      {/* Sections */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sections
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {chapter.sections.map(section => (
              <li key={section.id}>
                <Typography variant="body1" sx={{ py: 0.5 }}>
                  <strong>{section.number}</strong> - {section.title}
                </Typography>
              </li>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Key Topics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Topics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {chapter.keyTopics.map((topic, idx) => (
              <Chip
                key={idx}
                label={topic}
                variant="filled"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Ask Agent */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconMessageCircle size={20} />
            Ask the Learning Agent
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Get help understanding this chapter
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {quickQuestions.map((question, idx) => (
              <Button
                key={idx}
                variant="outlined"
                size="small"
                onClick={() => onAskAgent(question)}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              >
                {question}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* SM-2 Stats (if tracking) */}
      {learningItem && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Learning Stats (SM-2)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="h6">{learningItem.ease_factor.toFixed(2)}</Typography>
                <Typography variant="caption" color="text.secondary">Ease Factor</Typography>
              </Box>
              <Box>
                <Typography variant="h6">{learningItem.repetition_count}</Typography>
                <Typography variant="caption" color="text.secondary">Repetitions</Typography>
              </Box>
              <Box>
                <Typography variant="h6">{learningItem.interval_days}</Typography>
                <Typography variant="caption" color="text.secondary">Interval (days)</Typography>
              </Box>
              <Box>
                <Typography variant="h6">{learningItem.total_reviews}</Typography>
                <Typography variant="caption" color="text.secondary">Total Reviews</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

