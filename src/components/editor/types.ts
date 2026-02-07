/**
 * Editor Types
 * Shared types for the unified canvas editor
 */

/**
 * tldraw snapshot type - using generic Record for compatibility across versions
 * The actual snapshot structure is opaque and managed by tldraw
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TLSnapshot = Record<string, any>;

/**
 * Canvas data stored in the database
 */
export interface CanvasData {
  /** tldraw store snapshot */
  snapshot: TLSnapshot | null;
  /** Schema version for migrations */
  version: number;
  /** Last update timestamp */
  updatedAt: string;
  /** Original markdown content (for backwards compatibility) */
  markdownContent?: string;
}

/**
 * Event emitted when canvas changes
 */
export interface CanvasChangeEvent {
  lessonUUID: string;
  snapshot: TLSnapshot;
  timestamp: Date;
}

/**
 * Canvas tool modes
 */
export type CanvasMode = 'select' | 'draw' | 'text' | 'eraser' | 'hand' | 'arrow' | 'note';

/**
 * TLUiComponents subset for our overrides
 * Full type available from 'tldraw' but we only need RichTextToolbar
 */
export interface TLUiComponentsOverride {
  /** Custom RichTextToolbar component */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RichTextToolbar?: React.ComponentType<any> | null;
}

/**
 * Props for the UnifiedCanvas component
 */
export interface UnifiedCanvasProps {
  /** Initial data to load (existing canvas snapshot) */
  initialData?: CanvasData | null;
  /** @deprecated Use initialText instead */
  initialMarkdown?: string;
  /** Text/markdown content to auto-paste onto the canvas on first load (when no saved canvas data exists) */
  initialText?: string;
  /** Callback when canvas changes (debounced) */
  onChange?: (snapshot: TLSnapshot) => void;
  /** Callback on explicit save */
  onSave?: (snapshot: TLSnapshot) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Minimum height */
  minHeight?: number | string;
  /** Hide the UI (for embedded/preview mode) */
  hideUi?: boolean;
  /** Transparent background (for overlay mode) */
  transparentBg?: boolean;
  /** Override tldraw UI components (e.g., custom RichTextToolbar) */
  components?: TLUiComponentsOverride;
}

/**
 * Ref methods exposed by UnifiedCanvas
 */
export interface UnifiedCanvasRef {
  /** Get current snapshot */
  getSnapshot: () => TLSnapshot | null;
  /** Get the tldraw editor instance - cast as needed for specific operations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEditor: () => any | null;
  /** Focus the canvas */
  focus: () => void;
}

