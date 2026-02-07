/**
 * UnifiedCanvas Component
 * A tldraw-based canvas that supports both typing and drawing
 * Like OneNote - one pane for everything
 * 
 * Auto-pastes lesson content as text when first loaded (if no saved canvas data)
 */
import { useCallback, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Tldraw, Editor, createShapeId } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import { Save, Check } from 'lucide-react';

import type { UnifiedCanvasProps, UnifiedCanvasRef } from './types';

// ============================================================================
// Types - Using generic object for tldraw snapshot since API varies by version
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TLSnapshot = any;

// ============================================================================
// Helper: Convert plain text to tldraw richText format (TipTap JSON)
// ============================================================================
function textToRichText(text: string): TLSnapshot {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  return {
    type: 'doc',
    content: paragraphs.map(para => ({
      type: 'paragraph',
      content: para.split('\n').flatMap((line, idx, arr) => {
        const result: TLSnapshot[] = [{ type: 'text', text: line }];
        // Add hard break between lines within a paragraph
        if (idx < arr.length - 1) {
          result.push({ type: 'hardBreak' });
        }
        return result;
      })
    }))
  };
}

// ============================================================================
// Helper: Create text shapes from markdown content
// ============================================================================
function createTextShapesFromMarkdown(
  editor: Editor,
  markdown: string,
  startY: number = 100
): void {
  if (!markdown || !markdown.trim()) return;

  // Clean up markdown - remove excessive whitespace but keep structure
  const cleanText = markdown
    .replace(/#{1,6}\s+/g, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .trim();

  // Split into sections (by double newline or headers in original)
  const sections = cleanText.split(/\n{2,}/).filter(s => s.trim());
  
  let currentY = startY;
  const leftMargin = 100;
  const lineHeight = 32; // Approximate pixels per line
  const sectionGap = 40;
  const maxWidth = 800;

  try {
    sections.forEach((section) => {
      const lines = section.split('\n');
      const estimatedHeight = lines.length * lineHeight;
      
      // Create a text shape for this section
      const shapeId = createShapeId();
      
      // Try to create a text shape with the correct format (tldraw v4 uses richText)
      // Tag with meta.isLessonContent so it's excluded from AI extraction
      try {
        editor.createShape({
          id: shapeId,
          type: 'text',
          x: leftMargin,
          y: currentY,
          meta: { isLessonContent: true, createdAt: Date.now() },
          props: {
            richText: textToRichText(section),
            size: 'm',
            w: maxWidth,
            autoSize: true
          }
        });
      } catch (e) {
        // Fallback: Try creating a note shape instead
        console.log('[UnifiedCanvas] Text shape failed, trying note shape');
        try {
          const noteId = createShapeId();
          editor.createShape({
            id: noteId,
            type: 'note',
            x: leftMargin,
            y: currentY,
            meta: { isLessonContent: true, createdAt: Date.now() },
            props: {
              richText: textToRichText(section),
              size: 'l',
              color: 'white'
            }
          });
        } catch (e2) {
          // Last fallback: Create a frame shape with text as title
          console.log('[UnifiedCanvas] Note shape failed, trying frame shape');
          const frameId = createShapeId();
          editor.createShape({
            id: frameId,
            type: 'frame',
            x: leftMargin,
            y: currentY,
            props: {
              w: maxWidth,
              h: estimatedHeight + 40,
              name: section.substring(0, 100) // Frames use 'name' as title
            }
          });
        }
      }
      
      currentY += estimatedHeight + sectionGap;
    });
    
    // Center the view on the content
    editor.zoomToFit({ animation: { duration: 200 } });
  } catch (e) {
    console.error('[UnifiedCanvas] Failed to create text shapes:', e);
  }
}

// ============================================================================
// Debounce utility
// ============================================================================

function useDebouncedCallback<T extends (...args: TLSnapshot[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  return useCallback(
    ((...args: TLSnapshot[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

// ============================================================================
// Main Component
// ============================================================================

const UnifiedCanvas = forwardRef<UnifiedCanvasRef, UnifiedCanvasProps>(
  (
    {
      initialData,
      initialText, // New prop: markdown/text content to auto-paste on first load
      onChange,
      onSave,
      readOnly = false,
      minHeight = 600,
      hideUi = false,
      transparentBg = false,
      components // Custom tldraw UI component overrides
    },
    ref
  ) => {
    const theme = useTheme();
    const editorRef = useRef<Editor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Get snapshot from editor (handles different tldraw versions)
    const getEditorSnapshot = useCallback((): TLSnapshot | null => {
      const editor = editorRef.current;
      if (!editor) return null;
      
      // Try v4.x API first
      if (typeof (editor as TLSnapshot).getSnapshot === 'function') {
        return (editor as TLSnapshot).getSnapshot();
      }
      // Fallback to store-based API (v3.x and earlier)
      if (editor.store && typeof (editor.store as TLSnapshot).getSnapshot === 'function') {
        return (editor.store as TLSnapshot).getSnapshot();
      }
      return null;
    }, []);

    // Load snapshot into editor
    const loadEditorSnapshot = useCallback((editor: Editor, snapshot: TLSnapshot) => {
      try {
        // Try v4.x API first
        if (typeof (editor as TLSnapshot).loadSnapshot === 'function') {
          (editor as TLSnapshot).loadSnapshot(snapshot);
          return;
        }
        // Fallback to store-based API
        if (editor.store && typeof (editor.store as TLSnapshot).loadSnapshot === 'function') {
          (editor.store as TLSnapshot).loadSnapshot(snapshot);
        }
      } catch (e) {
        console.warn('[UnifiedCanvas] Failed to load snapshot:', e);
      }
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getSnapshot: getEditorSnapshot,
      getEditor: () => editorRef.current,
      focus: () => editorRef.current?.focus()
    }));

    // Debounced onChange handler
    const debouncedOnChange = useDebouncedCallback((snapshot: TLSnapshot) => {
      onChange?.(snapshot);
      setHasUnsavedChanges(true);
    }, 500);

    // Handle editor mount
    const handleMount = useCallback(
      (editor: Editor) => {
        editorRef.current = editor;
        setIsLoading(false);

        // Load initial data if provided (existing canvas data takes priority)
        if (initialData?.snapshot) {
          loadEditorSnapshot(editor, initialData.snapshot);
        } else if (initialText && initialText.trim()) {
          // No saved canvas data but we have text content - auto-paste it
          setTimeout(() => {
            createTextShapesFromMarkdown(editor, initialText);
          }, 100);
        }

        // Set to select mode by default
        if (!readOnly) {
          editor.setCurrentTool('select');
        }

        // Listen for changes
        if (onChange) {
          editor.store.listen(
            () => {
              const snapshot = getEditorSnapshot();
              if (snapshot) debouncedOnChange(snapshot);
            },
            { source: 'user', scope: 'document' }
          );
        }

        // Auto-add createdAt metadata to user-created shapes (for tracking last created shape)
        // This runs when user creates new shapes via tldraw tools
        editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
          // Only add createdAt if it's a text-containing shape without existing meta
          const shapeType = shape.type;
          if (shapeType === 'text' || shapeType === 'note' || shapeType === 'geo') {
            const meta = shape.meta as Record<string, unknown> | undefined;
            // Don't overwrite existing createdAt (e.g., from lesson content or AI)
            if (!meta?.createdAt && !meta?.isAI && !meta?.isLessonContent) {
              // Update shape with createdAt metadata
              editor.updateShape({
                id: shape.id,
                type: shape.type,
                meta: { ...shape.meta, createdAt: Date.now() }
              });
            }
          }
          return shape;
        });

        // Read-only mode
        if (readOnly) {
          editor.updateInstanceState({ isReadonly: true });
        }
      },
      [initialData?.snapshot, initialText, onChange, readOnly, debouncedOnChange, loadEditorSnapshot, getEditorSnapshot]
    );

    // Handle save
    const handleSave = useCallback(async () => {
      const snapshot = getEditorSnapshot();
      if (!snapshot || !onSave) return;

      setSaveStatus('saving');
      try {
        await onSave(snapshot);
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, [onSave, getEditorSnapshot]);

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: typeof minHeight === 'number' ? minHeight : minHeight,
          minHeight: minHeight,
          border: transparentBg ? 'none' : `1px solid ${theme.palette.divider}`,
          borderRadius: transparentBg ? 0 : 2,
          overflow: 'hidden',
          bgcolor: transparentBg ? 'transparent' : theme.palette.background.paper,
          // Custom tldraw styling for transparent overlay mode
          '& .tl-container': {
            borderRadius: 'inherit',
            bgcolor: transparentBg ? 'transparent !important' : undefined
          },
          // Make tldraw background transparent for overlay mode
          ...(transparentBg && {
            '& .tl-background': {
              bgcolor: 'transparent !important',
              background: 'transparent !important'
            },
            '& .tl-canvas': {
              bgcolor: 'transparent !important',
              background: 'transparent !important'
            },
            '& [data-testid="canvas"]': {
              bgcolor: 'transparent !important',
              background: 'transparent !important'
            }
          })
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              zIndex: 10
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Save button - positioned at bottom-left to avoid tldraw's style panel */}
        {!readOnly && onSave && !hideUi && (
          <Button
            onClick={handleSave}
            variant="contained"
            color={hasUnsavedChanges ? 'warning' : 'primary'}
            size="small"
            disabled={saveStatus === 'saving'}
            startIcon={
              saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />
            }
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              textTransform: 'none',
              minWidth: 100,
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved!'
                : hasUnsavedChanges
                  ? 'Save *'
                  : 'Save'}
          </Button>
        )}

        {/* tldraw Canvas */}
        <Tldraw
          onMount={handleMount}
          inferDarkMode={theme.palette.mode === 'dark'}
          hideUi={hideUi}
          {...(components ? { components } : {})}
        />

        {/* Error snackbar */}
        <Snackbar
          open={saveStatus === 'error'}
          autoHideDuration={3000}
          onClose={() => setSaveStatus('idle')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" variant="filled">
            Failed to save. Please try again.
          </Alert>
        </Snackbar>
      </Box>
    );
  }
);

UnifiedCanvas.displayName = 'UnifiedCanvas';

export default UnifiedCanvas;