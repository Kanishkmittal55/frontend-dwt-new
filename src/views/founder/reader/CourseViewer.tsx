/**
 * CourseViewer - Canvas-based Course Viewer with AI Tutor
 * 
 * Features:
 * - tldraw whiteboard for reading/editing content
 * - Collapsible sidebar for course navigation
 * - Full screen mode
 * - Read/Interactive modes (like CLRSCourse.tsx)
 * - AI tutor chat panel
 * - Drawing, typing, and page navigation
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Slide from '@mui/material/Slide';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconMenu2,
  IconArrowLeft,
  IconSparkles,
  IconChevronLeft,
  IconChevronRight,
  IconBook2,
  IconMaximize,
  IconMinimize,
  IconDeviceFloppy,
  IconCheck,
  IconMessageCircle,
  IconMessageCircleOff,
  IconBrain,
  IconChevronDown,
  IconChevronUp,
  IconX
} from '@tabler/icons-react';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

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
import { 
  updateHTILLesson, 
  createHTILModule, 
  createHTILLesson 
} from '@/api/founder/htilAPI';

// Hooks
import useTutorAgent from '@/hooks/useTutorAgent';
import { useCanvasActivityTracker } from '@/hooks/useCanvasActivityTracker';

// Components
import CourseSelector from './components/CourseSelector';
import ModuleNav from './components/ModuleNav';
import TutorChat from './components/TutorChat';
import IntakeForm from './components/IntakeForm';
import { 
  UnifiedCanvas, 
  type CanvasData, 
  type TLSnapshot,
  type UnifiedCanvasRef,
  typeAIResponse,
  findEmptySpaceNear
} from '@/components/editor';

// ============================================================================
// Constants
// ============================================================================

const NAV_WIDTH = 320;
const CHAT_WIDTH = 360;

// Get API key from env - in production use proper auth
const API_KEY = import.meta.env.VITE_API_KEY || 'test-all-access-key';
const USER_ID = 1; // TODO: Get from auth context

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'static' | 'interactive';

// ============================================================================
// Helper: Parse canvas data from lesson content
// ============================================================================

function parseCanvasData(content: string | null | undefined): CanvasData | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed.snapshot) return parsed as CanvasData;
  } catch {
    // Not JSON, it's markdown content
  }
  return null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function CourseViewer() {
  const theme = useTheme();

  // =========================================================================
  // View State
  // =========================================================================
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('static');
  const [showNav, setShowNav] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false); // Chat panel hidden by default in interactive mode
  const [showContextDebug, setShowContextDebug] = useState(false); // AI context debug panel
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Add Module/Lesson Dialogs
  const [addModuleDialogOpen, setAddModuleDialogOpen] = useState(false);
  const [addLessonDialogOpen, setAddLessonDialogOpen] = useState(false);
  const [addLessonModuleUUID, setAddLessonModuleUUID] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);

  // =========================================================================
  // Course/Lesson State
  // =========================================================================
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, CourseLesson[]>>({});
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingModuleUUID, setLoadingModuleUUID] = useState<string | null>(null);
  const [selectedModuleUUID, setSelectedModuleUUID] = useState<string | null>(null);
  const [selectedLessonUUID, setSelectedLessonUUID] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [completedLessonUUIDs, setCompletedLessonUUIDs] = useState<Set<string>>(new Set());
  
  // Canvas state
  const [canvasSaveStatus, setCanvasSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedCanvasChanges, setHasUnsavedCanvasChanges] = useState(false);
  const pendingCanvasSnapshot = useRef<TLSnapshot | null>(null);
  
  // Active LLM model display
  const [activeLLMModel, setActiveLLMModel] = useState<string | null>(null);

  // Canvas ref - exposes editor for AI writing
  const canvasRef = useRef<UnifiedCanvasRef>(null);
  
  // AI state tracking ref - prevents activity tracker from sending during AI typing animation
  const aiTypingRef = useRef<boolean>(false);

  // =========================================================================
  // Interactive Mode - Tutor Agent Hook
  // =========================================================================
  const tutor = useTutorAgent({
    apiKey: API_KEY,
    userId: USER_ID,
    ...(selectedCourse?.uuid && { courseId: selectedCourse.uuid }),
    autoConnect: false
  });

  // =========================================================================
  // LLM Model Display - now handled by tutor session (see useEffect below)
  // The tutor.llmProvider and tutor.llmModel are set when session starts
  // =========================================================================

  // =========================================================================
  // Canvas Activity Tracker (AI writing companion)
  // =========================================================================
  
  // Get editor instance from canvas ref
  const [canvasEditor, setCanvasEditor] = useState<import('@tldraw/tldraw').Editor | null>(null);
  
  // Update editor ref when canvas mounts
  const hasLoggedEditorReadyRef = useRef(false);
  useEffect(() => {
    // Only check when we have a lesson selected
    if (!selectedLesson?.uuid) {
      hasLoggedEditorReadyRef.current = false;
      return;
    }
    
    const checkEditor = () => {
      const ed = canvasRef.current?.getEditor() as import('@tldraw/tldraw').Editor | null;
      if (ed && ed !== canvasEditor) {
        if (!hasLoggedEditorReadyRef.current) {
          console.log('%c[Canvas] Editor ready', 'color: #4caf50');
          hasLoggedEditorReadyRef.current = true;
        }
        setCanvasEditor(ed);
      }
    };
    
    // Check immediately and then periodically until we get the editor
    checkEditor();
    const interval = setInterval(() => {
      if (!canvasEditor) checkEditor();
    }, 500);
    
    return () => clearInterval(interval);
  }, [selectedLesson?.uuid]); // Removed canvasEditor from deps to avoid re-triggering

  // Activity tracker - sends canvas updates to tutor agent
  // Rate limiting is handled by backend (single source of truth)
  const { syncLastSentText } = useCanvasActivityTracker(
    canvasEditor,
    tutor.sendCanvasText,
    tutor.sendCanvasIdle,
    { 
      enabled: viewMode === 'interactive' && tutor.isConnected,
      textDebounceMs: 2000,      // Debounce to reduce noise
      idleThresholdMs: 30000,    // Idle nudge after 30s
      aiTypingRef               // Prevent sending during AI typing animation
    }
  );

  // =========================================================================
  // Effects
  // =========================================================================

  // Load completed lessons from localStorage
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

  // Connect tutor once when a course is selected
  const hasConnectedRef = useRef(false);
  const lastCourseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedCourse && selectedCourse.uuid !== lastCourseIdRef.current) {
      lastCourseIdRef.current = selectedCourse.uuid;
      hasConnectedRef.current = false;
    }

    if (selectedCourse && !hasConnectedRef.current && !tutor.isConnected) {
      console.log('%c[Tutor] 🔌 Connecting', 'color: #2196f3; font-weight: bold', selectedCourse.uuid);
      hasConnectedRef.current = true;
      tutor.connect(selectedCourse.uuid);
    }
  }, [selectedCourse?.uuid, tutor.isConnected]);

  // NOTE: We DON'T auto-disconnect on cleanup to handle React StrictMode.
  // StrictMode double-mounts components in dev, which would kill the connection.
  // The connection will be cleaned up by:
  // 1. Browser closing the page
  // 2. User explicitly navigating away (handleBackToCourses)
  // 3. Server-side timeout

  // Auto-start session when connected
  const hasStartedSessionRef = useRef(false);
  const wasConnectedRef = useRef(false);
  
  // Reset session ref when disconnected (allows re-start on reconnect)
  useEffect(() => {
    if (wasConnectedRef.current && !tutor.isConnected) {
      console.log('%c[Tutor] 🔌 Disconnected - will re-start session on reconnect', 'color: #ff9800');
      hasStartedSessionRef.current = false;
    }
    wasConnectedRef.current = tutor.isConnected;
  }, [tutor.isConnected]);
  
  useEffect(() => {
    if (tutor.isConnected && selectedCourse && !tutor.hasSession && !hasStartedSessionRef.current) {
      console.log('%c[Tutor] 🎓 Starting session', 'color: #4caf50; font-weight: bold', selectedCourse.uuid);
      hasStartedSessionRef.current = true;
      tutor.startSession(selectedCourse.uuid);

      if (selectedCourse.status === 'ready') {
        tutor.setIntakeComplete(true);
      } else {
        tutor.startIntake();
      }
    }
    if (!selectedCourse) {
      hasStartedSessionRef.current = false;
    }
  }, [tutor.isConnected, tutor.hasSession, selectedCourse?.uuid]);

  // Update active LLM model display when tutor session provides LLM info
  useEffect(() => {
    if (tutor.llmProvider && tutor.llmModel) {
      // Format nicely: "claude-sonnet-4-..." → "Claude Sonnet 4"
      const formatModel = (model: string): string => {
        // Keep it short but readable
        const parts = model.split('-');
        if (parts.length >= 3) {
          // e.g., claude-sonnet-4-20250514 → Claude Sonnet 4
          return parts.slice(0, 3)
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ');
        }
        return model;
      };
      const displayModel = formatModel(tutor.llmModel);
      setActiveLLMModel(displayModel);
      console.log('%c[LLM] 🤖 Active model:', 'color: #9c27b0; font-weight: bold', tutor.llmProvider, tutor.llmModel);
    }
  }, [tutor.llmProvider, tutor.llmModel]);

  // Sync selected lesson with tutor - only after session is established
  useEffect(() => {
    if (tutor.isConnected && tutor.hasSession && selectedLesson?.uuid) {
      console.log('%c[Tutor] 📖 Selecting lesson', 'color: #2196f3', selectedLesson.uuid);
      tutor.selectLesson(selectedLesson.uuid);
    }
  }, [tutor.isConnected, tutor.hasSession, selectedLesson?.uuid, tutor.selectLesson]);

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

  const courseProgress = useMemo(() => {
    const total = allLessonsInOrder.length;
    if (total === 0) return 0;
    return Math.round((allLessonsInOrder.filter(l => completedLessonUUIDs.has(l.uuid)).length / total) * 100);
  }, [allLessonsInOrder, completedLessonUUIDs]);

  // Parse canvas data from current lesson
  const canvasData = parseCanvasData(selectedLesson?.content);

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
    hasConnectedRef.current = false;
    hasStartedSessionRef.current = false;

    setSelectedCourse(null);
    setModules([]);
    setLessonsByModule({});
    setSelectedModuleUUID(null);
    setSelectedLessonUUID(null);
    setSelectedLesson(null);
    setCompletedLessonUUIDs(new Set());
    setViewMode('static');
    setIsFullScreen(false);
  }, [tutor]);

  const handleModeChange = useCallback((_: any, newMode: ViewMode | null) => {
    if (newMode) {
      setViewMode(newMode);
      if (newMode === 'interactive' && !tutor.isConnected && selectedCourse) {
        tutor.connect(selectedCourse.uuid);
      }
    }
  }, [tutor, selectedCourse]);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
    if (!isFullScreen) {
      setShowNav(false); // Hide nav when entering fullscreen
    }
  }, [isFullScreen]);

  // Keyboard shortcuts - tldraw handles its own shortcuts for zoom, tools, etc.

  // =========================================================================
  // AI Canvas Writing - Handle when agent wants to write on canvas
  // =========================================================================

  useEffect(() => {
    // Only process when in interactive mode and we have a write request
    if (!tutor.canvasAIWrite || viewMode !== 'interactive') return;

    const editor = canvasRef.current?.getEditor();
    if (!editor) {
      console.warn('[CourseViewer] Cannot write to canvas - no editor ref');
      tutor.clearCanvasAIWrite();
      return;
    }

    const { text, position, color = 'violet', typingSpeed = 35, size = 'm' } = tutor.canvasAIWrite;

    // Find position for AI text
    const targetPosition = position || findEmptySpaceNear(
      editor,
      100, // Default reference X
      100, // Default reference Y
      'auto'
    );

    console.log('%c[Canvas] ✍️ AI typing on canvas', 'color: #9c27b0; font-weight: bold; font-size: 12px', {
      text: text.length > 100 ? text.substring(0, 100) + '...' : text,
      position: targetPosition,
      color
    });

    // Mark AI as typing - prevents activity tracker from sending updates
    aiTypingRef.current = true;

    // Start typing animation
    typeAIResponse(editor, {
      text,
      x: targetPosition.x,
      y: targetPosition.y,
      color,
      typingSpeed,
      size,
      onComplete: (shapeId: string) => {
        console.log('%c[Canvas] ✅ AI typing complete', 'color: #4caf50; font-weight: bold');
        
        // Mark AI as done typing
        aiTypingRef.current = false;
        
        // Sync lastSentText to include AI response - prevents re-triggering on same content
        syncLastSentText();
        
        setNotification({ type: 'info', message: 'AI wrote on canvas' });
      }
    });

    // Clear the request so we don't process it again
    tutor.clearCanvasAIWrite();
  }, [tutor.canvasAIWrite, viewMode, tutor]);

  // =========================================================================
  // AI Status Auto-Dismiss - Clear status messages after a short delay
  // =========================================================================
  
  useEffect(() => {
    // Don't auto-dismiss certain status types that need user action
    if (!tutor.canvasAIStatus) return;
    if (tutor.canvasAIStatus.status === 'error') return; // Keep errors visible
    
    // Auto-dismiss informational statuses after 3-5 seconds
    const dismissDelay = tutor.canvasAIStatus.status === 'need_more' ? 5000 : 3000;
    const timer = setTimeout(() => {
      tutor.clearCanvasAIStatus();
    }, dismissDelay);
    
    return () => clearTimeout(timer);
  }, [tutor.canvasAIStatus, tutor]);

  // =========================================================================
  // Handlers - Course/Module/Lesson Selection
  // =========================================================================

  const handleLoadLessons = useCallback(async (moduleUUID: string) => {
    if (lessonsByModule[moduleUUID]) return;
    setLoadingModuleUUID(moduleUUID);
    try {
      const lessons = await getLessonsByModule(moduleUUID);
      setLessonsByModule(prev => ({ ...prev, [moduleUUID]: lessons }));
      if (lessons.length > 0 && lessons[0]) {
        handleSelectLesson(lessons[0]);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({
        type: 'error',
        message: apiError.message || 'Failed to load lessons'
      });
    } finally {
      setLoadingModuleUUID(null);
    }
  }, [lessonsByModule]);

  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setLoadingCourse(true);

    // Reset state
    setModules([]);
    setLessonsByModule({});
    setSelectedModuleUUID(null);
    setSelectedLessonUUID(null);
    setSelectedLesson(null);

    // Auto-start interactive mode for pending courses
    if (course.status === 'pending') {
      setViewMode('interactive');
    }

    try {
      const detail = await getCourseByUUID(course.uuid);
      setModules(detail.modules);
      if (detail.modules.length > 0 && detail.modules[0]) {
        const firstModule = detail.modules[0];
        setSelectedModuleUUID(firstModule.uuid);
        await handleLoadLessons(firstModule.uuid);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({
        type: 'error',
        message: apiError.message || 'Failed to load course'
      });
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

    try {
      const detail = await getLessonByUUID(lesson.uuid);
      setSelectedLesson(detail.lesson);
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({
        type: 'error',
        message: apiError.message || 'Failed to load lesson'
      });
      setSelectedLesson(lesson);
    } finally {
      setLoadingLesson(false);
    }
  }, []);

  // Add Module Handler - opens dialog
  const handleAddModule = useCallback(() => {
    setNewModuleTitle('');
    setAddModuleDialogOpen(true);
  }, []);

  // Add Lesson Handler - opens dialog
  const handleAddLesson = useCallback((moduleUUID: string) => {
    setNewLessonTitle('');
    setAddLessonModuleUUID(moduleUUID);
    setAddLessonDialogOpen(true);
  }, []);

  // Confirm Add Module
  const handleConfirmAddModule = useCallback(async () => {
    if (!selectedCourse?.uuid || !newModuleTitle.trim()) return;
    
    setIsAddingModule(true);
    try {
      const newModule = await createHTILModule(selectedCourse.uuid, {
        title: newModuleTitle.trim(),
        description: '',
        sequence_order: modules.length + 1
      });
      
      // Refresh modules list
      const detail = await getCourseByUUID(selectedCourse.uuid);
      setModules(detail.modules);
      
      // Select the new module
      setSelectedModuleUUID(newModule.uuid);
      
      setNotification({ type: 'success', message: `Module "${newModuleTitle}" created!` });
      setAddModuleDialogOpen(false);
      setNewModuleTitle('');
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({
        type: 'error',
        message: apiError.message || 'Failed to create module'
      });
    } finally {
      setIsAddingModule(false);
    }
  }, [selectedCourse?.uuid, newModuleTitle, modules.length]);

  // Confirm Add Lesson
  const handleConfirmAddLesson = useCallback(async () => {
    if (!addLessonModuleUUID || !newLessonTitle.trim()) return;
    
    setIsAddingLesson(true);
    try {
      const existingLessons = lessonsByModule[addLessonModuleUUID] || [];
      const newLesson = await createHTILLesson(addLessonModuleUUID, {
        title: newLessonTitle.trim(),
        content: `# ${newLessonTitle.trim()}\n\nStart writing your lesson content here...`,
        sequence_order: existingLessons.length + 1
      });
      
      // Refresh lessons for this module
      const lessons = await getLessonsByModule(addLessonModuleUUID);
      setLessonsByModule(prev => ({ ...prev, [addLessonModuleUUID]: lessons }));
      
      // Select the new lesson
      handleSelectLesson(newLesson);
      
      setNotification({ type: 'success', message: `Lesson "${newLessonTitle}" created!` });
      setAddLessonDialogOpen(false);
      setNewLessonTitle('');
      setAddLessonModuleUUID(null);
    } catch (err) {
      const apiError = err as { message?: string };
      setNotification({
        type: 'error',
        message: apiError.message || 'Failed to create lesson'
      });
    } finally {
      setIsAddingLesson(false);
    }
  }, [addLessonModuleUUID, newLessonTitle, lessonsByModule, handleSelectLesson]);

  const handleNextLesson = useCallback(() => {
    const nextLesson = allLessonsInOrder[currentLessonIndex + 1];
    if (hasNextLesson && nextLesson) handleSelectLesson(nextLesson);
  }, [hasNextLesson, currentLessonIndex, allLessonsInOrder, handleSelectLesson]);

  const handlePrevLesson = useCallback(() => {
    const prevLesson = allLessonsInOrder[currentLessonIndex - 1];
    if (hasPrevLesson && prevLesson) handleSelectLesson(prevLesson);
  }, [hasPrevLesson, currentLessonIndex, allLessonsInOrder, handleSelectLesson]);

  // =========================================================================
  // Handlers - Canvas Save
  // =========================================================================

  // Track canvas changes (called from UnifiedCanvas onChange)
  const handleCanvasChange = useCallback((snapshot: TLSnapshot) => {
    pendingCanvasSnapshot.current = snapshot;
    setHasUnsavedCanvasChanges(true);
  }, []);

  // Save canvas (called from header button or UnifiedCanvas onSave)
  const handleCanvasSave = useCallback(async (snapshot?: TLSnapshot) => {
    if (!selectedLesson) return;
    
    // Use provided snapshot or pending snapshot
    const snapshotToSave = snapshot || pendingCanvasSnapshot.current;
    if (!snapshotToSave) {
      setNotification({ type: 'info', message: 'No changes to save' });
      return;
    }

    setCanvasSaveStatus('saving');
    try {
      const canvasData: CanvasData = {
        snapshot: snapshotToSave,
        version: 1,
        updatedAt: new Date().toISOString(),
        markdownContent: selectedLesson.content
      };

      await updateHTILLesson(selectedLesson.uuid, {
        content: JSON.stringify(canvasData)
      });

      setHasUnsavedCanvasChanges(false);
      setCanvasSaveStatus('saved');
      setNotification({ type: 'success', message: 'Saved!' });
      setTimeout(() => setCanvasSaveStatus('idle'), 2000);
    } catch (err) {
      const apiError = err as { message?: string };
      setCanvasSaveStatus('error');
      setNotification({
        type: 'error',
        message: apiError.message || 'Failed to save'
      });
      setTimeout(() => setCanvasSaveStatus('idle'), 3000);
    }
  }, [selectedLesson]);

  // Save from header button (uses pending snapshot)
  const handleHeaderSave = useCallback(() => {
    handleCanvasSave();
  }, [handleCanvasSave]);

  // =========================================================================
  // Handlers - Interactive Mode
  // =========================================================================

  const handleIntakeAnswer = useCallback((questionId: string, answer: any) => {
    tutor.answerIntakeQuestion(questionId, answer);
  }, [tutor]);

  const handleSendChat = useCallback(async (message: string) => {
    await tutor.sendChat(message);
  }, [tutor]);

  const handleLessonComplete = useCallback(async (lessonUUID: string, timeSpent: number, scrollDepth: number) => {
    tutor.completeLesson(lessonUUID, timeSpent, scrollDepth);
    saveProgress(lessonUUID);
    setNotification({ type: 'success', message: 'Great work! Keep going!' });

    // Refresh course data
    if (selectedCourse) {
      try {
        const detail = await getCourseByUUID(selectedCourse.uuid);
        setModules(detail.modules);
        setLessonsByModule({});
        if (detail.modules.length > 0 && detail.modules[0]) {
          const lessons = await getLessonsByModule(detail.modules[0].uuid);
          setLessonsByModule(prev => ({ ...prev, [detail.modules[0]!.uuid]: lessons }));
        }
      } catch (err) {
        console.warn('[CourseViewer] Failed to refresh course data after lesson complete', err);
      }
    }
  }, [tutor, saveProgress, selectedCourse]);

  // =========================================================================
  // Render: No Course Selected
  // =========================================================================

  if (!selectedCourse) {
    return <CourseSelector onSelectCourse={handleSelectCourse} />;
  }

  // =========================================================================
  // Render: Course View
  // =========================================================================

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullScreen ? '100vh' : 'calc(100vh - 100px)',
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : 'auto',
        left: isFullScreen ? 0 : 'auto',
        right: isFullScreen ? 0 : 'auto',
        bottom: isFullScreen ? 0 : 'auto',
        zIndex: isFullScreen ? 1300 : 'auto',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Progress Bar */}
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

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        {/* Left: Back & Title */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Back to courses">
            <IconButton onClick={handleBackToCourses} size="small">
              <IconArrowLeft size={20} />
            </IconButton>
          </Tooltip>
          {!showNav && (
            <Tooltip title="Show sidebar">
              <IconButton onClick={() => setShowNav(true)} size="small">
                <IconMenu2 size={20} />
              </IconButton>
            </Tooltip>
          )}
          <Box>
            <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
              {selectedCourse.title}
            </Typography>
            {selectedCourse.estimated_hours && (
              <Typography variant="caption" color="text.secondary">
                {formatEstimatedHours(selectedCourse.estimated_hours)}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Center: Lesson Navigation */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={handlePrevLesson}
            disabled={!hasPrevLesson}
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
          >
            <IconChevronRight size={20} />
          </IconButton>
        </Stack>

        {/* Right: Mode Toggle & Fullscreen */}
        <Stack direction="row" spacing={2} alignItems="center">
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

          {/* Chat Panel Toggle (only in interactive mode) */}
          {viewMode === 'interactive' && (
            <Tooltip title={showChatPanel ? 'Hide chat panel' : 'Show chat panel'}>
              <IconButton 
                onClick={() => setShowChatPanel(!showChatPanel)} 
                size="small"
                sx={{ 
                  color: showChatPanel ? theme.palette.primary.main : theme.palette.text.secondary,
                  bgcolor: showChatPanel ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                {showChatPanel ? <IconMessageCircle size={20} /> : <IconMessageCircleOff size={20} />}
              </IconButton>
            </Tooltip>
          )}

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullScreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
            <IconButton onClick={toggleFullScreen} size="small">
              {isFullScreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Navigation Drawer */}
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
              borderRight: `1px solid ${theme.palette.divider}`,
              boxSizing: 'border-box'
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
            onAddModule={handleAddModule}
            onAddLesson={handleAddLesson}
          />
        </Drawer>

        {/* Canvas Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Lesson Header */}
          {selectedLesson && (
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {selectedLesson.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Active LLM Model Display */}
                  {activeLLMModel && (
                    <Tooltip title="AI Model (configured in Settings)">
                      <Chip
                        label={activeLLMModel}
                        size="small"
                        variant="outlined"
                        icon={<IconSparkles size={14} />}
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          color: theme.palette.text.secondary,
                          '& .MuiChip-icon': {
                            color: theme.palette.primary.main
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                  {/* AI Status Indicator - shows feedback when AI isn't responding */}
                  {viewMode === 'interactive' && tutor.canvasAIStatus && (
                    <Chip
                      label={tutor.canvasAIStatus.message}
                      size="small"
                      variant="filled"
                      color={
                        tutor.canvasAIStatus.status === 'error' ? 'error' :
                        tutor.canvasAIStatus.status === 'need_more' ? 'warning' :
                        tutor.canvasAIStatus.status === 'rate_limited' ? 'info' :
                        'default'
                      }
                      sx={{
                        height: 28,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        animation: tutor.canvasAIStatus.status === 'thinking' ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.6 }
                        }
                      }}
                      onDelete={() => tutor.clearCanvasAIStatus()}
                    />
                  )}
                  {/* AI Context Debug Toggle - shows what's sent to LLM */}
                  {viewMode === 'interactive' && tutor.canvasAIContext && (
                    <Tooltip title={showContextDebug ? "Hide AI Context" : "Show AI Context"}>
                      <Chip
                        label={`Context: ${tutor.canvasAIContext.token_estimate} tokens`}
                        size="small"
                        variant={showContextDebug ? 'filled' : 'outlined'}
                        color="secondary"
                        icon={<IconBrain size={14} />}
                        onClick={() => setShowContextDebug(!showContextDebug)}
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      />
                    </Tooltip>
                  )}
                  {/* Save Button */}
                  <Button
                    variant={hasUnsavedCanvasChanges ? 'contained' : 'outlined'}
                    color={hasUnsavedCanvasChanges ? 'warning' : 'primary'}
                    size="small"
                    onClick={handleHeaderSave}
                    disabled={canvasSaveStatus === 'saving'}
                    startIcon={
                      canvasSaveStatus === 'saving' ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : canvasSaveStatus === 'saved' ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconDeviceFloppy size={16} />
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      minWidth: 90,
                      fontWeight: 600
                    }}
                  >
                    {canvasSaveStatus === 'saving'
                      ? 'Saving...'
                      : canvasSaveStatus === 'saved'
                        ? 'Saved!'
                        : hasUnsavedCanvasChanges
                          ? 'Save *'
                          : 'Save'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Content Area - Pure Canvas Mode (text auto-pasted onto canvas) */}
          <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {loadingLesson || loadingCourse ? (
              <Box sx={{ p: 4 }}>
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton
                  variant="rectangular"
                  height="60vh"
                  sx={{ mt: 2, borderRadius: 2 }}
                />
              </Box>
            ) : selectedLesson ? (
              /* Single unified canvas - lesson content is auto-pasted as text shapes */
              <UnifiedCanvas
                ref={canvasRef}
                key={selectedLesson.uuid}
                initialData={canvasData}
                initialText={!canvasData?.snapshot ? selectedLesson.content : undefined}
                onChange={handleCanvasChange}
                readOnly={false}
                minHeight="100%"
                hideUi={false}
                transparentBg={false}
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.text.secondary
                }}
              >
                <Typography>Select a lesson to view</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Panel: Tutor Chat (only when showChatPanel is true) */}
        {showChatPanel && viewMode === 'interactive' && (
          <Slide direction="left" in={showChatPanel}>
            <Box
              sx={{
                width: CHAT_WIDTH,
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
                      tutor.completeIntake();
                      tutor.requestLesson();
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress size={32} />
                  </Box>
                )
              ) : (
                <TutorChat
                  messages={tutor.messages}
                  isTyping={tutor.isTutorTyping}
                  isConnected={tutor.isConnected}
                  onSend={handleSendChat}
                  lessonContext={selectedLesson ? {
                    title: selectedLesson.title,
                    content: selectedLesson.content || '',
                    keyConcepts: selectedLesson.key_concepts || []
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
              )}
            </Box>
          </Slide>
        )}
      </Box>

      {/* Add Module Dialog */}
      <Dialog 
        open={addModuleDialogOpen} 
        onClose={() => !isAddingModule && setAddModuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Module</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Module Title"
            fullWidth
            variant="outlined"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            disabled={isAddingModule}
            placeholder="e.g., Chapter 2: Advanced Concepts"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddModule()}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAddModuleDialogOpen(false)} 
            disabled={isAddingModule}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAddModule}
            variant="contained"
            disabled={isAddingModule || !newModuleTitle.trim()}
          >
            {isAddingModule ? 'Creating...' : 'Add Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog 
        open={addLessonDialogOpen} 
        onClose={() => !isAddingLesson && setAddLessonDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Lesson</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Lesson Title"
            fullWidth
            variant="outlined"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            disabled={isAddingLesson}
            placeholder="e.g., Introduction to Sorting Algorithms"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddLesson()}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAddLessonDialogOpen(false)} 
            disabled={isAddingLesson}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAddLesson}
            variant="contained"
            disabled={isAddingLesson || !newLessonTitle.trim()}
          >
            {isAddingLesson ? 'Creating...' : 'Add Lesson'}
          </Button>
        </DialogActions>
      </Dialog>

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
          variant="filled"
        >
          {tutor.error || notification?.message}
        </Alert>
      </Snackbar>

      {/* AI Context Debug Panel - Compact with expandable sections */}
      <Collapse in={showContextDebug && !!tutor.canvasAIContext}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 480,
            maxHeight: 'calc(100vh - 100px)', // Only scroll when exceeds screen
            overflow: 'auto',
            zIndex: 1300,
            bgcolor: alpha(theme.palette.background.paper, 0.98),
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <IconBrain size={18} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" fontWeight={600}>
                AI Context
              </Typography>
              <Chip 
                label={`${tutor.canvasAIContext?.token_estimate || 0} tokens`} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip label={`W:${tutor.canvasAIContext?.window_size}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
              <Chip label={`${tutor.canvasAIContext?.total_messages_in_db || 0} msgs`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
              <IconButton size="small" onClick={() => setShowContextDebug(false)}>
                <IconX size={16} />
              </IconButton>
            </Stack>
          </Box>

          {tutor.canvasAIContext && (
            <Box sx={{ p: 1.5 }}>
              {/* Expandable Context Buttons */}
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                {/* Lesson Content Button */}
                {tutor.canvasAIContext.lesson_title && (
                  <Tooltip 
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: { maxWidth: 400, p: 1.5, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 4, border: `1px solid ${theme.palette.divider}` }
                      }
                    }}
                    title={
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="primary">
                          📚 {tutor.canvasAIContext.lesson_title}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                          {tutor.canvasAIContext.lesson_content || 'No content'}
                        </Typography>
                      </Box>
                    }
                  >
                    <Chip
                      icon={<span style={{ fontSize: '0.8rem' }}>📚</span>}
                      label={`Lesson: ${tutor.canvasAIContext.lesson_title.substring(0, 15)}...`}
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
                    />
                  </Tooltip>
                )}

                {/* Conversation History Button */}
                {(tutor.canvasAIContext.recent_messages?.length > 0 || tutor.canvasAIContext.summaries?.length > 0) && (
                  <Tooltip 
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: { maxWidth: 450, p: 1.5, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 4, border: `1px solid ${theme.palette.divider}` }
                      }
                    }}
                    title={
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mb: 1, display: 'block' }}>
                          💬 Conversation History ({tutor.canvasAIContext.recent_messages?.length || 0} recent + {tutor.canvasAIContext.summaries?.length || 0} summaries)
                        </Typography>
                        {tutor.canvasAIContext.summaries?.map((msg, i) => (
                          <Box key={`s-${i}`} sx={{ mb: 1, p: 0.5, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="caption" color="warning.main" fontWeight={600}>Summary</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>{msg.content}</Typography>
                          </Box>
                        ))}
                        {tutor.canvasAIContext.recent_messages?.map((msg, i) => (
                          <Box key={`m-${i}`} sx={{ mb: 0.5, pl: 1, borderLeft: `2px solid ${msg.role === 'assistant' ? theme.palette.secondary.main : theme.palette.primary.main}` }}>
                            <Typography variant="caption" fontWeight={600} color={msg.role === 'assistant' ? 'secondary' : 'primary'}>
                              {msg.role === 'assistant' ? 'AI' : 'You'}:
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', ml: 0.5 }}>{msg.content}</Typography>
                          </Box>
                        ))}
                      </Box>
                    }
                  >
                    <Chip
                      icon={<span style={{ fontSize: '0.8rem' }}>💬</span>}
                      label={`History: ${tutor.canvasAIContext.recent_messages?.length || 0} msgs`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) } }}
                    />
                  </Tooltip>
                )}

                {/* Summaries Button (if any) */}
                {tutor.canvasAIContext.summarized_count > 0 && (
                  <Chip
                    icon={<span style={{ fontSize: '0.8rem' }}>📝</span>}
                    label={`${tutor.canvasAIContext.summarized_count} summarized`}
                    size="small"
                    variant="outlined"
                    color="warning"
                  />
                )}
              </Stack>

              <Divider sx={{ my: 1 }} />

              {/* Full Prompt - Simplified with placeholders */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                  🎯 PROMPT TO LLM
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: alpha(theme.palette.grey[900], 0.02),
                  }}
                >
                  {/* System prompt */}
                  <Typography variant="caption" sx={{ color: theme.palette.grey[500], fontStyle: 'italic', display: 'block', mb: 1 }}>
                    SYSTEM: You are a personal tutor helping a student.
                  </Typography>

                  {/* Lesson Context Placeholder */}
                  {tutor.canvasAIContext.lesson_title && (
                    <Box sx={{ mb: 1, p: 0.75, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 1, border: `1px dashed ${theme.palette.info.main}` }}>
                      <Typography variant="caption" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                        📚 LESSON CONTEXT → <em>hover chip above</em>
                      </Typography>
                    </Box>
                  )}

                  {/* Conversation History Placeholder */}
                  {(tutor.canvasAIContext.recent_messages?.length > 0) && (
                    <Box sx={{ mb: 1, p: 0.75, bgcolor: alpha(theme.palette.secondary.main, 0.08), borderRadius: 1, border: `1px dashed ${theme.palette.secondary.main}` }}>
                      <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}>
                        💬 CONVERSATION ({tutor.canvasAIContext.recent_messages.length} msgs) → <em>hover chip above</em>
                      </Typography>
                    </Box>
                  )}

                  {/* The actual question */}
                  <Box sx={{ mt: 1.5, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 1, borderLeft: `3px solid ${theme.palette.primary.main}` }}>
                    <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, display: 'block', mb: 0.5 }}>
                      ❓ USER INPUT:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
                      {tutor.canvasAIContext.user_input 
                        ? (tutor.canvasAIContext.user_input.length > 200 
                            ? tutor.canvasAIContext.user_input.substring(tutor.canvasAIContext.user_input.length - 200) + '...' 
                            : tutor.canvasAIContext.user_input)
                        : 'No input'}
                    </Typography>
                  </Box>

                  {/* Instruction */}
                  <Typography variant="caption" sx={{ color: 'text.primary', fontStyle: 'italic', display: 'block', mt: 1.5 }}>
                    → Respond with SHORT answer (1-2 sentences). Be concise.
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}
