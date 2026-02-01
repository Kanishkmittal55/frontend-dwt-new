/**
 * AI Typing Effect - Animates text appearing character by character
 * Creates a natural "someone is typing" effect on the tldraw canvas
 * 
 * Uses tldraw v4's note shapes with richText format for compatibility
 */
import { Editor, createShapeId, TLShapeId } from '@tldraw/tldraw';

export interface AITypingOptions {
  /** Text to type */
  text: string;
  /** X position on canvas */
  x: number;
  /** Y position on canvas */
  y: number;
  /** Text color (tldraw color name) */
  color?: 'black' | 'blue' | 'violet' | 'green' | 'red' | 'orange';
  /** Milliseconds per character (lower = faster) */
  typingSpeed?: number;
  /** Text size */
  size?: 's' | 'm' | 'l' | 'xl';
  /** Callback when typing completes */
  onComplete?: (shapeId: TLShapeId) => void;
  /** Callback on each character typed */
  onProgress?: (currentText: string, progress: number) => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Convert plain text to tldraw v4 richText format (ProseMirror-like structure)
 * IMPORTANT: Empty text nodes are not allowed in ProseMirror
 */
function textToRichText(text: string): Record<string, unknown> {
  // Ensure text is never empty - ProseMirror requires at least some content
  const safeText = text || ' ';
  
  // Split by double newlines to get paragraphs
  const paragraphs = safeText.split(/\n\n+/).filter(p => p.trim());
  
  if (paragraphs.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }]
    };
  }
  
  return {
    type: 'doc',
    content: paragraphs.map(para => ({
      type: 'paragraph',
      content: para.split('\n').flatMap((line, idx, arr) => {
        // CRITICAL: Never create empty text nodes - use space as fallback
        const safeLineText = line || ' ';
        const result: Record<string, unknown>[] = [{ type: 'text', text: safeLineText }];
        // Add hard break between lines within a paragraph
        if (idx < arr.length - 1) {
          result.push({ type: 'hardBreak' });
        }
        return result;
      })
    }))
  };
}

/**
 * Types text onto the canvas character by character with natural timing
 * Uses note shapes (compatible with tldraw v4's richText format)
 * @returns The shape ID of the created note shape
 */
export async function typeAIResponse(
  editor: Editor,
  options: AITypingOptions
): Promise<TLShapeId> {
  const {
    text,
    x,
    y,
    color = 'violet',
    typingSpeed = 35,
    size = 'm',
    onComplete,
    onProgress
  } = options;

  const shapeId = createShapeId();

  // Create note shape with empty text first (tldraw v4 uses richText)
  // IMPORTANT: Add meta.isAI = true to identify AI-generated shapes
  // This allows the activity tracker to exclude AI text from extraction
  try {
    editor.createShape({
      id: shapeId,
      type: 'note',
      x,
      y,
      props: {
        richText: textToRichText(' '), // Start with space (empty causes issues)
        color,
        size: size === 'xl' ? 'l' : size, // Note doesn't have 'xl'
        font: 'sans'
      },
      meta: {
        isAI: true,  // Tag as AI-generated to prevent loops
        createdAt: Date.now()
      }
    });
  } catch (e) {
    console.error('[aiTypingEffect] Failed to create note shape:', e);
    throw e;
  }

  // Animate typing character by character
  let currentText = '';
  const totalChars = text.length;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentText += char;

    try {
      editor.updateShape({
        id: shapeId,
        type: 'note',
        props: { richText: textToRichText(currentText) }
      });
    } catch (e) {
      console.error('[aiTypingEffect] Failed to update note shape:', e);
      break;
    }

    // Progress callback
    onProgress?.(currentText, (i + 1) / totalChars);

    // Variable timing for natural feel
    let delay = typingSpeed;
    if (char === ' ') {
      delay = typingSpeed * 0.5; // Faster for spaces
    } else if (char === '.' || char === '!' || char === '?') {
      delay = typingSpeed * 3; // Pause at sentence ends
    } else if (char === ',') {
      delay = typingSpeed * 1.5; // Small pause at commas
    } else if (char === '\n') {
      delay = typingSpeed * 2; // Pause at newlines
    } else {
      // Add slight randomness for natural feel
      delay = typingSpeed + (Math.random() * 20 - 10);
    }

    await sleep(Math.max(10, delay));
  }

  // Complete callback
  onComplete?.(shapeId);

  return shapeId;
}

/**
 * Finds a good empty position on the canvas for AI response
 * Tries to place near the reference position without overlapping
 */
export function findEmptySpaceNear(
  editor: Editor,
  referenceX: number,
  referenceY: number,
  preferredDirection: 'right' | 'below' | 'auto' = 'auto',
  minWidth: number = 300,
  minHeight: number = 100
): { x: number; y: number } {
  const viewport = editor.getViewportPageBounds();
  const shapes = editor.getCurrentPageShapes();

  // Helper to check if area is empty
  const isAreaEmpty = (testX: number, testY: number): boolean => {
    const testBounds = {
      minX: testX,
      minY: testY,
      maxX: testX + minWidth,
      maxY: testY + minHeight
    };

    return !shapes.some(shape => {
      const bounds = editor.getShapePageBounds(shape);
      if (!bounds) return false;
      
      // Check for intersection
      return !(
        bounds.maxX < testBounds.minX ||
        bounds.minX > testBounds.maxX ||
        bounds.maxY < testBounds.minY ||
        bounds.minY > testBounds.maxY
      );
    });
  };

  // Try right of reference first
  if (preferredDirection === 'right' || preferredDirection === 'auto') {
    const rightX = referenceX + 400;
    if (rightX + minWidth < viewport.maxX && isAreaEmpty(rightX, referenceY)) {
      return { x: rightX, y: referenceY };
    }
  }

  // Try below reference
  if (preferredDirection === 'below' || preferredDirection === 'auto') {
    const belowY = referenceY + 150;
    if (belowY + minHeight < viewport.maxY && isAreaEmpty(referenceX, belowY)) {
      return { x: referenceX, y: belowY };
    }
  }

  // Try bottom-right of viewport
  const bottomRightX = viewport.maxX - minWidth - 50;
  const bottomRightY = viewport.maxY - minHeight - 100;
  if (isAreaEmpty(bottomRightX, bottomRightY)) {
    return { x: bottomRightX, y: bottomRightY };
  }

  // Fallback: place at bottom center of viewport
  return {
    x: viewport.minX + (viewport.maxX - viewport.minX) / 2 - minWidth / 2,
    y: viewport.maxY - minHeight - 50
  };
}

/**
 * Quick helper to type a simple message on the canvas
 */
export async function typeSimpleMessage(
  editor: Editor,
  message: string,
  color: AITypingOptions['color'] = 'violet'
): Promise<TLShapeId> {
  const viewport = editor.getViewportPageBounds();
  
  // Find position
  const position = findEmptySpaceNear(
    editor,
    viewport.minX + 100,
    viewport.minY + 100,
    'auto'
  );

  return typeAIResponse(editor, {
    text: message,
    x: position.x,
    y: position.y,
    color,
    typingSpeed: 40,
    size: 'm'
  });
}

