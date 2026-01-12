/**
 * Enrichment Status Badge
 * Visual indicator for idea workflow_stage
 */
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { getWorkflowStageColor, getIdeaStatusLabel } from '@/api/founder/ideasAPI';
import type { WorkflowStage } from '@/api/founder/schemas';

interface EnrichmentStatusBadgeProps {
  stage: WorkflowStage;
  size?: 'small' | 'medium';
}

export default function EnrichmentStatusBadge({ stage, size = 'small' }: EnrichmentStatusBadgeProps) {
  const isProcessing = stage === 'enriching' || stage === 'analyzing' || stage === 'pending_enrichment';
  const label = getIdeaStatusLabel({ workflow_stage: stage } as any);
  const color = getWorkflowStageColor(stage);

  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isProcessing && <CircularProgress size={12} color="inherit" />}
          {label}
        </Box>
      }
      color={color}
      variant={stage === 'ready_for_review' ? 'filled' : 'outlined'}
    />
  );
}























