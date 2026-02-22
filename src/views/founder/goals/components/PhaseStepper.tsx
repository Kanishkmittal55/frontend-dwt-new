/**
 * PhaseStepper
 * Shows phase progress for a pursuit (e.g. auditing → skill_gap → learning → ...)
 */
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { PHASES_BY_GOAL_TYPE, formatPhaseLabel } from '../constants';
import type { GoalType } from '@/api/founder/schemas';

export interface PhaseStepperProps {
  goalType: GoalType;
  currentPhase: string;
}

export default function PhaseStepper({ goalType, currentPhase }: PhaseStepperProps) {
  const theme = useTheme();
  const phases = PHASES_BY_GOAL_TYPE[goalType] ?? [];
  const currentIdx = phases.indexOf(currentPhase);

  if (phases.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      {phases.map((phase, idx) => {
        const isActive = idx === currentIdx;
        const isPast = idx < currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <Box
            key={phase}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: isActive
                  ? theme.palette.primary.main
                  : isPast
                    ? theme.palette.success.main
                    : theme.palette.action.disabledBackground,
                border: isActive ? `2px solid ${theme.palette.primary.dark}` : 'none'
              }}
              title={formatPhaseLabel(phase)}
            />
            {idx < phases.length - 1 && (
              <Box
                sx={{
                  width: 16,
                  height: 2,
                  bgcolor:
                    idx < currentIdx
                      ? theme.palette.success.main
                      : theme.palette.action.disabledBackground
                }}
              />
            )}
          </Box>
        );
      })}
      <Box
        component="span"
        sx={{
          ml: 1,
          fontSize: '0.75rem',
          color: 'text.secondary'
        }}
      >
        {formatPhaseLabel(currentPhase)}
      </Box>
    </Box>
  );
}
