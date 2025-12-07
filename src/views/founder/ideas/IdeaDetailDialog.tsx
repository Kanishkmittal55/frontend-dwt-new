/**
 * Idea Detail Dialog
 * 
 * Full-screen dialog showing complete idea information with tabs:
 * - Overview: Basic info, description, problem statement
 * - Fit Analysis: Founder fit score breakdown, feasibility scores
 * - Market Data: Enrichment data, competitors, market size
 * - SWOT: Strengths, Weaknesses, Opportunities, Threats (from enrichment)
 * 
 * Includes review form with decision dropdown and notes
 */
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';

import {
  IconX,
  IconBulb,
  IconChartRadar,
  IconWorld,
  IconTarget,
  IconCheck,
  IconAlertTriangle,
  IconTrendingUp,
  IconShieldCheck,
  IconUsers,
  IconCoin,
  IconCode,
  IconClock,
  IconCalendar,
  IconExternalLink
} from '@tabler/icons-react';

import EnrichmentStatusBadge from './components/EnrichmentStatusBadge';
import FitScoreRadar, { FitScoreBreakdown } from './components/FitScoreRadar';
import { submitReview, isReviewable, getFitScoreColor } from 'api/founder/ideasAPI';
import { getStoredUserId } from 'api/founder/founderClient';
import type { IdeaResponse, ReviewDecision } from 'api/founder/schemas';

// ============================================================================
// Types
// ============================================================================

