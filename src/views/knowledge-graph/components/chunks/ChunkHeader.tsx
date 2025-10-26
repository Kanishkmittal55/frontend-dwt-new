import React from 'react';
import { Stack, Button, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  IconPlus,
  IconLink,
  IconRefresh,
  IconLayoutGrid,
  IconLayoutList
} from '@tabler/icons-react';

interface ChunkHeaderProps {
  viewMode: 'grid' | 'list';
  selectedCount: number;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onAddClick: () => void;
  onAssignClick: () => void;
  onRefresh: () => void;
}

export const ChunkHeader: React.FC<ChunkHeaderProps> = ({
  viewMode,
  selectedCount,
  onViewModeChange,
  onAddClick,
  onAssignClick,
  onRefresh
}) => {
  return (
    <Stack direction="row" spacing={1}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
        size="small"
      >
        <ToggleButton value="grid">
          <IconLayoutGrid size={18} />
        </ToggleButton>
        <ToggleButton value="list">
          <IconLayoutList size={18} />
        </ToggleButton>
      </ToggleButtonGroup>
      
      <Button
        variant="contained"
        startIcon={<IconPlus />}
        onClick={onAddClick}
        size="small"
      >
        Add Chunk
      </Button>
      
      {selectedCount > 0 && (
        <Button
          variant="outlined"
          startIcon={<IconLink />}
          onClick={onAssignClick}
          size="small"
        >
          Assign ({selectedCount})
        </Button>
      )}
      
      <IconButton onClick={onRefresh} size="small" color="primary">
        <IconRefresh />
      </IconButton>
    </Stack>
  );
};