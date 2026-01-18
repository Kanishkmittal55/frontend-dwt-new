/**
 * Idea Card
 * Displays a single idea with summary info and quick actions
 * Supports live SSE enrichment updates
 */
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { IconEye, IconCheck, IconX, IconClock } from '@tabler/icons-react';
import EnrichmentStatusBadge from './EnrichmentStatusBadge';
import EnrichmentProgress from './EnrichmentProgress';
import { isReviewable, isEnriching, getFitScoreColor } from '@/api/founder/ideasAPI';
import type { IdeaResponse } from '@/api/founder/schemas';

interface IdeaCardProps {
  idea: IdeaResponse;
  onView: (idea: IdeaResponse) => void;
  onApprove?: (idea: IdeaResponse) => void;
  onReject?: (idea: IdeaResponse) => void;
  onDefer?: (idea: IdeaResponse) => void;
  /** Enable live SSE updates for enrichment progress */
  enableLiveUpdates?: boolean;
  /** Callback when enrichment completes */
  onEnrichmentComplete?: (idea: IdeaResponse) => void;
}

export default function IdeaCard({
  idea,
  onView,
  onApprove,
  onReject,
  onDefer,
  enableLiveUpdates = false,
  onEnrichmentComplete
}: IdeaCardProps) {
  const canReview = isReviewable(idea);
  const isCurrentlyEnriching = isEnriching(idea);
  const fitScore = idea.founder_fit_score;
  const fitScoreColor = getFitScoreColor(fitScore);
  
  // Show live progress if enriching and live updates enabled
  const showLiveProgress = enableLiveUpdates && isCurrentlyEnriching;

  // Truncate description
  const truncatedDesc = idea.description.length > 150
    ? idea.description.substring(0, 150) + '...'
    : idea.description;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* Header with status and fit score */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          {showLiveProgress ? (
            <EnrichmentProgress 
              ideaUUID={idea.uuid} 
              compact 
              onComplete={() => onEnrichmentComplete?.(idea)}
            />
          ) : (
            <EnrichmentStatusBadge stage={idea.workflow_stage} />
          )}
          {fitScore !== null && fitScore !== undefined && (
            <Tooltip title={`Fit Score: ${fitScore}%`}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: fitScoreColor,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              >
                {fitScore}
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Title */}
        <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
          {idea.title}
        </Typography>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {truncatedDesc}
        </Typography>

        {/* Industry chip */}
        {idea.industry && (
          <Chip 
            size="small" 
            label={idea.industry} 
            variant="outlined"
            sx={{ mr: 1, mb: 1 }}
          />
        )}

        {/* Feasibility scores if available */}
        {(idea.technical_feasibility || idea.market_feasibility || idea.financial_feasibility) && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {idea.technical_feasibility && (
              <Chip 
                size="small" 
                label={`Tech: ${idea.technical_feasibility}/10`}
                color={idea.technical_feasibility >= 7 ? 'success' : idea.technical_feasibility >= 4 ? 'warning' : 'error'}
                variant="outlined"
              />
            )}
            {idea.market_feasibility && (
              <Chip 
                size="small" 
                label={`Market: ${idea.market_feasibility}/10`}
                color={idea.market_feasibility >= 7 ? 'success' : idea.market_feasibility >= 4 ? 'warning' : 'error'}
                variant="outlined"
              />
            )}
            {idea.financial_feasibility && (
              <Chip 
                size="small" 
                label={`Finance: ${idea.financial_feasibility}/10`}
                color={idea.financial_feasibility >= 7 ? 'success' : idea.financial_feasibility >= 4 ? 'warning' : 'error'}
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<IconEye size={16} />}
          onClick={() => onView(idea)}
        >
          View Details
        </Button>

        {canReview && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onApprove && (
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => onApprove(idea)}
                >
                  <IconCheck size={18} />
                </IconButton>
              </Tooltip>
            )}
            {onDefer && (
              <Tooltip title="Defer">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => onDefer(idea)}
                >
                  <IconClock size={18} />
                </IconButton>
              </Tooltip>
            )}
            {onReject && (
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onReject(idea)}
                >
                  <IconX size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardActions>
    </Card>
  );
}
