interface IdeaDetailDialogProps {
  open: boolean;
  idea: IdeaResponse | null;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

// ============================================================================
// Tab Panel Component
// ============================================================================

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// ============================================================================
// Score Bar Component
// ============================================================================

function ScoreBar({ label, value, maxValue = 10, icon }: {
  label: string;
  value: number | null | undefined;
  maxValue?: number;
  icon?: React.ReactNode;
}) {
  const score = value ?? 0;
  const percentage = (score / maxValue) * 100;
  const color = score >= 7 ? 'success' : score >= 4 ? 'warning' : 'error';

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="body2">{label}</Typography>
        </Box>
        <Typography variant="body2" fontWeight="bold">
          {value !== null && value !== undefined ? `${score}/${maxValue}` : 'N/A'}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function IdeaDetailDialog({
  open,
  idea,
  onClose,
  onReviewSubmitted
}: IdeaDetailDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision | ''>('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canReview = idea ? isReviewable(idea) : false;

  // Reset form when dialog opens with new idea
  const handleClose = useCallback(() => {
    setActiveTab(0);
    setReviewDecision('');
    setReviewNotes('');
    setSubmitError(null);
    onClose();
  }, [onClose]);

  // Submit review
  const handleSubmitReview = useCallback(async () => {
    if (!idea || !reviewDecision) return;

    const userId = getStoredUserId();
    if (!userId) {
      setSubmitError('User not authenticated');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitReview(userId, idea.uuid, reviewDecision, reviewNotes || undefined);
      handleClose();
      onReviewSubmitted();
    } catch (err) {
      const error = err as Error;
      setSubmitError(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }, [idea, reviewDecision, reviewNotes, handleClose, onReviewSubmitted]);

  if (!idea) return null;

  // Extract enrichment data safely
  const enrichment = idea.enrichment_data || {};
  const swot = enrichment.swot as { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] } | undefined;
  const marketAnalysis = enrichment.market_analysis as Record<string, unknown> | undefined;
  const competitors = idea.competitors || [];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh', maxHeight: '90vh' }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <IconBulb size={24} />
              <Typography variant="h4" component="span">
                {idea.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <EnrichmentStatusBadge stage={idea.workflow_stage} />
              {idea.industry && (
                <Chip label={idea.industry} size="small" variant="outlined" />
              )}
              {idea.founder_fit_score !== null && idea.founder_fit_score !== undefined && (
                <Chip
                  label={`Fit: ${idea.founder_fit_score}%`}
                  size="small"
                  color={getFitScoreColor(idea.founder_fit_score) as 'success' | 'warning' | 'error' | 'default'}
                />
              )}
              {idea.priority && (
                <Chip label={`Priority: ${idea.priority}`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <IconX size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<IconBulb size={18} />} label="Overview" iconPosition="start" />
          <Tab icon={<IconChartRadar size={18} />} label="Fit Analysis" iconPosition="start" />
          <Tab icon={<IconWorld size={18} />} label="Market Data" iconPosition="start" />
          <Tab icon={<IconTarget size={18} />} label="SWOT" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        {/* Tab: Overview */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {idea.description}
              </Typography>

              {idea.problem_statement && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Problem Statement</Typography>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                    {idea.problem_statement}
                  </Typography>
                </>
              )}

              {idea.unique_value_proposition && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Unique Value Proposition</Typography>
                  <Typography variant="body1" paragraph>
                    {idea.unique_value_proposition}
                  </Typography>
                </>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Quick Info
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <IconUsers size={18} />
                    <Typography variant="body2">
                      <strong>Target:</strong> {idea.target_audience || 'Not specified'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <IconCoin size={18} />
                    <Typography variant="body2">
                      <strong>Market Size:</strong> {idea.market_size || 'Not analyzed'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <IconCalendar size={18} />
                    <Typography variant="body2">
                      <strong>Created:</strong> {new Date(idea.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {idea.enriched_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <IconClock size={18} />
                      <Typography variant="body2">
                        <strong>Enriched:</strong> {new Date(idea.enriched_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                  {idea.review_decision && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Chip
                        label={`Reviewed: ${idea.review_decision}`}
                        color={
                          idea.review_decision === 'approved' ? 'success' :
                          idea.review_decision === 'rejected' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                      {idea.review_notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {idea.review_notes}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab: Fit Analysis */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Radar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Fit Score Breakdown</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <FitScoreRadar
                      fitData={idea.founder_fit_explanation as {
                        skill_match?: number;
                        time_match?: number;
                        budget_match?: number;
                        risk_match?: number;
                        overall?: number;
                      } | null}
                      overallScore={idea.founder_fit_score}
                      size="medium"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Score Breakdown Bars */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Detailed Breakdown</Typography>
                  <Box sx={{ mt: 2 }}>
                    <FitScoreBreakdown
                      fitData={idea.founder_fit_explanation as {
                        skill_match?: number;
                        time_match?: number;
                        budget_match?: number;
                        risk_match?: number;
                      } | null}
                    />
                  </Box>
                  {idea.founder_fit_score !== null && idea.founder_fit_score !== undefined && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Overall Fit Score
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            color: getFitScoreColor(idea.founder_fit_score) + '.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {idea.founder_fit_score}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Feasibility Scores</Typography>
                  <Box sx={{ mt: 2 }}>
                    <ScoreBar
                      label="Technical Feasibility"
                      value={idea.technical_feasibility}
                      icon={<IconCode size={18} />}
                    />
                    <ScoreBar
                      label="Market Feasibility"
                      value={idea.market_feasibility}
                      icon={<IconTrendingUp size={18} />}
                    />
                    <ScoreBar
                      label="Financial Feasibility"
                      value={idea.financial_feasibility}
                      icon={<IconCoin size={18} />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {idea.historical_validation && Object.keys(idea.historical_validation).length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Historical Validation</Typography>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(idea.historical_validation, null, 2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab: Market Data */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {/* Market Size */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Market Size</Typography>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {idea.market_size || 'Not analyzed'}
                  </Typography>
                  {marketAnalysis && (
                    <Typography variant="body2" color="text.secondary">
                      {typeof marketAnalysis === 'string'
                        ? marketAnalysis
                        : JSON.stringify(marketAnalysis, null, 2)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Competitors */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Competitors</Typography>
                  {competitors.length > 0 ? (
                    <List dense>
                      {competitors.map((comp, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <IconExternalLink size={16} />
                          </ListItemIcon>
                          <ListItemText
                            primary={typeof comp === 'string' ? comp : (comp as { name?: string }).name || `Competitor ${idx + 1}`}
                            secondary={typeof comp === 'object' ? (comp as { url?: string }).url : undefined}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No competitors identified yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* External References */}
            {idea.external_references && idea.external_references.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>External References</Typography>
                    <List dense>
                      {idea.external_references.map((ref, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={typeof ref === 'string' ? ref : JSON.stringify(ref)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Raw Enrichment Data */}
            {Object.keys(enrichment).length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Additional Enrichment Data</Typography>
                    <Box
                      component="pre"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        maxHeight: 300
                      }}
                    >
                      {JSON.stringify(enrichment, null, 2)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab: SWOT */}
        <TabPanel value={activeTab} index={3}>
          {swot ? (
            <Grid container spacing={2}>
              {/* Strengths */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ bgcolor: 'success.lighter', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconShieldCheck size={20} color="green" />
                      <Typography variant="h6" color="success.dark">Strengths</Typography>
                    </Box>
                    {swot.strengths && swot.strengths.length > 0 ? (
                      <List dense>
                        {swot.strengths.map((item, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <IconCheck size={16} color="green" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not analyzed</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Weaknesses */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ bgcolor: 'error.lighter', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconAlertTriangle size={20} color="red" />
                      <Typography variant="h6" color="error.dark">Weaknesses</Typography>
                    </Box>
                    {swot.weaknesses && swot.weaknesses.length > 0 ? (
                      <List dense>
                        {swot.weaknesses.map((item, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <IconX size={16} color="red" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not analyzed</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Opportunities */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ bgcolor: 'info.lighter', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconTrendingUp size={20} color="blue" />
                      <Typography variant="h6" color="info.dark">Opportunities</Typography>
                    </Box>
                    {swot.opportunities && swot.opportunities.length > 0 ? (
                      <List dense>
                        {swot.opportunities.map((item, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <IconTrendingUp size={16} color="blue" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not analyzed</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Threats */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ bgcolor: 'warning.lighter', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconAlertTriangle size={20} color="orange" />
                      <Typography variant="h6" color="warning.dark">Threats</Typography>
                    </Box>
                    {swot.threats && swot.threats.length > 0 ? (
                      <List dense>
                        {swot.threats.map((item, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <IconAlertTriangle size={16} color="orange" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not analyzed</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              SWOT analysis will be available after enrichment completes.
            </Alert>
          )}
        </TabPanel>
      </DialogContent>

      {/* Review Actions */}
      <Divider />
      <DialogActions sx={{ p: 2, flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ width: '100%' }}>
            {submitError}
          </Alert>
        )}

        {canReview ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Decision</InputLabel>
              <Select
                value={reviewDecision}
                label="Decision"
                onChange={(e) => setReviewDecision(e.target.value as ReviewDecision)}
                disabled={submitting}
              >
                <MenuItem value="approved">✅ Approve</MenuItem>
                <MenuItem value="rejected">❌ Reject</MenuItem>
                <MenuItem value="deferred">⏸️ Defer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Review Notes (optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              size="small"
              multiline
              maxRows={2}
              sx={{ flex: 1 }}
              disabled={submitting}
            />

            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={!reviewDecision || submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : <IconCheck size={18} />}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              {idea.review_decision
                ? `Already reviewed: ${idea.review_decision}`
                : idea.workflow_stage === 'pending_enrichment'
                  ? 'Waiting for enrichment to complete before review'
                  : 'This idea cannot be reviewed yet'}
            </Typography>
            <Button onClick={handleClose} color="inherit">
              Close
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}

