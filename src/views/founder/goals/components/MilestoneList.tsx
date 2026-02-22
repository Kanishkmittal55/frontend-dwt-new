/**
 * MilestoneList
 * Displays milestones for a track with complete/skip actions
 */
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { IconCircleCheck, IconCircle, IconTrash } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import type { Milestone } from '@/api/founder';
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
        return (
          <Box
            key={m.uuid}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.25
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
            <Typography
              variant="body2"
              sx={{
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
                  sx={{ color: 'error.main', p: 0.25, ml: 'auto' }}
                >
                  <IconTrash size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
