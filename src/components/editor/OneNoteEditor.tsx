/**
 * OneNoteEditor Component
 * A TipTap-based document editor with OneNote-style behavior
 * 
 * Features:
 * - Document-style scrolling (no infinite canvas)
 * - Text highlighting for concepts and confusions
 * - Constrained zoom/pan behavior
 * - Rich text editing
 */
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Mark, Extension, textInputRule } from '@tiptap/core';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconHighlight,
  IconBulb,
  IconQuestionMark,
  IconH1,
  IconH2,
  IconList,
  IconListNumbers,
  IconBlockquote,
  IconCode,
  IconMathSymbols
} from '@tabler/icons-react';

// ============================================================================
// Math & CS Symbol Shortcuts Extension
// ============================================================================
// Type these shortcuts and they auto-convert as you type!
// No need to remember - just type like LaTeX:
//   \theta → Θ    \omega → Ω    \O → O    \infty → ∞
//   \leq → ≤      \geq → ≥      \neq → ≠  \sqrt → √
//   \arrow → →    \larrow → ←   ^2 → ²    ^n → ⁿ

const MathShortcuts = Extension.create({
  name: 'mathShortcuts',
  
  addInputRules() {
    return [
      // Greek letters (algorithm notation)
      textInputRule({ find: /\\theta\s$/, replace: 'Θ ' }),
      textInputRule({ find: /\\Theta\s$/, replace: 'Θ ' }),
      textInputRule({ find: /\\omega\s$/, replace: 'Ω ' }),
      textInputRule({ find: /\\Omega\s$/, replace: 'Ω ' }),
      textInputRule({ find: /\\alpha\s$/, replace: 'α ' }),
      textInputRule({ find: /\\beta\s$/, replace: 'β ' }),
      textInputRule({ find: /\\gamma\s$/, replace: 'γ ' }),
      textInputRule({ find: /\\delta\s$/, replace: 'δ ' }),
      textInputRule({ find: /\\epsilon\s$/, replace: 'ε ' }),
      textInputRule({ find: /\\lambda\s$/, replace: 'λ ' }),
      textInputRule({ find: /\\sigma\s$/, replace: 'σ ' }),
      textInputRule({ find: /\\pi\s$/, replace: 'π ' }),
      textInputRule({ find: /\\phi\s$/, replace: 'φ ' }),
      textInputRule({ find: /\\psi\s$/, replace: 'ψ ' }),
      
      // Mathematical operators & relations
      textInputRule({ find: /\\infty\s$/, replace: '∞ ' }),
      textInputRule({ find: /\\infinity\s$/, replace: '∞ ' }),
      textInputRule({ find: /\\leq\s$/, replace: '≤ ' }),
      textInputRule({ find: /\\geq\s$/, replace: '≥ ' }),
      textInputRule({ find: /\\neq\s$/, replace: '≠ ' }),
      textInputRule({ find: /\\approx\s$/, replace: '≈ ' }),
      textInputRule({ find: /\\times\s$/, replace: '× ' }),
      textInputRule({ find: /\\div\s$/, replace: '÷ ' }),
      textInputRule({ find: /\\pm\s$/, replace: '± ' }),
      textInputRule({ find: /\\sqrt\s$/, replace: '√ ' }),
      textInputRule({ find: /\\sum\s$/, replace: 'Σ ' }),
      textInputRule({ find: /\\prod\s$/, replace: 'Π ' }),
      textInputRule({ find: /\\forall\s$/, replace: '∀ ' }),
      textInputRule({ find: /\\exists\s$/, replace: '∃ ' }),
      textInputRule({ find: /\\in\s$/, replace: '∈ ' }),
      textInputRule({ find: /\\notin\s$/, replace: '∉ ' }),
      textInputRule({ find: /\\subset\s$/, replace: '⊂ ' }),
      textInputRule({ find: /\\supset\s$/, replace: '⊃ ' }),
      textInputRule({ find: /\\union\s$/, replace: '∪ ' }),
      textInputRule({ find: /\\intersect\s$/, replace: '∩ ' }),
      textInputRule({ find: /\\emptyset\s$/, replace: '∅ ' }),
      
      // Arrows
      textInputRule({ find: /\\arrow\s$/, replace: '→ ' }),
      textInputRule({ find: /\\rightarrow\s$/, replace: '→ ' }),
      textInputRule({ find: /\\leftarrow\s$/, replace: '← ' }),
      textInputRule({ find: /\\larrow\s$/, replace: '← ' }),
      textInputRule({ find: /\\uparrow\s$/, replace: '↑ ' }),
      textInputRule({ find: /\\downarrow\s$/, replace: '↓ ' }),
      textInputRule({ find: /\\leftrightarrow\s$/, replace: '↔ ' }),
      textInputRule({ find: /\\implies\s$/, replace: '⇒ ' }),
      textInputRule({ find: /\\iff\s$/, replace: '⇔ ' }),
      
      // Superscripts (common in complexity)
      textInputRule({ find: /\^0\s$/, replace: '⁰ ' }),
      textInputRule({ find: /\^1\s$/, replace: '¹ ' }),
      textInputRule({ find: /\^2\s$/, replace: '² ' }),
      textInputRule({ find: /\^3\s$/, replace: '³ ' }),
      textInputRule({ find: /\^n\s$/, replace: 'ⁿ ' }),
      textInputRule({ find: /\^i\s$/, replace: 'ⁱ ' }),
      textInputRule({ find: /\^k\s$/, replace: 'ᵏ ' }),
      
      // Subscripts
      textInputRule({ find: /_0\s$/, replace: '₀ ' }),
      textInputRule({ find: /_1\s$/, replace: '₁ ' }),
      textInputRule({ find: /_2\s$/, replace: '₂ ' }),
      textInputRule({ find: /_i\s$/, replace: 'ᵢ ' }),
      textInputRule({ find: /_n\s$/, replace: 'ₙ ' }),
      
      // Logic
      textInputRule({ find: /\\and\s$/, replace: '∧ ' }),
      textInputRule({ find: /\\or\s$/, replace: '∨ ' }),
      textInputRule({ find: /\\not\s$/, replace: '¬ ' }),
      textInputRule({ find: /\\therefore\s$/, replace: '∴ ' }),
      textInputRule({ find: /\\because\s$/, replace: '∵ ' }),
      
      // Brackets
      textInputRule({ find: /\\langle\s$/, replace: '⟨ ' }),
      textInputRule({ find: /\\rangle\s$/, replace: '⟩ ' }),
      textInputRule({ find: /\\lceil\s$/, replace: '⌈ ' }),
      textInputRule({ find: /\\rceil\s$/, replace: '⌉ ' }),
      textInputRule({ find: /\\lfloor\s$/, replace: '⌊ ' }),
      textInputRule({ find: /\\rfloor\s$/, replace: '⌋ ' }),
      
      // Common CS notation
      textInputRule({ find: /\\log\s$/, replace: 'log ' }),
      textInputRule({ find: /\\lg\s$/, replace: 'lg ' }),
      textInputRule({ find: /\\ln\s$/, replace: 'ln ' }),
      textInputRule({ find: /\\O\s$/, replace: 'O ' }),
      textInputRule({ find: /\\check\s$/, replace: '✓ ' }),
      textInputRule({ find: /\\cross\s$/, replace: '✗ ' }),
    ];
  },
});

