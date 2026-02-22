/**
 * usePursuits Hook
 * Fetches pursuits, tracks, and milestones via HTTP API
 */
import { useState, useCallback, useEffect } from 'react';
import {
  getPursuits,
  getTracksByPursuit,
  getTrackAssets,
  getMilestonesByTrack,
  createPursuit,
  createTrack,
  createMilestone,
  updatePursuitPhase,
  completePursuit,
  completeMilestone,
  deletePursuit,
  deleteTrack,
  deleteMilestone,
  type Pursuit,
  type Track,
  type Milestone,
  type PursuitTrackAssetResponse,
  type CreatePursuitRequest,
  type CreateTrackRequest,
  type CreateMilestoneRequest
} from '@/api/founder';

// ============================================================================
// Types
// ============================================================================

export interface PursuitWithTracks extends Pursuit {
  tracks: TrackWithMilestones[];
}

export interface TrackWithMilestones extends Track {
  milestones: Milestone[];
  assets: PursuitTrackAssetResponse[];
}

export interface UsePursuitsOptions {
  userId: number | null;
  autoFetch?: boolean;
}

export interface UsePursuitsReturn {
  pursuits: Pursuit[];
  pursuitsWithTracks: PursuitWithTracks[];
  activePursuit: Pursuit | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPursuit: (params: CreatePursuitRequest) => Promise<Pursuit>;
  createTrack: (pursuitUUID: string, params: CreateTrackRequest) => Promise<Track>;
  createMilestone: (
    pursuitUUID: string,
    trackUUID: string,
    params: CreateMilestoneRequest
  ) => Promise<Milestone>;
  updatePhase: (pursuitUUID: string, phase: string) => Promise<Pursuit>;
  completePursuit: (pursuitUUID: string) => Promise<Pursuit>;
  completeMilestone: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<Milestone>;
  deletePursuit: (pursuitUUID: string) => Promise<void>;
  deleteTrack: (pursuitUUID: string, trackUUID: string) => Promise<void>;
  deleteMilestone: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<void>;
  updateAssetFromApiResponse: (asset: PursuitTrackAssetResponse) => void;
}

// ============================================================================
// Hook
// ============================================================================

export default function usePursuits({
  userId,
  autoFetch = true
}: UsePursuitsOptions): UsePursuitsReturn {
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [pursuitsWithTracks, setPursuitsWithTracks] = useState<PursuitWithTracks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePursuit = pursuits.find((p) => p.status === 'active') ?? null;

  const fetchPursuits = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getPursuits(userId);
      setPursuits(response.items);

      // Fetch tracks and milestones for each pursuit
      const withTracks: PursuitWithTracks[] = await Promise.all(
        response.items.map(async (p) => {
          const tracks = await getTracksByPursuit(userId, p.uuid);
          const tracksWithMilestones: TrackWithMilestones[] = await Promise.all(
            tracks.map(async (t) => {
              const [milestones, assets] = await Promise.all([
                getMilestonesByTrack(userId, p.uuid, t.uuid),
                getTrackAssets(userId, p.uuid, t.uuid)
              ]);
              return { ...t, milestones, assets };
            })
          );
          return { ...p, tracks: tracksWithMilestones };
        })
      );
      setPursuitsWithTracks(withTracks);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load pursuits';
      setError(msg);
      setPursuits([]);
      setPursuitsWithTracks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchPursuits();
    }
  }, [userId, autoFetch, fetchPursuits]);

  const handleCreatePursuit = useCallback(
    async (params: CreatePursuitRequest) => {
      if (!userId) throw new Error('User not authenticated');
      const p = await createPursuit(userId, params);
      await fetchPursuits();
      return p;
    },
    [userId, fetchPursuits]
  );

  const handleCreateTrack = useCallback(
    async (pursuitUUID: string, params: CreateTrackRequest) => {
      if (!userId) throw new Error('User not authenticated');
      const t = await createTrack(userId, pursuitUUID, params);
      await fetchPursuits();
      return t;
    },
    [userId, fetchPursuits]
  );

  const handleCreateMilestone = useCallback(
    async (
      pursuitUUID: string,
      trackUUID: string,
      params: CreateMilestoneRequest
    ) => {
      if (!userId) throw new Error('User not authenticated');
      const m = await createMilestone(userId, pursuitUUID, trackUUID, params);
      await fetchPursuits();
      return m;
    },
    [userId, fetchPursuits]
  );

  const handleUpdatePhase = useCallback(
    async (pursuitUUID: string, phase: string) => {
      if (!userId) throw new Error('User not authenticated');
      const p = await updatePursuitPhase(userId, pursuitUUID, phase);
      await fetchPursuits();
      return p;
    },
    [userId, fetchPursuits]
  );

  const handleCompletePursuit = useCallback(
    async (pursuitUUID: string) => {
      if (!userId) throw new Error('User not authenticated');
      const p = await completePursuit(userId, pursuitUUID);
      await fetchPursuits();
      return p;
    },
    [userId, fetchPursuits]
  );

  const handleCompleteMilestone = useCallback(
    async (
      pursuitUUID: string,
      trackUUID: string,
      milestoneUUID: string
    ) => {
      if (!userId) throw new Error('User not authenticated');
      const m = await completeMilestone(
        userId,
        pursuitUUID,
        trackUUID,
        milestoneUUID
      );
      await fetchPursuits();
      return m;
    },
    [userId, fetchPursuits]
  );

  const handleDeletePursuit = useCallback(
    async (pursuitUUID: string) => {
      if (!userId) throw new Error('User not authenticated');
      await deletePursuit(userId, pursuitUUID);
      await fetchPursuits();
    },
    [userId, fetchPursuits]
  );

  const handleDeleteTrack = useCallback(
    async (pursuitUUID: string, trackUUID: string) => {
      if (!userId) throw new Error('User not authenticated');
      await deleteTrack(userId, pursuitUUID, trackUUID);
      await fetchPursuits();
    },
    [userId, fetchPursuits]
  );

  const handleDeleteMilestone = useCallback(
    async (pursuitUUID: string, trackUUID: string, milestoneUUID: string) => {
      if (!userId) throw new Error('User not authenticated');
      await deleteMilestone(userId, pursuitUUID, trackUUID, milestoneUUID);
      await fetchPursuits();
    },
    [userId, fetchPursuits]
  );

  const updateAssetFromApiResponse = useCallback((asset: PursuitTrackAssetResponse) => {
    const assetUUID = asset.uuid;
    const trackUUID = asset.track_uuid;
    setPursuitsWithTracks((prev) =>
      prev.map((p) => {
        const hasTrack = p.tracks.some((t) => t.uuid === trackUUID);
        if (!hasTrack) return p;
        return {
          ...p,
          tracks: p.tracks.map((t) => {
            if (t.uuid !== trackUUID) return t;
            return {
              ...t,
              assets: (t.assets ?? []).map((a) =>
                a.uuid === assetUUID ? { ...a, ...asset } : a
              )
            };
          })
        };
      })
    );
  }, []);

  return {
    pursuits,
    pursuitsWithTracks,
    activePursuit,
    loading,
    error,
    refetch: fetchPursuits,
    createPursuit: handleCreatePursuit,
    createTrack: handleCreateTrack,
    createMilestone: handleCreateMilestone,
    updatePhase: handleUpdatePhase,
    completePursuit: handleCompletePursuit,
    completeMilestone: handleCompleteMilestone,
    deletePursuit: handleDeletePursuit,
    deleteTrack: handleDeleteTrack,
    deleteMilestone: handleDeleteMilestone,
    updateAssetFromApiResponse
  };
}
