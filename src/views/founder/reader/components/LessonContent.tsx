/**
 * LessonContent Component
 * Main content area for displaying lesson content with rich formatting
 * 
 * Design: Clean, spacious layout with excellent readability
 */
import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconClock,
  IconFileText,
  IconSparkles,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconHelpCircle,
  IconChevronLeft,
  IconChevronRight,
  IconBookmark,
  IconBookmarkFilled
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { CourseLesson, CourseQuiz } from '@/api/founder/coursesAPI';
import { formatEstimatedTime } from '@/api/founder/coursesAPI';

// ============================================================================
// Types
// ============================================================================

interface LessonContentProps {
  lesson: CourseLesson | null;
  quiz: CourseQuiz | null;
  loading: boolean;
  isCompleted: boolean;
  hasNextLesson: boolean;
  hasPrevLesson: boolean;
  onMarkComplete: () => void;
  onStartQuiz: () => void;
  onNextLesson: () => void;
  onPrevLesson: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function LessonContent({
  lesson,
  quiz,
  loading,
  isCompleted,
  hasNextLesson,
  hasPrevLesson,
  onMarkComplete,
  onStartQuiz,
  onNextLesson,
  onPrevLesson
}: LessonContentProps) {
  const theme = useTheme();
  const [bookmarked, setBookmarked] = useState(false);

  // Word count estimate for reading time display
  const wordCount = useMemo(() => {
    if (!lesson?.content) return 0;
    return lesson.content.split(/\s+/).length;
  }, [lesson?.content]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 5 }}>
        <Skeleton variant="text" width={400} height={56} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Skeleton variant="rounded" width={100} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Box>
        <Skeleton variant="rounded" height={120} sx={{ mb: 4, borderRadius: 3 }} />
        <Skeleton variant="text" height={28} />
        <Skeleton variant="text" height={28} />
        <Skeleton variant="text" height={28} />
        <Skeleton variant="text" width="75%" height={28} />
      </Box>
    );
  }

  // No lesson selected
  if (!lesson) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 6,
          bgcolor: alpha(theme.palette.background.default, 0.4)
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}
        >
          <IconFileText size={36} color={theme.palette.primary.main} strokeWidth={1.5} />
        </Box>
        <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
          Select a lesson to begin
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320 }}>
          Choose a module and lesson from the navigation panel on the left
        </Typography>
      </Box>
    );
  }

  const hasQuiz = quiz && quiz.questions && quiz.questions.length > 0;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default
      }}
    >

      {/* Scrollable Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: theme.palette.background.paper
        }}
      >
        {/* Content Container with max-width for readability */}
        <Box
          sx={{
            maxWidth: 820,
            mx: 'auto',
            px: { xs: 3, sm: 5, md: 6 },
            py: 5
          }}
        >
          {/* Lesson Title */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              lineHeight: 1.3,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              mb: 3
            }}
          >
            {lesson.title}
          </Typography>

          {/* Meta Info Row */}
          <Stack 
            direction="row" 
            spacing={3} 
            alignItems="center" 
            sx={{ mb: 4 }}
            flexWrap="wrap"
          >
            {lesson.estimated_minutes && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <IconClock size={18} color={theme.palette.text.secondary} strokeWidth={1.75} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                >
                  {formatEstimatedTime(lesson.estimated_minutes)}
                </Typography>
              </Stack>
            )}
            {wordCount > 0 && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <IconFileText size={18} color={theme.palette.text.secondary} strokeWidth={1.75} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                >
                  {wordCount.toLocaleString()} words
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Summary Card */}
          {lesson.summary && (
            <Box
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, 0.06),
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.primary,
                  lineHeight: 1.75,
                  fontSize: '0.9375rem'
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    fontWeight: 700, 
                    color: theme.palette.info.dark,
                    mr: 0.75 
                  }}
                >
                  Summary:
                </Box>
                {lesson.summary}
              </Typography>
            </Box>
          )}

          {/* Key Concepts */}
          {lesson.key_concepts && lesson.key_concepts.length > 0 && (
            <Box sx={{ mb: 5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <IconSparkles size={18} color={theme.palette.warning.main} strokeWidth={2} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    fontSize: '0.8125rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Key concepts
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {lesson.key_concepts.map((concept, idx) => (
                  <Chip
                    key={idx}
                    label={concept}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.dark,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      height: 28,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.warning.main, 0.15)
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
                // Headings
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.01em',
                  mt: 5,
                  mb: 2.5
                },
                '& h1': { fontSize: '1.875rem', lineHeight: 1.3 },
                '& h2': { fontSize: '1.5rem', lineHeight: 1.35 },
                '& h3': { fontSize: '1.25rem', lineHeight: 1.4 },
                '& h4': { fontSize: '1.125rem', lineHeight: 1.45 },
                
                // Paragraphs - DARKER text for readability
                '& p': {
                  fontSize: '1.0625rem',
                  lineHeight: 1.85,
                  color: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.text.primary, 0.9) 
                    : theme.palette.grey[800],
                  mb: 2.5,
                  letterSpacing: '0.01em'
                },
                
                // Strong text
                '& strong': {
                  fontWeight: 600,
                  color: theme.palette.text.primary
                },
                
                // Lists - Better spacing and darker text
                '& ul, & ol': {
                  pl: 3.5,
                  mb: 2.5,
                  '& li': {
                    fontSize: '1.0625rem',
                    lineHeight: 1.8,
                    color: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.text.primary, 0.9) 
                      : theme.palette.grey[800],
                    mb: 1,
                    '&::marker': {
                      color: theme.palette.primary.main
                    }
                  }
                },
                
                // Blockquotes
                '& blockquote': {
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  pl: 3,
                  py: 2,
                  my: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  borderRadius: '0 12px 12px 0',
                  '& p': { 
                    mb: 0,
                    fontStyle: 'italic',
                    color: theme.palette.text.primary
                  }
                },
                
                // Inline code
                '& code': {
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  bgcolor: alpha(theme.palette.text.primary, 0.08),
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.secondary.light 
                    : theme.palette.secondary.dark,
                  px: 1,
                  py: 0.25,
                  borderRadius: '6px',
                  fontSize: '0.875em',
                  fontWeight: 500
                },
                
                // Code blocks
                '& pre': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.black, 0.4) 
                    : theme.palette.grey[100],
                  p: 3,
                  borderRadius: 3,
                  overflow: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                  my: 3,
                  '& code': {
                    bgcolor: 'transparent',
                    p: 0,
                    color: theme.palette.text.primary
                  }
                },
                
                // Tables
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  my: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  '& th, & td': {
                    border: `1px solid ${theme.palette.divider}`,
                    p: 1.5,
                    textAlign: 'left',
                    fontSize: '0.9375rem'
                  },
                  '& th': {
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    fontWeight: 600,
                    color: theme.palette.text.primary
                  },
                  '& td': {
                    color: theme.palette.text.primary
                  }
                },
                
                // Links
                '& a': {
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderBottomColor: theme.palette.primary.main
                  }
                },
                
                // Images
                '& img': {
                  maxWidth: '100%',
                  borderRadius: 3,
                  my: 3,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                  '&[alt]:not([src]), &[src=""]': {
                    display: 'none'
                  }
                },
                
                // Horizontal rules
                '& hr': {
                  border: 'none',
                  borderTop: `2px solid ${alpha(theme.palette.divider, 0.6)}`,
                  my: 5
                }
              }
            }}
          >
            <Box className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.content}
              </ReactMarkdown>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
