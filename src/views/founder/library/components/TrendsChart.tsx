/**
 * Trends Chart Component
 * Displays entity trends over time using ApexCharts
 */
import { useState, useEffect } from 'react';

// MUI
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';

// Chart
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Icons
import { IconTrendingUp, IconChartLine } from '@tabler/icons-react';

// API
import { 
  trendsAPI, 
  type EntityTrend, 
  type TrendingEntitiesResponse,
  type PeriodType 
} from '@/api/founder/trendsAPI';

// ============================================================================
// Types
// ============================================================================

interface TrendsChartProps {
  height?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function TrendsChart({ height = 300 }: TrendsChartProps) {
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<EntityTrend[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>('hourly');
  
  // Fetch trends
  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await trendsAPI.getTrendingEntities({
          period_type: periodType,
          limit: 10
        });
        setTrends(response.entities || []);
      } catch (err) {
        console.error('Failed to fetch trends:', err);
        setError('Failed to load trends');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTrends();
  }, [periodType]);

  // Chart options
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true,
        barHeight: '70%'
      }
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.primary.light,
      theme.palette.secondary.light,
      theme.palette.success.light,
      theme.palette.warning.light,
      theme.palette.info.light
    ],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val} mentions`,
      style: {
        fontSize: '11px',
        colors: [theme.palette.text.primary]
      },
      offsetX: 5
    },
    xaxis: {
      categories: trends.map(t => t.entity_name),
      labels: {
        style: { colors: theme.palette.text.secondary }
      }
    },
    yaxis: {
      labels: {
        style: { 
          colors: theme.palette.text.primary,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 4
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val: number) => `${val} mentions`
      }
    },
    legend: { show: false }
  };

  const chartSeries = [{
    name: 'Mentions',
    data: trends.map(t => t.mention_count)
  }];

  // Period options
  const periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ];

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" height={height} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconTrendingUp size={24} color={theme.palette.primary.main} />
            <Typography variant="h5">Entity Trends</Typography>
            <Chip 
              size="small" 
              label={`${trends.length} entities`} 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          <TextField
            select
            size="small"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            sx={{ minWidth: 120 }}
          >
            {periodOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!error && trends.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <IconChartLine size={48} color={theme.palette.text.disabled} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No trend data available yet.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Run the discovery service to collect data.
            </Typography>
          </Box>
        )}

        {/* Chart */}
        {!error && trends.length > 0 && (
          <Box sx={{ 
            '& .apexcharts-menu': { bgcolor: 'background.paper' },
            '& .apexcharts-tooltip': { boxShadow: theme.shadows[4] }
          }}>
            <Chart 
              options={chartOptions} 
              series={chartSeries} 
              type="bar" 
              height={height} 
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

