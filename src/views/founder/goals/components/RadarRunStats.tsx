/**
 * RadarRunStats
 * Displays radar run statistics with expandable discovered items per run
 */
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import { useTheme, alpha } from '@mui/material/styles';
import { IconTrash, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import {
  getRadarRunDiscoveries,
  type PursuitTrackRadarRunResponse,
  type PursuitTrackRadarRunStatus,
  type RadarDiscoveryItem
} from '@/api/founder';
import { IconPlayerStop } from '@tabler/icons-react';

const STATUS_COLORS: Record<PursuitTrackRadarRunStatus, string> = {
  enqueued: 'info',
  running: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default'
} as const;

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

export interface RadarRunStatsProps {
  runs: PursuitTrackRadarRunResponse[];
  loading?: boolean;
  error?: string | null;
  onDeleteRun?: (runUUID: string) => Promise<void>;
  onCancelRun?: (runUUID: string) => Promise<void>;
  disabled?: boolean;
  userId?: number | null;
  pursuitUUID?: string;
  trackUUID?: string;
}

export default function RadarRunStats({
  runs,
  loading,
  error,
  onDeleteRun,
  onCancelRun,
  disabled = false,
  userId,
  pursuitUUID,
  trackUUID
}: RadarRunStatsProps) {
  const theme = useTheme();
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [discoveries, setDiscoveries] = useState<Record<string, RadarDiscoveryItem[]>>({});
  const [loadingDiscoveries, setLoadingDiscoveries] = useState<Record<string, boolean>>({});
  const [cancellingRun, setCancellingRun] = useState<string | null>(null);

  const handleCancelRun = async (runUUID: string) => {
    if (!onCancelRun || !runUUID) return;
    setCancellingRun(runUUID);
    console.log('[RadarRunStats] Cancel clicked', { runUUID });
    try {
      await onCancelRun(runUUID);
      console.log('[RadarRunStats] Cancel completed', { runUUID });
    } catch (err) {
      console.error('[RadarRunStats] Cancel failed', { runUUID, err });
    } finally {
      setCancellingRun(null);
    }
  };

  const handleToggleExpand = async (runUUID: string) => {
    if (expandedRun === runUUID) {
      setExpandedRun(null);
      return;
    }
    setExpandedRun(runUUID);
    if (discoveries[runUUID]) return;
    if (!userId || !pursuitUUID || !trackUUID) return;
    setLoadingDiscoveries((prev) => ({ ...prev, [runUUID]: true }));
    try {
      const items = await getRadarRunDiscoveries(userId, pursuitUUID, trackUUID, runUUID);
      setDiscoveries((prev) => ({ ...prev, [runUUID]: items }));
    } finally {
      setLoadingDiscoveries((prev) => ({ ...prev, [runUUID]: false }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.secondary">
          Loading runs…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!runs?.length) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No radar runs yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
      {runs.map((run) => {
        const status = (run.run_status ?? 'enqueued') as PursuitTrackRadarRunStatus;
        const color = STATUS_COLORS[status] ?? 'default';
        const ingested = run.ingested_count ?? 0;
        const crawled = run.total_crawled_count ?? 0;
        const sourcesDone = run.sources_completed_count ?? 0;
        const sourcesTotal = run.sources_total ?? 0;
        const runUUID = run.uuid ?? '';
        const isExpanded = expandedRun === runUUID;
        const items = discoveries[runUUID] ?? [];
        const isLoadingItems = loadingDiscoveries[runUUID];
        const canExpand = !!runUUID && !!userId && !!pursuitUUID && !!trackUUID && ingested > 0;

        return (
          <Box
            key={run.uuid ?? run.created_at ?? Math.random()}
            sx={{
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.75,
                px: 1
              }}
            >
              {canExpand && (
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(runUUID)}
                  sx={{ p: 0.25 }}
                >
                  {isExpanded ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                </IconButton>
              )}
              <Chip
                label={status}
                size="small"
                color={color as 'info' | 'warning' | 'success' | 'error' | 'default'}
                sx={{ textTransform: 'capitalize', height: 20, minWidth: 72 }}
              />
              <Typography variant="caption" color="text.secondary">
                {ingested} ingested · {crawled} crawled
                {sourcesTotal > 0 && ` · ${sourcesDone}/${sourcesTotal} sources`}
              </Typography>
              {run.current_source_site && status === 'running' && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {run.current_source_site}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {formatDate(run.enqueued_at ?? run.created_at)}
              </Typography>
              {!disabled && status === 'running' && onCancelRun && run.uuid && (
                <Tooltip title="Cancel run">
                  <IconButton
                    size="small"
                    onClick={() => handleCancelRun(run.uuid!)}
                    disabled={cancellingRun === run.uuid}
                    sx={{ color: 'warning.main', p: 0.25 }}
                  >
                    <IconPlayerStop size={14} />
                  </IconButton>
                </Tooltip>
              )}
              {!disabled && onDeleteRun && run.uuid && (
                <Tooltip title="Delete run">
                  <IconButton
                    size="small"
                    onClick={() => onDeleteRun(run.uuid!)}
                    sx={{ color: 'error.main', p: 0.25 }}
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Collapse in={isExpanded}>
              <Box sx={{ px: 2, pb: 1.5, pt: 0 }}>
                {isLoadingItems ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">
                      Loading discoveries…
                    </Typography>
                  </Box>
                ) : items.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No unique items in this run
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {items.map((item) => (
                      <Box
                        key={item.uuid ?? item.title ?? Math.random()}
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: 0.5,
                          bgcolor: alpha(theme.palette.background.paper, 0.5)
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {item.title ?? 'Untitled'}
                        </Typography>
                        {item.source_site && (
                          <Typography variant="caption" color="text.secondary">
                            {item.source_site}
                          </Typography>
                        )}
                        {item.source_url && (
                          <Link
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{ display: 'block', mt: 0.25 }}
                          >
                            View job
                          </Link>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}
