/**
 * ForgettingCurve — Per-concept R(t) over 30 days + 7-day projection
 * Uses recharts LineChart. Threshold line at 80%.
 */
import { useEffect, useState } from 'react';

// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';

import { getRetentionCurve } from 'api/founder/knowledgeAPI';
import type { RetentionCurveResponse } from 'api/founder/knowledgeAPI';

// ============================================================================
// Stable color palette for up to 20 concepts
// ============================================================================
const PALETTE = [
  '#1976d2', '#e53935', '#43a047', '#fb8c00', '#8e24aa',
  '#00acc1', '#d81b60', '#7cb342', '#f4511e', '#3949ab',
  '#00897b', '#c0ca33', '#5e35b1', '#039be5', '#e65100',
  '#6d4c41', '#546e7a', '#ad1457', '#00695c', '#ff6f00'
];

// ============================================================================
// Component
// ============================================================================
interface Props {
  courseUUID: string;
}

export default function ForgettingCurve({ courseUUID }: Props) {
  const [data, setData] = useState<RetentionCurveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCurves, setVisibleCurves] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getRetentionCurve(courseUUID);
        if (!cancelled) {
          setData(res);
          // Show all by default (cap at 10 for readability)
          setVisibleCurves(new Set(res.curves.slice(0, 10).map((c: any) => c.item_uuid)));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load retention curves');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseUUID]);

  if (loading) return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data || data.curves.length === 0) {
    return <Alert severity="info">No retention data available. Complete some reviews first.</Alert>;
  }

  // Build chart data: each row = { day, concept1retention, concept2retention, ... }
  // All curves should have the same day points, but be safe
  const allDays = new Set<number>();
  data.curves.forEach((c: any) => c.points.forEach((p: any) => allDays.add(p.days_from_review)));
  const sortedDays = [...allDays].sort((a, b) => a - b);

  const chartData = sortedDays.map((day) => {
    const row: Record<string, number> = { day };
    data.curves.forEach((curve: any) => {
      if (!visibleCurves.has(curve.item_uuid)) return;
      const pt = curve.points.find((p: any) => p.days_from_review === day);
      if (pt) row[curve.item_uuid] = Math.round(pt.retention * 100);
    });
    return row;
  });

  const toggleCurve = (uuid: string) => {
    setVisibleCurves((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Forgetting Curves
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Projected retention R(t) = e<sup>-t/S</sup> over 30 days. Threshold at 80%.
        </Typography>

        {/* Concept chips for toggling visibility */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {data.curves.map((curve: any, idx: number) => (
            <Chip
              key={curve.item_uuid}
              label={`${curve.item_title.slice(0, 20)}${curve.item_title.length > 20 ? '\u2026' : ''} (${Math.round(curve.current_retention * 100)}%)`}
              size="small"
              variant={visibleCurves.has(curve.item_uuid) ? 'filled' : 'outlined'}
              onClick={() => toggleCurve(curve.item_uuid)}
              sx={{
                bgcolor: visibleCurves.has(curve.item_uuid) ? PALETTE[idx % PALETTE.length] : 'transparent',
                color: visibleCurves.has(curve.item_uuid) ? '#fff' : 'text.primary',
                borderColor: PALETTE[idx % PALETTE.length],
                cursor: 'pointer',
                fontSize: 11,
                '&:hover': { opacity: 0.85 }
              }}
            />
          ))}
        </Box>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              label={{ value: 'Days from last review', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 11 }}
            />
            <RTooltip
              formatter={((value: number, name: string) => {
                const curve = data.curves.find((c: any) => c.item_uuid === name);
                return [`${value}%`, curve?.item_title ?? name];
              }) as any}
              labelFormatter={(label) => `Day ${label}`}
            />
            <ReferenceLine
              y={80}
              stroke="#ff5722"
              strokeDasharray="6 3"
              label={{ value: '80% threshold', position: 'right', fill: '#ff5722', fontSize: 11 }}
            />
            {data.curves
              .filter((c: any) => visibleCurves.has(c.item_uuid))
              .map((curve: any, idx: number) => (
                <Line
                  key={curve.item_uuid}
                  type="monotone"
                  dataKey={curve.item_uuid}
                  stroke={PALETTE[data.curves.indexOf(curve) % PALETTE.length] ?? '#1976d2'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

