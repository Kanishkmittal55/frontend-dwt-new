/**
 * useLearningItems Hook
 * Manages learning items (SM-2 spaced repetition) via WebSocket
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { founderAgentClient } from '@/api/founder/agentAPI';

// ============================================================================
// Types
// ============================================================================

export interface LearningItem {
  uuid: string;
  item_type: string;      // 'chapter' | 'concept' | 'exercise'
  item_id: string;        // 'clrs_ch2', 'merge_sort', 'ex_2.3-7'
  title?: string;
  ease_factor: number;
  repetition_count: number;
  interval_days: number;
  next_review_at?: string;
  last_reviewed_at?: string;
  last_quality?: number;
  total_reviews: number;
  is_due: boolean;
}

export interface LearningItemsResponse {
  items: LearningItem[];
  count: number;
  due_count?: number;
  item_type?: string;
  request_id?: string;
}

// SM-2 Quality Grades
export const SM2_GRADES = {
  COMPLETE_BLACKOUT: 0,      // Complete blackout
  INCORRECT_REMEMBERED: 1,   // Incorrect; but upon seeing the answer, remembered
  INCORRECT_EASY: 2,         // Incorrect; but answer seemed easy to recall
  CORRECT_DIFFICULTY: 3,     // Correct with serious difficulty
  CORRECT_HESITATION: 4,     // Correct after hesitation
  PERFECT: 5                 // Perfect response
} as const;

export type SM2Quality = typeof SM2_GRADES[keyof typeof SM2_GRADES];

// ============================================================================
// Hook
// ============================================================================

interface UseLearningItemsOptions {
  autoFetchDue?: boolean;
  onItemUpdated?: (item: LearningItem) => void;
}

export default function useLearningItems(options: UseLearningItemsOptions = {}) {
  const { autoFetchDue = true, onItemUpdated } = options;

  const [items, setItems] = useState<LearningItem[]>([]);
  const [dueItems, setDueItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pendingRequests = useRef<Map<string, (response: LearningItemsResponse | LearningItem) => void>>(new Map());

  // Generate request ID
  const generateId = () => crypto.randomUUID();

  // Listen for learning item messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'learning.items') {
          const payload = msg.payload as LearningItemsResponse;
          
          // Check if this is a response to a pending request
          if (payload.request_id && pendingRequests.current.has(payload.request_id)) {
            const resolver = pendingRequests.current.get(payload.request_id)!;
            resolver(payload);
            pendingRequests.current.delete(payload.request_id);
          }
          
          // Update state based on context
          if (payload.item_type) {
            // Filtered by type
            setItems(payload.items);
          } else if (payload.due_count !== undefined && payload.due_count === payload.count) {
            // Due items
            setDueItems(payload.items);
          } else {
            setItems(payload.items);
          }
        }
        
        if (msg.type === 'learning.item') {
          const item = msg.payload as LearningItem;
          
          // Update item in lists
          setItems(prev => {
            const idx = prev.findIndex(i => i.uuid === item.uuid);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = item;
              return updated;
            }
            return [...prev, item];
          });
          
          // Update due items
          setDueItems(prev => {
            if (item.is_due) {
              const idx = prev.findIndex(i => i.uuid === item.uuid);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = item;
                return updated;
              }
              return [...prev, item];
            } else {
              // Remove from due if no longer due
              return prev.filter(i => i.uuid !== item.uuid);
            }
          });
          
          // Callback
          onItemUpdated?.(item);
          
          // Resolve pending request
          const requestId = msg.id;
          if (pendingRequests.current.has(requestId)) {
            const resolver = pendingRequests.current.get(requestId)!;
            resolver(item);
            pendingRequests.current.delete(requestId);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    // Get the WebSocket from the client
    const ws = (founderAgentClient as any).ws;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [onItemUpdated]);

  // Fetch due items on mount
  useEffect(() => {
    if (autoFetchDue && founderAgentClient.isConnected) {
      fetchDueItems();
    }
  }, [autoFetchDue]);

  // Fetch due items
  const fetchDueItems = useCallback(async () => {
    if (!founderAgentClient.isConnected) {
      setError('Not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ws = (founderAgentClient as any).ws as WebSocket;
      const requestId = generateId();
      
      const message = {
        id: requestId,
        type: 'learning.get_due',
        payload: {}
      };
      
      // Wait for response
      await new Promise<LearningItemsResponse>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error('Request timeout'));
        }, 10000);
        
        pendingRequests.current.set(requestId, (response) => {
          clearTimeout(timeout);
          resolve(response as LearningItemsResponse);
        });
        
        ws.send(JSON.stringify(message));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch due items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch items by type
  const fetchItemsByType = useCallback(async (itemType: string) => {
    if (!founderAgentClient.isConnected) {
      setError('Not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ws = (founderAgentClient as any).ws as WebSocket;
      const requestId = generateId();
      
      const message = {
        id: requestId,
        type: 'learning.get_by_type',
        payload: { item_type: itemType }
      };
      
      ws.send(JSON.stringify(message));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create or get learning item
  const createItem = useCallback(async (itemType: string, itemId: string, title?: string): Promise<LearningItem | null> => {
    if (!founderAgentClient.isConnected) {
      setError('Not connected');
      return null;
    }

    try {
      const ws = (founderAgentClient as any).ws as WebSocket;
      const requestId = generateId();
      
      const message = {
        id: requestId,
        type: 'learning.create',
        payload: { item_type: itemType, item_id: itemId, title }
      };
      
      return await new Promise<LearningItem>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error('Request timeout'));
        }, 10000);
        
        pendingRequests.current.set(requestId, (response) => {
          clearTimeout(timeout);
          resolve(response as LearningItem);
        });
        
        ws.send(JSON.stringify(message));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      return null;
    }
  }, []);

  // Record review completion
  const recordReview = useCallback(async (itemType: string, itemId: string, quality: SM2Quality): Promise<LearningItem | null> => {
    if (!founderAgentClient.isConnected) {
      setError('Not connected');
      return null;
    }

    try {
      const ws = (founderAgentClient as any).ws as WebSocket;
      const requestId = generateId();
      
      const message = {
        id: requestId,
        type: 'learning.review',
        payload: { item_type: itemType, item_id: itemId, quality }
      };
      
      return await new Promise<LearningItem>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error('Request timeout'));
        }, 10000);
        
        pendingRequests.current.set(requestId, (response) => {
          clearTimeout(timeout);
          resolve(response as LearningItem);
        });
        
        ws.send(JSON.stringify(message));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record review');
      return null;
    }
  }, []);

  return {
    items,
    dueItems,
    loading,
    error,
    fetchDueItems,
    fetchItemsByType,
    createItem,
    recordReview,
    SM2_GRADES
  };
}

