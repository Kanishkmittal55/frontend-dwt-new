/**
 * Memory Dashboard — Landing page for the Memory Matrix
 * Shows a course selector + NeuralMap summary for the selected course
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Icons
import BrainIcon from '@mui/icons-material/Psychology';
import GridViewIcon from '@mui/icons-material/GridView';
import TimelineIcon from '@mui/icons-material/Timeline';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

// Context & API
import { useAuth } from 'contexts/AuthContext';
import { getCourses } from 'api/founder/coursesAPI';
import { getLearnerProfile, getMemoryMatrix } from 'api/founder/knowledgeAPI';
import type { Course } from 'api/founder/coursesAPI';
import type { MemoryMatrixResponse } from 'api/founder/knowledgeAPI';

// Sub-views
import NeuralMap from './NeuralMap';
import StrengthMatrix from './StrengthMatrix';
import ForgettingCurve from './ForgettingCurve';

// ============================================================================
// Tab config
// ============================================================================
const TABS = [
  { label: 'Neural Map', icon: <BubbleChartIcon />, path: '' },
  { label: 'Strength', icon: <GridViewIcon />, path: 'strength' },
  { label: 'Retention', icon: <TimelineIcon />, path: 'retention' }
] as const;

function tabFromPath(pathname: string): number {
  if (pathname.endsWith('/strength')) return 1;
  if (pathname.endsWith('/retention')) return 2;
  return 0;
}

// ============================================================================
// Component
// ============================================================================
export default function KnowledgeDashboard() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [matrix, setMatrix] = useState<MemoryMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(() => tabFromPath(location.pathname));

  // Load courses & profile
  const bootstrap = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [courseRes, profileRes] = await Promise.all([
        getCourses(userId, { status: 'ready' }),
        getLearnerProfile(userId).catch(() => null)
      ]);
      const readyCourses = courseRes.courses ?? [];
      setCourses(readyCourses);
      setProfile(profileRes);
      if (readyCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(readyCourses[0].uuid);
      }
    } catch (err) {
      console.error('[KnowledgeDashboard] bootstrap error:', err);
      setError(err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Load memory matrix when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    let cancelled = false;
    console.log('[KnowledgeDashboard] Loading memory matrix for course:', selectedCourse);
    (async () => {
      try {
        const m = await getMemoryMatrix(selectedCourse);
        console.log('[KnowledgeDashboard] Memory matrix loaded:', m?.total_concepts, 'concepts');
        if (!cancelled) setMatrix(m);
      } catch (err) {
        console.warn('[KnowledgeDashboard] Memory matrix error (non-fatal):', err);
        if (!cancelled) setMatrix(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCourse]);

  // Sync tab from URL
  useEffect(() => {
    setTabIndex(tabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (_: React.SyntheticEvent, newIdx: number) => {
    setTabIndex(newIdx);
    const tab = TABS[newIdx];
    if (!tab) return;
    navigate(tab.path ? `/memory/${tab.path}` : '/memory', { replace: true });
  };

  // ========== Render ==========
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (courses.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <BrainIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>No courses yet</Typography>
        <Typography color="text.secondary">
          Create a course first — then come back to see your memory map.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Grid container spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Memory
          </Typography>
          {profile?.mastery && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${profile.mastery.total_items ?? 0} concepts`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${profile.mastery.items_due ?? 0} due`}
                size="small"
                color={(profile.mastery.items_due ?? 0) > 0 ? 'warning' : 'success'}
                variant="outlined"
              />
              {profile.retention && (
                <Chip
                  label={`${Math.round((profile.retention.success_rate ?? 0) * 100)}% success`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Course</InputLabel>
            <Select
              value={selectedCourse}
              label="Course"
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map((c) => (
                <MenuItem key={c.uuid} value={c.uuid}>
                  {c.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Quick stats bar */}
      {matrix && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Concepts', value: matrix.total_concepts, color: '#1976d2' },
            { label: 'Due', value: matrix.concepts_due, color: '#ed6c02' },
            { label: 'Avg Retention', value: `${Math.round(matrix.avg_retention * 100)}%`, color: '#2e7d32' },
            { label: 'Links', value: matrix.relationships.length, color: '#9c27b0' }
          ].map((stat) => (
            <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((t) => (
          <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {/* Tab content */}
      {selectedCourse && tabIndex === 0 && (
        <NeuralMap courseUUID={selectedCourse} matrix={matrix} />
      )}
      {selectedCourse && tabIndex === 1 && (
        <StrengthMatrix courseUUID={selectedCourse} />
      )}
      {selectedCourse && tabIndex === 2 && (
        <ForgettingCurve courseUUID={selectedCourse} />
      )}
    </Box>
  );
}

