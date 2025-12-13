/**
 * Enrichment Progress
 * Real-time progress indicator using SSE
 * Shows current thread, progress bar, and ETA
 */
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';

import { IconLoader2, IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import { useEnrichmentUpdates } from '@/hooks/useEnrichmentStream';
import { getEnrichmentStateLabel, getEnrichmentStateColor } from '@/api/founder/enrichmentAPI';
import type { EnrichmentState } from '@/api/founder/schemas';

interface EnrichmentProgressProps {
  ideaUUID: string;
  /** Compact mode for card view */
  compact?: boolean;
  /** Callback when enrichment completes */
  onComplete?: () => void;
}

// Thread icons
const THREAD_ICONS: Record<string, string> = {
  legal: '⚖️',
  market: '📊',
  founder: '👤',
  technical: '⚙️',
  financial: '💰',
  aggregating: '🔄'
};

export default function EnrichmentProgress({
  ideaUUID,
  compact = false,
  onComplete
}: EnrichmentProgressProps) {
  const { status, streamState, error, isStreaming } = useEnrichmentUpdates(ideaUUID, {
    onComplete: () => onComplete?.()
  });

  // Loading state
  if (streamState === 'connecting' && !status) {
    return compact ? (
      <Skeleton variant="rounded" width={100} height={24} />
    ) : (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rounded" height={8} sx={{ mt: 1 }} />
      </Box>
    );
  }

  // Error state
  if (error && !status) {
    return compact ? (
      <Chip size="small" label="Error" color="error" variant="outlined" />
    ) : (
      <Alert severity="error" sx={{ py: 0.5 }}>
        Failed to load enrichment status
      </Alert>
    );
  }

  // No status yet
  if (!status) {
    return compact ? (
      <Chip size="small" label="Pending" color="default" variant="outlined" />
    ) : (
      <Typography variant="body2" color="text.secondary">
        Waiting for enrichment to start...
      </Typography>
    );
  }

  const state = status.state as EnrichmentState;
  const progressPct = status.progress_pct;
  const currentThread = status.current_thread;
  const threadsCompleted = status.threads_completed;
  const threadsTotal = status.threads_total;

  // Compact mode - just a chip with progress
  if (compact) {
    return (
      <Tooltip title={`${getEnrichmentStateLabel(state)} - ${progressPct}%`}>
        <Chip
          size="small"
          icon={getStateIcon(state)}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {currentThread && THREAD_ICONS[currentThread]}
              {progressPct}%
            </Box>
          }
          color={getEnrichmentStateColor(state)}
          variant={state === 'completed' ? 'filled' : 'outlined'}
        />
      </Tooltip>
    );
  }

  // Full mode - detailed progress
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStateIcon(state)}
          <Typography variant="subtitle2">
            {getEnrichmentStateLabel(state)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {threadsCompleted}/{threadsTotal} threads
        </Typography>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progressPct}
        sx={{
          height: 8,
          borderRadius: 1,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
            bgcolor: getProgressColor(state)
          }
        }}
      />

      {/* Current thread info */}
      {currentThread && isActiveState(state) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {THREAD_ICONS[currentThread] || '🔍'} Analyzing {currentThread}...
          </Typography>
        </Box>
      )}

      {/* Estimated completion */}
      {status.estimated_completion && isActiveState(state) && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          ETA: {formatETA(status.estimated_completion)}
        </Typography>
      )}

      {/* Error message */}
      {status.error && (
        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
          {status.error}
        </Alert>
      )}

      {/* Streaming indicator */}
      {isStreaming && isActiveState(state) && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          🔴 Live updates
        </Typography>
      )}
    </Box>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getStateIcon(state: EnrichmentState) {
  switch (state) {
    case 'completed':
      return <IconCheck size={16} color="green" />;
    case 'failed':
      return <IconX size={16} color="red" />;
    case 'blocked':
      return <IconAlertTriangle size={16} color="orange" />;
    default:
      return <IconLoader2 size={16} className="animate-spin" />;
  }
}

function getProgressColor(state: EnrichmentState): string {
  switch (state) {
    case 'completed':
      return '#4caf50'; // green
    case 'failed':
      return '#f44336'; // red
    case 'blocked':
      return '#ff9800'; // orange
    default:
      return '#2196f3'; // blue
  }
}

function isActiveState(state: EnrichmentState): boolean {
  return ['queued', 'processing', 'legal', 'market', 'founder', 'aggregating'].includes(state);
}

function formatETA(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'any moment';
    
    const diffMin = Math.ceil(diffMs / 60000);
    if (diffMin < 60) return `~${diffMin} min`;
    
    const diffHrs = Math.ceil(diffMin / 60);
    return `~${diffHrs} hr`;
  } catch {
    return 'soon';
  }
}

