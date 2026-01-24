/**
 * CLRSCourse View
 * Main course reading experience with modules, lessons, and quizzes
 * Fetches content from the backend courses API
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconMenu2,
  IconArrowLeft,
  IconBook2,
  IconCheck,
  IconClock
} from '@tabler/icons-react';

import MainCard from '@/ui-component/cards/MainCard';

// API
import {
  getCourseByUUID,
  getLessonsByModule,
  getLessonByUUID,
  formatEstimatedHours,
  type Course,
  type CourseModule,
  type CourseLesson,
  type CourseQuiz
} from '@/api/founder/coursesAPI';

// Components
import CourseSelector from './components/CourseSelector';
import ModuleNav from './components/ModuleNav';
import LessonContent from './components/LessonContent';
import QuizView from './components/QuizView';

// ============================================================================
// Constants
// ============================================================================

const NAV_WIDTH = 320;

// ============================================================================
// Main Component
// ============================================================================

export default function CLRSCourse() {
  const theme = useTheme();

  // View state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Course data state
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, CourseLesson[]>>({});
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingModuleUUID, setLoadingModuleUUID] = useState<string | null>(null);

  // Selection state
  const [selectedModuleUUID, setSelectedModuleUUID] = useState<string | null>(null);
  const [selectedLessonUUID, setSelectedLessonUUID] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<CourseQuiz | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Progress state (stored in localStorage)
  const [completedLessonUUIDs, setCompletedLessonUUIDs] = useState<Set<string>>(new Set());

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);

  // Load completed lessons from localStorage
  useEffect(() => {
    if (!selectedCourse) return;
    const key = `course_progress_${selectedCourse.uuid}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCompletedLessonUUIDs(new Set(parsed));
      } catch {
        // Ignore
      }
    }
  }, [selectedCourse?.uuid]);

  // Save completed lessons to localStorage
  const saveProgress = useCallback((lessonUUID: string) => {
    if (!selectedCourse) return;

    setCompletedLessonUUIDs(prev => {
      const next = new Set([...prev, lessonUUID]);
      const key = `course_progress_${selectedCourse.uuid}`;
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  }, [selectedCourse]);

  // Handle course selection
  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setLoadingCourse(true);
    setModules([]);
    setLessonsByModule({});
    setSelectedModuleUUID(null);
    setSelectedLessonUUID(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);

    try {
      const detail = await getCourseByUUID(course.uuid);
      setModules(detail.modules);

      // Auto-select first module and load its lessons
      if (detail.modules.length > 0) {
        const firstModule = detail.modules[0];
        setSelectedModuleUUID(firstModule.uuid);
        await handleLoadLessons(firstModule.uuid);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({ type: 'error', message: apiError.message || 'Failed to load course' });
    } finally {
      setLoadingCourse(false);
    }
  }, []);

  // Load lessons for a module
  const handleLoadLessons = useCallback(async (moduleUUID: string) => {
    if (lessonsByModule[moduleUUID]) return; // Already loaded

    setLoadingModuleUUID(moduleUUID);
    try {
      const lessons = await getLessonsByModule(moduleUUID);
      setLessonsByModule(prev => ({ ...prev, [moduleUUID]: lessons }));

      // Auto-select first lesson if this is the selected module
      if (lessons.length > 0) {
        handleSelectLesson(lessons[0]);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({ type: 'error', message: apiError.message || 'Failed to load lessons' });
    } finally {
      setLoadingModuleUUID(null);
    }
  }, [lessonsByModule]);

  // Handle module selection
  const handleSelectModule = useCallback((module: CourseModule) => {
    setSelectedModuleUUID(module.uuid);
  }, []);

  // Handle lesson selection
  const handleSelectLesson = useCallback(async (lesson: CourseLesson) => {
    setSelectedLessonUUID(lesson.uuid);
    setSelectedModuleUUID(lesson.module_uuid);
    setLoadingLesson(true);
    setSelectedQuiz(null);

    try {
      const detail = await getLessonByUUID(lesson.uuid);
      setSelectedLesson(detail.lesson);
      setSelectedQuiz(detail.quiz || null);
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({ type: 'error', message: apiError.message || 'Failed to load lesson' });
      setSelectedLesson(lesson); // Fallback to passed lesson
    } finally {
      setLoadingLesson(false);
    }
  }, []);

  // Handle mark complete
  const handleMarkComplete = useCallback(() => {
    if (!selectedLesson) return;
    saveProgress(selectedLesson.uuid);
    setNotification({ type: 'success', message: 'Lesson marked as complete!' });
  }, [selectedLesson, saveProgress]);

  // Handle quiz complete
  const handleQuizComplete = useCallback((score: number, passed: boolean) => {
    if (passed && selectedLesson) {
      saveProgress(selectedLesson.uuid);
    }
    setShowQuiz(false);
    setNotification({
      type: passed ? 'success' : 'info',
      message: passed ? `Quiz passed with ${score}%!` : `Quiz completed with ${score}%`
    });
  }, [selectedLesson, saveProgress]);

  // Get all lessons in order for navigation
  const allLessonsInOrder = useMemo(() => {
    const lessons: CourseLesson[] = [];
    modules.forEach(module => {
      const moduleLessons = lessonsByModule[module.uuid] || [];
      lessons.push(...moduleLessons);
    });
    return lessons;
  }, [modules, lessonsByModule]);

  // Navigation helpers
  const currentLessonIndex = useMemo(() => {
    if (!selectedLessonUUID) return -1;
    return allLessonsInOrder.findIndex(l => l.uuid === selectedLessonUUID);
  }, [allLessonsInOrder, selectedLessonUUID]);

  const hasNextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessonsInOrder.length - 1;
  const hasPrevLesson = currentLessonIndex > 0;

  const handleNextLesson = useCallback(() => {
    if (hasNextLesson) {
      handleSelectLesson(allLessonsInOrder[currentLessonIndex + 1]);
    }
  }, [hasNextLesson, currentLessonIndex, allLessonsInOrder, handleSelectLesson]);

  const handlePrevLesson = useCallback(() => {
    if (hasPrevLesson) {
      handleSelectLesson(allLessonsInOrder[currentLessonIndex - 1]);
    }
  }, [hasPrevLesson, currentLessonIndex, allLessonsInOrder, handleSelectLesson]);

  // Calculate course progress
  const courseProgress = useMemo(() => {
    const totalLessons = allLessonsInOrder.length;
    if (totalLessons === 0) return 0;
    const completed = allLessonsInOrder.filter(l => completedLessonUUIDs.has(l.uuid)).length;
    return Math.round((completed / totalLessons) * 100);
  }, [allLessonsInOrder, completedLessonUUIDs]);

  // Handle back to courses
  const handleBackToCourses = useCallback(() => {
    setSelectedCourse(null);
    setModules([]);
    setLessonsByModule({});
    setSelectedModuleUUID(null);
    setSelectedLessonUUID(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setCompletedLessonUUIDs(new Set());
  }, []);

  // Course selector view
  if (!selectedCourse) {
    return (
      <MainCard
        title="Courses"
        sx={{ height: 'calc(100vh - 100px)' }}
        contentSX={{ p: 0, height: '100%', overflow: 'auto' }}
      >
        <CourseSelector onSelectCourse={handleSelectCourse} />
        
        <Snackbar
          open={!!notification}
          autoHideDuration={4000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={notification?.type || 'info'}
            onClose={() => setNotification(null)}
          >
            {notification?.message}
          </Alert>
        </Snackbar>
      </MainCard>
    );
  }

  // Course view
  return (
    <MainCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBackToCourses} size="small">
            <IconArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={600} noWrap sx={{ maxWidth: 400 }}>
              {selectedCourse.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
              {selectedCourse.total_modules && (
                <Typography variant="caption" color="text.secondary">
                  {selectedCourse.total_modules} modules
                </Typography>
              )}
              {selectedCourse.estimated_hours && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconClock size={12} />
                  <Typography variant="caption" color="text.secondary">
                    {formatEstimatedHours(selectedCourse.estimated_hours)}
                  </Typography>
                </Box>
              )}
              <Chip
                size="small"
                icon={<IconCheck size={12} />}
                label={`${courseProgress}% complete`}
                color={courseProgress === 100 ? 'success' : 'default'}
                variant="outlined"
                sx={{ height: 22 }}
              />
            </Box>
          </Box>
        </Box>
      }
      secondary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setShowNav(!showNav)}>
            <IconMenu2 size={18} />
          </IconButton>
        </Box>
      }
      sx={{ height: 'calc(100vh - 100px)', position: 'relative' }}
      contentSX={{ p: 0, height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}
    >
      {/* Course Progress */}
      <LinearProgress
        variant="determinate"
        value={courseProgress}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          '& .MuiLinearProgress-bar': {
            bgcolor: courseProgress === 100 ? theme.palette.success.main : theme.palette.primary.main
          }
        }}
      />

      {/* Module Navigation - Left Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={showNav}
        sx={{
          width: showNav ? NAV_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: NAV_WIDTH,
            position: 'relative',
            border: 'none',
            borderRight: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        {loadingCourse ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={120} />
            <Skeleton variant="rounded" height={60} sx={{ mt: 2 }} />
            <Skeleton variant="rounded" height={60} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" height={60} sx={{ mt: 1 }} />
          </Box>
        ) : (
          <ModuleNav
            modules={modules}
            selectedModuleUUID={selectedModuleUUID}
            selectedLessonUUID={selectedLessonUUID}
            lessonsByModule={lessonsByModule}
            loadingModuleUUID={loadingModuleUUID}
            completedLessonUUIDs={completedLessonUUIDs}
            onSelectModule={handleSelectModule}
            onSelectLesson={handleSelectLesson}
            onLoadLessons={handleLoadLessons}
          />
        )}
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}
      >
        <LessonContent
          lesson={selectedLesson}
          quiz={selectedQuiz}
          loading={loadingLesson}
          isCompleted={selectedLesson ? completedLessonUUIDs.has(selectedLesson.uuid) : false}
          hasNextLesson={hasNextLesson}
          hasPrevLesson={hasPrevLesson}
          onMarkComplete={handleMarkComplete}
          onStartQuiz={() => setShowQuiz(true)}
          onNextLesson={handleNextLesson}
          onPrevLesson={handlePrevLesson}
        />
      </Box>

      {/* Quiz Dialog */}
      {selectedQuiz && (
        <QuizView
          quiz={selectedQuiz}
          open={showQuiz}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notification?.type || 'info'}
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}

