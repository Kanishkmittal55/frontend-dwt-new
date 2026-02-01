/**
 * HTILCourseCreator
 * Incremental course creation interface for "How To Infuse Learning"
 * 
 * Key features:
 * - Save data incrementally (each section saved separately)
 * - Real-time validation with Zod schemas
 * - WebSocket events for AI tutor integration
 * - Expandable tree structure for course navigation
 */
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconArrowLeft,
  IconPlus,
  IconBook2,
  IconFolder,
  IconFileText,
  IconPencil,
  IconChevronDown,
  IconChevronRight,
  IconTrash,
  IconCheck,
  IconSparkles,
  IconGripVertical
} from '@tabler/icons-react';

import MainCard from '@/ui-component/cards/MainCard';
import useTutorAgent from '@/hooks/useTutorAgent';

// API and Schemas
import {
  createHTILCourse,
  createHTILModule,
  createHTILLesson,
  createHTILExercise,
  createHTILQuiz,
  updateHTILCourse,
  updateHTILModule,
  updateHTILLesson,
  deleteHTILModule,
  deleteHTILLesson,
  deleteHTILExercise,
  getHTILCourse,
  type Course,
  type CourseModule,
  type CourseLesson,
  type CourseExercise,
  type CourseQuiz
} from '@/api/founder/htilAPI';

// Sub-components
import HTILCourseForm from './components/HTILCourseForm';
import HTILModuleForm from './components/HTILModuleForm';
import HTILLessonForm from './components/HTILLessonForm';
import HTILExerciseForm from './components/HTILExerciseForm';
import HTILQuizForm from './components/HTILQuizForm';

// ============================================================================
// Types
// ============================================================================

interface HTILCourseCreatorProps {
  userId: number;
  existingCourseUUID?: string;
  onBack: () => void;
}

type EditMode = 'course' | 'module' | 'lesson' | 'exercise' | 'quiz';

interface EditTarget {
  mode: EditMode;
  uuid?: string;
  parentUUID?: string;
}

interface CourseTree {
  course: Course | null;
  modules: ModuleNode[];
}

interface ModuleNode {
  module: CourseModule;
  lessons: LessonNode[];
  expanded: boolean;
}

