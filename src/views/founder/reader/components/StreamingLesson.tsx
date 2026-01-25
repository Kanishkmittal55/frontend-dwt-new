/**
 * StreamingLesson Component
 * Displays lesson content with real-time streaming support
 * Shows progress, hook, and gradually appearing content
 */
import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconClock,
  IconSparkles,
  IconPlayerPlay,
  IconCheck,
  IconArrowRight,
  IconMessageCircle,
  IconBrain
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { LessonPayload } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface StreamingLessonProps {
  lesson: LessonPayload | null;
  isGenerating: boolean;
  onComplete: (lessonUUID: string, timeSpent: number, scrollDepth: number) => void;
  onSkip: (lessonUUID: string, reason: string) => void;
  onStartQuiz: () => void;
  onOpenChat: () => void;
  hasQuiz?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function StreamingLesson({
  lesson,
  isGenerating,
  onComplete,
  onSkip,
  onStartQuiz,
  onOpenChat,
  hasQuiz = true
}: StreamingLessonProps) {
  const theme = useTheme();
  const [startTime] = useState(Date.now());
  const [scrollDepth, setScrollDepth] = useState(0);
  // Hook is always visible when lesson has one (removed auto-hide)

  // Track scroll depth
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrolled = target.scrollTop;
      const height = target.scrollHeight - target.clientHeight;
      if (height > 0) {
        setScrollDepth(Math.round((scrolled / height) * 100));
      }
    };

    // Note: Need to attach to the scrollable container
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Word count
  const wordCount = useMemo(() => {
    if (!lesson?.content) return 0;
    return lesson.content.split(/\s+/).length;
  }, [lesson?.content]);

  // Handle complete
  const handleComplete = () => {
    if (!lesson) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onComplete(lesson.lessonUUID, timeSpent, scrollDepth);
  };

  // Generating state
  if (isGenerating && !lesson) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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
            mb: 3,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.05)', opacity: 0.8 }
            }
          }}
        >
          <IconBrain size={40} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
          Crafting your lesson...
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Personalizing content based on your learning style
        </Typography>
        <LinearProgress
          sx={{
            width: 200,
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1)
          }}
        />
      </Box>
    );
  }

  // No lesson state
  if (!lesson) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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
          <IconPlayerPlay size={36} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
          Ready to learn?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Click "Start Learning" to generate your first personalized lesson
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Streaming indicator */}
      {isGenerating && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 10
          }}
        />
      )}

      {/* Hook Banner - Persistent intro text */}
      {lesson.hook && (
        <Fade in timeout={500}>
          <Box
            sx={{
              px: 4,
              py: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              borderRadius: 0
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.5
                }}
              >
                <IconSparkles size={20} color={theme.palette.primary.main} />
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontStyle: 'italic',
                  color: theme.palette.text.primary,
                  lineHeight: 1.7,
                  fontSize: '1rem'
                }}
              >
                "{lesson.hook}"
              </Typography>
            </Stack>
          </Box>
        </Fade>
      )}

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: theme.palette.background.paper
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            mx: 'auto',
            px: { xs: 3, sm: 5 },
            py: 5
          }}
        >
          {/* Title */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.25rem' },
              lineHeight: 1.3,
              mb: 3,
              letterSpacing: '-0.02em'
            }}
          >
            {lesson.title}
          </Typography>

          {/* Meta Row */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 4 }}
            flexWrap="wrap"
            useFlexGap
          >
            {lesson.estimatedMins && (
              <Chip
                icon={<IconClock size={14} />}
                label={`${lesson.estimatedMins} min`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.text.primary, 0.06),
                  '& .MuiChip-icon': { color: 'text.secondary' }
                }}
              />
            )}
            {wordCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {wordCount.toLocaleString()} words
              </Typography>
            )}
            <Chip
              label={`Lesson ${lesson.sequence}`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600
              }}
            />
          </Stack>

          {/* Key Concepts */}
          {lesson.keyConcepts && lesson.keyConcepts.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  mb: 1.5,
                  display: 'block'
                }}
              >
                Key Concepts
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {lesson.keyConcepts.map((concept, idx) => (
                  <Chip
                    key={idx}
                    label={concept}
                    size="small"
                    onClick={() => {}} // Could open chat with question about this concept
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.dark,
                      fontWeight: 500,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.secondary.main, 0.2)
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Main Content */}
          <Box
            sx={{
              '& .markdown-content': {
                '& h1, & h2, & h3, & h4': {
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mt: 4,
                  mb: 2
                },
                '& h2': { fontSize: '1.5rem' },
                '& h3': { fontSize: '1.25rem' },
                '& p': {
                  fontSize: '1.0625rem',
                  lineHeight: 1.85,
                  color: theme.palette.grey[800],
                  mb: 2
                },
                '& ul, & ol': {
                  pl: 3,
                  mb: 2,
                  '& li': {
                    fontSize: '1.0625rem',
                    lineHeight: 1.75,
                    color: theme.palette.grey[800],
                    mb: 0.75
                  }
                },
                '& blockquote': {
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  pl: 3,
                  py: 1,
                  my: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  borderRadius: '0 8px 8px 0',
                  '& p': { mb: 0, fontStyle: 'italic' }
                },
                '& code': {
                  bgcolor: alpha(theme.palette.text.primary, 0.08),
                  color: theme.palette.secondary.dark,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: '0.875em',
                  fontFamily: '"JetBrains Mono", monospace'
                },
                '& pre': {
                  bgcolor: theme.palette.grey[100],
                  p: 2.5,
                  borderRadius: 2,
                  overflow: 'auto',
                  my: 3,
                  '& code': {
                    bgcolor: 'transparent',
                    p: 0,
                    color: theme.palette.text.primary
                  }
                },
                '& strong': {
                  fontWeight: 600,
                  color: theme.palette.text.primary
                },
                '& a': {
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    borderBottomColor: theme.palette.primary.main
                  }
                }
              }
            }}
          >
            <Box className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.content}
              </ReactMarkdown>
            </Box>

            {/* Streaming cursor */}
            {isGenerating && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 2,
                  height: '1.2em',
                  bgcolor: theme.palette.primary.main,
                  ml: 0.5,
                  animation: 'blink 1s infinite',
                  '@keyframes blink': {
                    '0%, 50%': { opacity: 1 },
                    '51%, 100%': { opacity: 0 }
                  }
                }}
              />
            )}
          </Box>

          {/* Summary */}
          {lesson.summary && !isGenerating && (
            <Box
              sx={{
                mt: 5,
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.success.main, 0.06),
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.success.dark,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <IconCheck size={18} />
                Key Takeaway
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                {lesson.summary}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Action Footer */}
      {!isGenerating && (
        <Box
          sx={{
            px: 4,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Button
            variant="text"
            startIcon={<IconMessageCircle size={18} />}
            onClick={onOpenChat}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Ask a question
          </Button>

          <Stack direction="row" spacing={2}>
            {hasQuiz && (
              <Button
                variant="outlined"
                onClick={onStartQuiz}
                sx={{
                  borderColor: theme.palette.divider,
                  color: 'text.primary',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Take Quiz
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleComplete}
              endIcon={<IconArrowRight size={18} />}
              sx={{
                bgcolor: '#22c55e',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  bgcolor: '#16a34a'
                }
              }}
            >
              Complete & Continue
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}


