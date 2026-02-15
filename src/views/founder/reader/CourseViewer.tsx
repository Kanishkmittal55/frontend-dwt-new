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
  IconX,
  IconPlayerStop,
  IconPalette,
  IconPencil,
  IconNote,
  IconTrash,
  IconRefresh,
  IconDatabaseExport
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
import { syncSeeds } from '@/api/founder';

// Hooks
import useTutorAgent from '@/hooks/useTutorAgent';
import { useCanvasActivityTracker } from '@/hooks/useCanvasActivityTracker';
import { useOneNoteActivityTracker } from '@/hooks/useOneNoteActivityTracker';

// Components
import CourseSelector from './components/CourseSelector';
import ModuleNav from './components/ModuleNav';
import TutorChat from './components/TutorChat';
import IntakeForm from './components/IntakeForm';
import LessonEndDialog from './components/LessonEndDialog';
// Vetting mode is handled inline inside TutorChat
import { CustomRichTextToolbar, type SourceType, type SelectionData } from './components/CustomRichTextToolbar';
import { 
  UnifiedCanvas, 
  OneNoteEditor,
  type CanvasData, 
  type TLSnapshot,
  type UnifiedCanvasRef,
  type OneNoteEditorRef,
  type OneNoteSelectionData,
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
type EditorMode = 'canvas' | 'onenote';

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
// Phase 5: Data Sync Helpers (Canvas <-> OneNote)
// ============================================================================

/**
 * Convert tldraw richText (ProseMirror JSON) to HTML for TipTap
 * Both use ProseMirror under the hood, so the format is very similar
 */
function richTextToHtml(richText: Record<string, unknown> | null | undefined): string {
  if (!richText || typeof richText !== 'object') return '';
  
  const doc = richText as {
    type: string;
    content?: Array<{
      type: string;
      content?: Array<{
        type: string;
        text?: string;
        marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
      }>;
    }>;
  };
  
  if (doc.type !== 'doc' || !Array.isArray(doc.content)) return '';
  
  const htmlParts: string[] = [];
  
  for (const block of doc.content) {
    if (block.type === 'paragraph') {
      const paraContent: string[] = [];
      
      if (Array.isArray(block.content)) {
        for (const node of block.content) {
          if (node.type === 'text' && node.text) {
            let text = escapeHtml(node.text);
            
            // Apply marks (bold, italic, etc.)
            if (Array.isArray(node.marks)) {
              for (const mark of node.marks) {
                switch (mark.type) {
                  case 'bold':
                    text = `<strong>${text}</strong>`;
                    break;
                  case 'italic':
                    text = `<em>${text}</em>`;
                    break;
                  case 'underline':
                    text = `<u>${text}</u>`;
                    break;
                  case 'strike':
                    text = `<s>${text}</s>`;
                    break;
                  case 'code':
                    text = `<code>${text}</code>`;
                    break;
                  case 'highlight':
                    text = `<mark>${text}</mark>`;
                    break;
                }
              }
            }
            
            paraContent.push(text);
          } else if (node.type === 'hardBreak') {
            paraContent.push('<br/>');
          }
        }
      }
      
      htmlParts.push(`<p>${paraContent.join('')}</p>`);
    } else if (block.type === 'heading') {
      // Handle headings if present
      const level = (block as { attrs?: { level?: number } }).attrs?.level || 1;
      const headingContent: string[] = [];
      if (Array.isArray(block.content)) {
        for (const node of block.content) {
          if (node.type === 'text' && node.text) {
            headingContent.push(escapeHtml(node.text));
          }
        }
      }
      htmlParts.push(`<h${level}>${headingContent.join('')}</h${level}>`);
    }
  }
  
  return htmlParts.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Shape type with tldraw structure
 */
interface TLShape {
  id: string;
  type: string;
  x?: number;
  y?: number;
  props?: {
    richText?: Record<string, unknown>;
    text?: string;
  };
  meta?: {
    isLessonContent?: boolean;
    isAI?: boolean;
  };
}

// Track corrupted markdownContent warnings to avoid spam
let hasWarnedCorruptedMarkdown = false;

/**
 * Extract text content from canvas data for OneNote editor
 * Converts tldraw richText shapes to HTML for TipTap
 * Falls back to markdown content or lesson content
 */
function extractTextFromCanvas(canvasData: CanvasData | null, fallbackContent?: string): string {
  // Priority 1: If we have stored markdownContent, use that (it's the original source)
  // BUT: Skip if it's actually JSON (corrupted data from old saves)
  if (canvasData?.markdownContent) {
    const content = canvasData.markdownContent.trim();
    // Check if it's NOT JSON (valid markdown/text)
    if (!content.startsWith('{') && !content.startsWith('[')) {
      // Convert markdown to simple HTML for TipTap
      return markdownToSimpleHtml(content);
    }
    // If markdownContent is JSON, it's corrupted - fall through to extract from shapes
    if (!hasWarnedCorruptedMarkdown) {
      console.warn('[extractTextFromCanvas] markdownContent is JSON (corrupted), extracting from shapes instead');
      hasWarnedCorruptedMarkdown = true;
    }
  }
  
  // Priority 2: Extract from tldraw snapshot shapes
  if (canvasData?.snapshot) {
    try {
      const snapshot = canvasData.snapshot;
      const shapes: TLShape[] = [];
      
      // tldraw v4 stores shapes in snapshot.store (keyed by shape:xxx)
      // or in snapshot.document.store
      const store = snapshot.store || snapshot.document?.store || {};
      
      for (const key in store) {
        if (key.startsWith('shape:')) {
          const shape = store[key] as TLShape;
          if (shape) {
            shapes.push(shape);
          }
        }
      }
      
      // Sort shapes by Y position (top to bottom) for reading order
      shapes.sort((a, b) => (a.y || 0) - (b.y || 0));
      
      const htmlParts: string[] = [];
      
      for (const shape of shapes) {
        // Skip AI-generated shapes (they're responses, not content)
        if (shape.meta?.isAI) continue;
        
        if (shape.type === 'text' || shape.type === 'note') {
          // Handle richText format (tldraw v4)
          if (shape.props?.richText) {
            const html = richTextToHtml(shape.props.richText);
            if (html.trim()) {
              htmlParts.push(html);
            }
          }
          // Fallback: plain text prop (older format)
          else if (shape.props?.text) {
            const text = escapeHtml(shape.props.text);
            const paragraphs = text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`);
            htmlParts.push(paragraphs.join('\n'));
          }
        } else if (shape.type === 'geo' && shape.props?.text) {
          // Geo shapes can have text labels
          const text = escapeHtml(shape.props.text);
          htmlParts.push(`<p><em>[Shape: ${text}]</em></p>`);
        }
      }
      
      if (htmlParts.length > 0) {
        return htmlParts.join('\n\n');
      }
    } catch (e) {
      console.warn('[extractTextFromCanvas] Failed to extract text from snapshot:', e);
    }
  }
  
  // Priority 3: Fallback to provided content (lesson.content)
  if (fallbackContent) {
    // Check if it's already HTML
    if (fallbackContent.trim().startsWith('<')) {
      return fallbackContent;
    }
    
    // Check if it's a JSON canvas snapshot (shouldn't show raw JSON to user)
    if (fallbackContent.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(fallbackContent);
        // If it's a canvas snapshot, try to extract from it
        if (parsed.snapshot) {
          const extracted = extractTextFromCanvas(parsed as CanvasData, undefined);
          if (extracted.trim()) {
            return extracted;
          }
          // If we have markdownContent in the parsed data, use that
          if (parsed.markdownContent) {
            return markdownToSimpleHtml(parsed.markdownContent);
          }
        }
        // If parsed but not a snapshot, it's probably some other JSON - show empty
        console.warn('[extractTextFromCanvas] Fallback content is JSON but not extractable');
        return '<p><em>This lesson was created in Canvas mode. Switch to Canvas view to see the content.</em></p>';
      } catch {
        // Not valid JSON, treat as markdown
      }
    }
    
    // Otherwise convert markdown to HTML
    return markdownToSimpleHtml(fallbackContent);
  }
  
  return '';
}

/**
 * Convert simple markdown to HTML for TipTap
 * Handles headings, paragraphs, bold, italic, lists, code blocks
 */
function markdownToSimpleHtml(markdown: string): string {
  if (!markdown) return '';
  
  // Already HTML? Return as-is
  if (markdown.trim().startsWith('<')) {
    return markdown;
  }
  
  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let listItems: string[] = [];
  
  const flushList = () => {
    if (inList && listItems.length > 0) {
      const items = listItems.map(item => `<li>${item}</li>`).join('');
      htmlParts.push(`<${listType}>${items}</${listType}>`);
      listItems = [];
      inList = false;
    }
  };
  
  for (const line of lines) {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        htmlParts.push(`<pre><code>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      flushList();
      const level = headingMatch[1].length;
      const text = processInlineMarkdown(headingMatch[2]);
      htmlParts.push(`<h${level}>${text}</h${level}>`);
      continue;
    }
    
    // Unordered lists
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch && ulMatch[1]) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(processInlineMarkdown(ulMatch[1]));
      continue;
    }
    
    // Ordered lists
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch && olMatch[1]) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(processInlineMarkdown(olMatch[1]));
      continue;
    }
    
    // Blockquotes
    if (line.startsWith('>')) {
      flushList();
      const text = processInlineMarkdown(line.substring(1).trim());
      htmlParts.push(`<blockquote><p>${text}</p></blockquote>`);
      continue;
    }
    
    // Empty lines
    if (line.trim() === '') {
      flushList();
      continue;
    }
    
    // Regular paragraph
    flushList();
    const text = processInlineMarkdown(line);
    htmlParts.push(`<p>${text}</p>`);
  }
  
  flushList();
  
  return htmlParts.join('\n');
}

/**
 * Process inline markdown (bold, italic, code, links)
 */
function processInlineMarkdown(text: string): string {
  let result = escapeHtml(text);
  
  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Inline code: `code`
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Links: [text](url)
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  
  return result;
}

/**
 * Format AI response as styled HTML for OneNote/TipTap editor
 * Creates a purple blockquote with AI indicator styling
 */
function formatAIResponseForOneNote(text: string): string {
  // Clean up text: normalize line breaks and remove excessive whitespace
  const cleanText = text.trim().replace(/\n{3,}/g, '\n\n');
  
  // Process the text: convert newlines to paragraphs, handle markdown
  const paragraphs = cleanText.split(/\n\n/).filter(p => p.trim());
  
  if (paragraphs.length === 0) {
    return '';
  }

  // Format each paragraph
  const formattedParagraphs = paragraphs.map(para => {
    // Check if it's a heading (starts with #)
    const headingMatch = para.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      const level = headingMatch[1].length;
      return `<h${level}>${escapeHtml(headingMatch[2])}</h${level}>`;
    }

    // Check for list items
    if (para.includes('\n- ') || para.startsWith('- ')) {
      const items = para.split(/\n/).filter(line => line.trim());
      const listItems = items.map(item => {
        const itemText = item.replace(/^-\s*/, '').trim();
        return `<li>${processInlineMarkdown(itemText)}</li>`;
      }).join('');
      return `<ul>${listItems}</ul>`;
    }

    // Regular paragraph - join lines with space (single newlines become spaces)
    const lines = para.split('\n').map(line => processInlineMarkdown(line.trim())).filter(l => l).join(' ');
    return lines ? `<p>${lines}</p>` : '';
  }).filter(p => p).join('');

  // Return clean HTML without extra whitespace
  return `<div class="ai-response"><p class="ai-response-header"><strong>🤖 AI Response</strong></p>${formattedParagraphs}</div><p></p>`;
}

