/**
 * Founder Dashboard
 * Main dashboard for Founder OS
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';

// Icons
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Context
import { useFounder } from 'contexts/FounderContext';
import { useAuth } from 'contexts/AuthContext';

// ============================================================================
// Component
// ============================================================================

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { founderProfile, isProfileLoading, isProfileComplete, profileError } = useFounder();

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (!isProfileLoading && !founderProfile) {
      navigate('/founder/onboarding');
    }
  }, [isProfileLoading, founderProfile, navigate]);

  // Loading state
  if (isProfileLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={60} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={150} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (profileError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {profileError}
      </Alert>
    );
  }

  // No profile - should redirect
  if (!founderProfile) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Welcome back, {founderProfile.display_name || user?.first_name || 'Founder'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's your founder journey at a glance
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ideas Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LightbulbIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Pending Ideas
                </Typography>
              </Box>
              <Typography variant="h3">0</Typography>
              <Typography variant="caption" color="text.secondary">
                Ideas awaiting review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TaskAltIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Today's Tasks
                </Typography>
              </Box>
              <Typography variant="h3">0</Typography>
              <Typography variant="caption" color="text.secondary">
                Tasks to complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Streak Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RocketLaunchIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Current Streak
                </Typography>
              </Box>
              <Typography variant="h3">🔥 0</Typography>
              <Typography variant="caption" color="text.secondary">
                days in a row
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Compound Score
                </Typography>
              </Box>
              <Typography variant="h3">0</Typography>
              <Typography variant="caption" color="text.secondary">
                Your progress score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              startIcon={<LightbulbIcon />}
              onClick={() => navigate('/founder/ideas')}
            >
              Review Ideas
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<TaskAltIcon />}
              onClick={() => navigate('/founder/today')}
            >
              Today's Tasks
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/founder/profile')}
            >
              Edit Profile
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Profile
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Goal</Typography>
              <Typography>{founderProfile.primary_goal?.replace('_', ' ') || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Hours/Week</Typography>
              <Typography>{founderProfile.hours_per_week || 0}h</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Budget</Typography>
              <Typography>${founderProfile.budget_available?.toLocaleString() || 0}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Risk</Typography>
              <Typography>{founderProfile.risk_tolerance || '—'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}















