/**
 * CustomRichTextToolbar Component
 * 
 * A minimal rich text toolbar for the learning canvas that shows:
 * - Bold (essential formatting)
 * - Save Concept (💡 lightbulb - track for spaced repetition)
 * - Mark Confusion (❓ question mark - flag for clarification)
 * 
 * With smooth annotation popup for adding notes before saving.
 * 
 * Uses tldraw's native UI components for consistent styling.
 */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  track,
  useEditor,
  useValue,
  debounce,
} from '@tldraw/editor';
import type { TiptapEditor } from '@tldraw/editor';
import type { EditorEvents as TextEditorEvents, Range } from '@tiptap/core';
import {
  TldrawUiContextualToolbar,
  TldrawUiButton,
  TldrawUiButtonIcon,
  preventDefault,
} from 'tldraw';

// MUI for annotation popup
import TextField from '@mui/material/TextField';
import Fade from '@mui/material/Fade';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { createPortal } from 'react-dom';

// ============================================================================
// Types
// ============================================================================

/** Source type for selected text content */
export type SourceType = 'lesson' | 'notes' | 'ai_response';

/** Selection data with optional annotation */
export interface SelectionData {
  text: string;
  sourceType: SourceType;
  annotation?: string | undefined;
}

export interface CustomRichTextToolbarProps {
  /** Callback when saving selection as concept */
  onSaveConcept?: (data: SelectionData) => void;
  /** Callback when marking selection as confusion point */
  onMarkConfusion?: (data: SelectionData) => void;
  /** Current lesson UUID for context */
  lessonUUID?: string;
  /** Whether saving is in progress */
  isSaving?: boolean;
}

// ============================================================================
// Helper: Convert DOMRect to Box
// ============================================================================

function rectToBox(rect: DOMRect): Box {
  return new Box(rect.x, rect.y, rect.width, rect.height);
}

// ============================================================================
// Helper: Get source type from the editing shape's metadata
// ============================================================================

function getSourceType(editor: ReturnType<typeof useEditor>): SourceType {
  const editingShapeId = editor.getEditingShapeId();
  if (!editingShapeId) return 'notes';
  
  const shape = editor.getShape(editingShapeId);
  if (!shape) return 'notes';
  
  const meta = shape.meta as Record<string, unknown> | undefined;
  
  if (meta?.isLessonContent) return 'lesson';
  if (meta?.isAI) return 'ai_response';
  
  return 'notes';
}

// ============================================================================
// Custom Icon Components (matching tldraw's 18x18 icon style)
// ============================================================================

/** Lightbulb icon for concepts - matches tldraw icon styling */
function ConceptIcon() {
  return (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M9 21h6" />
      <path d="M9 18h6" />
    </svg>
  );
}

/** Question mark icon for confusion - matches tldraw icon styling */
function ConfusionIcon() {
  return (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// Separator Component (matches tldraw styling)
// ============================================================================

function ToolbarSeparator() {
  return (
    <div
      className="tlui-toolbar__separator"
      style={{
        width: '1px',
        height: '18px',
        background: 'var(--color-divider)',
        margin: '0 4px',
        alignSelf: 'center',
      }}
    />
  );
}

// ============================================================================
// Annotation Popup Component
// ============================================================================

interface AnnotationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (annotation: string) => void;
  type: 'concept' | 'confusion';
  selectedText: string;
  isSaving: boolean | undefined;
  anchorPosition: { x: number; y: number } | null;
}

function AnnotationPopup({ isOpen, onClose, onSubmit, type, selectedText, isSaving, anchorPosition }: AnnotationPopupProps) {
  const [annotation, setAnnotation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setAnnotation('');
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    onSubmit(annotation);
    setAnnotation('');
  }, [annotation, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSubmit, onClose]);

  const isConcept = type === 'concept';
  const accentColor = isConcept ? '#4caf50' : '#ff9800';
  const label = isConcept ? 'Save Concept' : 'Mark Confusion';
  const placeholder = isConcept 
    ? 'Why is this important to remember?' 
    : 'What exactly confuses you?';

  if (!isOpen || !anchorPosition) return null;

  // Use portal to render outside tldraw's contextual toolbar
  return createPortal(
    <Fade in={isOpen} timeout={150}>
      <div
        style={{
          position: 'fixed',
          top: anchorPosition.y + 10,
          left: anchorPosition.x,
          transform: 'translateX(-50%)',
          zIndex: 99999,
          pointerEvents: 'auto',
        }}
      >
        <ClickAwayListener onClickAway={onClose}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              border: `2px solid ${accentColor}`,
              padding: '12px',
              minWidth: '280px',
              maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '8px',
              color: accentColor,
              fontWeight: 600,
              fontSize: '13px',
            }}>
              {isConcept ? <ConceptIcon /> : <ConfusionIcon />}
              {label}
            </div>

            {/* Selected text preview */}
            <div style={{
              background: '#f5f5f5',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              color: '#666',
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontStyle: 'italic',
            }}>
              "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
            </div>

            {/* Annotation input */}
            <TextField
              inputRef={inputRef}
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              multiline
              maxRows={3}
              size="small"
              fullWidth
              disabled={!!isSaving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '13px',
                  background: '#fafafa',
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '12px',
                  opacity: 0.7,
                },
              }}
            />

            {/* Actions */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '8px', 
              marginTop: '10px' 
            }}>
              <button
                onClick={onClose}
                disabled={!!isSaving}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  background: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!!isSaving}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  background: accentColor,
                  color: 'white',
                  cursor: !!isSaving ? 'wait' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: !!isSaving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = !!isSaving ? '0.7' : '1';
                }}
              >
                {!!isSaving ? 'Saving...' : (annotation.trim() ? 'Save with Note' : 'Save')}
              </button>
            </div>

            {/* Hint */}
            <div style={{
              fontSize: '10px',
              color: '#888',
              marginTop: '8px',
              textAlign: 'center',
            }}>
              Press Enter to save • Esc to cancel
            </div>
          </div>
        </ClickAwayListener>
      </div>
    </Fade>,
    document.body
  );
}

