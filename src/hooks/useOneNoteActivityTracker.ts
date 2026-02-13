/**
 * useOneNoteActivityTracker Hook
 * 
 * Watches TipTap editor for text changes and idle time,
 * then sends updates to the tutor agent for real-time AI collaboration.
 * 
 * Features:
 * - Debounces text updates (2s after typing stops)
 * - Tracks idle time (sends signal after 30s)
 * - Works with TipTap's onUpdate callback
 * 
 * Mirrors useCanvasActivityTracker but adapted for TipTap editor.
 */
import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export interface OneNoteActivityTrackerOptions {
  /** Debounce delay before sending text updates (ms) */
  textDebounceMs?: number;
  /** Idle threshold before sending idle signal (ms) */
  idleThresholdMs?: number;
  /** Whether tracking is enabled */
  enabled?: boolean;
  /** Ref indicating if AI is currently typing (prevents sending during animation) */
  aiTypingRef?: React.RefObject<boolean>;
}

const DEFAULT_OPTIONS = {
  textDebounceMs: 2000,
  idleThresholdMs: 30000,
  enabled: true
};

/**
 * Hook to track OneNote/TipTap editor activity and send updates to tutor agent
 */
export function useOneNoteActivityTracker(
  editor: Editor | null,
  sendCanvasText: (text: string, position: { x: number; y: number }, shapeId: string) => void,
  sendCanvasIdle: (durationMs: number) => void,
  options?: OneNoteActivityTrackerOptions
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Refs for debouncing and tracking
  const textDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastSentTextRef = useRef<string>('');
  const idleSentRef = useRef<boolean>(false);
  const lastSkipReasonRef = useRef<string>(''); // Prevent log spam
  const cursorPositionRef = useRef<number>(0);
  const previousContentLengthRef = useRef<number>(0); // Track content length to detect deletions

  /**
   * Extract only user-typed content (excludes AI responses)
   * Strategy: Get the current paragraph the user is typing in, 
   * skip any content inside .ai-response blocks
   */
  const extractRecentText = useCallback((ed: Editor): { text: string; position: number } | null => {
    // Get cursor position
    const cursorPos = ed.state.selection.anchor;
    cursorPositionRef.current = cursorPos;

    // Get the node at cursor position
    const $pos = ed.state.doc.resolve(cursorPos);
    
    // Walk up to find the paragraph/block containing cursor
    let currentNode = $pos.parent;
    let nodeText = '';
    
    // Check if we're inside an AI response (traverse up the tree)
    let isInsideAIResponse = false;
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const node = $pos.node(depth);
      // Check if this node or its parent is an AI response div
      // AI responses have class="ai-response" which is rendered as a custom node
      const nodeDOM = ed.view.nodeDOM($pos.before(depth + 1)) as HTMLElement | null;
      if (nodeDOM?.classList?.contains('ai-response') || nodeDOM?.closest?.('.ai-response')) {
        isInsideAIResponse = true;
        break;
      }
    }
    
    // If user is inside an AI response, don't send
    if (isInsideAIResponse) {
      console.debug('[OneNote] ⏭️ Cursor inside AI response, skipping');
      return null;
    }
    
    // Get text from current paragraph only
    if (currentNode.isTextblock) {
      nodeText = currentNode.textContent.trim();
    }
    
    // If current paragraph is empty or too short, look at text before cursor (last 2-3 lines)
    if (!nodeText || nodeText.length < 5) {
      const textBeforeCursor = ed.state.doc.textBetween(0, cursorPos);
      const lines = textBeforeCursor.split('\n').filter(l => l.trim());
      
      // Get last 1-2 non-empty lines
      const recentLines = lines.slice(-2);
      nodeText = recentLines.join(' ').trim();
      
      // Filter out anything that looks like AI response headers
      if (nodeText.includes('🤖 AI Response') || nodeText.includes('AI Response')) {
        // Find text after the last AI response marker
        const parts = nodeText.split(/🤖\s*AI\s*Response/i);
        nodeText = parts[parts.length - 1]?.trim() || '';
      }
    }
    
    // Limit to last 300 chars to keep context focused
    if (nodeText.length > 300) {
      nodeText = nodeText.slice(-300).trim();
    }
    
    if (!nodeText) return null;

    console.debug('[OneNote] 📝 User input: "%s"', 
      nodeText.length > 60 ? nodeText.substring(0, 60) + '...' : nodeText
    );

    return {
      text: nodeText,
      position: cursorPos
    };
  }, []);

  /**
   * Handle text change with debounce
   */
  const handleTextChange = useCallback(() => {
    if (!editor || !opts.enabled) return;

    // Check if AI is currently typing animation - skip if so
    if (opts.aiTypingRef?.current) {
      if (lastSkipReasonRef.current !== 'ai_typing') {
        console.log('%c[OneNote] ⏸️ Paused - AI is typing', 'color: #ff9800');
        lastSkipReasonRef.current = 'ai_typing';
      }
      return;
    }
    
    // Get current content length
    const currentContentLength = editor.state.doc.textContent.length;
    const previousLength = previousContentLengthRef.current;
    
    // Update the reference for next comparison
    previousContentLengthRef.current = currentContentLength;
    
    // Skip if content was deleted (length decreased) - user is removing text, not adding
    if (currentContentLength < previousLength) {
      if (lastSkipReasonRef.current !== 'deletion') {
        console.log('%c[OneNote] ⏭️ Text deleted, skipping AI trigger', 'color: #ff9800', {
          previousLength,
          currentLength: currentContentLength,
          diff: previousLength - currentContentLength
        });
        lastSkipReasonRef.current = 'deletion';
      }
      // Still reset idle tracking since user is active
      lastActivityRef.current = Date.now();
      idleSentRef.current = false;
      return;
    }
    
    // Clear skip reason when no longer skipping
    if (lastSkipReasonRef.current !== '') {
      console.log('%c[OneNote] ▶️ Tracking resumed', 'color: #4caf50');
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
    textDebounceRef.current = setTimeout(() => {
      const extracted = extractRecentText(editor);
      
      if (extracted && extracted.text !== lastSentTextRef.current) {
        console.log('%c[OneNote] 📝 Sending text to AI', 'color: #9c27b0; font-weight: bold', {
          text: extracted.text.length > 80 ? extracted.text.substring(0, 80) + '...' : extracted.text,
          cursorPosition: extracted.position
        });
        lastSentTextRef.current = extracted.text;
        
        // Send with a virtual position and shapeId for compatibility with canvas API
        // Position is mapped from cursor position (line as y, char as x concept)
        sendCanvasText(
          extracted.text, 
          { x: extracted.position % 100, y: Math.floor(extracted.position / 100) * 50 },
          `onenote-paragraph-${Date.now()}`
        );
      }
    }, opts.textDebounceMs);
  }, [editor, opts.enabled, opts.textDebounceMs, opts.aiTypingRef, extractRecentText, sendCanvasText]);

  /**
   * Check for idle state
   */
  const checkIdle = useCallback(() => {
    if (!opts.enabled || idleSentRef.current) return;

    const now = Date.now();
    const idleDuration = now - lastActivityRef.current;

    if (idleDuration >= opts.idleThresholdMs) {
      console.log('%c[OneNote] ⏸️ User idle', 'color: #2196f3; font-weight: bold', 
        `${(idleDuration/1000).toFixed(0)}s - sending nudge request`
      );
      idleSentRef.current = true;
      sendCanvasIdle(idleDuration);
    }
  }, [opts.enabled, opts.idleThresholdMs, sendCanvasIdle]);

  /**
   * Subscribe to editor updates
   */
  useEffect(() => {
    if (!editor) {
      console.log('%c[OneNote] Activity tracker: no editor', 'color: #999');
      return;
    }
    if (!opts.enabled) {
      console.log('%c[OneNote] Activity tracker: disabled (switch to Interactive mode)', 'color: #ff9800');
      return;
    }
    
    console.log('%c[OneNote] ✅ Activity tracker: ACTIVE', 'color: #4caf50; font-weight: bold');
    
    // Initialize content length reference to current document length
    previousContentLengthRef.current = editor.state.doc.textContent.length;

    // Listen for editor updates via TipTap's onUpdate
    const handleUpdate = () => {
      handleTextChange();
    };

    // Listen for selection changes (user moving cursor)
    const handleSelectionUpdate = () => {
      // Reset idle on any activity
      lastActivityRef.current = Date.now();
      idleSentRef.current = false;
    };

    // Subscribe to editor events
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleSelectionUpdate);

    // Set up idle checker interval
    idleTimerRef.current = setInterval(checkIdle, 5000); // Check every 5 seconds

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
      
      if (textDebounceRef.current) {
        clearTimeout(textDebounceRef.current);
      }
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [editor, opts.enabled, handleTextChange, checkIdle]);

  /**
   * Reset activity timestamp (call on user interaction)
   */
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleSentRef.current = false;
  }, []);

  /**
   * Sync lastSentText to current content (call after AI types to prevent re-send)
   * Also clears the last sent text to allow fresh detection after AI response
   */
  const syncLastSentText = useCallback(() => {
    if (!editor) return;
    // After AI types, clear the lastSentText so next user input is detected fresh
    // This prevents re-triggering on stale content
    lastSentTextRef.current = '';
    lastActivityRef.current = Date.now();
    console.log('%c[OneNote] 🔄 Reset tracking after AI response', 'color: #607d8b');
  }, [editor]);

  return { resetActivity, syncLastSentText };
}

export default useOneNoteActivityTracker;

