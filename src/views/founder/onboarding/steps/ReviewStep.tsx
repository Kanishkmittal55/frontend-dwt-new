/**
 * Review Step - Onboarding
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Grid from '@mui/material/Grid';

import type { OnboardingData } from '../OnboardingWizard';

interface ReviewStepProps {
  data: OnboardingData;
  onEdit: (step: number) => void;
}

const GOAL_LABELS: Record<string, string> = {
  side_income: '💵 Side Income',
  replace_job: '🚀 Replace Job',
  build_empire: '👑 Build Empire',
  learn_and_grow: '📚 Learn & Grow'
};

const WORK_STYLE_LABELS: Record<string, string> = {
  solo: '🧑 Solo',
  small_team: '👥 Small Team',
  large_team: '🏢 Large Team'
};

const RISK_LABELS: Record<string, string> = {
  low: '🛡️ Low',
  medium: '⚖️ Medium',
  high: '🎲 High'
};

interface SectionProps {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}

function Section({ title, step, onEdit, children }: SectionProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        <IconButton size="small" onClick={() => onEdit(step)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}

export default function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const topSkills = Object.entries(data.skills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your profile before completing setup
      </Typography>

      {/* Basic Info */}
      <Section title="Basic Info" step={0} onEdit={onEdit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Display Name</Typography>
            <Typography>{data.display_name || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Job Title</Typography>
            <Typography>{data.job_title || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Experience</Typography>
            <Typography>{data.years_experience} years</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Industries</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {data.industry_background.length > 0 ? (
                data.industry_background.map((ind) => (
                  <Chip key={ind} label={ind} size="small" variant="outlined" />
                ))
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Section>

      {/* Skills */}
      <Section title="Top Skills" step={1} onEdit={onEdit}>
        {topSkills.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {topSkills.map(([skill, level]) => (
              <Chip
                key={skill}
                label={`${skill}: ${level}/10`}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">No skills rated yet</Typography>
        )}
      </Section>

      {/* Constraints */}
      <Section title="Constraints" step={2} onEdit={onEdit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <Typography variant="caption" color="text.secondary">Day Job</Typography>
            <Typography>{data.has_day_job ? 'Yes' : 'No'}</Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Typography variant="caption" color="text.secondary">Hours/Week</Typography>
            <Typography>{data.hours_per_week}h</Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Typography variant="caption" color="text.secondary">Budget</Typography>
            <Typography>${data.budget_available.toLocaleString()}</Typography>
          </Grid>
        </Grid>
      </Section>

      {/* Goals */}
      <Section title="Goals" step={3} onEdit={onEdit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Primary Goal</Typography>
            <Typography>{GOAL_LABELS[data.primary_goal]}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Target Income</Typography>
            <Typography>${data.target_monthly_income.toLocaleString()}/month</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Work Style</Typography>
            <Typography>{WORK_STYLE_LABELS[data.work_style]}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Risk Tolerance</Typography>
            <Typography>{RISK_LABELS[data.risk_tolerance]}</Typography>
          </Grid>
        </Grid>

        {(data.preferred_industries.length > 0 || data.avoided_industries.length > 0) && (
          <Box sx={{ mt: 2 }}>
            {data.preferred_industries.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Preferred Industries</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {data.preferred_industries.map((ind) => (
                    <Chip key={ind} label={ind} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
            {data.avoided_industries.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Avoiding</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {data.avoided_industries.map((ind) => (
                    <Chip key={ind} label={ind} size="small" color="error" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Section>

      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', mt: 2 }}>
        ✨ Ready to go! Click "Complete Setup" to create your profile.
      </Typography>
    </Box>
  );
}

