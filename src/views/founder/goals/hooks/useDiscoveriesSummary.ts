/**
 * useDiscoveriesSummary Hook
 * Fetches radar discovery summary (dashboard stats) for a pursuit
 */
import { useState, useCallback, useEffect } from 'react';
import { getDiscoveriesSummary, type RadarDiscoverySummaryResponse } from '@/api/founder';

export interface UseDiscoveriesSummaryOptions {
  userId: number | null;
  pursuitUUID: string | null;
  enabled?: boolean;
  /** When this changes, refetch (e.g. after crawl completes) */
  refreshTrigger?: number;
}

export interface UseDiscoveriesSummaryReturn {
  summary: RadarDiscoverySummaryResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useDiscoveriesSummary({
  userId,
  pursuitUUID,
  enabled = true,
  refreshTrigger
}: UseDiscoveriesSummaryOptions): UseDiscoveriesSummaryReturn {
  const [summary, setSummary] = useState<RadarDiscoverySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId || !pursuitUUID) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getDiscoveriesSummary(userId, pursuitUUID);
      setSummary(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load discovery summary';
      setError(msg);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId, pursuitUUID]);

  useEffect(() => {
    if (enabled && userId && pursuitUUID) {
      fetchSummary();
    } else {
      setSummary(null);
      setError(null);
    }
  }, [enabled, userId, pursuitUUID, refreshTrigger, fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
}
