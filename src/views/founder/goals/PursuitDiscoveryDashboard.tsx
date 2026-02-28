/**
 * PursuitDiscoveryDashboard
 * ApplyPilot-style dashboard for a job-search pursuit's discoveries
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTheme, alpha } from '@mui/material/styles';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip
} from 'recharts';
import type { ScoreFilter } from '@/api/founder';
import { useAuth } from '@/contexts/AuthContext';
import MainCard from '@/ui-component/cards/MainCard';
import useDiscoveriesSummary from './hooks/useDiscoveriesSummary';
import useDiscoveries from './hooks/useDiscoveries';
import DiscoveryList from './components/DiscoveryList';
import { useDiscoveryLive, useDiscoveryRefreshTrigger } from '@/contexts/DiscoveryLiveContext';
import useFounderAgent from '@/hooks/useFounderAgent';

export default function PursuitDiscoveryDashboard() {
  const { pursuitUUID } = useParams<{ pursuitUUID: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { userId } = useAuth();
  const { invalidateDiscoveries } = useDiscoveryLive();
  const liveRefreshTrigger = useDiscoveryRefreshTrigger(pursuitUUID ?? null);
  const [score, setScore] = useState<ScoreFilter>('all');

  const handleRadarDiscoveryIngested = useCallback(
    (uuid: string) => invalidateDiscoveries(uuid),
    [invalidateDiscoveries]
  );

  useFounderAgent({
    autoConnect: true,
    onRadarDiscoveryIngested: handleRadarDiscoveryIngested
  });

  const { summary, loading: summaryLoading, error: summaryError } = useDiscoveriesSummary({
    userId: userId ?? null,
    pursuitUUID: pursuitUUID ?? null,
    enabled: !!userId && !!pursuitUUID,
    refreshTrigger: liveRefreshTrigger
  });

  const { items: discoveries, loading: discoveriesLoading, error: discoveriesError } = useDiscoveries({
    userId: userId ?? null,
    pursuitUUID: pursuitUUID ?? null,
    enabled: !!userId && !!pursuitUUID,
    refreshTrigger: liveRefreshTrigger,
    score
  });

  const handleBack = () => navigate('/founder/mission');

  if (!pursuitUUID || !userId) {
    return (
      <Box>
        <Alert severity="info">Select a pursuit from Mission to view its discovery dashboard.</Alert>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Mission
        </Button>
      </Box>
    );
  }

  if (summaryError) {
    return (
      <Box>
        <Alert severity="error">{summaryError}</Alert>
        <Button startIcon={<IconArrowLeft size={18} />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Mission
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<IconArrowLeft size={18} />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Mission
      </Button>

      <MainCard title="Discovery Dashboard" sx={{ mb: 2 }}>
        {summaryLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">Loading…</Typography>
          </Box>
        ) : summary ? (
          <>
            {/* Top row: Total Jobs, Scored by LLM, Strong Fit, Discoveries (filter + dots) */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Total Jobs
                    </Typography>
                    <Typography variant="h4">{summary.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.info.main, 0.04) }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Scored by LLM
                    </Typography>
                    <Typography variant="h4">{summary.scored}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Strong Fit (7+)
                    </Typography>
                    <Typography variant="h4">{summary.strong_fit_7_plus}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="score-filter-label">Score filter</InputLabel>
                        <Select
                          labelId="score-filter-label"
                          value={score}
                          label="Score filter"
                          onChange={(e) => {
                            const v = e.target.value;
                            setScore(v === 'all' ? 'all' : (Number(v) as 7 | 8 | 9));
                          }}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value={7}>7</MenuItem>
                          <MenuItem value={8}>8</MenuItem>
                          <MenuItem value={9}>9</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <DiscoveryList
                      items={discoveries}
                      loading={discoveriesLoading}
                      error={discoveriesError}
                      showEmptyState
                      dotSize={14}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* By Source */}
            {summary.by_source?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  By Source
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {summary.by_source.map((s) => (
                    <Card key={s.source_site} variant="outlined" sx={{ minWidth: 160 }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="subtitle2">{s.source_site}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {s.count} jobs · {s.strong_fit_count} strong fit
                          {s.avg_score != null ? ` · avg ${(s.avg_score * 100).toFixed(0)}%` : ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {/* Score Distribution */}
            {summary.score_distribution?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Score Distribution
                </Typography>
                <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Box sx={{ width: 560, maxWidth: '100%', aspectRatio: '560/293' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={summary.score_distribution.map((d) => ({
                            score: String(d.score),
                            count: d.count
                          }))}
                          margin={{ top: 12, right: 16, left: 24, bottom: 24 }}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                          <XAxis
                            dataKey="score"
                            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                            label={{
                              value: 'Score',
                              position: 'insideBottom',
                              offset: -4,
                              style: { fontSize: 11, fill: theme.palette.text.secondary }
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                            label={{
                              value: 'Count',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -8,
                              style: { fontSize: 11, fill: theme.palette.text.secondary }
                            }}
                          />
                          <Tooltip
                            formatter={(value: number) => [value, 'Count']}
                            labelFormatter={(label) => `Score ${label}`}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 8
                            }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                            {summary.score_distribution.map((d, idx) => (
                              <Cell
                                key={d.score}
                                fill={
                                  d.score >= 7
                                    ? theme.palette.success.main
                                    : d.score >= 5
                                      ? theme.palette.warning.main
                                      : theme.palette.error.main
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </>
        ) : null}
      </MainCard>
    </Box>
  );
}
