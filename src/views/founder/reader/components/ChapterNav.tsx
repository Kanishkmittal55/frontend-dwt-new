/**
 * ChapterNav Component
 * Navigation sidebar for CLRS chapters
 */
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { useState } from 'react';
import { IconChevronDown, IconChevronRight, IconCircleCheck, IconClock, IconFlame } from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';

import { CLRS_PARTS, type CLRSChapter } from '../data/chapters';
import type { LearningItem } from '../hooks/useLearningItems';

interface ChapterNavProps {
  selectedChapterId: string | null;
  onSelectChapter: (chapter: CLRSChapter) => void;
  learningItems: LearningItem[];
}

export default function ChapterNav({ selectedChapterId, onSelectChapter, learningItems }: ChapterNavProps) {
  const theme = useTheme();
  const [expandedParts, setExpandedParts] = useState<number[]>([1, 2]); // Start all expanded

  const togglePart = (partNumber: number) => {
    setExpandedParts(prev =>
      prev.includes(partNumber)
        ? prev.filter(p => p !== partNumber)
        : [...prev, partNumber]
    );
  };

  // Get learning item for a chapter
  const getChapterItem = (chapterId: string): LearningItem | undefined => {
    return learningItems.find(item => item.item_type === 'chapter' && item.item_id === chapterId);
  };

  // Get progress percentage based on reviews
  const getProgress = (item?: LearningItem): number => {
    if (!item) return 0;
    // Progress based on repetition count (max out at 5 reps = 100%)
    return Math.min((item.repetition_count / 5) * 100, 100);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: CLRSChapter['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return theme.palette.success.main;
      case 'intermediate': return theme.palette.warning.main;
      case 'advanced': return theme.palette.error.main;
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, fontWeight: 600, color: 'text.secondary' }}>
        CLRS Chapters
      </Typography>

      <List dense disablePadding>
        {CLRS_PARTS.map(part => (
          <Box key={part.number}>
            {/* Part Header */}
            <ListItemButton
              onClick={() => togglePart(part.number)}
              sx={{
                py: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {expandedParts.includes(part.number) ? (
                  <IconChevronDown size={18} />
                ) : (
                  <IconChevronRight size={18} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" fontWeight={600}>
                    Part {part.number}: {part.title}
                  </Typography>
                }
              />
            </ListItemButton>

            {/* Chapters */}
            <Collapse in={expandedParts.includes(part.number)}>
              <List dense disablePadding>
                {part.chapters.map(chapter => {
                  const item = getChapterItem(chapter.id);
                  const progress = getProgress(item);
                  const isSelected = chapter.id === selectedChapterId;
                  const isDue = item?.is_due ?? false;

                  return (
                    <ListItemButton
                      key={chapter.id}
                      selected={isSelected}
                      onClick={() => onSelectChapter(chapter)}
                      sx={{
                        pl: 4,
                        borderLeft: isSelected
                          ? `3px solid ${theme.palette.primary.main}`
                          : '3px solid transparent',
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        {/* Chapter Title Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {progress >= 100 ? (
                            <IconCircleCheck size={16} color={theme.palette.success.main} />
                          ) : isDue ? (
                            <IconFlame size={16} color={theme.palette.error.main} />
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                bgcolor: getDifficultyColor(chapter.difficulty),
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 600
                              }}
                            >
                              {chapter.number}
                            </Typography>
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              fontWeight: isSelected ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {chapter.title}
                          </Typography>
                        </Box>

                        {/* Progress & Meta Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              flex: 1,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconClock size={12} color={theme.palette.text.secondary} />
                            <Typography variant="caption" color="text.secondary">
                              {chapter.estimatedHours}h
                            </Typography>
                          </Box>
                          {isDue && (
                            <Chip
                              label="Due"
                              size="small"
                              color="error"
                              sx={{ height: 18, fontSize: 10 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Box>
  );
}

