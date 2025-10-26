import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { IconAlertCircle } from '@tabler/icons-react';
import { ChunkUtils } from '../../../utilities/chunk.utils';
import { Chunk, Workspace } from '../../../../types/chunk-ui';

interface OverlapIndicatorProps {
  chunk: Chunk;
  allChunks: Chunk[];
}

export const OverlapIndicator: React.FC<OverlapIndicatorProps> = ({ chunk, allChunks }) => {
  const overlaps = ChunkUtils.detectOverlaps(chunk, allChunks);
  
  if (overlaps.length === 0) return null;
  
  return (
    <Tooltip title={`Overlaps with ${overlaps.length} other chunk(s)`}>
      <Chip
        icon={<IconAlertCircle size={14} />}
        label={`${overlaps.length} overlaps`}
        size="small"
        color="warning"
        variant="outlined"
        sx={{ 
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.6 },
            '100%': { opacity: 1 }
          }
        }}
      />
    </Tooltip>
  );
};