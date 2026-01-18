/**
 * ReviewCard Component
 * Flashcard-style review interface with SM-2 quality grading
 */
import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import { IconX, IconEye, IconBrain, IconAlertTriangle } from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';

import type { LearningItem, SM2Quality } from '../hooks/useLearningItems';
import { SM2_GRADES } from '../hooks/useLearningItems';
import { getChapterById } from '../data/chapters';

interface ReviewCardProps {
  item: LearningItem;
  onGrade: (quality: SM2Quality) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function ReviewCard({ item, onGrade, onSkip, onClose }: ReviewCardProps) {
  const theme = useTheme();
  const [showAnswer, setShowAnswer] = useState(false);

  // Get chapter data for context
  const chapter = getChapterById(item.item_id);

  // Quality grade buttons with descriptions
  const gradeButtons: { grade: SM2Quality; label: string; color: string; description: string }[] = [
    {
      grade: SM2_GRADES.COMPLETE_BLACKOUT,
      label: '0',
      color: theme.palette.error.dark,
      description: 'Complete blackout'
    },
    {
      grade: SM2_GRADES.INCORRECT_REMEMBERED,
      label: '1',
      color: theme.palette.error.main,
      description: 'Incorrect, but remembered on reveal'
    },
    {
      grade: SM2_GRADES.INCORRECT_EASY,
      label: '2',
      color: theme.palette.warning.main,
      description: 'Incorrect, but seemed easy'
    },
    {
      grade: SM2_GRADES.CORRECT_DIFFICULTY,
      label: '3',
      color: theme.palette.warning.light,
      description: 'Correct with difficulty'
    },
    {
      grade: SM2_GRADES.CORRECT_HESITATION,
      label: '4',
      color: theme.palette.success.light,
      description: 'Correct after hesitation'
    },
    {
      grade: SM2_GRADES.PERFECT,
      label: '5',
      color: theme.palette.success.main,
      description: 'Perfect response'
    }
  ];

  return (
    <Card
      sx={{
        maxWidth: 600,
        mx: 'auto',
        boxShadow: theme.shadows[8],
        borderRadius: 2,
        overflow: 'visible'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.04)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconBrain size={20} color={theme.palette.primary.main} />
          <Typography variant="subtitle2" color="text.secondary">
            Review: {item.item_type}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Rep #{item.repetition_count + 1} • EF: {item.ease_factor.toFixed(2)}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <IconX size={18} />
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Question/Prompt */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary" gutterBottom>
            Can you recall the key concepts from
          </Typography>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {chapter?.title || item.title || item.item_id}
          </Typography>
          {chapter && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
              {chapter.keyTopics.map((topic, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1
                  }}
                >
                  {topic}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        {/* Answer Toggle */}
        {!showAnswer ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<IconEye />}
              onClick={() => setShowAnswer(true)}
              sx={{ minWidth: 200 }}
            >
              Show Answer
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Try to recall before revealing
            </Typography>
          </Box>
        ) : (
          <Fade in={showAnswer}>
            <Box>
              {/* Answer Content */}
              {chapter && (
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Key Sections:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {chapter.sections.map(section => (
                      <li key={section.id}>
                        <Typography variant="body2">
                          {section.number} - {section.title}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Quality Rating */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  How well did you recall this?
                </Typography>
                <ButtonGroup variant="outlined" size="large" sx={{ mt: 1 }}>
                  {gradeButtons.map(({ grade, label, color, description }) => (
                    <Tooltip key={grade} title={description} placement="top">
                      <Button
                        onClick={() => onGrade(grade)}
                        sx={{
                          minWidth: 48,
                          borderColor: color,
                          color: color,
                          '&:hover': {
                            bgcolor: alpha(color, 0.1),
                            borderColor: color
                          }
                        }}
                      >
                        {label}
                      </Button>
                    </Tooltip>
                  ))}
                </ButtonGroup>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                  0 = Blackout, 5 = Perfect recall
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
      </CardContent>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.grey[50]
        }}
      >
        <Button
          size="small"
          color="inherit"
          startIcon={<IconAlertTriangle size={16} />}
          onClick={onSkip}
        >
          Skip for now
        </Button>
        <Typography variant="caption" color="text.secondary">
          Interval: {item.interval_days} days
        </Typography>
      </Box>
    </Card>
  );
}

