/**
 * Domain Knowledge Metrics Dialog
 * Shows last assessment metrics: overall score, coverage, per-concept scores, duration, hints.
 */
import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import CloseIcon from '@mui/icons-material/Close';

import { getDomainKnowledgeMetrics } from 'api/founder/knowledgeAPI';
import type { DomainKnowledgeMetricsResponse } from 'api/founder/knowledgeAPI';

interface DomainKnowledgeMetricsDialogProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  domainName: string;
  userId?: number;
}

export default function DomainKnowledgeMetricsDialog({
  open,
  onClose,
  slug,
  domainName,
  userId
}: DomainKnowledgeMetricsDialogProps) {
  const [metrics, setMetrics] = useState<DomainKnowledgeMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slug) return;
    setMetrics(null);
    setError(null);
    if (!userId) {
      setMetrics({});
      return;
    }
    setLoading(true);
    getDomainKnowledgeMetrics(slug, userId)
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, [open, slug, userId]);

  const hasData =
    metrics &&
    (metrics.overall_score_pct != null ||
      metrics.coverage_pct != null ||
      (metrics.concept_scores && metrics.concept_scores.length > 0));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" component="span">
          {domainName} — Last Assessment Metrics
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!userId && (
          <Alert severity="info">Log in to see your assessment metrics.</Alert>
        )}
        {userId && loading && (
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        )}
        {userId && error && (
          <Alert severity="error">{error}</Alert>
        )}
        {userId && !loading && !error && !hasData && !metrics?.inference_error && (
          <Typography color="text.secondary">
            No assessment completed yet. Complete a test to see inferred metrics.
          </Typography>
        )}
        {userId && metrics?.inference_error && (
          <Alert severity="warning">
            Inference failed: {metrics.inference_error}
          </Alert>
        )}
        {userId && hasData && !metrics?.inference_error && (
          <Box>
            <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
              {metrics.overall_score_pct != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Overall score</Typography>
                  <Typography variant="h5">{metrics.overall_score_pct}%</Typography>
                </Box>
              )}
              {metrics.coverage_pct != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Coverage</Typography>
                  <Typography variant="h5">{metrics.coverage_pct}%</Typography>
                </Box>
              )}
              {metrics.duration_sec != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography variant="h5">{Math.floor(metrics.duration_sec / 60)}m {metrics.duration_sec % 60}s</Typography>
                </Box>
              )}
              {metrics.hints_used != null && metrics.hints_used > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Hints used</Typography>
                  <Typography variant="h5">{metrics.hints_used}</Typography>
                </Box>
              )}
            </Box>
            {metrics.concept_scores && metrics.concept_scores.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Per-concept scores</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Concept</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell>Justification</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.concept_scores.map((cs, i) => (
                      <TableRow key={i}>
                        <TableCell>{cs.concept_slug ?? '-'}</TableCell>
                        <TableCell align="right">{cs.score ?? '-'}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>{cs.justification ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
