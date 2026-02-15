/**
 * Radar Dashboard
 * Goal-driven intelligence — the system scans and surfaces actionable items
 * based on the founder's active goal.
 *
 * Examples by goal type:
 *  - Business goal → business ideas, market opportunities
 *  - Investment goal → stock market signals, portfolio insights
 *  - Social media goal → content scripts, platform opportunities
 *  - Career goal → job signals, skill gaps, networking opportunities
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { IconRadar2 } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';

// ============================================================================
// Component
// ============================================================================

export default function RadarDashboard() {
  const theme = useTheme();

  return (
    <MainCard title="Radar">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <IconRadar2 size={64} stroke={1.2} color={theme.palette.primary.main} />
        <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>
          Radar
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, textAlign: 'center', mb: 4 }}>
          Your personal radar scans for opportunities aligned with your active goal.
          Business ideas, market signals, content opportunities — all goal-driven.
        </Typography>
        <Card variant="outlined" sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Business goal → business ideas &amp; market opportunities<br />
              • Investment goal → stock market signals &amp; portfolio insights<br />
              • Social media goal → content scripts &amp; platform opportunities<br />
              • Career goal → job signals &amp; skill gap analysis<br />
              • All signals scored and ranked by relevance to your active goal
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MainCard>
  );
}



