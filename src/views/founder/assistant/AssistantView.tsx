/**
 * CoFounder View
 * Your AI co-founder — a global agent that has full context of your system state
 * and can help with any question across all views.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { IconRobot } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';

// ============================================================================
// Component
// ============================================================================

export default function CoFounderView() {
  const theme = useTheme();

  return (
    <MainCard title="CoFounder">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <IconRobot size={64} stroke={1.2} color={theme.palette.primary.main} />
        <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>
          CoFounder
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, textAlign: 'center', mb: 4 }}>
          Your AI co-founder that understands your entire journey — memory state, missions,
          training schedule, radar signals, and intel. Ask anything.
        </Typography>
        <Card variant="outlined" sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Chat with an AI that has full context of your learning state<br />
              • Ask about your schedule, weak concepts, or course progress<br />
              • Get help understanding training priorities and mission alignment<br />
              • Available as a floating panel across all views
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MainCard>
  );
}
