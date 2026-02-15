/**
 * Radar Dashboard
 * Goal-driven intelligence — the system scans and surfaces actionable items
 * based on the founder's active mission(s).
 *
 * For now, Radar surfaces the Ideas pipeline. Once mission-driven scanning is
 * live, this view will auto-filter/rank signals by the founder's active goals.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { IconRadar2 } from '@tabler/icons-react';

import IdeasDashboard from '../ideas/IdeasDashboard';

// ============================================================================
// Component
// ============================================================================

export default function RadarDashboard() {
  return (
    <Box>
      <Alert
        icon={<IconRadar2 size={20} />}
        severity="info"
        sx={{ mb: 2 }}
      >
        <Typography variant="body2">
          <strong>Radar</strong> functions according to the founder's mission(s) — surfacing ideas, signals, and opportunities aligned with your active goals.
        </Typography>
      </Alert>
      <IdeasDashboard />
    </Box>
  );
}



