/**
 * Fit Score Radar Chart
 * 
 * Visualizes founder fit score breakdown using a radar chart.
 * Shows: skill_match, time_match, budget_match, risk_match (0-100)
 * Displays overall score prominently in the center.
 */
import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface FitScoreData {
  skill_match?: number | null;
  time_match?: number | null;
  budget_match?: number | null;
  risk_match?: number | null;
  overall?: number | null;
}

interface FitScoreRadarProps {
  /** Fit score data from founder_fit_explanation or calculated scores */
  fitData: FitScoreData | null | undefined;
  /** Overall fit score (0-100) */
  overallScore?: number | null;
  /** Chart size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show labels on axes */
  showLabels?: boolean;
  /** Show the overall score in center */
  showOverallScore?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CONFIG = {
  small: { width: 200, height: 200, fontSize: 10, centerSize: 'h5' as const },
  medium: { width: 280, height: 280, fontSize: 12, centerSize: 'h4' as const },
  large: { width: 360, height: 360, fontSize: 14, centerSize: 'h3' as const }
};

const DIMENSION_LABELS: Record<string, string> = {
  skill_match: 'Skills',
  time_match: 'Time',
  budget_match: 'Budget',
  risk_match: 'Risk'
};

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 70) return '#4caf50'; // green
  if (score >= 40) return '#ff9800'; // orange
  return '#f44336'; // red
}

function formatScore(value: number | null | undefined): number {
  return value ?? 0;
}

// ============================================================================
// Custom Tooltip
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { dimension: string; score: number; fullMark: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const score = data.score;
  const color = getScoreColor(score);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 1,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        {data.dimension}
      </Typography>
      <Typography variant="h6" sx={{ color }}>
        {score}%
      </Typography>
    </Box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FitScoreRadar({
  fitData,
  overallScore,
  size = 'medium',
  showLabels = true,
  showOverallScore = true
}: FitScoreRadarProps) {
  const theme = useTheme();
  const config = SIZE_CONFIG[size];

  // Prepare radar chart data
  const chartData = useMemo(() => {
    if (!fitData) return [];

    return [
      {
        dimension: DIMENSION_LABELS.skill_match,
        score: formatScore(fitData.skill_match),
        fullMark: 100
      },
      {
        dimension: DIMENSION_LABELS.time_match,
        score: formatScore(fitData.time_match),
        fullMark: 100
      },
      {
        dimension: DIMENSION_LABELS.budget_match,
        score: formatScore(fitData.budget_match),
        fullMark: 100
      },
      {
        dimension: DIMENSION_LABELS.risk_match,
        score: formatScore(fitData.risk_match),
        fullMark: 100
      }
    ];
  }, [fitData]);

  // Calculate overall score
  const displayOverall = useMemo(() => {
    if (overallScore !== null && overallScore !== undefined) {
      return overallScore;
    }
    if (fitData?.overall !== null && fitData?.overall !== undefined) {
      return fitData.overall;
    }
    // Calculate average if individual scores exist
    if (fitData) {
      const scores = [
        fitData.skill_match,
        fitData.time_match,
        fitData.budget_match,
        fitData.risk_match
      ].filter((s): s is number => s !== null && s !== undefined);

      if (scores.length > 0) {
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }
    return null;
  }, [overallScore, fitData]);

  const overallColor = displayOverall !== null ? getScoreColor(displayOverall) : theme.palette.text.secondary;

  // No data state
  if (!fitData || chartData.length === 0) {
    return (
      <Box
        sx={{
          width: config.width,
          height: config.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Fit score not available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: config.width, height: config.height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid
            stroke={theme.palette.divider}
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={showLabels ? {
              fill: theme.palette.text.secondary,
              fontSize: config.fontSize
            } : false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: config.fontSize - 2 }}
            tickCount={5}
            stroke={theme.palette.divider}
          />
          <Radar
            name="Fit Score"
            dataKey="score"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: theme.palette.primary.main,
              strokeWidth: 0
            }}
            activeDot={{
              r: 6,
              fill: theme.palette.primary.dark,
              strokeWidth: 0
            }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Center Overall Score */}
      {showOverallScore && displayOverall !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <Typography
            variant={config.centerSize}
            sx={{
              fontWeight: 'bold',
              color: overallColor,
              lineHeight: 1
            }}
          >
            {displayOverall}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.5
            }}
          >
            Overall
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ============================================================================
// Compact Variant - For use in cards/lists
// ============================================================================

interface FitScoreCompactProps {
  overallScore: number | null | undefined;
  size?: 'small' | 'medium';
}

export function FitScoreCompact({ overallScore, size = 'small' }: FitScoreCompactProps) {
  const score = overallScore ?? 0;
  const color = getScoreColor(score);
  const dimension = size === 'small' ? 40 : 56;

  return (
    <Box
      sx={{
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: `${color}20`,
        border: 2,
        borderColor: color
      }}
    >
      <Typography
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{ fontWeight: 'bold', color }}
      >
        {score}
      </Typography>
    </Box>
  );
}

// ============================================================================
// Score Bar Variant - Horizontal breakdown
// ============================================================================

interface FitScoreBreakdownProps {
  fitData: FitScoreData | null | undefined;
  compact?: boolean;
}

export function FitScoreBreakdown({ fitData, compact = false }: FitScoreBreakdownProps) {
  if (!fitData) {
    return (
      <Typography variant="body2" color="text.secondary">
        Fit breakdown not available
      </Typography>
    );
  }

  const dimensions = [
    { key: 'skill_match', label: 'Skills', value: fitData.skill_match },
    { key: 'time_match', label: 'Time', value: fitData.time_match },
    { key: 'budget_match', label: 'Budget', value: fitData.budget_match },
    { key: 'risk_match', label: 'Risk', value: fitData.risk_match }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
      {dimensions.map(({ key, label, value }) => {
        const score = value ?? 0;
        const color = getScoreColor(score);

        return (
          <Box key={key}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color }}>
                {score}%
              </Typography>
            </Box>
            <Box
              sx={{
                height: compact ? 4 : 6,
                bgcolor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${score}%`,
                  bgcolor: color,
                  borderRadius: 1,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}














