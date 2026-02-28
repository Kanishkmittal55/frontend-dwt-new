/**
 * DiscoverTrackMilestones
 * DAG-style dots view of discover track pipeline nodes (JobSpy, Workday, SmartExtract).
 * Reflects actual system behavior — data sources Run Radar touches.
 * Progress derived from latest radar run.
 */
import { useMemo, useSyncExternalStore } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import type { PursuitTrackRadarRunResponse } from '@/api/founder';
import { radarRunStreamStore, type RadarRunStreamEvent } from '@/stores/radarRunStreamStore';

const DEFAULT_SOURCES = ['jobspy', 'workday', 'smartextract'];

function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    jobspy: 'JobSpy',
    workday: 'Workday',
    smartextract: 'SmartExtract'
  };
  return labels[source.toLowerCase()] ?? source;
}

function formatWorkUnitKey(key: string): string {
  if (!key) return '';
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

function formatStreamEvent(e: RadarRunStreamEvent): string {
  if (e.work_unit_key) {
    return `${formatSourceLabel(e.source_site || 'workday')}: ${formatWorkUnitKey(e.work_unit_key)} — ${e.count} job${e.count !== 1 ? 's' : ''}`;
  }
  return `${formatSourceLabel(e.source_site || '')} — ${e.count} discover${e.count !== 1 ? 'ies' : 'y'}`;
}

export interface DiscoverTrackMilestonesProps {
  /** Latest radar run (most recent by enqueued_at) — progress from this run */
  latestRun?: PursuitTrackRadarRunResponse | null;
  loading?: boolean;
}

export default function DiscoverTrackMilestones({
  latestRun,
  loading = false
}: DiscoverTrackMilestonesProps) {
  const theme = useTheme();

  const allEvents = useSyncExternalStore(
    radarRunStreamStore.subscribe,
    radarRunStreamStore.getSnapshot,
    radarRunStreamStore.getSnapshot
  );
  const streamEvents = useMemo(() => {
    if (!latestRun?.uuid) return [];
    return allEvents.filter((e) => e.run_uuid === latestRun.uuid);
  }, [allEvents, latestRun?.uuid]);

  const sources = latestRun?.source_sites
    ? latestRun.source_sites.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_SOURCES;

  const completedCount = latestRun?.sources_completed_count ?? 0;
  const currentSource = (latestRun?.current_source_site ?? '').toLowerCase();
  const runStatus = latestRun?.run_status ?? 'enqueued';

  if (loading) {
    return (
      <Box sx={{ pl: 3, py: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: theme.palette.action.disabledBackground
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pl: 3, py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Pipeline
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
        {sources.map((source, idx) => {
          const isCompleted = idx < completedCount;
          const isCurrent =
            runStatus === 'running' &&
            idx === completedCount &&
            (currentSource === source || currentSource.includes(source));
          const isPending = !isCompleted && !isCurrent;

          return (
            <Box
              key={source}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <Tooltip
                title={
                  isCompleted
                    ? `${formatSourceLabel(source)} — completed`
                    : isCurrent
                      ? `${formatSourceLabel(source)} — running`
                      : `${formatSourceLabel(source)} — pending`
                }
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: isCompleted
                      ? theme.palette.success.main
                      : isCurrent
                        ? theme.palette.primary.main
                        : theme.palette.action.disabledBackground,
                    border:
                      isCurrent
                        ? `2px solid ${theme.palette.primary.dark}`
                        : 'none',
                    transition: 'background-color 0.2s, border 0.2s'
                  }}
                />
              </Tooltip>
              {idx < sources.length - 1 && (
                <Box
                  sx={{
                    width: 14,
                    height: 2,
                    bgcolor:
                      idx < completedCount
                        ? theme.palette.success.main
                        : theme.palette.action.disabledBackground
                  }}
                />
              )}
            </Box>
          );
        })}
        <Box
          component="span"
          sx={{
            ml: 1,
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}
        >
          {runStatus === 'completed'
            ? `${completedCount}/${sources.length} sources`
            : runStatus === 'cancelled'
              ? 'Cancelled'
              : runStatus === 'running'
                ? `${formatSourceLabel(currentSource || sources[completedCount] || '')}…`
                : 'Run Radar to start'}
        </Box>
      </Box>
      {runStatus === 'cancelled' && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
          Pipeline cancelled
        </Typography>
      )}
      {runStatus === 'running' && streamEvents.length > 0 && (
        <Box
          sx={{
            mt: 1,
            py: 0.5,
            px: 1,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {(() => {
              const last = streamEvents[streamEvents.length - 1]!;
              const total = last.total_crawled;
              return (
                <>
                  Live: {formatStreamEvent(last)}
                  {total != null && ` · ${total} discover${total !== 1 ? 'ies' : 'y'} so far`}
                </>
              );
            })()}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
