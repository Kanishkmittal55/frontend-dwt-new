/**
 * QueueStats Component
 * Displays revision queue statistics
 */
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PendingIcon from '@mui/icons-material/Pending';

import type { RevisionStatsPayload } from '@/hooks/useTutorAgent';

interface QueueStatsProps {
  stats: RevisionStatsPayload | null;
  loading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, color, loading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box sx={{ color, mb: 1 }}>
          {icon}
        </Box>
        {loading ? (
          <Skeleton variant="text" width={40} sx={{ mx: 'auto', fontSize: '2rem' }} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function QueueStats({ stats, loading }: QueueStatsProps) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          icon={<AccessTimeIcon fontSize="large" />}
          label="Due Today"
          value={stats?.dueToday ?? 0}
          color="#2196f3"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          icon={<AutorenewIcon fontSize="large" />}
          label="First Reviews"
          value={stats?.firstReviews ?? 0}
          color="#ff9800"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          icon={<EmojiEventsIcon fontSize="large" />}
          label="Mastered"
          value={stats?.masteredItems ?? 0}
          color="#4caf50"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          icon={<PendingIcon fontSize="large" />}
          label="Pending"
          value={stats?.pendingVetting ?? 0}
          color="#9c27b0"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}

