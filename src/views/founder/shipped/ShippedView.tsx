/**
 * Shipped View
 * Your track record — completed projects, launched features, and deployed milestones.
 * Everything you've built, shipped, and accomplished.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { IconRocket } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';

// ============================================================================
// Component
// ============================================================================

export default function ShippedView() {
  const theme = useTheme();

  return (
    <MainCard title="Shipped">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <IconRocket size={64} stroke={1.2} color={theme.palette.primary.main} />
        <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>
          Shipped
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, textAlign: 'center', mb: 4 }}>
          Your track record — everything you&apos;ve built, launched, and accomplished.
          Completed milestones, deployed projects, and shipped features.
        </Typography>
        <Card variant="outlined" sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Track completed milestones from your missions<br />
              • Celebrate shipped features and products<br />
              • Build your founder portfolio over time<br />
              • View timeline of accomplishments<br />
              • Share your track record
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </MainCard>
  );
}



