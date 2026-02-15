/**
 * Playbook View
 * Your strategic playbook — GTM plans, competitive research, and execution strategies.
 * The system helps you build and iterate on your go-to-market approach.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { IconMap2 } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';

// ============================================================================
// Component
// ============================================================================

export default function PlaybookView() {
  const theme = useTheme();

  return (
    <MainCard title="Playbook">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <IconMap2 size={64} stroke={1.2} color={theme.palette.primary.main} />
        <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>
          Playbook
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, textAlign: 'center', mb: 4 }}>
          Your strategic playbook — research, plan, and iterate on your go-to-market approach.
          Build execution strategies aligned with your active mission.
        </Typography>
        <Card variant="outlined" sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Research competitors and market positioning<br />
              • Build GTM strategy documents<br />
              • Plan launch sequences and milestones<br />
              • AI-assisted competitive analysis and strategy recommendations<br />
              • Track plan execution and iterate
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MainCard>
  );
}



