/**
 * useDiscoveries Hook
 * Fetches radar discovery items (job listings, etc.) for a pursuit
 */
import { useState, useCallback, useEffect } from 'react';
import {
  getDiscoveriesByPursuit,
  type RadarDiscoveryItem,
  type ScoreFilter
} from '@/api/founder';

export interface UseDiscoveriesOptions {
  userId: number | null;
  pursuitUUID: string | null;
  enabled?: boolean;
  /** When this changes, refetch (e.g. after crawl completes) */
  refreshTrigger?: number;
  /** Score filter: All / 7 / 8 / 9 (exact bucket, matches graph) */
  score?: ScoreFilter;
}

export interface UseDiscoveriesReturn {
  items: RadarDiscoveryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useDiscoveries({
  userId,
  pursuitUUID,
  enabled = true,
  refreshTrigger,
  score = 'all'
}: UseDiscoveriesOptions): UseDiscoveriesReturn {
  const [items, setItems] = useState<RadarDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscoveries = useCallback(async () => {
    if (!userId || !pursuitUUID) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getDiscoveriesByPursuit(userId, pursuitUUID, { score });
      setItems(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load discoveries';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, pursuitUUID, score]);

  useEffect(() => {
    if (enabled && userId && pursuitUUID) {
      fetchDiscoveries();
    } else {
      setItems([]);
      setError(null);
    }
  }, [enabled, userId, pursuitUUID, refreshTrigger, score, fetchDiscoveries]);

  return {
    items,
    loading,
    error,
    refetch: fetchDiscoveries
  };
}