interface LessonNode {
  lesson: CourseLesson;
  exercises: CourseExercise[];
  quiz?: CourseQuiz;
  expanded: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const NAV_WIDTH = 280;
const API_KEY = import.meta.env.VITE_API_KEY || 'test-all-access-key';

const STEPS = ['Course Info', 'Add Modules', 'Add Lessons', 'Exercises & Quiz'];

// ============================================================================
// Component
// ============================================================================

export default function HTILCourseCreator({
  userId,
  existingCourseUUID,
  onBack
}: HTILCourseCreatorProps) {
  const theme = useTheme();

  // =========================================================================
  // State
  // =========================================================================
  const [courseTree, setCourseTree] = useState<CourseTree>({ course: null, modules: [] });
  const [activeStep, setActiveStep] = useState(0);
  const [editTarget, setEditTarget] = useState<EditTarget>({ mode: 'course' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // =========================================================================
  // Tutor Agent (for AI events)
  // =========================================================================
  const tutor = useTutorAgent({
    apiKey: API_KEY,
    userId,
    courseId: courseTree.course?.uuid,
    autoConnect: false
  });

  // Connect when course is created
  useEffect(() => {
    if (courseTree.course?.uuid && !tutor.isConnected) {
      tutor.connect(courseTree.course.uuid);
    }
  }, [courseTree.course?.uuid]);

  // =========================================================================
  // Load existing course
  // =========================================================================
  useEffect(() => {
    if (existingCourseUUID) {
      loadCourse(existingCourseUUID);
    }
  }, [existingCourseUUID]);

  const loadCourse = async (uuid: string) => {
    setLoading(true);
    try {
      const detail = await getHTILCourse(uuid);
      setCourseTree({
        course: detail.course,
        modules: detail.modules.map(m => ({
          module: m,
          lessons: [],
          expanded: false
        }))
      });
      setActiveStep(1);
      setEditTarget({ mode: 'module', parentUUID: uuid });
    } catch (err: any) {
      console.error('[HTILCourseCreator] loadCourse error:', err);
      const errorMessage = err?.message || 'Failed to load course';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // Course Handlers
  // =========================================================================
  const handleCreateCourse = useCallback(async (data: { title: string; description?: string; source_document_url?: string }) => {
    setLoading(true);
    try {
      const course = await createHTILCourse({
        user_id: userId,
        title: data.title,
        description: data.description,
        source_document_url: data.source_document_url
      });
      setCourseTree({ course, modules: [] });
      setActiveStep(1);
      setEditTarget({ mode: 'module', parentUUID: course.uuid });
      setNotification({ type: 'success', message: 'Course created! Now add modules.' });
    } catch (err: any) {
      console.error('[HTILCourseCreator] handleCreateCourse error:', err);
      const errorMessage = err?.message || 'Failed to create course';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleUpdateCourse = useCallback(async (data: { title?: string; description?: string }) => {
    if (!courseTree.course) return;
    setLoading(true);
    try {
      const updated = await updateHTILCourse(courseTree.course.uuid, data);
      setCourseTree(prev => ({ ...prev, course: updated }));
      setNotification({ type: 'success', message: 'Course updated' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to update course' });
    } finally {
      setLoading(false);
    }
  }, [courseTree.course]);

  // =========================================================================
  // Module Handlers
  // =========================================================================
  const handleCreateModule = useCallback(async (data: { title: string; description?: string }) => {
    if (!courseTree.course) return;
    setLoading(true);
    try {
      const module = await createHTILModule(courseTree.course.uuid, data);
      setCourseTree(prev => ({
        ...prev,
        modules: [...prev.modules, { module, lessons: [], expanded: true }]
      }));
      setEditTarget({ mode: 'lesson', parentUUID: module.uuid });
      setActiveStep(2);
      setNotification({ type: 'success', message: `Module "${data.title}" added` });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create module' });
    } finally {
      setLoading(false);
    }
  }, [courseTree.course]);

  const handleDeleteModule = useCallback(async (moduleUUID: string) => {
    setLoading(true);
    try {
      await deleteHTILModule(moduleUUID);
      setCourseTree(prev => ({
        ...prev,
        modules: prev.modules.filter(m => m.module.uuid !== moduleUUID)
      }));
      setNotification({ type: 'info', message: 'Module deleted' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete module' });
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================================
  // Lesson Handlers
  // =========================================================================
  const handleCreateLesson = useCallback(async (moduleUUID: string, data: { title: string; content: string; summary?: string }) => {
    setLoading(true);
    try {
      const lesson = await createHTILLesson(moduleUUID, data);
      setCourseTree(prev => ({
        ...prev,
        modules: prev.modules.map(m =>
          m.module.uuid === moduleUUID
            ? { ...m, lessons: [...m.lessons, { lesson, exercises: [], expanded: true }] }
            : m
        )
      }));
      setEditTarget({ mode: 'exercise', parentUUID: lesson.uuid });
      setActiveStep(3);
      setNotification({ type: 'success', message: `Lesson "${data.title}" added` });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create lesson' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteLesson = useCallback(async (lessonUUID: string, moduleUUID: string) => {
    setLoading(true);
    try {
      await deleteHTILLesson(lessonUUID);
      setCourseTree(prev => ({
        ...prev,
        modules: prev.modules.map(m =>
          m.module.uuid === moduleUUID
            ? { ...m, lessons: m.lessons.filter(l => l.lesson.uuid !== lessonUUID) }
            : m
        )
      }));
      setNotification({ type: 'info', message: 'Lesson deleted' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete lesson' });
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================================
  // Exercise Handlers
  // =========================================================================
  const handleCreateExercise = useCallback(async (lessonUUID: string, data: {
    exercise_id: string;
    statement: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    exercise_type?: 'practice' | 'concept' | 'problem' | 'starred';
  }) => {
    setLoading(true);
    try {
      const exercise = await createHTILExercise(lessonUUID, {
        ...data,
        difficulty: data.difficulty || 'intermediate',
        exercise_type: data.exercise_type || 'practice'
      });
      setCourseTree(prev => ({
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l =>
            l.lesson.uuid === lessonUUID
              ? { ...l, exercises: [...l.exercises, exercise] }
              : l
          )
        }))
      }));
      setNotification({ type: 'success', message: `Exercise ${data.exercise_id} added` });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create exercise' });
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================================
  // Quiz Handler
  // =========================================================================
  const handleCreateQuiz = useCallback(async (lessonUUID: string, data: {
    questions: Array<{
      question: string;
      options: Array<{ text: string; is_correct: boolean }>;
    }>;
    passing_score?: number;
  }) => {
    setLoading(true);
    try {
      const quiz = await createHTILQuiz(lessonUUID, {
        questions: data.questions.map(q => ({
          question: q.question,
          options: q.options,
          question_type: 'multiple_choice' as const
        })),
        passing_score: data.passing_score ?? 0.7,
        difficulty: 'mixed' as const
      });
      setCourseTree(prev => ({
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l =>
            l.lesson.uuid === lessonUUID
              ? { ...l, quiz }
              : l
          )
        }))
      }));
      setNotification({ type: 'success', message: 'Quiz added' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create quiz' });
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================================
  // Tree Navigation
  // =========================================================================
  const toggleModuleExpand = (moduleUUID: string) => {
    setCourseTree(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.module.uuid === moduleUUID ? { ...m, expanded: !m.expanded } : m
      )
    }));
  };

  const toggleLessonExpand = (moduleUUID: string, lessonUUID: string) => {
    setCourseTree(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.module.uuid === moduleUUID
          ? {
              ...m,
              lessons: m.lessons.map(l =>
                l.lesson.uuid === lessonUUID ? { ...l, expanded: !l.expanded } : l
              )
            }
          : m
      )
    }));
  };

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <MainCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={onBack} size="small">
            <IconArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>
            {courseTree.course?.title || 'Create HTIL Course'}
          </Typography>
        </Box>
      }
      secondary={
        <Stepper activeStep={activeStep} sx={{ minWidth: 400 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      }
      border={false}
      sx={{
        height: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      contentSX={{ p: 0, flex: 1, display: 'flex', overflow: 'hidden', '&:last-child': { pb: 0 } }}
    >
      {/* Left Navigation Tree */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={true}
        sx={{
          width: NAV_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: NAV_WIDTH,
            position: 'relative',
            border: 'none',
            borderRight: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Course Structure
          </Typography>
          
          {courseTree.course && (
            <List dense disablePadding>
              {/* Course Header */}
              <ListItem disablePadding>
                <ListItemButton
                  selected={editTarget.mode === 'course'}
                  onClick={() => setEditTarget({ mode: 'course', uuid: courseTree.course?.uuid })}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <IconBook2 size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={courseTree.course.title}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Modules */}
              {courseTree.modules.map((mNode) => (
                <Box key={mNode.module.uuid}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={editTarget.mode === 'module' && editTarget.uuid === mNode.module.uuid}
                      onClick={() => setEditTarget({ mode: 'module', uuid: mNode.module.uuid, parentUUID: courseTree.course?.uuid })}
                    >
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleModuleExpand(mNode.module.uuid); }}>
                        {mNode.expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                      </IconButton>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <IconFolder size={16} />
                      </ListItemIcon>
                      <ListItemText
                        primary={mNode.module.title}
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                      />
                    </ListItemButton>
                  </ListItem>

                  {/* Lessons */}
                  <Collapse in={mNode.expanded}>
                    <List dense disablePadding sx={{ pl: 4 }}>
                      {mNode.lessons.map((lNode) => (
                        <ListItem key={lNode.lesson.uuid} disablePadding>
                          <ListItemButton
                            selected={editTarget.mode === 'lesson' && editTarget.uuid === lNode.lesson.uuid}
                            onClick={() => setEditTarget({ mode: 'lesson', uuid: lNode.lesson.uuid, parentUUID: mNode.module.uuid })}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <IconFileText size={14} />
                            </ListItemIcon>
                            <ListItemText
                              primary={lNode.lesson.title}
                              primaryTypographyProps={{ variant: 'caption', noWrap: true }}
                              secondary={`${lNode.exercises.length} exercises`}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                      
                      {/* Add Lesson Button */}
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => setEditTarget({ mode: 'lesson', parentUUID: mNode.module.uuid })}
                          sx={{ color: 'primary.main' }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <IconPlus size={14} />
                          </ListItemIcon>
                          <ListItemText primary="Add Lesson" primaryTypographyProps={{ variant: 'caption' }} />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </Collapse>
                </Box>
              ))}

              {/* Add Module Button */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setEditTarget({ mode: 'module', parentUUID: courseTree.course?.uuid })}
                  sx={{ color: 'primary.main' }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <IconPlus size={16} />
                  </ListItemIcon>
                  <ListItemText primary="Add Module" primaryTypographyProps={{ variant: 'body2' }} />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          overflow: 'auto',
          bgcolor: alpha(theme.palette.background.default, 0.5)
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !courseTree.course && (
          <HTILCourseForm onSubmit={handleCreateCourse} />
        )}

        {!loading && courseTree.course && editTarget.mode === 'course' && (
          <HTILCourseForm
            initialData={{
              title: courseTree.course.title,
              description: courseTree.course.description || ''
            }}
            onSubmit={handleUpdateCourse}
            isEdit
          />
        )}

        {!loading && courseTree.course && editTarget.mode === 'module' && !editTarget.uuid && (
          <HTILModuleForm onSubmit={handleCreateModule} />
        )}

        {!loading && courseTree.course && editTarget.mode === 'lesson' && !editTarget.uuid && editTarget.parentUUID && (
          <HTILLessonForm
            onSubmit={(data) => handleCreateLesson(editTarget.parentUUID!, data)}
          />
        )}

        {!loading && courseTree.course && editTarget.mode === 'exercise' && editTarget.parentUUID && (
          <HTILExerciseForm
            onSubmit={(data) => handleCreateExercise(editTarget.parentUUID!, data)}
          />
        )}
      </Box>

      {/* Notifications */}
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

