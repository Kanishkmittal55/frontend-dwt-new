/**
 * useCanvasImagePaste Hook
 *
 * Document-level paste handler for images on the tldraw canvas.
 * Isolated from UnifiedCanvas to avoid interfering with:
 * - Activity tracker (AI response to typing)
 * - tldraw's native paste for text
 * - Store listeners
 *
 * Only handles IMAGE paste. Text paste is left to tldraw.
 * Uses capture phase so we can run before tldraw; calls stopPropagation
 * only when we actually paste images to avoid duplicate paste.
 */
import { useEffect, useRef } from 'react';
import type { Editor } from '@tldraw/tldraw';

const PASTE_STEAL_TAGS = new Set(['input', 'select', 'textarea']);
const PASTE_IMAGE_TYPES = [
  'web image/vnd.tldraw+png',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

const PASTE_DEBUG = false;

function pasteLog(...args: unknown[]) {
  if (PASTE_DEBUG) {
    console.log('[useCanvasImagePaste]', ...args);
  }
}

export interface UseCanvasImagePasteOptions {
  /** Editor ref - must be stable */
  editorRef: React.RefObject<Editor | null>;
  /** Whether canvas is read-only (paste disabled) */
  readOnly: boolean;
  /** Callback when paste succeeds (e.g. mark unsaved) */
  onPasteSuccess?: () => void;
}

export function useCanvasImagePaste({
  editorRef,
  readOnly,
  onPasteSuccess
}: UseCanvasImagePasteOptions) {
  const onPasteSuccessRef = useRef(onPasteSuccess);
  onPasteSuccessRef.current = onPasteSuccess;

  useEffect(() => {
    if (readOnly) return;

    const handlePaste = async (e: ClipboardEvent) => {
      pasteLog('1. paste event fired');

      const editor = editorRef.current;
      if (!editor) {
        pasteLog('2. SKIP: no editor');
        return;
      }

      // Only skip for real form inputs (chat, etc.). Do NOT skip for contenteditable.
      const active = document.activeElement as HTMLElement | null;
      if (active && PASTE_STEAL_TAGS.has(active.tagName?.toLowerCase() ?? '')) {
        pasteLog('3. SKIP: focus in input/select/textarea');
        return;
      }

      const isEditingShape = editor.getEditingShapeId() !== null;
      if (isEditingShape) {
        pasteLog('4. Editing text shape - will paste images if clipboard has them');
      }

      // When tldraw has focus and we're NOT editing: let tldraw handle paste (text or image)
      if (editor.getInstanceState().isFocused && !isEditingShape) {
        pasteLog('5. SKIP: tldraw has focus, let native handler run');
        return;
      }

      pasteLog('6. Fallback handler active');

      // --- Sync: try event clipboardData first ---
      const eventFiles: File[] = [];
      const items = e.clipboardData?.items;

      for (const item of Array.from(items ?? [])) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) eventFiles.push(f);
        }
      }
      if (eventFiles.length === 0 && e.clipboardData?.files?.length) {
        eventFiles.push(...Array.from(e.clipboardData.files));
      }

      const imageFromEvent = eventFiles.filter(
        (f) => PASTE_IMAGE_TYPES.includes(f.type) || f.type.startsWith('image/')
      );

      if (imageFromEvent.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        if (isEditingShape) editor.cancel();
        pasteLog('10. Fast path: pasting', imageFromEvent.length, 'image(s)');
        try {
          const point = editor.inputs.getCurrentPagePoint();
          editor.markHistoryStoppingPoint('paste');
          await editor.putExternalContent({ type: 'files', files: imageFromEvent, point });
          onPasteSuccessRef.current?.();
          pasteLog('11. SUCCESS');
        } catch (err) {
          pasteLog('12. ERROR', err);
          console.warn('[useCanvasImagePaste] paste failed:', err);
        }
        return;
      }

      // --- Async: Clipboard API (macOS screenshots) ---
      // When editing a text shape and no images in event: let text paste into the shape
      if (isEditingShape) {
        pasteLog('13. SKIP: editing shape, no images in event (let text paste)');
        return;
      }

      if (!navigator.clipboard?.read) {
        pasteLog('14. SKIP: no navigator.clipboard.read');
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      pasteLog('15. Slow path: clipboard.read()');

      try {
        const clipboardItems = await navigator.clipboard.read();
        const files: File[] = [];
        let idx = 0;
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (PASTE_IMAGE_TYPES.includes(type) || type.startsWith('image/')) {
              const blob = await item.getType(type);
              const ext = type.split('/')[1] || 'png';
              files.push(new File([blob], `pasted-${Date.now()}-${idx}.${ext}`, { type }));
              break;
            }
          }
          idx++;
        }

        if (files.length === 0) {
          pasteLog('16. SKIP: no images in clipboard');
          return;
        }

        if (editor.getEditingShapeId()) editor.cancel();
        const point = editor.inputs.getCurrentPagePoint();
        editor.markHistoryStoppingPoint('paste');
        await editor.putExternalContent({ type: 'files', files, point });
        onPasteSuccessRef.current?.();
        pasteLog('17. SUCCESS');
      } catch (err) {
        pasteLog('18. ERROR', err);
        console.warn('[useCanvasImagePaste] clipboard paste failed:', err);
      }
    };

    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [readOnly, editorRef]);
}
