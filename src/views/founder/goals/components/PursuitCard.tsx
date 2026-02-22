/**
 * PursuitCard
 * Single pursuit summary with phase stepper, tracks, and radar discoveries
 */
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { IconDotsVertical } from '@tabler/icons-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { GOAL_TYPE_LABELS } from '../constants';
import type { Pursuit } from '@/api/founder';
import type { PursuitWithTracks, TrackWithMilestones } from '../hooks/usePursuits';
import PhaseStepper from './PhaseStepper';
import TrackList from './TrackList';
import DiscoveryList from './DiscoveryList';
import useDiscoveries from '../hooks/useDiscoveries';
import type { GoalType } from '@/api/founder/schemas';

export interface PursuitCardProps {
  pursuit: PursuitWithTracks;
  userId?: number | null;
  refreshTrigger?: number;
  onUpdatePhase?: (pursuitUUID: string, phase: string) => Promise<void>;
  onCompletePursuit?: (pursuitUUID: string) => Promise<void>;
  onDeletePursuit?: (pursuitUUID: string) => Promise<void>;
  onCompleteMilestone: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<void>;
  onAddTrack?: (pursuit: PursuitWithTracks) => void;
  onAddMilestone?: (pursuit: PursuitWithTracks, track: TrackWithMilestones) => void;
  onDeleteTrack?: (pursuitUUID: string, trackUUID: string) => Promise<void>;
  onDeleteMilestone?: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<void>;
  onUploadAsset?: (
    pursuitUUID: string,
    trackUUID: string,
    file: File
  ) => Promise<void>;
  onDeleteAsset?: (
    pursuitUUID: string,
    trackUUID: string,
    assetUUID: string
  ) => Promise<void>;
  onUpdateAssetRelevance?: (
    pursuitUUID: string,
    trackUUID: string,
    assetUUID: string,
    enabled: boolean
  ) => Promise<void>;
  disabled?: boolean;
}

export default function PursuitCard({
  pursuit,
  userId,
  refreshTrigger,
  onUpdatePhase,
  onCompletePursuit,
  onDeletePursuit,
  onCompleteMilestone,
  onAddTrack,
  onAddMilestone,
  onDeleteTrack,
  onDeleteMilestone,
  onUploadAsset,
  onDeleteAsset,
  onUpdateAssetRelevance,
  disabled = false
}: PursuitCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { items: discoveries, loading: discoveriesLoading, error: discoveriesError } = useDiscoveries({
    userId: userId ?? null,
    pursuitUUID: pursuit.uuid,
    enabled: !!userId,
    refreshTrigger
  });
  const goalLabel = GOAL_TYPE_LABELS[pursuit.goal_type as GoalType] ?? pursuit.goal_type;
  const isActive = pursuit.status === 'active';
  const isCompleted = pursuit.status === 'completed';

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleComplete = async () => {
    if (onCompletePursuit) {
      await onCompletePursuit(pursuit.uuid);
    }
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (onDeletePursuit) {
      await onDeletePursuit(pursuit.uuid);
    }
    handleCloseMenu();
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" component="div">
              {pursuit.title}
            </Typography>
            <Chip
              label={goalLabel}
              size="small"
              sx={{ mt: 0.5, textTransform: 'capitalize' }}
            />
            {!isCompleted && (
              <Chip
                label={pursuit.status}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5, ml: 0.5, textTransform: 'capitalize' }}
              />
            )}
          </Box>
          {!disabled && (onCompletePursuit || onDeletePursuit) && (
            <>
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <IconDotsVertical size={18} />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {!isCompleted && onCompletePursuit && (
                  <MenuItem onClick={handleComplete}>
                    <ListItemIcon>
                      <IconCheck size={18} />
                    </ListItemIcon>
                    Mark Complete
                  </MenuItem>
                )}
                {onDeletePursuit && (
                  <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <IconTrash size={18} />
                    </ListItemIcon>
                    Delete
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>

        {!isCompleted && isActive && (
          <Box sx={{ mt: 1.5, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Phase
            </Typography>
            <PhaseStepper
              goalType={pursuit.goal_type as GoalType}
              currentPhase={pursuit.phase}
            />
          </Box>
        )}

        {pursuit.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {pursuit.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Tracks
          </Typography>
          {!disabled && !isCompleted && onAddTrack && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onAddTrack?.(pursuit)}
            >
              + Add Track
            </Button>
          )}
        </Box>
        <TrackList
          tracks={pursuit.tracks ?? []}
          pursuitUUID={pursuit.uuid}
          userId={userId}
          onCompleteMilestone={onCompleteMilestone}
          onAddMilestone={onAddMilestone ? (t) => onAddMilestone(pursuit, t) : undefined}
          onDeleteTrack={onDeleteTrack}
          onDeleteMilestone={onDeleteMilestone}
          onUploadAsset={onUploadAsset}
          onDeleteAsset={onDeleteAsset}
          onUpdateAssetRelevance={onUpdateAssetRelevance}
          disabled={disabled}
        />
        <DiscoveryList
          items={discoveries}
          loading={discoveriesLoading}
          error={discoveriesError}
          showEmptyState={pursuit.goal_type === 'job_search'}
        />
      </CardContent>
    </Card>
  );
}