/**
 * Insert AI response in TipTap editor with typing effect
 * Types words progressively for a natural feel while maintaining valid HTML
 */
function typeAIResponseInOneNote(
  editor: import('@tiptap/react').Editor,
  text: string,
  options: {
    typingSpeed?: number; // ms per word
    onComplete?: () => void;
  } = {}
) {
  const { typingSpeed = 30, onComplete } = options;
  
  // Split text into words
  const words = text.trim().split(/\s+/);
  if (words.length === 0) {
    onComplete?.();
    return;
  }
  
  // Insert header first, then type content word by word
  const headerHTML = '<div class="ai-response"><p class="ai-response-header"><strong>🤖 AI Response</strong></p><p>';
  editor.commands.insertContent(headerHTML);
  
  let currentWordIndex = 0;
  let needsNewParagraph = false;
  
  const typeNextWord = () => {
    if (currentWordIndex >= words.length) {
      // Close the container and add trailing paragraph
      editor.commands.insertContent('</p></div><p></p>');
      setTimeout(() => {
        onComplete?.();
      }, 50);
      return;
    }
    
    const word = words[currentWordIndex] || '';
    
    // Handle paragraph breaks (double newlines become new paragraph indicators)
    if (word === '' || needsNewParagraph) {
      needsNewParagraph = false;
      // Don't add empty words, just mark that next word needs new paragraph
    } else {
      // Check for markdown formatting
      let displayWord = word;
      
      // Bold: **word** -> <strong>word</strong>
      displayWord = displayWord.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic: *word* -> <em>word</em>
      displayWord = displayWord.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Code: `word` -> <code>word</code>
      displayWord = displayWord.replace(/`(.+?)`/g, '<code>$1</code>');
      
      // Insert word with space
      editor.commands.insertContent(displayWord + ' ');
    }
    
    currentWordIndex++;
    
    // Calculate delay - vary slightly for natural feel
    const delay = typingSpeed + Math.random() * 10;
    setTimeout(typeNextWord, delay);
  };
  
  // Start typing after a brief pause
  setTimeout(typeNextWord, 100);
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
  const [editorMode, setEditorMode] = useState<EditorMode>('canvas');
  const [showNav, setShowNav] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false); // Chat panel hidden by default in interactive mode
  const [showContextDebug, setShowContextDebug] = useState(false); // AI context debug panel
  const [showStylePanel, setShowStylePanel] = useState(false); // tldraw style panel collapsed by default
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

  // Sync to CSV state
  const [isSyncingCsv, setIsSyncingCsv] = useState(false);

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
  
  // OneNote unsaved state (defined early so handleBackToCourses can use it)
  const [hasUnsavedOneNoteChanges, setHasUnsavedOneNoteChanges] = useState(false);
  const pendingOneNoteContent = useRef<string | null>(null);
  
  // Active LLM model display
  const [activeLLMModel, setActiveLLMModel] = useState<string | null>(null);

  // Canvas ref - exposes editor for AI writing
  const canvasRef = useRef<UnifiedCanvasRef>(null);
  
  // OneNote editor ref
  const oneNoteRef = useRef<OneNoteEditorRef>(null);
  
  // AI state tracking ref - prevents activity tracker from sending during AI typing animation
  const aiTypingRef = useRef<boolean>(false);
  
  // Lesson session tracking
  const [showLessonEndDialog, setShowLessonEndDialog] = useState(false);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const lessonStartTimeRef = useRef<number>(Date.now());

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
      enabled: viewMode === 'interactive' && tutor.isConnected && editorMode === 'canvas',
      textDebounceMs: 2000,      // Debounce to reduce noise
      idleThresholdMs: 30000,    // Idle nudge after 30s
      aiTypingRef               // Prevent sending during AI typing animation
    }
  );

  // =========================================================================
  // OneNote Activity Tracker (AI writing companion for TipTap)
  // =========================================================================
  
  // Get TipTap editor instance from OneNote ref
  const [oneNoteEditor, setOneNoteEditor] = useState<import('@tiptap/react').Editor | null>(null);
  
  // Update OneNote editor ref when component mounts
  const hasLoggedOneNoteEditorReadyRef = useRef(false);
  useEffect(() => {
    // Only check when we have a lesson selected and in onenote mode
    if (!selectedLesson?.uuid || editorMode !== 'onenote') {
      hasLoggedOneNoteEditorReadyRef.current = false;
      return;
    }
    
    const checkEditor = () => {
      const ed = oneNoteRef.current?.getEditor();
      if (ed && ed !== oneNoteEditor) {
        if (!hasLoggedOneNoteEditorReadyRef.current) {
          console.log('%c[OneNote] Editor ready', 'color: #4caf50');
          hasLoggedOneNoteEditorReadyRef.current = true;
        }
        setOneNoteEditor(ed);
      }
    };
    
    // Check immediately and then periodically until we get the editor
    checkEditor();
    const interval = setInterval(() => {
      if (!oneNoteEditor) checkEditor();
    }, 500);
    
    return () => clearInterval(interval);
  }, [selectedLesson?.uuid, editorMode]); // Removed oneNoteEditor from deps to avoid re-triggering

  // OneNote activity tracker - sends TipTap updates to tutor agent
  const { syncLastSentText: syncOneNoteLastSentText } = useOneNoteActivityTracker(
    oneNoteEditor,
    tutor.sendCanvasText,
    tutor.sendCanvasIdle,
    { 
      enabled: viewMode === 'interactive' && tutor.isConnected && editorMode === 'onenote',
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
  // Clear AI context when switching lessons to ensure fresh context from DB
  useEffect(() => {
    if (tutor.isConnected && tutor.hasSession && selectedLesson?.uuid) {
      console.log('%c[Tutor] 📖 Selecting lesson', 'color: #2196f3', selectedLesson.uuid);
      // Clear previous AI context before selecting new lesson
      tutor.clearCanvasAIContext();
      tutor.clearCanvasAIStatus();
      tutor.selectLesson(selectedLesson.uuid);
      // Reset lesson start time
      lessonStartTimeRef.current = Date.now();
    }
  }, [tutor.isConnected, tutor.hasSession, selectedLesson?.uuid, tutor.selectLesson, tutor.clearCanvasAIContext, tutor.clearCanvasAIStatus]);

  // Handle selection result from server
  useEffect(() => {
    if (tutor.selectionResult) {
      setIsSavingSelection(false);
      if (tutor.selectionResult.success) {
        setNotification({
          type: 'success',
          message: tutor.selectionResult.action === 'save_concept' 
            ? '💡 Concept saved!' 
            : '❓ Confusion point marked!'
        });
      } else {
        setNotification({
          type: 'error',
          message: tutor.selectionResult.message || 'Failed to save'
        });
      }
      tutor.clearSelectionResult();
    }
  }, [tutor.selectionResult, tutor]);

  // Also reset saving state on any error (e.g., if server rejects the message)
  useEffect(() => {
    if (tutor.error && isSavingSelection) {
      setIsSavingSelection(false);
    }
  }, [tutor.error, isSavingSelection]);

  // In interactive mode, reset saving state as soon as the vet console opens
  // (the saving interaction has moved to the chat panel, buttons should be re-enabled
  // so the founder can continue selecting text while the conversation is ongoing)
  useEffect(() => {
    if (tutor.isVetConsoleOpen && isSavingSelection) {
      setIsSavingSelection(false);
    }
  }, [tutor.isVetConsoleOpen, isSavingSelection]);

  // Also reset saving state when the vet verdict arrives (safety net for edge cases)
  useEffect(() => {
    if (tutor.vetVerdict && isSavingSelection) {
      setIsSavingSelection(false);
    }
  }, [tutor.vetVerdict, isSavingSelection]);

  // Handle lesson score from server (after ending lesson)
  useEffect(() => {
    if (tutor.lessonScore) {
      setShowLessonEndDialog(true);
    }
  }, [tutor.lessonScore]);

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
  // Canvas data comes from canvas_content field (not content!)
  // content holds the original markdown or OneNote HTML
  const canvasData = parseCanvasData(selectedLesson?.canvas_content);
  
  // OneNote uses the `content` field directly (original markdown or saved HTML)
  // Canvas uses the `canvas_content` field (tldraw JSON)
  // No need to extract from canvas - these are now separate fields
  const oneNoteInitialContent = useMemo(() => {
    if (!selectedLesson) return '';
    // Use content field directly - it contains either original markdown or saved OneNote HTML
    return selectedLesson.content || '';
  }, [selectedLesson?.uuid, selectedLesson?.content]); // Recalculate when lesson changes

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
    // Check for unsaved changes before leaving
    const hasUnsavedChanges = hasUnsavedCanvasChanges || hasUnsavedOneNoteChanges;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      if (!confirmed) {
        return; // User cancelled, stay on page
      }
    }

    // End session first to clear all tutor state including AI context
    if (tutor.hasSession) {
      tutor.endSession();
    }
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
    setShowContextDebug(false);
    
    // Reset unsaved state
    setHasUnsavedCanvasChanges(false);
    setHasUnsavedOneNoteChanges(false);
  }, [tutor, hasUnsavedCanvasChanges, hasUnsavedOneNoteChanges]);

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
  // AI Canvas/OneNote Writing - Handle when agent wants to write
  // =========================================================================

  useEffect(() => {
    // Only process when in interactive mode and we have a write request
    if (!tutor.canvasAIWrite || viewMode !== 'interactive') return;

    const { text, position, color = 'violet', typingSpeed = 35, size = 'm' } = tutor.canvasAIWrite;

    // =========================================================================
    // OneNote Mode - Insert styled AI response with typing effect
    // =========================================================================
    if (editorMode === 'onenote') {
      const tipTapEditor = oneNoteRef.current?.getEditor();
      if (!tipTapEditor) {
        console.warn('[CourseViewer] Cannot write to OneNote - no editor ref');
        tutor.clearCanvasAIWrite();
        return;
      }

      console.log('%c[OneNote] ✍️ AI typing response', 'color: #9c27b0; font-weight: bold; font-size: 12px', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text
      });

      // Mark AI as typing - prevents activity tracker from sending updates
      aiTypingRef.current = true;

      // Clear the request immediately to prevent re-processing
      tutor.clearCanvasAIWrite();

      // Type the AI response with animation
      typeAIResponseInOneNote(tipTapEditor, text, {
        typingSpeed: typingSpeed || 15,
        onComplete: () => {
          console.log('%c[OneNote] ✅ AI typing complete', 'color: #4caf50; font-weight: bold');
          
          // Mark AI as done typing
          aiTypingRef.current = false;
          
          // Re-focus the editor so user can continue typing
          tipTapEditor.commands.focus('end');
          
          // Sync lastSentText to prevent re-triggering
          syncOneNoteLastSentText();
          
          setNotification({ type: 'info', message: 'AI responded' });
        }
      });
      return;
    }

    // =========================================================================
    // Canvas Mode - Animated typing on canvas
    // =========================================================================
    const editor = canvasRef.current?.getEditor();
    if (!editor) {
      console.warn('[CourseViewer] Cannot write to canvas - no editor ref');
      tutor.clearCanvasAIWrite();
      return;
    }

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
  }, [tutor.canvasAIWrite, viewMode, editorMode, tutor]);

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
  // Canvas saves to `canvas_content` field (tldraw JSON)
  // OneNote saves to `content` field (HTML)
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
      // Canvas data structure with snapshot and metadata
      const canvasDataToSave: CanvasData = {
        snapshot: snapshotToSave,
        version: 1,
        updatedAt: new Date().toISOString(),
        markdownContent: selectedLesson.content // Keep original markdown as reference
      };

      // Save Canvas JSON to canvas_content field (not content!)
      await updateHTILLesson(selectedLesson.uuid, {
        canvas_content: JSON.stringify(canvasDataToSave)
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

  // Handle sync to CSV (exports database to CSV seed files)
  const handleSyncToCsv = useCallback(async () => {
    setIsSyncingCsv(true);
    try {
      const result = await syncSeeds();
      const tableCount = result.results?.length || 0;
      setNotification({
        type: 'success',
        message: `✅ Synced ${tableCount} tables to CSV in ${result.total_time || 'N/A'}`
      });
    } catch (error) {
      console.error('[CourseViewer] Sync to CSV failed:', error);
      setNotification({
        type: 'error',
        message: 'Failed to sync data. Check console for details.'
      });
    } finally {
      setIsSyncingCsv(false);
    }
  }, []);

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
  // Handlers - Canvas Selection (save concepts/confusion points via RichTextToolbar)
  // =========================================================================

  const handleSaveConcept = useCallback((data: SelectionData) => {
    if (!data.text || !selectedLesson?.uuid) return;
    
    setIsSavingSelection(true);

    // In interactive mode, auto-open chat panel so vetting conversation is visible
    if (viewMode === 'interactive') {
      setShowChatPanel(true);
    }

    tutor.sendCanvasSelection({
      text: data.text,
      action: 'save_concept',
      source_type: data.sourceType,
      lesson_uuid: selectedLesson.uuid,
      view_mode: viewMode,
      ...(data.annotation ? { annotation: data.annotation } : {})
    });
  }, [selectedLesson?.uuid, tutor, viewMode]);

  const handleMarkConfusion = useCallback((data: SelectionData) => {
    if (!data.text || !selectedLesson?.uuid) return;
    
    setIsSavingSelection(true);
    tutor.sendCanvasSelection({
      text: data.text,
      action: 'mark_confusion',
      source_type: data.sourceType,
      lesson_uuid: selectedLesson.uuid,
      ...(data.annotation ? { annotation: data.annotation } : {})
    });
  }, [selectedLesson?.uuid, tutor]);

  // =========================================================================
  // Handlers - OneNote Editor (TipTap-based document editor)
  // =========================================================================

  // Warn user about unsaved changes when leaving the page (browser close/reload)
  useEffect(() => {
    const hasUnsavedChanges = hasUnsavedCanvasChanges || hasUnsavedOneNoteChanges;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedCanvasChanges, hasUnsavedOneNoteChanges]);

  const handleOneNoteChange = useCallback((html: string) => {
    pendingOneNoteContent.current = html;
    setHasUnsavedOneNoteChanges(true);
  }, []);

  // Save OneNote content
  const handleOneNoteSave = useCallback(async (html?: string) => {
    if (!selectedLesson) return;
    
    const contentToSave = html || pendingOneNoteContent.current;
    if (!contentToSave) {
      setNotification({ type: 'info', message: 'No changes to save' });
      return;
    }

    setCanvasSaveStatus('saving');
    try {
      // Store as plain HTML (or we could wrap it in a structure)
      await updateHTILLesson(selectedLesson.uuid, {
        content: contentToSave
      });

      setHasUnsavedOneNoteChanges(false);
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

  // Handlers for OneNote concept/confusion marking
  const handleOneNoteSaveConcept = useCallback((data: OneNoteSelectionData) => {
    if (!data.text || !selectedLesson?.uuid) return;
    
    setIsSavingSelection(true);

    if (viewMode === 'interactive') {
      setShowChatPanel(true);
    }

    tutor.sendCanvasSelection({
      text: data.text,
      action: 'save_concept',
      source_type: 'note' as SourceType,
      lesson_uuid: selectedLesson.uuid,
      view_mode: viewMode
    });
  }, [selectedLesson?.uuid, tutor, viewMode]);

  const handleOneNoteMarkConfusion = useCallback((data: OneNoteSelectionData) => {
    if (!data.text || !selectedLesson?.uuid) return;
    
    setIsSavingSelection(true);
    tutor.sendCanvasSelection({
      text: data.text,
      action: 'mark_confusion',
      source_type: 'note' as SourceType,
      lesson_uuid: selectedLesson.uuid
    });
  }, [selectedLesson?.uuid, tutor]);

  // =========================================================================
  // Handlers - End Lesson Session
  // =========================================================================

  const handleEndLesson = useCallback(() => {
    if (!selectedLesson?.uuid) return;
    
    const timeSpentSeconds = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
    tutor.sendLessonEnd({
      lesson_uuid: selectedLesson.uuid,
      time_spent_seconds: timeSpentSeconds
    });
  }, [selectedLesson?.uuid, tutor]);

  const handleLessonEndConfirm = useCallback((energyLevel: number) => {
    // Energy level could be sent in a follow-up or stored locally
    console.log('[Lesson] Energy level:', energyLevel);
    tutor.clearLessonScore();
    setShowLessonEndDialog(false);
    
    // Optionally mark as complete and move to next
    if (selectedLesson?.uuid) {
      saveProgress(selectedLesson.uuid);
    }
  }, [tutor, selectedLesson?.uuid, saveProgress]);

  // =========================================================================
  // Memoized tldraw Components Override (Custom RichTextToolbar)
  // =========================================================================
  
  const tldrawComponents = useMemo(() => {
    // Only provide custom toolbar when in interactive mode and connected
    if (viewMode !== 'interactive' || !tutor.isConnected) {
      return undefined;
    }
    
    // Create a wrapper component that passes our callbacks to CustomRichTextToolbar
    const lessonUUID = selectedLesson?.uuid;
    const RichTextToolbarWithCallbacks = () => (
      <CustomRichTextToolbar
        onSaveConcept={handleSaveConcept}
        onMarkConfusion={handleMarkConfusion}
        {...(lessonUUID ? { lessonUUID } : {})}
        isSaving={isSavingSelection}
      />
    );
    
    return {
      RichTextToolbar: RichTextToolbarWithCallbacks
    };
  }, [viewMode, tutor.isConnected, handleSaveConcept, handleMarkConfusion, selectedLesson?.uuid, isSavingSelection]);

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
        bgcolor: theme.palette.background.default,
        // Conditionally hide/show tldraw style panel (color/size controls on right side)
        // Target the style panel container which appears when shapes are selected
        ...(showStylePanel ? {} : {
          '& [class*="style-panel"]': {
            display: 'none !important'
          },
          '& [class*="StylePanel"]': {
            display: 'none !important'
          }
        })
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

      {/* Unified Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          minHeight: 52
        }}
      >
        {/* Left: Navigation & Titles */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexShrink: 0 }}>
          <Tooltip title="Back to courses">
            <IconButton onClick={handleBackToCourses} size="small">
              <IconArrowLeft size={18} />
            </IconButton>
          </Tooltip>
          {!showNav && (
            <Tooltip title="Show sidebar">
              <IconButton onClick={() => setShowNav(true)} size="small">
                <IconMenu2 size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Typography 
            variant="body2" 
            fontWeight={600} 
            noWrap 
            sx={{ 
              maxWidth: 150,
              color: theme.palette.text.secondary 
            }}
          >
            {selectedCourse.title}
          </Typography>
          {selectedLesson && (
            <>
              <Typography variant="body2" color="text.disabled">/</Typography>
              <Typography 
                variant="body2" 
                fontWeight={600} 
                noWrap 
                sx={{ maxWidth: 200 }}
              >
                {selectedLesson.title}
              </Typography>
            </>
          )}
        </Stack>

        {/* Center: Lesson Navigation - takes remaining space and centers content */}
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <Tooltip title="Previous lesson">
            <span>
              <IconButton
                size="small"
                onClick={handlePrevLesson}
                disabled={!hasPrevLesson}
              >
                <IconChevronLeft size={18} />
              </IconButton>
            </span>
          </Tooltip>
          {selectedLesson && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontWeight: 500, 
                minWidth: 60, 
                textAlign: 'center',
                fontSize: '0.75rem'
              }}
            >
              {selectedLesson.sequence_order || 1} of {allLessonsInOrder.length || '?'}
            </Typography>
          )}
          <Tooltip title="Next lesson">
            <span>
              <IconButton
                size="small"
                onClick={handleNextLesson}
                disabled={!hasNextLesson}
              >
                <IconChevronRight size={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* Right: Controls */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {/* Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleModeChange}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.background.default, 0.8),
              '& .MuiToggleButton-root': {
                px: 1,
                py: 0.25,
                textTransform: 'none',
                fontSize: '0.75rem',
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
              <IconBook2 size={14} style={{ marginRight: 4 }} />
              Read
            </ToggleButton>
            <ToggleButton value="interactive">
              <IconSparkles size={14} style={{ marginRight: 4 }} />
              Interactive
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Editor Mode Toggle (Canvas ↔ OneNote) - Single icon */}
          <Tooltip title={editorMode === 'canvas' ? 'Switch to OneNote view' : 'Switch to Canvas view'}>
            <IconButton
              onClick={() => setEditorMode(editorMode === 'canvas' ? 'onenote' : 'canvas')}
              size="small"
              sx={{
                color: editorMode === 'onenote' ? theme.palette.secondary.main : theme.palette.text.secondary,
                bgcolor: editorMode === 'onenote' ? alpha(theme.palette.secondary.main, 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.2)
                }
              }}
            >
              {editorMode === 'canvas' ? <IconNote size={18} /> : <IconPencil size={18} />}
            </IconButton>
          </Tooltip>

          {/* LLM Model Display */}
          {activeLLMModel && (
            <Tooltip title="AI Model">
              <Chip
                label={activeLLMModel}
                size="small"
                variant="outlined"
                icon={<IconSparkles size={12} />}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
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

          {/* AI Status Indicator */}
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
                height: 24,
                fontSize: '0.7rem',
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

          {/* AI Context Debug Toggle */}
          {viewMode === 'interactive' && tutor.canvasAIContext && (
            <Tooltip title={showContextDebug ? "Hide AI Context" : "Show AI Context"}>
              <Chip
                label={`${tutor.canvasAIContext.token_estimate}`}
                size="small"
                variant={showContextDebug ? 'filled' : 'outlined'}
                color="secondary"
                icon={<IconBrain size={12} />}
                onClick={() => setShowContextDebug(!showContextDebug)}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              />
            </Tooltip>
          )}

          {/* Save Button - handles both Canvas and OneNote modes */}
          <Tooltip title={(editorMode === 'canvas' ? hasUnsavedCanvasChanges : hasUnsavedOneNoteChanges) ? 'Save changes (unsaved!)' : 'No changes to save'}>
            <span>
              <IconButton 
                onClick={() => editorMode === 'canvas' ? handleHeaderSave() : handleOneNoteSave()}
                disabled={canvasSaveStatus === 'saving'}
                size="small"
                sx={{
                  color: (editorMode === 'canvas' ? hasUnsavedCanvasChanges : hasUnsavedOneNoteChanges)
                    ? theme.palette.error.main 
                    : canvasSaveStatus === 'saved' 
                      ? theme.palette.success.main 
                      : theme.palette.text.secondary
                }}
              >
                {canvasSaveStatus === 'saving' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : canvasSaveStatus === 'saved' ? (
                  <IconCheck size={18} />
                ) : (
                  <IconDeviceFloppy size={18} />
                )}
              </IconButton>
            </span>
          </Tooltip>

          {/* Sync to CSV Button - exports database to CSV seed files */}
          <Tooltip title={isSyncingCsv ? 'Syncing...' : 'Sync to CSV'}>
            <span>
              <IconButton
                onClick={handleSyncToCsv}
                disabled={isSyncingCsv}
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main
                  }
                }}
              >
                {isSyncingCsv ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IconDatabaseExport size={18} />
                )}
              </IconButton>
            </span>
          </Tooltip>

          {/* Style Panel Toggle - only for Canvas mode (tldraw) */}
          {editorMode === 'canvas' && (
            <Tooltip title={showStylePanel ? 'Hide colors & sizes' : 'Show colors & sizes'}>
              <IconButton 
                onClick={() => setShowStylePanel(!showStylePanel)} 
                size="small"
                sx={{ 
                  color: showStylePanel ? theme.palette.primary.main : theme.palette.text.secondary,
                  bgcolor: showStylePanel ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                <IconPalette size={18} />
              </IconButton>
            </Tooltip>
          )}

          {/* Chat Panel Toggle - visible in interactive mode */}
          {viewMode === 'interactive' && (
            <Tooltip title={showChatPanel ? 'Hide chat' : 'Show chat'}>
              <IconButton 
                onClick={() => setShowChatPanel(!showChatPanel)} 
                size="small"
                sx={{ 
                  color: showChatPanel ? theme.palette.primary.main : theme.palette.text.secondary,
                  bgcolor: showChatPanel ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                {showChatPanel ? <IconMessageCircle size={18} /> : <IconMessageCircleOff size={18} />}
              </IconButton>
            </Tooltip>
          )}

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <IconButton onClick={toggleFullScreen} size="small">
              {isFullScreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
            </IconButton>
          </Tooltip>

          {/* End Lesson Button - only in interactive mode when connected */}
          {viewMode === 'interactive' && tutor.isConnected && (
            <Tooltip title="End lesson and see scores">
              <IconButton
                onClick={handleEndLesson}
                size="small"
                sx={{ 
                  color: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                }}
              >
                <IconPlayerStop size={18} />
              </IconButton>
            </Tooltip>
          )}
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

        {/* Editor Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Content Area - Canvas or OneNote Mode */}
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
              /* Conditional rendering: Canvas (tldraw) or OneNote (TipTap) */
              editorMode === 'canvas' ? (
                <UnifiedCanvas
                  ref={canvasRef}
                  key={selectedLesson.uuid}
                  initialData={canvasData}
                  initialText={undefined} // Canvas uses canvas_content only, never falls back to content
                  onChange={handleCanvasChange}
                  readOnly={false}
                  minHeight="100%"
                  hideUi={false}
                  transparentBg={false}
                  components={tldrawComponents}
                />
              ) : (
                <OneNoteEditor
                  ref={oneNoteRef}
                  key={`onenote-${selectedLesson.uuid}`}
                  initialContent={oneNoteInitialContent}
                  onChange={handleOneNoteChange}
                  onSave={handleOneNoteSave}
                  onSaveConcept={handleOneNoteSaveConcept}
                  onMarkConfusion={handleOneNoteMarkConfusion}
                  readOnly={false}
                  placeholder="Start taking notes..."
                  showToolbar={true}
                  minHeight="100%"
                  isSaving={isSavingSelection}
                />
              )
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
                  // Concept Vetting Mode (inline in chat panel)
                  isVettingMode={tutor.isVetConsoleOpen}
                  vetMessages={tutor.vetMessages}
                  vetConceptText={tutor.vetConceptText}
                  isAgentThinking={tutor.isAgentThinking}
                  vetVerdict={tutor.vetVerdict}
                  onInjectVetMessage={tutor.injectVetMessage}
                  onStopVetLoop={tutor.stopVetLoop}
                  onExitVetting={tutor.closeVetConsole}
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

      {/* Lesson End Dialog - Shows scores after ending lesson */}
      <LessonEndDialog
        open={showLessonEndDialog}
        lessonScore={tutor.lessonScore}
        onClose={() => {
          setShowLessonEndDialog(false);
          tutor.clearLessonScore();
        }}
        onConfirm={handleLessonEndConfirm}
      />

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

              {/* Context Actions */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                {/* Clear History Button */}
                <Tooltip title="Clear all conversation history for this lesson. AI will start fresh.">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<IconTrash size={14} />}
                    onClick={() => {
                      if (selectedLesson?.uuid && window.confirm('Clear all conversation history? This cannot be undone.')) {
                        tutor.clearConversationHistory(selectedLesson.uuid);
                      }
                    }}
                    sx={{ 
                      fontSize: '0.7rem', 
                      py: 0.5,
                      borderStyle: 'dashed',
                      '&:hover': { borderStyle: 'solid' }
                    }}
                  >
                    Clear History
                  </Button>
                </Tooltip>

                {/* Refresh Context Display (local) */}
                <Tooltip title="Refresh context display">
                  <IconButton 
                    size="small"
                    onClick={() => tutor.clearCanvasAIContext()}
                    sx={{ color: 'text.secondary' }}
                  >
                    <IconRefresh size={14} />
                  </IconButton>
                </Tooltip>
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
