/**
 * Enrichment Report Card
 * Displays full enrichment results: scores, facts, recommendations
 */
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';

import { 
  IconChevronDown, 
  IconCheck, 
  IconAlertTriangle, 
  IconInfoCircle,
  IconExternalLink,
  IconBulb,
  IconScale,
  IconChartBar,
  IconUser,
  IconClock
} from '@tabler/icons-react';

import { getEnrichmentResult, interpretFitScore } from '@/api/founder/enrichmentAPI';
import type { EnrichmentResult, FitScore, EnrichmentFact } from '@/api/founder/schemas';

interface EnrichmentReportCardProps {
  ideaUUID: string;
  /** Pre-loaded result (skip fetch) */
  result?: EnrichmentResult;
}

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  legal: <IconScale size={18} />,
  market: <IconChartBar size={18} />,
  founder: <IconUser size={18} />,
  competitor: <IconChartBar size={18} />,
  trend: <IconClock size={18} />,
  default: <IconInfoCircle size={18} />
};

export default function EnrichmentReportCard({ ideaUUID, result: preloadedResult }: EnrichmentReportCardProps) {
  const [result, setResult] = useState<EnrichmentResult | null>(preloadedResult ?? null);
  const [loading, setLoading] = useState(!preloadedResult);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preloadedResult) return;

    async function fetchResult() {
      try {
        setLoading(true);
        const data = await getEnrichmentResult(ideaUUID);
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load enrichment');
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [ideaUUID, preloadedResult]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="rounded" height={100} sx={{ mt: 2 }} />
          <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!result) {
    return (
      <Alert severity="info">
        No enrichment data available yet.
      </Alert>
    );
  }

  const compositeScore = result.composite_score;
  const interpretation = interpretFitScore(compositeScore);
  const facts = result.facts ?? [];
  const blockers = result.blockers ?? [];
  const warnings = result.warnings ?? [];
  const recommendations = result.recommendations ?? [];
  const scores = result.scores ?? [];

  return (
    <Card>
      <CardContent>
        {/* Header with composite score */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Enrichment Report</Typography>
          {compositeScore !== null && compositeScore !== undefined && (
            <Tooltip title={interpretation.description}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: interpretation.color + '20',
                  border: `1px solid ${interpretation.color}`
                }}
              >
                <Typography variant="h5" sx={{ color: interpretation.color, fontWeight: 'bold' }}>
                  {compositeScore}
                </Typography>
                <Box>
                  <Typography variant="caption" sx={{ color: interpretation.color, display: 'block' }}>
                    {interpretation.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fit Score
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Blockers - high priority */}
        {blockers.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⛔ Blockers Found
            </Typography>
            <List dense disablePadding>
              {blockers.map((blocker, idx) => (
                <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                  <ListItemText primary={blocker} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ Warnings
            </Typography>
            <List dense disablePadding>
              {warnings.map((warning, idx) => (
                <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Fit Scores by dimension */}
        {scores.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
              <Typography variant="subtitle1">Fit Scores by Dimension</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {scores.map((score, idx) => (
                  <ScoreBar key={idx} score={score} />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconBulb size={18} />
                <Typography variant="subtitle1">Recommendations</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {recommendations.map((rec, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <IconCheck size={16} color="green" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Facts/Research */}
        {facts.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
              <Typography variant="subtitle1">Research Facts ({facts.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {facts.map((fact, idx) => (
                  <FactItem key={idx} fact={fact} />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Temporal info */}
        {(result.trend_ttl_days || result.opportunity_window) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {result.trend_ttl_days && (
              <Chip
                size="small"
                icon={<IconClock size={14} />}
                label={`Trend TTL: ${result.trend_ttl_days} days`}
                variant="outlined"
              />
            )}
            {result.opportunity_window && (
              <Chip
                size="small"
                label={`Window: ${result.opportunity_window}`}
                variant="outlined"
                color="info"
              />
            )}
          </Box>
        )}

        {/* Metadata */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Tokens: {result.tokens_used?.toLocaleString() ?? '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Duration: {result.duration_ms ? `${(result.duration_ms / 1000).toFixed(1)}s` : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Threads: {result.thread_count ?? '-'}
          </Typography>
          {result.partial && (
            <Chip size="small" label="Partial" color="warning" variant="outlined" />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ScoreBar({ score }: { score: FitScore }) {
  const interpretation = interpretFitScore(score.score);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {score.dimension}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ color: interpretation.color, fontWeight: 'bold' }}>
            {score.score}
          </Typography>
          {score.confidence !== undefined && (
            <Typography variant="caption" color="text.secondary">
              ({Math.round(score.confidence * 100)}% conf)
            </Typography>
          )}
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score.score}
        sx={{
          height: 6,
          borderRadius: 1,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
            bgcolor: interpretation.color
          }
        }}
      />
      {score.explanation && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {score.explanation}
        </Typography>
      )}
    </Box>
  );
}

function FactItem({ fact }: { fact: EnrichmentFact }) {
  const icon = CATEGORY_ICONS[fact.category] || CATEGORY_ICONS.default;
  
  return (
    <ListItem alignItems="flex-start" sx={{ py: 1 }}>
      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={fact.content}
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip 
              size="small" 
              label={fact.category} 
              variant="outlined" 
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
            {fact.source && (
              <Typography variant="caption" color="text.secondary">
                Source: {fact.source}
              </Typography>
            )}
            {fact.source_url && (
              <Link 
                href={fact.source_url} 
                target="_blank" 
                rel="noopener"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <IconExternalLink size={12} />
              </Link>
            )}
            {fact.confidence !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {Math.round(fact.confidence * 100)}% conf
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );
}

