/**
 * ModuleNav Component
 * Left sidebar navigation for course modules and lessons
 */
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme, alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import {
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconClock,
  IconLayoutSidebarLeftCollapse,
  IconPlus,
  IconFolderPlus,
  IconFilePlus
} from '@tabler/icons-react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import type { CourseModule, CourseLesson } from '@/api/founder/coursesAPI';
import { formatEstimatedTime } from '@/api/founder/coursesAPI';

// ============================================================================
// Types
// ============================================================================

interface ModuleNavProps {
  modules: CourseModule[];
  selectedModuleUUID: string | null;
  selectedLessonUUID: string | null;
  lessonsByModule: Record<string, CourseLesson[]>;
  loadingModuleUUID: string | null;
  completedLessonUUIDs: Set<string>;
  onSelectModule: (module: CourseModule) => void;
  onSelectLesson: (lesson: CourseLesson) => void;
  onLoadLessons: (moduleUUID: string) => void;
  onToggle?: () => void;
  onAddModule?: () => void;
  onAddLesson?: (moduleUUID: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function ModuleNav({
  modules,
  selectedModuleUUID,
  selectedLessonUUID,
  lessonsByModule,
  loadingModuleUUID,
  completedLessonUUIDs,
  onSelectModule,
  onSelectLesson,
  onLoadLessons,
  onToggle,
  onAddModule,
  onAddLesson
}: ModuleNavProps) {
  const theme = useTheme();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Auto-expand selected module
  useEffect(() => {
    if (selectedModuleUUID && !expandedModules.has(selectedModuleUUID)) {
      setExpandedModules(prev => new Set([...prev, selectedModuleUUID]));
    }
  }, [selectedModuleUUID]);

  // Handle module click
  const handleModuleClick = useCallback((module: CourseModule) => {
    const isExpanded = expandedModules.has(module.uuid);
    
    if (isExpanded) {
      // Collapse
      setExpandedModules(prev => {
        const next = new Set(prev);
        next.delete(module.uuid);
        return next;
      });
    } else {
      // Expand and load lessons if not loaded
      setExpandedModules(prev => new Set([...prev, module.uuid]));
      if (!lessonsByModule[module.uuid]) {
        onLoadLessons(module.uuid);
      }
    }
    
    onSelectModule(module);
  }, [expandedModules, lessonsByModule, onSelectModule, onLoadLessons]);

  // Calculate module progress
  const getModuleProgress = useCallback((moduleUUID: string): number => {
    const lessons = lessonsByModule[moduleUUID];
    if (!lessons || lessons.length === 0) return 0;
    
    const completedCount = lessons.filter(l => completedLessonUUIDs.has(l.uuid)).length;
    return Math.round((completedCount / lessons.length) * 100);
  }, [lessonsByModule, completedLessonUUIDs]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(theme.palette.background.default, 0.5)
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600} color="primary">
            Course Modules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {modules.length} modules
          </Typography>
        </Box>
        {onToggle && (
          <IconButton size="small" onClick={onToggle} sx={{ color: 'text.secondary' }}>
            <IconLayoutSidebarLeftCollapse size={18} />
          </IconButton>
        )}
      </Box>

      {/* Modules List */}
      <List component="nav" sx={{ p: 1, flex: 1, overflow: 'auto' }}>
        {modules.map((module, index) => {
          const isExpanded = expandedModules.has(module.uuid);
          const isSelected = selectedModuleUUID === module.uuid;
          const lessons = lessonsByModule[module.uuid] || [];
          const isLoading = loadingModuleUUID === module.uuid;
          const progress = getModuleProgress(module.uuid);

          return (
            <Box key={module.uuid} sx={{ mb: 0.5 }}>
              {/* Module Item */}
              <ListItemButton
                selected={isSelected}
                onClick={() => handleModuleClick(module)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                  },
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.16)
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {isExpanded ? (
                    <IconFolderOpen size={20} color={theme.palette.primary.main} />
                  ) : (
                    <IconFolder size={20} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={isSelected ? 600 : 500} noWrap>
                      {index + 1}. {module.title}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {module.total_lessons && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          {module.total_lessons} lessons
                        </Typography>
                      )}
                      {module.estimated_minutes && (
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconClock size={12} />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {formatEstimatedTime(module.estimated_minutes)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                {isExpanded ? (
                  <IconChevronDown size={16} color={theme.palette.text.secondary} />
                ) : (
                  <IconChevronRight size={16} color={theme.palette.text.secondary} />
                )}
              </ListItemButton>

              {/* Progress Bar */}
              {progress > 0 && (
                <Box sx={{ px: 2, pb: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 3,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        bgcolor: progress === 100 ? theme.palette.success.main : theme.palette.primary.main
                      }
                    }}
                  />
                </Box>
              )}

              {/* Lessons List (Collapsible) */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 3 }}>
                  {/* Loading State */}
                  {isLoading && (
                    <>
                      <Skeleton variant="rounded" height={36} sx={{ mx: 1, mb: 0.5, borderRadius: 1.5 }} />
                      <Skeleton variant="rounded" height={36} sx={{ mx: 1, mb: 0.5, borderRadius: 1.5 }} />
                      <Skeleton variant="rounded" height={36} sx={{ mx: 1, mb: 0.5, borderRadius: 1.5 }} />
                    </>
                  )}

                  {/* Lessons */}
                  {!isLoading && lessons.map((lesson) => {
                    const isLessonSelected = selectedLessonUUID === lesson.uuid;
                    const isCompleted = completedLessonUUIDs.has(lesson.uuid);

                    return (
                      <ListItemButton
                        key={lesson.uuid}
                        selected={isLessonSelected}
                        onClick={() => onSelectLesson(lesson)}
                        sx={{
                          borderRadius: 1.5,
                          py: 0.75,
                          mb: 0.25,
                          transition: 'all 0.15s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.06)
                          },
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.14)
                            }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {isCompleted ? (
                            <IconCheck size={16} color={theme.palette.success.main} />
                          ) : (
                            <IconFileText size={16} color={theme.palette.text.secondary} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontWeight: isLessonSelected ? 600 : 400,
                                color: isCompleted ? theme.palette.success.main : 'inherit',
                                textDecoration: isCompleted ? 'none' : 'none'
                              }}
                            >
                              {lesson.title}
                            </Typography>
                          }
                        />
                        {lesson.estimated_minutes && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {lesson.estimated_minutes}m
                          </Typography>
                        )}
                      </ListItemButton>
                    );
                  })}

                  {/* No lessons */}
                  {!isLoading && lessons.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
                      No lessons available
                    </Typography>
                  )}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>

      {/* Add Module & Lesson Buttons */}
      {(onAddModule || onAddLesson) && (
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          mt: 'auto'
        }}>
          <Stack spacing={1}>
            {onAddModule && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconFolderPlus size={16} />}
                onClick={onAddModule}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
              >
                Add Module
              </Button>
            )}
            {onAddLesson && selectedModuleUUID && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconFilePlus size={16} />}
                onClick={() => onAddLesson(selectedModuleUUID)}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    bgcolor: alpha(theme.palette.secondary.main, 0.04)
                  }
                }}
              >
                Add Lesson
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

