/**
 * Skills Step - Onboarding
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';

import type { OnboardingData } from '../OnboardingWizard';

interface SkillsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const SKILL_CATEGORIES = [
  { key: 'programming', label: 'Programming/Coding', emoji: '💻' },
  { key: 'design', label: 'Design (UI/UX)', emoji: '🎨' },
  { key: 'marketing', label: 'Marketing', emoji: '📣' },
  { key: 'sales', label: 'Sales', emoji: '💰' },
  { key: 'writing', label: 'Writing/Content', emoji: '✍️' },
  { key: 'analytics', label: 'Analytics/Data', emoji: '📊' },
  { key: 'operations', label: 'Operations', emoji: '⚙️' },
  { key: 'finance', label: 'Finance/Accounting', emoji: '📈' },
  { key: 'leadership', label: 'Leadership', emoji: '👥' },
  { key: 'product', label: 'Product Management', emoji: '🎯' }
];

const SKILL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Basic',
  3: 'Developing',
  4: 'Competent',
  5: 'Proficient',
  6: 'Advanced',
  7: 'Expert',
  8: 'Master',
  9: 'Guru',
  10: 'World Class'
};

export default function SkillsStep({ data, updateData }: SkillsStepProps) {
  const handleSkillChange = (skillKey: string, value: number) => {
    updateData({
      skills: {
        ...data.skills,
        [skillKey]: value
      }
    });
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Rate your proficiency in each area (1 = Beginner, 10 = Expert)
      </Typography>

      <Grid container spacing={3}>
        {SKILL_CATEGORIES.map((skill) => {
          const value = data.skills[skill.key] || 1;
          return (
            <Grid size={{ xs: 12, sm: 6 }} key={skill.key}>
              <Box sx={{ px: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {skill.emoji} {skill.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={value}
                    onChange={(_, newValue) => handleSkillChange(skill.key, newValue as number)}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ minWidth: 70, textAlign: 'right' }}
                  >
                    {SKILL_LABELS[value]}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}














