/**
 * TrackList
 * Displays tracks for a pursuit with milestones and assets
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Collapse from '@mui/material/Collapse';
import Popper from '@mui/material/Popper';
import { useTheme, alpha } from '@mui/material/styles';
import { IconBook2, IconRocket, IconSearch, IconTrash, IconUpload, IconFile, IconChevronDown, IconChevronRight, IconCheck, IconAlertCircle, IconCopy } from '@tabler/icons-react';
import { TRACK_TYPE_LABELS } from '../constants';
import type { TrackWithMilestones } from '../hooks/usePursuits';
import type { PursuitTrackAssetResponse } from '@/api/founder';
import MilestoneList from './MilestoneList';

const TRACK_ICONS: Record<string, React.ReactNode> = {
  learn: <IconBook2 size={16} />,
  execute: <IconRocket size={16} />,
  discover: <IconSearch size={16} />
};

const ACCEPTED_ASSET_TYPES = '.pdf,.txt';

// TrackAssetsSection — expandable file list with delete + relevance toggle
function TrackAssetsSection({
  track,
  pursuitUUID,
  disabled,
  expanded,
  onToggleExpand,
  onDeleteAsset,
  onUpdateAssetRelevance
}: {
  track: TrackWithMilestones;
  pursuitUUID: string;
  disabled: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
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
}) {
  const assets = track.assets ?? [];
  const count = assets.length;

  return (
    <Box sx={{ pl: 3, py: 0.5 }}>
      <Button
        size="small"
        variant="text"
        onClick={onToggleExpand}
        startIcon={
          expanded ? (
            <IconChevronDown size={14} />
          ) : (
            <IconChevronRight size={14} />
          )
        }
        sx={{
          minWidth: 'auto',
          px: 0.5,
          py: 0.25,
          textTransform: 'none',
          color: 'text.secondary',
          fontSize: '0.75rem'
        }}
      >
        <IconFile size={14} style={{ marginRight: 4 }} />
        {count} file{count !== 1 ? 's' : ''}
      </Button>
      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
          {assets.map((a) => (
            <TrackAssetRow
              key={a.uuid ?? a.filename ?? a.asset_type ?? Math.random()}
              asset={a}
              pursuitUUID={pursuitUUID}
              trackUUID={track.uuid}
              disabled={disabled}
              onDelete={onDeleteAsset}
              onToggleRelevance={onUpdateAssetRelevance}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function TrackAssetRow({
  asset,
  pursuitUUID,
  trackUUID,
  disabled,
  onDelete,
  onToggleRelevance
}: {
  asset: PursuitTrackAssetResponse;
  pursuitUUID: string;
  trackUUID: string;
  disabled: boolean;
  onDelete?: (
    pursuitUUID: string,
    trackUUID: string,
    assetUUID: string
  ) => Promise<void>;
  onToggleRelevance?: (
    pursuitUUID: string,
    trackUUID: string,
    assetUUID: string,
    enabled: boolean
  ) => Promise<void>;
}) {
  const theme = useTheme();
  const uuid = asset.uuid ?? '';
  const filename = asset.filename ?? asset.asset_type ?? 'Asset';
  const relevance = asset.asset_relevance_enabled ?? false;
  const extractedText = asset.extracted_text?.trim() ?? '';
  const hasExtraction = extractedText.length > 0;

  const [extractionAnchor, setExtractionAnchor] = useState<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIconEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setExtractionAnchor(e.currentTarget);
  }, []);
  const handleIconLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setExtractionAnchor(null), 150);
  }, []);
  const handlePopoverEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);
  const handlePopoverLeave = useCallback(() => {
    setExtractionAnchor(null);
  }, []);

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  const handleCopyExtracted = useCallback(() => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setExtractionAnchor(null);
    }
  }, [extractedText]);

  if (!uuid) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        px: 1,
        borderRadius: 1,
        bgcolor: 'action.hover',
        '&:hover': { bgcolor: 'action.selected' }
      }}
    >
      <IconFile size={14} style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.8rem'
        }}
      >
        {filename}
      </Typography>
      <Tooltip title={hasExtraction ? 'Text extracted — hover to view' : 'Text extraction pending'}>
        <Box
          component="span"
          onMouseEnter={handleIconEnter}
          onMouseLeave={handleIconLeave}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: hasExtraction
              ? alpha('#1B5E20', 0.15)
              : alpha(theme.palette.warning.main, 0.12),
            color: hasExtraction ? '#1B5E20' : theme.palette.warning.main,
            cursor: 'default',
            flexShrink: 0
          }}
        >
          {hasExtraction ? <IconCheck size={12} /> : <IconAlertCircle size={12} />}
        </Box>
      </Tooltip>
      <Popper
        open={!!extractionAnchor}
        anchorEl={extractionAnchor}
        placement="top"
        modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
      >
        <Box
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
          sx={{
            p: 1.5,
            maxWidth: 320,
            maxHeight: 240,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            bgcolor: 'background.paper',
            overflow: 'hidden',
            zIndex: theme.zIndex.tooltip
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Extracted text
          </Typography>
          <Box
            sx={{
              maxHeight: 160,
              overflow: 'auto',
              py: 1,
              px: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              fontSize: '0.75rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace'
            }}
          >
            {hasExtraction ? extractedText : 'No text extracted yet.'}
          </Box>
          {hasExtraction && (
            <Button
              size="small"
              startIcon={<IconCopy size={14} />}
              onClick={handleCopyExtracted}
              sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem' }}
            >
              Copy
            </Button>
          )}
        </Box>
      </Popper>
      {!disabled && onToggleRelevance && (
        <Tooltip title={relevance ? 'Used for job matching' : 'Enable for job matching'}>
          <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <Switch
              size="small"
              checked={relevance}
              onChange={(e) =>
                onToggleRelevance(pursuitUUID, trackUUID, uuid, e.target.checked)
              }
              sx={{ '& .MuiSwitch-thumb': { width: 14, height: 14 }, '& .MuiSwitch-switchBase': { p: 0.5 } }}
            />
          </Box>
        </Tooltip>
      )}
      {!disabled && onDelete && (
        <Tooltip title="Delete file">
          <IconButton
            size="small"
            onClick={() => onDelete(pursuitUUID, trackUUID, uuid)}
            sx={{ color: 'error.main', p: 0.25 }}
          >
            <IconTrash size={14} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export interface TrackListProps {
  tracks: TrackWithMilestones[];
  pursuitUUID: string;
  userId?: number | null;
  onCompleteMilestone: (
    pursuitUUID: string,
    trackUUID: string,
    milestoneUUID: string
  ) => Promise<void>;
  onAddMilestone?: (track: TrackWithMilestones) => void;
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

export default function TrackList({
  tracks,
  pursuitUUID,
  userId,
  onCompleteMilestone,
  onAddMilestone,
  onDeleteTrack,
  onDeleteMilestone,
  onUploadAsset,
  onDeleteAsset,
  onUpdateAssetRelevance,
  disabled = false
}: TrackListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});

  const handleUploadClick = (trackUUID: string) => {
    if (!onUploadAsset || !userId) return;
    fileInputRef.current?.setAttribute('data-track-uuid', trackUUID);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const trackUUID = e.target.getAttribute('data-track-uuid');
    if (!file || !trackUUID || !onUploadAsset) return;
    e.target.value = '';
    e.target.removeAttribute('data-track-uuid');
    try {
      await onUploadAsset(pursuitUUID, trackUUID, file);
    } catch (err) {
      console.error('Asset upload failed:', err);
    }
  };

  if (!tracks?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        No tracks yet
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tracks.map((track) => {
        const Icon = TRACK_ICONS[track.track_type] ?? IconBook2;
        const label = TRACK_TYPE_LABELS[track.track_type] ?? track.track_type;
        const isActive = track.status === 'active';
        const isCompleted = track.status === 'completed';

        return (
          <Box
            key={track.uuid}
            sx={{
              borderLeft: 3,
              borderColor: isActive ? 'primary.main' : 'divider',
              pl: 2,
              py: 0.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                {Icon}
              </Box>
              <Typography
                variant="subtitle2"
                sx={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? 'text.secondary' : 'text.primary'
                }}
              >
                {label}: {track.title}
              </Typography>
              <Chip
                label={track.status}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize', height: 20 }}
              />
              {!disabled && onAddMilestone && (
                <Button
                  size="small"
                  variant="text"
                  sx={{ ml: 'auto', minWidth: 'auto', px: 1 }}
                  onClick={() => onAddMilestone(track)}
                >
                  + Milestone
                </Button>
              )}
              {!disabled && onUploadAsset && userId && (
                <Tooltip title="Upload resume, cover letter, or portfolio">
                  <IconButton
                    size="small"
                    onClick={() => handleUploadClick(track.uuid)}
                    sx={{ p: 0.25 }}
                  >
                    <IconUpload size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {!disabled && onDeleteTrack && (
                <Tooltip title="Delete track">
                  <IconButton
                    size="small"
                    onClick={() => onDeleteTrack(pursuitUUID, track.uuid)}
                    sx={{ color: 'error.main', p: 0.25 }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {track.assets && track.assets.length > 0 && (
              <TrackAssetsSection
                track={track}
                pursuitUUID={pursuitUUID}
                disabled={disabled}
                expanded={!!expandedAssets[track.uuid]}
                onToggleExpand={() =>
                  setExpandedAssets((prev) => ({
                    ...prev,
                    [track.uuid]: !prev[track.uuid]
                  }))
                }
                onDeleteAsset={onDeleteAsset}
                onUpdateAssetRelevance={onUpdateAssetRelevance}
              />
            )}
            <MilestoneList
              track={track}
              pursuitUUID={pursuitUUID}
              onCompleteMilestone={onCompleteMilestone}
              onDeleteMilestone={onDeleteMilestone}
              disabled={disabled}
            />
          </Box>
        );
      })}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_ASSET_TYPES}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Box>
  );
}
