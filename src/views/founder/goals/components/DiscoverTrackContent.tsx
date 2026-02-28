/**
 * DiscoverTrackContent
 * Radar runs section for a discover track: pipeline dots + run stats + Open Dashboard
 */
import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { cancelRadarRun } from '@/api/founder';
import useRadarRuns from '../hooks/useRadarRuns';
import DiscoverTrackMilestones from './DiscoverTrackMilestones';
import RadarRunStats from './RadarRunStats';

export interface DiscoverTrackContentProps {
  pursuitUUID: string;
  trackUUID: string;
  userId: number | null;
  onDeleteRadarRun?: (
    pursuitUUID: string,
    trackUUID: string,
    runUUID: string
  ) => Promise<void>;
  onOpenDashboard?: (pursuitUUID: string) => void;
  disabled?: boolean;
}

export default function DiscoverTrackContent({
  pursuitUUID,
  trackUUID,
  userId,
  onDeleteRadarRun,
  onOpenDashboard,
  disabled = false
}: DiscoverTrackContentProps) {
  const { runs, loading, error, refetch } = useRadarRuns({
    userId,
    pursuitUUID,
    trackUUID,
    enabled: !!userId && !!pursuitUUID && !!trackUUID
  });

  const latestRun = useMemo(() => {
    if (!runs?.length) return null;
    return [...runs].sort(
      (a, b) =>
        new Date(b.enqueued_at || b.created_at || 0).getTime() -
        new Date(a.enqueued_at || a.created_at || 0).getTime()
    )[0];
  }, [runs]);

  const handleDeleteRun = async (runUUID: string) => {
    if (onDeleteRadarRun) {
      await onDeleteRadarRun(pursuitUUID, trackUUID, runUUID);
      refetch();
    }
  };

  const handleCancelRun = async (runUUID: string) => {
    if (!userId) return;
    console.log('[DiscoverTrackContent] Cancelling run', { pursuitUUID, trackUUID, runUUID });
    await cancelRadarRun(userId, pursuitUUID, trackUUID, runUUID);
    await refetch();
    console.log('[DiscoverTrackContent] Run cancelled, refetched', { runUUID });
  };

  return (
    <Box sx={{ pl: 3, mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
      <DiscoverTrackMilestones
        latestRun={latestRun}
        loading={loading}
      />
      {onOpenDashboard && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <Button
            size="small"
            variant="text"
            sx={{ minWidth: 'auto', px: 0.5, textTransform: 'none' }}
            onClick={() => onOpenDashboard(pursuitUUID)}
          >
            Open Dashboard
          </Button>
        </Box>
      )}
      <RadarRunStats
        runs={runs}
        loading={loading}
        error={error}
        onDeleteRun={handleDeleteRun}
        onCancelRun={handleCancelRun}
        disabled={disabled}
        userId={userId ?? undefined}
        pursuitUUID={pursuitUUID}
        trackUUID={trackUUID}
      />
    </Box>
  );
}
