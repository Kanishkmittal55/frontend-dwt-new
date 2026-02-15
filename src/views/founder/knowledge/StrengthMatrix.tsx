/**
 * StrengthMatrix — Module × Concept retention heatmap
 * Rows = modules, Columns = concepts, Cell = retention_pct color
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';

import { getStrengthMatrix } from 'api/founder/knowledgeAPI';
import type { StrengthMatrixResponse } from 'api/founder/knowledgeAPI';

// ============================================================================
// Color scale for retention (0 → red, 0.5 → yellow, 1 → green)
// ============================================================================
function retentionColor(value: number): string {
  if (value >= 0.8) return '#2e7d32'; // dark green
  if (value >= 0.6) return '#66bb6a'; // light green
  if (value >= 0.4) return '#ffa726'; // amber
  if (value >= 0.2) return '#ef6c00'; // dark orange
  return '#c62828';                    // red
}

function masteryBadge(state?: string): string {
  switch (state) {
    case 'graduated': return '\uD83D\uDC8E'; // 💎
    case 'mastered': return '\uD83D\uDFE2';   // 🟢
    case 'learning': return '\uD83D\uDFE1';   // 🟡
    case 'new': return '\uD83D\uDD34';         // 🔴
    default: return '';
  }
}

// ============================================================================
// Component
// ============================================================================
interface Props {
  courseUUID: string;
}

export default function StrengthMatrix({ courseUUID }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<StrengthMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getStrengthMatrix(courseUUID);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load strength matrix');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseUUID]);

  if (loading) return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data || data.concepts.length === 0) {
    return <Alert severity="info">No concept data available for this course.</Alert>;
  }

  // Build lookup: moduleUUID-itemUUID → cell
  const cellMap = new Map<string, typeof data.cells[number]>();
  for (const cell of data.cells) {
    cellMap.set(`${cell.module_uuid}-${cell.item_uuid}`, cell);
  }

  const modules = [...data.modules].sort((a, b) => (a.module_order ?? 0) - (b.module_order ?? 0));

  return (
    <Card variant="outlined">
      <CardContent sx={{ overflowX: 'auto' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Strength Matrix
        </Typography>

        <Box
          component="table"
          sx={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: modules.length * 80 + 200,
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              px: 1,
              py: 0.5,
              fontSize: 12,
              textAlign: 'center'
            },
            '& th': {
              bgcolor: 'background.default',
              fontWeight: 600,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 180 }}>Concept</th>
              {modules.map((m) => (
                <Tooltip key={m.module_uuid} title={m.module_title} arrow>
                  <th style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.module_title.length > 14 ? m.module_title.slice(0, 12) + '\u2026' : m.module_title}
                  </th>
                </Tooltip>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.concepts.map((concept: any) => (
              <tr key={concept.item_uuid}>
                <td
                  style={{ textAlign: 'left', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => navigate(`/memory/concept/${concept.item_uuid}`)}
                >
                  {concept.item_title}
                </td>
                {modules.map((mod) => {
                  const cell = cellMap.get(`${mod.module_uuid}-${concept.item_uuid}`);
                  if (!cell) {
                    return (
                      <td key={mod.module_uuid} style={{ background: '#f5f5f5' }}>
                        —
                      </td>
                    );
                  }
                  return (
                    <Tooltip
                      key={mod.module_uuid}
                      title={`${concept.item_title} · ${mod.module_title}: ${Math.round(cell.strength * 100)}% strength, ${cell.retention != null ? Math.round(cell.retention * 100) + '% retention' : 'N/A'} ${masteryBadge(cell.mastery_state)}`}
                      arrow
                    >
                      <td
                        style={{
                          background: retentionColor(cell.strength),
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/memory/concept/${concept.item_uuid}`)}
                      >
                        {Math.round(cell.strength * 100)}%
                      </td>
                    </Tooltip>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Box>

        {/* Color legend */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">Strength:</Typography>
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
            <Box
              key={v}
              sx={{
                width: 24,
                height: 16,
                bgcolor: retentionColor(v),
                borderRadius: 0.5,
                display: 'inline-block'
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary">0% → 100%</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

