/**
 * MilestoneList
 * Displays milestones for a track with complete/skip actions.
 * Click a milestone title to expand and view its description.
 */
import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { IconCircleCheck, IconCircle, IconTrash, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import type { TrackWithMilestones } from '../hooks/usePursuits';

export interface MilestoneListProps {
  track: TrackWithMilestones;
  pursuitUUID: string;
  onCompleteMilestone: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<void>;
  onDeleteMilestone?: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<void>;
  disabled?: boolean;
}

export default function MilestoneList({
  track,
  pursuitUUID,
  onCompleteMilestone,
  onDeleteMilestone,
  disabled = false
}: MilestoneListProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!track.milestones?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 4 }}>
        No milestones yet
      </Typography>
    );
  }

  return (
    <Box sx={{ pl: 4, mt: 0.5 }}>
      {track.milestones.map((m) => {
        const isCompleted = m.status === 'completed' || m.status === 'skipped';
        const isExpanded = expanded === m.uuid;
        const hasDescription = Boolean(m.description?.trim());
        return (
          <Box key={m.uuid} sx={{ py: 0.25 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <IconButton
                size="small"
                onClick={() =>
                  !isCompleted && !disabled
                    ? onCompleteMilestone(pursuitUUID, track.uuid, m.uuid)
                    : undefined
                }
                disabled={disabled || isCompleted}
                sx={{ p: 0.25 }}
              >
                {isCompleted ? (
                  <IconCircleCheck size={18} style={{ color: theme.palette.success.main }} />
                ) : (
                  <IconCircle size={18} />
                )}
              </IconButton>
              {hasDescription ? (
                <IconButton
                  size="small"
                  onClick={() => setExpanded(isExpanded ? null : m.uuid)}
                  sx={{ p: 0.25, color: 'text.secondary' }}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                </IconButton>
              ) : null}
              <Typography
                variant="body2"
                onClick={hasDescription ? () => setExpanded(isExpanded ? null : m.uuid) : undefined}
                sx={{
                  flex: 1,
                  cursor: hasDescription ? 'pointer' : 'default',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? 'text.secondary' : 'text.primary'
                }}
              >
                {m.title}
              </Typography>
              {!disabled && onDeleteMilestone && (
                <Tooltip title="Delete milestone">
                  <IconButton
                    size="small"
                    onClick={() => onDeleteMilestone(pursuitUUID, track.uuid, m.uuid)}
                    sx={{ color: 'error.main', p: 0.25 }}
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {isExpanded && m.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ pl: 5.5, mt: 0.5, whiteSpace: 'pre-wrap' }}
              >
                {m.description}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
