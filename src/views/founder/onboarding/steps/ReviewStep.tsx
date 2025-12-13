/**
 * Review Step - Onboarding
 * Summary of all profile data including research-backed fields
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
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
        <IconButton size="small" onClick={() => onEdit(step)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
      <Divider sx={{ mt: 1.5 }} />
    </Box>
  );
}

export default function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const topSkills = Object.entries(data.skills).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review your profile before completing setup
      </Typography>

      {/* Basic Info */}
      <Section title="Basic Info" step={0} onEdit={onEdit}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Name</Typography>
            <Typography variant="body2">{data.display_name || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Title</Typography>
            <Typography variant="body2">{data.job_title || '—'}</Typography>
          </Grid>
        </Grid>
      </Section>

      {/* Skills */}
      <Section title="Top Skills" step={1} onEdit={onEdit}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {topSkills.map(([skill, level]) => (
            <Chip key={skill} label={`${skill}: ${level}`} size="small" variant="outlined" />
          ))}
        </Box>
      </Section>

      {/* Constraints */}
      <Section title="Constraints" step={2} onEdit={onEdit}>
        <Typography variant="body2">
          {data.hours_per_week}h/week • ${data.budget_available.toLocaleString()} budget
          {data.has_day_job && ' • Has day job'}
        </Typography>
      </Section>

      {/* Goals */}
      <Section title="Goals" step={3} onEdit={onEdit}>
        <Typography variant="body2">
          {GOAL_LABELS[data.primary_goal]} • {WORK_STYLE_LABELS[data.work_style]} • {RISK_LABELS[data.risk_tolerance]}
        </Typography>
      </Section>

      {/* Experience */}
      <Section title="Experience" step={4} onEdit={onEdit}>
        <Typography variant="body2">
          {data.prior_startup_count ?? 0} startups • {data.management_experience_years ?? 0}y management
          {data.startup_experience_type !== 'none' && ` • ${data.startup_experience_type?.replace('_', ' ')}`}
        </Typography>
        {(data.functional_areas_experienced?.length ?? 0) > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {data.functional_areas_experienced?.map((area) => (
              <Chip key={area} label={area} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </Section>

      {/* Mindset */}
      <Section title="Mindset" step={5} onEdit={onEdit}>
        <Typography variant="body2">
          Action: {data.action_orientation ?? 5}/10 • Grit: {data.grit_score ?? 5}/10 • 
          Learning: {data.learning_agility ?? 'medium'} • Style: {data.decision_style ?? 'mixed'}
        </Typography>
      </Section>

      {/* Network */}
      <Section title="Network" step={6} onEdit={onEdit}>
        <Typography variant="body2">
          {data.network_strength ?? 'weak'} network • {data.industry_network_depth ?? 'none'} industry depth
          {data.mentor_access && ' • Has mentors'}
          {data.investor_network && ' • Investor connections'}
        </Typography>
      </Section>

      {/* AI */}
      <Section title="AI Tools" step={7} onEdit={onEdit}>
        <Typography variant="body2">
          Style: {data.ai_augmentation_style ?? 'balanced'}
          {(data.ai_task_dependence?.length ?? 0) > 0 && ` • Depends on AI for: ${data.ai_task_dependence?.join(', ')}`}
        </Typography>
        {(data.core_skills_without_ai?.length ?? 0) > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {data.core_skills_without_ai?.map((skill) => (
              <Chip key={skill} label={skill} size="small" color="success" variant="outlined" />
            ))}
          </Box>
        )}
      </Section>

      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', mt: 2 }}>
        ✨ Ready! Click "Complete Setup" to create your research-backed profile.
      </Typography>
    </Box>
  );
}