// ============================================================================
// Inner Toolbar Component (handles the actual toolbar content)
// ============================================================================

interface ToolbarInnerProps extends CustomRichTextToolbarProps {
  textEditor: TiptapEditor;
}

function ToolbarInner({
  textEditor,
  onSaveConcept,
  onMarkConfusion,
  isSaving,
}: ToolbarInnerProps) {
  const editor = useEditor();
  const [currentSelection, setCurrentSelection] = useState<Range | null>(null);
  const previousSelectionBounds = useRef<Box | undefined>(undefined);
  const [isMousingDown, setIsMousingDown] = useState(false);
  
  // Annotation popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<'concept' | 'confusion'>('concept');
  const [pendingText, setPendingText] = useState('');
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // Track selection changes
  useEffect(() => {
    const handleSelectionUpdate = ({ editor: te }: TextEditorEvents['selectionUpdate']) => {
      setCurrentSelection(te.state.selection);
    };
    textEditor.on('selectionUpdate', handleSelectionUpdate);
    handleSelectionUpdate({ editor: textEditor } as TextEditorEvents['selectionUpdate']);
    return () => {
      textEditor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [textEditor]);

  // Check if bold is active
  const isBoldActive = useMemo(() => {
    return textEditor.isActive('bold');
  }, [textEditor, currentSelection]);

  // Track mousing state
  useEffect(() => {
    if (!textEditor) return;

    const handlePointingStateChange = debounce(({ isPointing }: { isPointing: boolean }) => {
      setIsMousingDown(isPointing);
    }, 16);
    const handlePointingDown = () => handlePointingStateChange({ isPointing: true });
    const handlePointingUp = () => handlePointingStateChange({ isPointing: false });

    const touchDownEvents = ['touchstart', 'pointerdown', 'mousedown'];
    const touchUpEvents = ['touchend', 'pointerup', 'mouseup'];
    
    touchDownEvents.forEach((eventName) => {
      textEditor.view.dom.addEventListener(eventName, handlePointingDown);
    });
    touchUpEvents.forEach((eventName) => {
      document.body.addEventListener(eventName, handlePointingUp);
    });
    
    return () => {
      touchDownEvents.forEach((eventName) => {
        if (textEditor.isInitialized) {
          textEditor.view.dom.removeEventListener(eventName, handlePointingDown);
        }
      });
      touchUpEvents.forEach((eventName) => {
        document.body.removeEventListener(eventName, handlePointingUp);
      });
    };
  }, [textEditor]);

  // Get selection bounds for toolbar positioning
  const getSelectionBounds = useCallback(() => {
    const selection = window.getSelection();
    if (!currentSelection || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const rangeBoxes: Box[] = [];
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      rangeBoxes.push(rectToBox(range.getBoundingClientRect()));
    }

    const bounds = Box.Common(rangeBoxes);
    previousSelectionBounds.current = bounds;
    return bounds;
  }, [currentSelection]);

  // Toggle bold formatting
  const handleBoldClick = useCallback(() => {
    if (!textEditor.view) return;
    // @ts-expect-error dynamic chain call typing
    textEditor.chain().focus().toggleBold().run();
  }, [textEditor]);

  // Open annotation popup for concept
  const handleConceptClick = useCallback((e: React.MouseEvent) => {
    console.log('%c[RichTextToolbar] 💡 Concept button clicked', 'color: #4caf50');
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log('[RichTextToolbar] Selected text:', selectedText?.substring(0, 50));
    
    if (selectedText && selectedText.length >= 3) {
      // Get button position for popup
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopupPosition({ x: rect.left + rect.width / 2, y: rect.bottom });
      setPendingText(selectedText);
      setPopupType('concept');
      setPopupOpen(true);
      console.log('[RichTextToolbar] Popup opened for concept');
    } else {
      console.warn('[RichTextToolbar] No valid selection for concept');
    }
  }, []);

  // Open annotation popup for confusion
  const handleConfusionClick = useCallback((e: React.MouseEvent) => {
    console.log('%c[RichTextToolbar] ❓ Confusion button clicked', 'color: #ff9800');
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log('[RichTextToolbar] Selected text:', selectedText?.substring(0, 50));
    
    if (selectedText && selectedText.length >= 3) {
      // Get button position for popup
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopupPosition({ x: rect.left + rect.width / 2, y: rect.bottom });
      setPendingText(selectedText);
      setPopupType('confusion');
      setPopupOpen(true);
      console.log('[RichTextToolbar] Popup opened for confusion');
    } else {
      console.warn('[RichTextToolbar] No valid selection for confusion');
    }
  }, []);

  // Close popup
  const handlePopupClose = useCallback(() => {
    setPopupOpen(false);
    setPendingText('');
    setPopupPosition(null);
  }, []);

  // Submit with annotation
  const handlePopupSubmit = useCallback((annotation: string) => {
    const sourceType = getSourceType(editor);
    const data: SelectionData = {
      text: pendingText,
      sourceType,
      annotation: annotation.trim() || undefined,
    };
    
    if (popupType === 'concept' && onSaveConcept) {
      onSaveConcept(data);
      console.log('%c[RichTextToolbar] 💡 Concept saved', 'color: #4caf50', {
        text: pendingText.substring(0, 50),
        annotation: annotation.substring(0, 30),
        sourceType,
      });
    } else if (popupType === 'confusion' && onMarkConfusion) {
      onMarkConfusion(data);
      console.log('%c[RichTextToolbar] ❓ Confusion marked', 'color: #ff9800', {
        text: pendingText.substring(0, 50),
        annotation: annotation.substring(0, 30),
        sourceType,
      });
    }
    
    handlePopupClose();
  }, [editor, pendingText, popupType, onSaveConcept, onMarkConfusion, handlePopupClose]);

  // Check if we have valid text selection for our custom buttons
  const hasValidSelection = useMemo(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    return text && text.length >= 3;
  }, [currentSelection]);


  return (
    <TldrawUiContextualToolbar
      className="tlui-rich-text__toolbar"
      getSelectionBounds={getSelectionBounds}
      isMousingDown={isMousingDown}
      changeOnlyWhenYChanges={true}
      label="Text tools"
    >
      {/* Bold button - using tldraw's native button component */}
      <TldrawUiButton
        type="icon"
        title="Bold (Ctrl+B)"
        data-testid="rich-text.bold"
        isActive={isBoldActive}
        onPointerDown={preventDefault}
        onClick={handleBoldClick}
      >
        <TldrawUiButtonIcon icon="bold" />
      </TldrawUiButton>

      <ToolbarSeparator />

      {/* Save as Concept - custom learning button */}
      <TldrawUiButton
        type="icon"
        title="Save as Concept (track for review)"
        data-testid="rich-text.save-concept"
        disabled={isSaving || !hasValidSelection}
        isActive={popupOpen && popupType === 'concept'}
        onPointerDown={preventDefault}
        onClick={handleConceptClick}
      >
        <ConceptIcon />
      </TldrawUiButton>

      {/* Mark as Confusion - custom learning button */}
      <TldrawUiButton
        type="icon"
        title="Mark as Confusion Point"
        data-testid="rich-text.mark-confusion"
        disabled={isSaving || !hasValidSelection}
        isActive={popupOpen && popupType === 'confusion'}
        onPointerDown={preventDefault}
        onClick={handleConfusionClick}
      >
        <ConfusionIcon />
      </TldrawUiButton>

      {/* Annotation Popup - rendered via portal */}
      <AnnotationPopup
        isOpen={popupOpen}
        onClose={handlePopupClose}
        onSubmit={handlePopupSubmit}
        type={popupType}
        selectedText={pendingText}
        isSaving={isSaving}
        anchorPosition={popupPosition}
      />
    </TldrawUiContextualToolbar>
  );
}

// ============================================================================
// Main Component (exported)
// ============================================================================

export const CustomRichTextToolbar = track(function CustomRichTextToolbar(
  props: CustomRichTextToolbarProps
) {
  const editor = useEditor();
  const textEditor = useValue('textEditor', () => editor.getRichTextEditor(), [editor]);

  // Don't render on coarse pointer devices or without text editor
  if (editor.getInstanceState().isCoarsePointer || !textEditor) return null;

  return <ToolbarInner textEditor={textEditor} {...props} />;
});

export default CustomRichTextToolbar;
