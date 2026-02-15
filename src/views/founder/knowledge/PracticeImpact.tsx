/**
 * PracticeImpact — Per-Concept Deep Dive
 * Route: /knowledge/concept/:uuid
 *
 * Shows: review history timeline, speed improvement (time_to_reveal_ms trend),
 *        confidence arc, mastery badge.
 *
 * Requires a courseUUID. Since the URL is /knowledge/concept/:uuid we need
 * to know which course it belongs to. The KnowledgeDashboard passes the
 * selected course via query param ?course=<uuid>.
 */
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import { getPracticeImpact } from 'api/founder/knowledgeAPI';
import type { PracticeImpactResponse } from 'api/founder/knowledgeAPI';

// ============================================================================
// Mastery helpers
// ============================================================================
const MASTERY_COLORS: Record<string, string> = {
  new: '#ef5350',
  learning: '#ffa726',
  mastered: '#66bb6a',
  graduated: '#42a5f5'
};

const MASTERY_EMOJI: Record<string, string> = {
  new: '\uD83D\uDD34',
  learning: '\uD83D\uDFE1',
  mastered: '\uD83D\uDFE2',
  graduated: '\uD83D\uDC8E'
};

// ============================================================================
// Component
// ============================================================================
export default function PracticeImpact() {
  const { uuid: itemUUID } = useParams<{ uuid: string }>();
  const [searchParams] = useSearchParams();
  const courseUUID = searchParams.get('course') ?? '';
  const navigate = useNavigate();

  const [data, setData] = useState<PracticeImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemUUID || !courseUUID) {
      setError('Missing course or concept UUID');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getPracticeImpact(courseUUID, itemUUID);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load practice data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseUUID, itemUUID]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!data) return null;

  // Speed chart data (time_to_reveal_ms per session)
  const speedData = data.sessions
    .filter((s: any) => s.time_to_reveal_ms != null)
    .map((s: any, idx: number) => ({
      session: idx + 1,
      ms: s.time_to_reveal_ms!,
      date: new Date(s.started_at).toLocaleDateString()
    }));

  // Confidence chart data
  const confData = (data.confidence_trend ?? []).map((t: any) => ({
    date: t.date ?? '',
    confidence: t.avg_confidence != null ? Math.round(t.avg_confidence * 100) / 100 : 0,
    sessions: t.session_count ?? 0
  }));

  const masColor = MASTERY_COLORS[data.current_mastery_state] ?? '#999';

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {MASTERY_EMOJI[data.current_mastery_state] ?? ''} {data.item_title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              label={data.current_mastery_state}
              size="small"
              sx={{ bgcolor: masColor, color: '#fff', textTransform: 'capitalize', fontWeight: 600 }}
            />
            <Chip
              label={`${Math.round(data.current_retention * 100)}% retention`}
              size="small"
              variant="outlined"
            />
            <Chip label={`${data.total_sessions} sessions`} size="small" variant="outlined" />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Speed improvement chart */}
        {speedData.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Reveal Speed (ms)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Time to reveal answer — lower is better
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={speedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" label={{ value: 'Session #', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip
                      formatter={((val: number) => [`${val} ms`, 'Reveal time']) as any}
                      labelFormatter={(label) => `Session ${label}`}
                    />
                    <Bar dataKey="ms" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Confidence arc */}
        {confData.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Confidence Trend
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Average self-assessed confidence over time
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={confData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <RTooltip />
                    <Line type="monotone" dataKey="confidence" stroke="#43a047" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Review history table */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Review History
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Quality</TableCell>
                      <TableCell>Reveal (ms)</TableCell>
                      <TableCell>Conf. Before</TableCell>
                      <TableCell>Conf. After</TableCell>
                      <TableCell>Hint?</TableCell>
                      <TableCell>Gave up?</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.sessions.map((s: any, idx: number) => (
                      <TableRow key={s.session_uuid}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{new Date(s.started_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {s.quality_rating != null ? qualityBadge(s.quality_rating) : '—'}
                        </TableCell>
                        <TableCell>{s.time_to_reveal_ms ?? '—'}</TableCell>
                        <TableCell>{s.confidence_before?.toFixed(1) ?? '—'}</TableCell>
                        <TableCell>{s.confidence_after?.toFixed(1) ?? '—'}</TableCell>
                        <TableCell>{s.hint_requested ? 'Yes' : '—'}</TableCell>
                        <TableCell>{s.gave_up ? 'Yes' : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {data.sessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No review sessions recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function qualityBadge(q: number): string {
  if (q >= 4) return `\u2B50 ${q}`; // ⭐
  if (q >= 3) return `\u2705 ${q}`; // ✅
  if (q >= 2) return `\u26A0\uFE0F ${q}`; // ⚠️
  return `\u274C ${q}`; // ❌
}

