/**
 * CLRSCourse View
 * Main course reading experience with modules, lessons, and quizzes
 * Supports two modes:
 * 1. Static Mode: Traditional course navigation from pre-generated content
 * 2. Interactive Mode: Real-time personalized learning with AI tutor
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import { useTheme, alpha } from '@mui/material/styles';
import Slide from '@mui/material/Slide';
import Tooltip from '@mui/material/Tooltip';
import { IconCircleCheck, IconCircleCheckFilled, IconShare, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import CircularProgress from '@mui/material/CircularProgress';

import {
  IconMenu2,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconSparkles,
  IconBook2,
  IconRobot,
  IconX
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

// Hooks
import useTutorAgent from '@/hooks/useTutorAgent';

// Components
import CourseSelector from './components/CourseSelector';
import ModuleNav from './components/ModuleNav';
import LessonContent from './components/LessonContent';
import QuizView from './components/QuizView';
import IntakeForm from './components/IntakeForm';
import TutorChat from './components/TutorChat';
import StreamingLesson from './components/StreamingLesson';

// ============================================================================
// Constants
// ============================================================================

const NAV_WIDTH = 320;
const CHAT_WIDTH = 380;

// Get API key from env - in production use proper auth
const API_KEY = import.meta.env.VITE_API_KEY || 'test-all-access-key';
const USER_ID = 1; // TODO: Get from auth context

type ViewMode = 'static' | 'interactive';

// ============================================================================
// Main Component
// ============================================================================

export default function CLRSCourse() {
  const theme = useTheme();

  // =========================================================================
  // View State
  // =========================================================================
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('static');
  const [showNav, setShowNav] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // =========================================================================
  // Static Mode State (existing functionality)
  // =========================================================================
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, CourseLesson[]>>({});
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingModuleUUID, setLoadingModuleUUID] = useState<string | null>(null);
  const [selectedModuleUUID, setSelectedModuleUUID] = useState<string | null>(null);
  const [selectedLessonUUID, setSelectedLessonUUID] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<CourseQuiz | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [completedLessonUUIDs, setCompletedLessonUUIDs] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);

  // =========================================================================
  // Interactive Mode - Tutor Agent Hook
  // =========================================================================
  const tutor = useTutorAgent({
    apiKey: API_KEY,
    userId: USER_ID,
    ...(selectedCourse?.uuid && { courseId: selectedCourse.uuid }), // Uses spread operator to conditionally add the courseId property only when selectedCourse?.uuid exists
    autoConnect: false
  });

  // =========================================================================
  // Effects
  // =========================================================================

  // This local storage is to track user's progress not for lesson storage
  useEffect(() => {
    if (!selectedCourse) return;
    const key = `course_progress_${selectedCourse.uuid}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setCompletedLessonUUIDs(new Set(JSON.parse(stored)));
      } catch { /* ignore */ }
    }
  }, [selectedCourse?.uuid]);

  // Connect tutor once when a course is selected (stays connected across mode switches)
  const hasConnectedRef = useRef(false);
  const lastCourseIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only connect once per course selection (not per mode switch)
    if (selectedCourse && selectedCourse.uuid !== lastCourseIdRef.current) {
      lastCourseIdRef.current = selectedCourse.uuid;
      hasConnectedRef.current = false;
    }
    
    if (selectedCourse && !hasConnectedRef.current && !tutor.isConnected) {
      console.log('[CLRSCourse] Connecting tutor for course:', selectedCourse.uuid);
      hasConnectedRef.current = true;
      tutor.connect(selectedCourse.uuid);
    }
  }, [selectedCourse?.uuid, tutor.isConnected]);

  // Clean up on unmount only
  useEffect(() => {
    return () => {
      if (tutor.isConnected) {
        tutor.disconnect();
      }
    };
  }, []);

  // Auto-start session when connected (only once per course)
  const hasStartedSessionRef = useRef(false);
  useEffect(() => {
    if (tutor.isConnected && selectedCourse && !tutor.hasSession && !hasStartedSessionRef.current) {
      console.log('[CLRSCourse] Starting session for course:', selectedCourse.uuid);
      hasStartedSessionRef.current = true;
      tutor.startSession(selectedCourse.uuid);

      // If course already completed intake, skip to chat
      if (selectedCourse.status === 'active') {
        tutor.setIntakeComplete(true);
      } else {
        // Start intake for new/pending courses
        console.log('[CLRSCourse] Starting intake for course:', selectedCourse.uuid);
        tutor.startIntake();
      }
    }
    // Reset when course changes
    if (!selectedCourse) {
      hasStartedSessionRef.current = false;
    }
  }, [tutor.isConnected, tutor.hasSession, selectedCourse?.uuid]);

    useEffect(() => {
      if (tutor.isConnected && selectedLesson?.uuid) {
          tutor.selectLesson(selectedLesson.uuid);
      }
  }, [tutor.isConnected, selectedLesson?.uuid, tutor.selectLesson]);


  // =========================================================================
  // Handlers - General
  // =========================================================================

  const saveProgress = useCallback((lessonUUID: string) => {
    if (!selectedCourse) return;
    setCompletedLessonUUIDs(prev => {
      const next = new Set([...prev, lessonUUID]);
      localStorage.setItem(`course_progress_${selectedCourse.uuid}`, JSON.stringify([...next]));
      return next;
    });
  }, [selectedCourse]);

  const handleBackToCourses = useCallback(() => {
    if (tutor.isConnected) {
      tutor.disconnect();
    }
    // Reset connection tracking refs
    hasConnectedRef.current = false;
    hasStartedSessionRef.current = false;
    
    setSelectedCourse(null);
    setModules([]);
    setLessonsByModule({});
    setSelectedModuleUUID(null);
    setSelectedLessonUUID(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setCompletedLessonUUIDs(new Set());
    setViewMode('static');
    setShowChat(false);
  }, [tutor]);

  const handleModeChange = useCallback((_: any, newMode: ViewMode | null) => {
    if (newMode) {
      setViewMode(newMode);
      if (newMode === 'interactive' && !tutor.isConnected && selectedCourse) {
        tutor.connect(selectedCourse.uuid);
      }
    }
  }, [tutor, selectedCourse]);

  // =========================================================================
  // Handlers - Static Mode
  // =========================================================================
  const handleLoadLessons = useCallback(async (moduleUUID: string) => {
    if (lessonsByModule[moduleUUID]) return;
    setLoadingModuleUUID(moduleUUID);
    try {
      const lessons = await getLessonsByModule(moduleUUID);
      setLessonsByModule(prev => ({ ...prev, [moduleUUID]: lessons }));
      // Add in CLRSCourse.tsx temporarily for debug
      console.log('[Debug] selectedLesson content length:', selectedLesson?.content?.length);
      const firstLesson = lessons[0]
      if (lessons.length > 0) {
        if (firstLesson){
          handleSelectLesson(firstLesson);
        }
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({ type: 'error', message: apiError.message || 'Failed to load lessons' });
    } finally {
      setLoadingModuleUUID(null);
    }
  }, [lessonsByModule]);

  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setLoadingCourse(true);

    // Reset all pervious state
    setModules([]);
    setLessonsByModule({});
    setSelectedModuleUUID(null);
    setSelectedLessonUUID(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);

    // Auto-start interactive mode for pending courses
    if (course.status === 'pending') {
      setViewMode('interactive');
    }

    try {
      const detail = await getCourseByUUID(course.uuid);
      setModules(detail.modules);
      if (detail.modules.length > 0) {
        const firstModule = detail.modules[0];
        if (firstModule){
          setSelectedModuleUUID(firstModule?.uuid);
          await handleLoadLessons(firstModule.uuid);
        }
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({ type: 'error', message: apiError.message || 'Failed to load course' });
    } finally {
      setLoadingCourse(false);
    }
  }, [handleLoadLessons]);

  const handleSelectModule = useCallback((module: CourseModule) => {
    setSelectedModuleUUID(module.uuid);
  }, []);

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
      setSelectedLesson(lesson);
    } finally {
      setLoadingLesson(false);
    }
  }, []);

  const handleMarkComplete = useCallback(() => {
    if (!selectedLesson) return;
    saveProgress(selectedLesson.uuid);
    setNotification({ type: 'success', message: 'Lesson marked as complete!' });
    tutor.completeLesson(selectedLesson.uuid, 0, 1.0);
  }, [selectedLesson, saveProgress]);

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

  // =========================================================================
  // Handlers - Interactive Mode
  // =========================================================================

  const handleIntakeAnswer = useCallback((questionId: string, answer: any) => {
    tutor.answerIntakeQuestion(questionId, answer);
  }, [tutor]);

  const handleRequestLesson = useCallback(() => {
    tutor.requestLesson();
  }, [tutor]);

  const handleLessonComplete = useCallback(async (lessonUUID: string, timeSpent: number, scrollDepth: number) => {
    tutor.completeLesson(lessonUUID, timeSpent, scrollDepth);
    saveProgress(lessonUUID);
    setNotification({ type: 'success', message: 'Great work! Keep going!' });
    
    // Refresh course data from DB to show newly created modules/lessons in sidebar
    if (selectedCourse) {
      try {
        const detail = await getCourseByUUID(selectedCourse.uuid);
        setModules(detail.modules);
        // Clear cached lessons to force re-fetch
        setLessonsByModule({});
        // Auto-load lessons for first module if available
        if (detail.modules.length > 0) {
          const module = detail.modules[0]
          if (module){
          const lessons = await getLessonsByModule(module.uuid);
          setLessonsByModule(prev => ({ ...prev, [module.uuid]: lessons }));
          }
      }
      } catch (err) {
        console.warn('[CLRSCourse] Failed to refresh course data after lesson complete', err);
      }
    }
  }, [tutor, saveProgress, selectedCourse]);

  const handleLessonSkip = useCallback((lessonUUID: string, reason: string) => {
    tutor.skipLesson(lessonUUID, reason);
  }, [tutor]);

  const handleStartInteractiveQuiz = useCallback(() => {
    tutor.startQuiz('knowledge', tutor.currentLesson?.lessonUUID);
  }, [tutor]);

  const handleSendChat = useCallback(async (message: string) => {
    await tutor.sendChat(message);
  }, [tutor]);

  // =========================================================================
  // Computed Values
  // =========================================================================

  const allLessonsInOrder = useMemo(() => {
    const lessons: CourseLesson[] = [];
    modules.forEach(module => {
      lessons.push(...(lessonsByModule[module.uuid] || []));
    });
    return lessons;
  }, [modules, lessonsByModule]);

  const currentLessonIndex = useMemo(() => {
    if (!selectedLessonUUID) return -1;
    return allLessonsInOrder.findIndex(l => l.uuid === selectedLessonUUID);
  }, [allLessonsInOrder, selectedLessonUUID]);

  const hasNextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessonsInOrder.length - 1;
  const hasPrevLesson = currentLessonIndex > 0;

  const handleNextLesson = useCallback(() => {
    const nextLesson = allLessonsInOrder[currentLessonIndex + 1];
    if (hasNextLesson && nextLesson) handleSelectLesson(nextLesson);
  }, [hasNextLesson, currentLessonIndex, allLessonsInOrder, handleSelectLesson]);

  const handlePrevLesson = useCallback(() => {
    const prevLesson = allLessonsInOrder[currentLessonIndex - 1];
    if (hasPrevLesson && prevLesson) handleSelectLesson(prevLesson);
  }, [hasPrevLesson, currentLessonIndex, allLessonsInOrder, handleSelectLesson]);

  const courseProgress = useMemo(() => {
    const total = allLessonsInOrder.length;
    if (total === 0) return 0;
    return Math.round((allLessonsInOrder.filter(l => completedLessonUUIDs.has(l.uuid)).length / total) * 100);
  }, [allLessonsInOrder, completedLessonUUIDs]);

  // =========================================================================
  // Render - Course Selector
  // =========================================================================

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
          <Alert severity={notification?.type || 'info'} onClose={() => setNotification(null)}>
            {notification?.message}
          </Alert>
        </Snackbar>
      </MainCard>
    );
  }

  // =========================================================================
  // Render - Course View
  // =========================================================================

  return (
    <MainCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={handleBackToCourses} size="small">
            <IconArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
            {selectedCourse.title}
          </Typography>
        </Box>
      }
      secondary={
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
          {/* Left: Mark Complete & Share */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={selectedLesson && completedLessonUUIDs.has(selectedLesson.uuid) ? "Completed" : "Mark complete"}>
              <IconButton
                size="small"
                onClick={handleMarkComplete}
                disabled={!selectedLesson}
                sx={{
                  color: selectedLesson && completedLessonUUIDs.has(selectedLesson.uuid) ? '#22c55e' : 'text.secondary',
                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                }}
              >
                {selectedLesson && completedLessonUUIDs.has(selectedLesson.uuid) ? (
                  <IconCircleCheckFilled size={20} />
                ) : (
                  <IconCircleCheck size={20} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <IconShare size={20} />
              </IconButton>
            </Tooltip>
          </Box>
      
          {/* Center: Lesson Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handlePrevLesson}
              disabled={!hasPrevLesson}
              sx={{ color: hasPrevLesson ? 'text.primary' : 'text.disabled' }}
            >
              <IconChevronLeft size={20} />
            </IconButton>
            {selectedLesson && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 80, textAlign: 'center' }}>
                Lesson {selectedLesson.sequence_order || 1}
              </Typography>
            )}
            <IconButton
              size="small"
              onClick={handleNextLesson}
              disabled={!hasNextLesson}
              sx={{ color: hasNextLesson ? 'text.primary' : 'text.disabled' }}
            >
              <IconChevronRight size={20} />
            </IconButton>
          </Box>
      
          {/* Right: Mode Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleModeChange}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.background.default, 0.8),
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  border: 'none',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': { bgcolor: theme.palette.primary.dark }
                  }
                }
              }}
            >
              <ToggleButton value="static">
                <IconBook2 size={16} style={{ marginRight: 6 }} />
                Read
              </ToggleButton>
              <ToggleButton value="interactive">
                <IconSparkles size={16} style={{ marginRight: 6 }} />
                Interactive
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      }
      border={false}
      sx={{
        height: 'calc(100vh - 100px)', 
        position: 'relative',
        display: 'flex',           
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        '& .MuiCardHeader-root': {
          '& .MuiCardHeader-content': {
            flex: '0 0 auto',
            maxWidth: 350
          },
          '& .MuiCardHeader-action': {
            flex: '1 1 auto',
            alignSelf: 'center',
            marginTop: 0,
            marginRight: 0,
            marginLeft: 24
          }
        }
      }}
      contentSX={{ p: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden', '&:last-child': { pb: 0 } }}
    >
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

      {/* Left Navigation Drawer (Static mode only) */}
      {viewMode === 'static' && (
        
        <Slide direction="right" in={viewMode === 'static'} mountOnEnter unmountOnExit>
          
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
              borderRight: `1px solid ${theme.palette.divider}`,  // ← Only right border
              boxSizing: 'border-box'  // ← Important for alignment
            }
          }}
        >
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
            onToggle={() => setShowNav(false)}
          />
        </Drawer>
        </Slide>
      )}

      {/* Nav Toggle Button (when nav is collapsed) */}
      {viewMode === 'static' && !showNav && (
        <IconButton
          onClick={() => setShowNav(true)}
          size="small"
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
          }}
        >
          <IconMenu2 size={18} />
        </IconButton>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden'
        }}
      >

        {/* ================= STATIC MODE ================= */}
          <LessonContent
            lesson={selectedLesson}
            quiz={selectedQuiz}
            loading={loadingLesson || loadingCourse}
            isCompleted={selectedLesson ? completedLessonUUIDs.has(selectedLesson.uuid) : false}
            hasNextLesson={hasNextLesson}
            hasPrevLesson={hasPrevLesson}
            onMarkComplete={handleMarkComplete}
            onStartQuiz={() => setShowQuiz(true)}
            onNextLesson={handleNextLesson}
            onPrevLesson={handlePrevLesson}
          />

          {/* Chat Panel - only in Interactive mode */}
          {viewMode === 'interactive' && (
            <Slide direction="left" in={viewMode === 'interactive'}>
              <Box
                sx={{
                  width: 360,
                  height: '100%',         
                  flexShrink: 0,
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: theme.palette.background.paper,
                  overflow: 'hidden'
                }}
              >
                {/* Show IntakeForm if intake not complete, otherwise TutorChat */}
                {!tutor.intakeComplete ? (
                tutor.currentIntakeQuestion ? (
                  <IntakeForm
                    question={tutor.currentIntakeQuestion}
                    progress={tutor.intakeProgress}
                    loading={tutor.isTutorTyping}
                    onAnswer={handleIntakeAnswer}
                    onSkip={() => {}}
                    onComplete={() => {
                      tutor.setIntakeComplete(true);
                      tutor.completeIntake();  // Send complete to backend
                      tutor.requestLesson(); 
                    }}
                  />
                ) : (
                  // Waiting for first intake question
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress size={32} />
                  </Box>
                )
              ) : (
                <>
                  {console.log('[Debug] Lesson context:', {
                    hasSelectedLesson: !!selectedLesson,
                    title: selectedLesson?.title,
                    contentLength: selectedLesson?.content?.length,
                    contentPreview: selectedLesson?.content?.substring(0, 100)
                  })}
                  <TutorChat
                    messages={tutor.messages}
                    isTyping={tutor.isTutorTyping}
                    isConnected={tutor.isConnected}
                    onSend={handleSendChat}
                    lessonContext={selectedLesson ? {
                      title: selectedLesson.title,
                      content: selectedLesson.content || '',
                      keyConcepts: []
                    } : undefined}
                    lessonCompletePrompt={tutor.lessonCompletePrompt}
                    onStartQuiz={() => {
                      tutor.dismissLessonPrompt();
                      if (selectedLesson?.uuid) {
                        tutor.startQuiz('comprehension', selectedLesson.uuid);
                      }
                    }}
                    onSkipToNext={(lessonUUID, nextChunkIdx) => {
                      tutor.requestNextLesson(lessonUUID, nextChunkIdx);
                    }}
                  />
                </>
              )}
              </Box>
            </Slide>
          )}
        
      </Box>


      {/* Quiz Dialog (Static mode) */}
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
        open={!!notification || !!tutor.error}
        autoHideDuration={4000}
        onClose={() => {
          setNotification(null);
          tutor.clearError();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={tutor.error ? 'error' : notification?.type || 'info'}
          onClose={() => {
            setNotification(null);
            tutor.clearError();
          }}
        >
          {tutor.error || notification?.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
