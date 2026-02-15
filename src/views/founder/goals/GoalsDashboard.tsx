/**
 * Mission Dashboard
 * Define and track your founder missions — the system adapts everything around them.
 * Courses, radar signals, training tasks, and intel all align to your active mission.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { IconTarget } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';

// ============================================================================
// Component
// ============================================================================

export default function MissionDashboard() {
  const theme = useTheme();

  return (
    <MainCard title="Mission">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <IconTarget size={64} stroke={1.2} color={theme.palette.primary.main} />
        <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>
          Mission
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, textAlign: 'center', mb: 4 }}>
          Define your missions — the system adapts everything around them.
          Courses, radar, training, and intel all align to your active mission.
        </Typography>
        <Card variant="outlined" sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Define missions like &quot;Launch a SaaS business by Jan 2027&quot; or &quot;Build investment portfolio&quot;<br />
              • Activate a mission to focus the entire system<br />
              • Track milestones and progress<br />
              • System generates relevant courses, radar signals, and training tasks based on your active mission
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MainCard>
  );
}
