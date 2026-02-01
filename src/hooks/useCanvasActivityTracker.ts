/**
 * useCanvasActivityTracker Hook
 * 
 * Watches tldraw canvas for text changes and idle time,
 * then sends updates to the tutor agent for real-time AI collaboration.
 * 
 * Features:
 * - Debounces text updates (2s after typing stops)
 * - Tracks idle time (sends signal after 30s)
 * - Extracts text content from canvas shapes
 */
import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tldraw/tldraw';

export interface CanvasActivityTrackerOptions {
  /** Debounce delay before sending text updates (ms) */
  textDebounceMs?: number;
  /** Idle threshold before sending idle signal (ms) */
  idleThresholdMs?: number;
  /** Whether tracking is enabled */
  enabled?: boolean;
  /** Ref indicating if AI is currently typing (prevents sending during animation) */
  aiTypingRef?: React.RefObject<boolean>;
  // NOTE: Rate limiting is now handled by backend only (single source of truth)
}

const DEFAULT_OPTIONS = {
  textDebounceMs: 2000,
  idleThresholdMs: 30000,
  enabled: true
};

/**
 * Hook to track canvas activity and send updates to tutor agent
 */
export function useCanvasActivityTracker(
  editor: Editor | null,
  sendCanvasText: (text: string, position: { x: number; y: number }, shapeId: string) => void,
  sendCanvasIdle: (durationMs: number) => void,
  options?: CanvasActivityTrackerOptions
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Refs for debouncing and tracking
  const textDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastSentTextRef = useRef<string>('');
  const idleSentRef = useRef<boolean>(false);
  const lastSkipReasonRef = useRef<string>(''); // Prevent log spam

  // Extract all text content from canvas shapes (excluding AI and lesson content shapes)
  const extractCanvasText = useCallback((ed: Editor): { text: string; position: { x: number; y: number }; shapeId: string } | null => {
    const shapes = ed.getCurrentPageShapes();
    
    // Find all text-containing shapes (text, note, frame with label)
    // CRITICAL: Exclude AI-generated shapes AND lesson content shapes to prevent feedback loops
    let aiShapeCount = 0;
    let lessonShapeCount = 0;
    const textShapes = shapes.filter(shape => {
      const meta = shape.meta as Record<string, unknown> | undefined;
      
      // Skip AI-generated shapes - they have meta.isAI = true
      if (meta?.isAI === true) {
        aiShapeCount++;
        return false;
      }
      
      // Skip lesson content shapes - they have meta.isLessonContent = true
      // Lesson content is fetched separately and added to prompt once
      if (meta?.isLessonContent === true) {
        lessonShapeCount++;
        return false;
      }
      
      const shapeType = shape.type;
      return shapeType === 'text' || shapeType === 'note' || shapeType === 'geo';
    });

    // Debug log when shapes are filtered out (only occasionally to avoid spam)
    if ((aiShapeCount > 0 || lessonShapeCount > 0) && textShapes.length > 0) {
      console.debug('[Canvas] 🔍 Extracting text: %d user shapes, %d AI filtered, %d lesson filtered', 
        textShapes.length, aiShapeCount, lessonShapeCount);
    }

    if (textShapes.length === 0) return null;

    // QUICK FIX: Only send the LAST CREATED user shape's text
    // This prevents cumulative text issues where old questions keep getting re-sent
    // Sort by createdAt (newest first) - shapes without createdAt go to the end
    const sortedByCreation = [...textShapes].sort((a, b) => {
      const aTime = (a.meta as Record<string, unknown>)?.createdAt as number || 0;
      const bTime = (b.meta as Record<string, unknown>)?.createdAt as number || 0;
      return bTime - aTime; // Descending: newest first
    });

    // Get the most recently created shape
    const lastCreatedShape = sortedByCreation[0];
    if (!lastCreatedShape) return null;

    const props = lastCreatedShape.props as Record<string, unknown>;
    let shapeText = '';

    // Extract text based on shape type
    if (props.richText && typeof props.richText === 'object') {
      // tldraw v4 richText format
      shapeText = extractTextFromRichText(props.richText as Record<string, unknown>);
    } else if (typeof props.text === 'string') {
      shapeText = props.text;
    } else if (typeof props.label === 'string') {
      shapeText = props.label;
    }

    if (!shapeText.trim()) return null;

    console.debug('[Canvas] 📝 Using LAST created shape only: "%s..." (created: %s)', 
      shapeText.substring(0, 30),
      new Date((lastCreatedShape.meta as Record<string, unknown>)?.createdAt as number || 0).toISOString()
    );

    return {
      text: shapeText.trim(),
      position: { x: lastCreatedShape.x, y: lastCreatedShape.y },
      shapeId: lastCreatedShape.id
    };
  }, []);

  // Handle text change with debounce
  // Rate limiting is handled by backend - frontend only debounces and prevents sending during AI typing
  const handleTextChange = useCallback(() => {
    if (!editor || !opts.enabled) return;

    // Check if AI is currently typing animation - skip if so
    if (opts.aiTypingRef?.current) {
      if (lastSkipReasonRef.current !== 'ai_typing') {
        console.log('%c[Canvas] ⏸️ Paused - AI is typing', 'color: #ff9800');
        lastSkipReasonRef.current = 'ai_typing';
      }
      return;
    }
    
    // Clear skip reason when no longer skipping
    if (lastSkipReasonRef.current !== '') {
      console.log('%c[Canvas] ▶️ Tracking resumed', 'color: #4caf50');
      lastSkipReasonRef.current = '';
    }

    // Reset idle tracking
    lastActivityRef.current = Date.now();
    idleSentRef.current = false;

    // Clear existing debounce
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
    }

    // Debounce the text extraction and sending
    // Backend handles rate limiting (10s between responses)
    textDebounceRef.current = setTimeout(() => {
      const extracted = extractCanvasText(editor);
      
      if (extracted && extracted.text !== lastSentTextRef.current) {
        console.log('%c[Canvas] 📝 Sending text to AI', 'color: #9c27b0; font-weight: bold', {
          text: extracted.text.length > 80 ? extracted.text.substring(0, 80) + '...' : extracted.text,
          position: extracted.position
        });
        lastSentTextRef.current = extracted.text;
        sendCanvasText(extracted.text, extracted.position, extracted.shapeId);
      }
    }, opts.textDebounceMs);
  }, [editor, opts.enabled, opts.textDebounceMs, opts.aiTypingRef, extractCanvasText, sendCanvasText]);

  // Check for idle state
  const checkIdle = useCallback(() => {
    if (!opts.enabled || idleSentRef.current) return;

    const now = Date.now();
    const idleDuration = now - lastActivityRef.current;

    if (idleDuration >= opts.idleThresholdMs) {
      console.log('%c[Canvas] ⏸️ User idle', 'color: #2196f3; font-weight: bold', `${(idleDuration/1000).toFixed(0)}s - sending nudge request`);
      idleSentRef.current = true;
      sendCanvasIdle(idleDuration);
    }
  }, [opts.enabled, opts.idleThresholdMs, sendCanvasIdle]);

  // Subscribe to editor store changes
  useEffect(() => {
    if (!editor) {
      console.log('%c[Canvas] Activity tracker: no editor', 'color: #999');
      return;
    }
    if (!opts.enabled) {
      console.log('%c[Canvas] Activity tracker: disabled (switch to Interactive mode)', 'color: #ff9800');
      return;
    }
    
    console.log('%c[Canvas] ✅ Activity tracker: ACTIVE', 'color: #4caf50; font-weight: bold');

    // Listen for store changes
    const unsubscribe = editor.store.listen(
      () => {
        handleTextChange();
      },
      { source: 'user', scope: 'document' }
    );

    // Set up idle checker interval
    idleTimerRef.current = setInterval(checkIdle, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      if (textDebounceRef.current) {
        clearTimeout(textDebounceRef.current);
      }
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [editor, opts.enabled, handleTextChange, checkIdle]);

  // Reset activity on any user interaction
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleSentRef.current = false;
  }, []);

  // Sync lastSentText to current canvas content (call after AI types to prevent re-send)
  const syncLastSentText = useCallback(() => {
    if (!editor) return;
    const extracted = extractCanvasText(editor);
    if (extracted) {
      lastSentTextRef.current = extracted.text;
      console.log('%c[Canvas] 🔄 Synced lastSentText after AI response', 'color: #607d8b');
    }
  }, [editor, extractCanvasText]);

  return { resetActivity, syncLastSentText };
}

/**
 * Extract plain text from tldraw v4 richText format
 */
function extractTextFromRichText(richText: Record<string, unknown>): string {
  if (!richText || typeof richText !== 'object') return '';

  const content = richText.content;
  if (!Array.isArray(content)) return '';

  let text = '';
  
  for (const node of content) {
    if (node && typeof node === 'object') {
      const nodeObj = node as Record<string, unknown>;
      
      if (nodeObj.type === 'paragraph' && Array.isArray(nodeObj.content)) {
        for (const child of nodeObj.content) {
          if (child && typeof child === 'object') {
            const childObj = child as Record<string, unknown>;
            if (childObj.type === 'text' && typeof childObj.text === 'string') {
              text += childObj.text;
            } else if (childObj.type === 'hardBreak') {
              text += '\n';
            }
          }
        }
        text += '\n';
      }
    }
  }

  return text.trim();
}

export default useCanvasActivityTracker;

