/**
 * useRadarRuns Hook
 * Fetches radar discovery runs for a track
 */
import { useState, useCallback, useEffect } from 'react';
import { getRadarRunsByTrack, type PursuitTrackRadarRunResponse } from '@/api/founder';
import { useDiscoveryLive } from '@/contexts/DiscoveryLiveContext';

export interface UseRadarRunsOptions {
  userId: number | null;
  pursuitUUID: string | null;
  trackUUID: string | null;
  enabled?: boolean;
  refreshTrigger?: number;
}

export interface UseRadarRunsReturn {
  runs: PursuitTrackRadarRunResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useRadarRuns({
  userId,
  pursuitUUID,
  trackUUID,
  enabled = true,
  refreshTrigger = 0
}: UseRadarRunsOptions): UseRadarRunsReturn {
  const [runs, setRuns] = useState<PursuitTrackRadarRunResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getRadarRunsRefreshTrigger } = useDiscoveryLive();
  const liveTrigger = pursuitUUID ? getRadarRunsRefreshTrigger(pursuitUUID) : 0;
  const effectiveTrigger = refreshTrigger || liveTrigger;

  const fetchRuns = useCallback(async () => {
    if (!userId || !pursuitUUID || !trackUUID) {
      setRuns([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRadarRunsByTrack(userId, pursuitUUID, trackUUID);
      setRuns(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load radar runs';
      setError(msg);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [userId, pursuitUUID, trackUUID]);

  useEffect(() => {
    if (!enabled || !userId || !pursuitUUID || !trackUUID) {
      setRuns([]);
      return;
    }
    fetchRuns();
  }, [enabled, userId, pursuitUUID, trackUUID, effectiveTrigger, fetchRuns]);

  return { runs, loading, error, refetch: fetchRuns };
}