// ============================================================================
// Custom Marks for Concept & Confusion Highlighting
// ============================================================================

/**
 * ConceptMark - Yellow highlight for concepts to review
 */
const ConceptMark = Mark.create({
  name: 'concept',
  
  addAttributes() {
    return {
      uuid: {
        default: null,
        parseHTML: element => element.getAttribute('data-uuid'),
        renderHTML: attributes => {
          if (!attributes.uuid) return {};
          return { 'data-uuid': attributes.uuid };
        },
      },
    };
  },
  
  parseHTML() {
    return [{ tag: 'mark.concept-mark' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['mark', { ...HTMLAttributes, class: 'concept-mark' }, 0];
  },
});

/**
 * ConfusionMark - Pink highlight for confusion points
 */
const ConfusionMark = Mark.create({
  name: 'confusion',
  
  addAttributes() {
    return {
      uuid: {
        default: null,
        parseHTML: element => element.getAttribute('data-uuid'),
        renderHTML: attributes => {
          if (!attributes.uuid) return {};
          return { 'data-uuid': attributes.uuid };
        },
      },
    };
  },
  
  parseHTML() {
    return [{ tag: 'mark.confusion-mark' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['mark', { ...HTMLAttributes, class: 'confusion-mark' }, 0];
  },
});

// ============================================================================
// Types
// ============================================================================

export interface SelectionData {
  text: string;
  from: number;
  to: number;
}

export interface OneNoteEditorProps {
  /** Initial content (HTML string or TipTap JSON) */
  initialContent?: string;
  /** Callback when content changes */
  onChange?: (html: string) => void;
  /** Callback when content should be saved */
  onSave?: (html: string) => void;
  /** Callback when user marks text as concept */
  onSaveConcept?: (data: SelectionData) => void;
  /** Callback when user marks text as confusion */
  onMarkConfusion?: (data: SelectionData) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Minimum height */
  minHeight?: number | string;
  /** Is saving selection (for loading state) */
  isSaving?: boolean;
}

export interface OneNoteEditorRef {
  /** Get current content as HTML */
  getHTML: () => string;
  /** Get current content as JSON */
  getJSON: () => Record<string, unknown>;
  /** Set content */
  setContent: (content: string) => void;
  /** Focus the editor */
  focus: () => void;
  /** Insert content at cursor */
  insertContent: (content: string) => void;
  /** Get the TipTap editor instance (for activity tracking) */
  getEditor: () => import('@tiptap/react').Editor | null;
}

// ============================================================================
// Main Component
// ============================================================================

const OneNoteEditor = forwardRef<OneNoteEditorRef, OneNoteEditorProps>(
  (
    {
      initialContent = '',
      onChange,
      onSave,
      onSaveConcept,
      onMarkConfusion,
      readOnly = false,
      placeholder = 'Start typing...',
      showToolbar = true,
      minHeight = 400,
      isSaving = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const [hasSelection, setHasSelection] = useState(false);
    
    // Initialize TipTap editor
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Highlight.configure({
          multicolor: true,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Underline,
        ConceptMark,
        ConfusionMark,
        MathShortcuts, // Auto-replace: \theta → Θ, \omega → Ω, ^2 → ², etc.
      ],
      content: initialContent,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        setHasSelection(from !== to);
      },
    });
    
    // Update editable state when readOnly prop changes
    useEffect(() => {
      if (editor) {
        editor.setEditable(!readOnly);
      }
    }, [editor, readOnly]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      getJSON: () => editor?.getJSON() || {},
      setContent: (content: string) => {
        editor?.commands.setContent(content);
      },
      focus: () => {
        editor?.commands.focus();
      },
      insertContent: (content: string) => {
        editor?.commands.insertContent(content);
      },
      getEditor: () => editor,
    }));

    // Handle Ctrl+S for save
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          if (editor) {
            onSave?.(editor.getHTML());
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [editor, onSave]);

    // Mark selection as concept
    const handleMarkConcept = useCallback(() => {
      if (!editor) return;
      
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      
      if (text.length < 3) return; // Minimum selection length
      
      // Apply the concept mark
      editor.chain().focus().setMark('concept').run();
      
      // Notify parent
      onSaveConcept?.({ text, from, to });
    }, [editor, onSaveConcept]);

    // Mark selection as confusion
    const handleMarkConfusion = useCallback(() => {
      if (!editor) return;
      
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      
      if (text.length < 3) return;
      
      // Apply the confusion mark
      editor.chain().focus().setMark('confusion').run();
      
      // Notify parent
      onMarkConfusion?.({ text, from, to });
    }, [editor, onMarkConfusion]);

    if (!editor) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: minHeight,
          bgcolor: theme.palette.background.paper
        }}>
          <CircularProgress size={32} />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          minHeight,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Fixed Toolbar - Cohesive color palette */}
        {showToolbar && !readOnly && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 2,
              py: 1.25,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.default,
              flexWrap: 'wrap',
            }}
          >
            {/* Color palette constants for consistency */}
            {/* Active: #0ea5e9 (sky blue) | Highlight: #f59e0b (amber) | Concept: #10b981 (emerald) | Confusion: #8b5cf6 (violet) */}
            
            {/* Text Formatting */}
            <Tooltip title="Bold (Ctrl+B)">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBold().run()}
                sx={{ 
                  color: editor.isActive('bold') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconBold size={22} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Italic (Ctrl+I)">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                sx={{ 
                  color: editor.isActive('italic') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconItalic size={22} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Underline (Ctrl+U)">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                sx={{ 
                  color: editor.isActive('underline') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconUnderline size={22} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Highlight">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                sx={{ 
                  color: editor.isActive('highlight') ? '#f59e0b' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#f59e0b', 0.1) }
                }}
              >
                <IconHighlight size={22} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 24, alignSelf: 'center' }} />

            {/* Headings */}
            <Tooltip title="Heading 1">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                sx={{ 
                  color: editor.isActive('heading', { level: 1 }) ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconH1 size={22} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Heading 2">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                sx={{ 
                  color: editor.isActive('heading', { level: 2 }) ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconH2 size={22} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 24, alignSelf: 'center' }} />

            {/* Lists */}
            <Tooltip title="Bullet List">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                sx={{ 
                  color: editor.isActive('bulletList') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconList size={22} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Numbered List">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                sx={{ 
                  color: editor.isActive('orderedList') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconListNumbers size={22} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 24, alignSelf: 'center' }} />

            {/* Block Elements */}
            <Tooltip title="Blockquote">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                sx={{ 
                  color: editor.isActive('blockquote') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconBlockquote size={22} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Code Block">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                sx={{ 
                  color: editor.isActive('codeBlock') ? '#0ea5e9' : theme.palette.text.secondary,
                  '&:hover': { bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconCode size={22} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 24, alignSelf: 'center' }} />

            {/* Learning Actions - Concept (emerald) & Confusion (violet) */}
            <Tooltip title="Save as Concept (for review)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleMarkConcept}
                  disabled={!hasSelection || isSaving}
                  sx={{ 
                    color: hasSelection ? '#10b981' : theme.palette.text.disabled,
                    '&:hover': { bgcolor: alpha('#10b981', 0.1) }
                  }}
                >
                  <IconBulb size={22} />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Mark as Confusion">
              <span>
                <IconButton
                  size="small"
                  onClick={handleMarkConfusion}
                  disabled={!hasSelection || isSaving}
                  sx={{ 
                    color: hasSelection ? '#8b5cf6' : theme.palette.text.disabled,
                    '&:hover': { bgcolor: alpha('#8b5cf6', 0.1) }
                  }}
                >
                  <IconQuestionMark size={22} />
                </IconButton>
              </span>
            </Tooltip>

            {isSaving && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}

            {/* Math Shortcuts Help - subtle help icon */}
            <Tooltip 
              title={
                <Box sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                  <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
                    Math Shortcuts (type + space)
                  </Typography>
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>
                    \theta → Θ &nbsp; \omega → Ω<br/>
                    \leq → ≤ &nbsp; \geq → ≥ &nbsp; \neq → ≠<br/>
                    \infty → ∞ &nbsp; \sqrt → √<br/>
                    \arrow → → &nbsp; \implies → ⇒<br/>
                    ^2 → ² &nbsp; ^n → ⁿ &nbsp; _n → ₙ<br/>
                    \sum → Σ &nbsp; \forall → ∀<br/>
                    \lfloor → ⌊ &nbsp; \rfloor → ⌋
                  </Box>
                </Box>
              }
              arrow
              placement="bottom-end"
            >
              <IconButton
                size="small"
                sx={{ 
                  ml: 1,
                  color: theme.palette.text.disabled,
                  '&:hover': { color: '#0ea5e9', bgcolor: alpha('#0ea5e9', 0.1) }
                }}
              >
                <IconMathSymbols size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Editor Content Area - Document-style scrolling with OneNote-like infinite scroll */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto', // Document-style scroll
            p: 3,
            // OneNote-style infinite scroll: add large bottom padding so users
            // always have plenty of empty space to continue writing when at bottom
            pb: '65vh', // >60% of viewport as empty space when at bottom
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            // Editor styling
            '& .tiptap': {
              outline: 'none',
              minHeight: '100%',
              width: '100%',
              maxWidth: '100%',
              fontSize: '1rem',
              lineHeight: 1.7,
              color: theme.palette.text.primary,
              fontFamily: theme.typography.fontFamily,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              
              // Paragraph spacing
              '& p': {
                margin: '0.5em 0',
              },
              
              // Headings
              '& h1': {
                fontSize: '1.75rem',
                fontWeight: 700,
                margin: '1em 0 0.5em',
                color: theme.palette.text.primary,
              },
              '& h2': {
                fontSize: '1.5rem',
                fontWeight: 600,
                margin: '0.75em 0 0.5em',
                color: theme.palette.text.primary,
              },
              '& h3': {
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: '0.75em 0 0.5em',
                color: theme.palette.text.primary,
              },
              
              // Lists
              '& ul, & ol': {
                paddingLeft: '1.5em',
                margin: '0.5em 0',
              },
              
              // Blockquote
              '& blockquote': {
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                paddingLeft: '1em',
                margin: '1em 0',
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              },
              
              // Code blocks
              '& pre': {
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
                borderRadius: '8px',
                padding: '1em',
                margin: '1em 0',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxWidth: '100%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              },
              '& code': {
                backgroundColor: alpha(theme.palette.text.primary, 0.08),
                borderRadius: '4px',
                padding: '0.2em 0.4em',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                wordBreak: 'break-word',
              },
              
              // Concept highlight (emerald - matches toolbar)
              '& .concept-mark': {
                backgroundColor: alpha('#10b981', 0.2),
                borderRadius: '2px',
                padding: '0 2px',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha('#10b981', 0.35),
                },
              },
              
              // Confusion highlight (violet - matches toolbar)
              '& .confusion-mark': {
                backgroundColor: alpha('#8b5cf6', 0.2),
                borderRadius: '2px',
                padding: '0 2px',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha('#8b5cf6', 0.35),
                },
              },
              
              // Generic highlight
              '& mark': {
                backgroundColor: '#fef08a',
                borderRadius: '2px',
                padding: '0 2px',
              },
              
              // Placeholder - using :first-of-type for SSR compatibility
              '& p.is-editor-empty:first-of-type::before': {
                color: theme.palette.text.disabled,
                content: 'attr(data-placeholder)',
                float: 'left',
                height: 0,
                pointerEvents: 'none',
              },
              
              // AI Response styling - purple blockquote with indicator
              '& .ai-response': {
                backgroundColor: alpha('#9c27b0', 0.08),
                borderLeft: '4px solid #9c27b0',
                borderRadius: '0 8px 8px 0',
                padding: '1em 1.5em',
                margin: '1.5em 0',
                position: 'relative',
                
                // AI response header
                '& .ai-response-header': {
                  color: '#9c27b0',
                  margin: '0 0 0.75em 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                },
                
                // Paragraphs inside AI response
                '& p': {
                  margin: '0.5em 0',
                  color: theme.palette.text.primary,
                },
                
                // Lists inside AI response
                '& ul, & ol': {
                  margin: '0.5em 0',
                  paddingLeft: '1.5em',
                },
                
                // Headings inside AI response
                '& h1, & h2, & h3': {
                  color: '#7b1fa2',
                  margin: '0.75em 0 0.5em',
                },
                
                // Code inside AI response
                '& code': {
                  backgroundColor: alpha('#9c27b0', 0.12),
                },
                
                // Hover effect
                '&:hover': {
                  backgroundColor: alpha('#9c27b0', 0.12),
                },
              },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>
    );
  }
);

OneNoteEditor.displayName = 'OneNoteEditor';

export default OneNoteEditor;

