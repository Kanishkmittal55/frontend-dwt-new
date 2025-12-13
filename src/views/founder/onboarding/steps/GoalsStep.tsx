/**
 * Goals Step - Onboarding
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';

import type { OnboardingData } from '../OnboardingWizard';

interface GoalsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const PRIMARY_GOALS = [
  { value: 'side_income', label: '💵 Side Income', description: 'Earn extra money while keeping my job' },
  { value: 'replace_job', label: '🚀 Replace My Job', description: 'Build income to quit my 9-5' },
  { value: 'build_empire', label: '👑 Build an Empire', description: 'Create a large, scalable business' },
  { value: 'learn_and_grow', label: '📚 Learn & Grow', description: 'Gain experience and skills' }
];

const WORK_STYLES = [
  { value: 'solo', label: '🧑 Solo', description: 'Work alone, full control' },
  { value: 'small_team', label: '👥 Small Team', description: '2-5 people' },
  { value: 'large_team', label: '🏢 Large Team', description: 'Build a bigger organization' }
];

const RISK_LEVELS = [
  { value: 'low', label: '🛡️ Low Risk', description: 'Steady, proven models' },
  { value: 'medium', label: '⚖️ Medium Risk', description: 'Balanced approach' },
  { value: 'high', label: '🎲 High Risk', description: 'Big swings, big rewards' }
];

const INDUSTRY_OPTIONS = [
  'Tech/Software', 'E-commerce', 'Fintech', 'Healthcare', 'Education',
  'Marketing', 'Media/Content', 'Real Estate', 'Food & Beverage', 'Retail',
  'Manufacturing', 'Consulting', 'SaaS', 'Mobile Apps', 'AI/ML',
  'Crypto/Web3', 'Gaming', 'Travel', 'Fashion', 'Fitness'
];

export default function GoalsStep({ data, updateData }: GoalsStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Primary Goal */}
      <FormControl fullWidth>
        <InputLabel>Primary Goal</InputLabel>
        <Select
          value={data.primary_goal}
          label="Primary Goal"
          onChange={(e) => updateData({ primary_goal: e.target.value as OnboardingData['primary_goal'] })}
        >
          {PRIMARY_GOALS.map((goal) => (
            <MenuItem key={goal.value} value={goal.value}>
              <Box>
                <Typography>{goal.label}</Typography>
                <Typography variant="caption" color="text.secondary">{goal.description}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Target Monthly Income */}
      <TextField
        label="Target Monthly Income"
        type="number"
        value={data.target_monthly_income}
        onChange={(e) => updateData({ target_monthly_income: parseInt(e.target.value) || 0 })}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
          endAdornment: <InputAdornment position="end">/month</InputAdornment>
        }}
        inputProps={{ min: 0, step: 500 }}
        fullWidth
        helperText="How much would you like to earn from side projects?"
      />

      <Grid container spacing={2}>
        {/* Work Style */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Work Style</InputLabel>
            <Select
              value={data.work_style}
              label="Work Style"
              onChange={(e) => updateData({ work_style: e.target.value as OnboardingData['work_style'] })}
            >
              {WORK_STYLES.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  {style.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Risk Tolerance */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Risk Tolerance</InputLabel>
            <Select
              value={data.risk_tolerance}
              label="Risk Tolerance"
              onChange={(e) => updateData({ risk_tolerance: e.target.value as OnboardingData['risk_tolerance'] })}
            >
              {RISK_LEVELS.map((risk) => (
                <MenuItem key={risk.value} value={risk.value}>
                  {risk.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Preferred Industries */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Preferred Industries (Optional)
        </Typography>
        <Autocomplete
          multiple
          options={INDUSTRY_OPTIONS}
          value={data.preferred_industries}
          onChange={(_, newValue) => updateData({ preferred_industries: newValue })}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  variant="outlined"
                  color="primary"
                  label={option}
                  {...tagProps}
                  key={option}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="Industries you'd love to work in" />
          )}
        />
      </Box>

      {/* Avoided Industries */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Industries to Avoid (Optional)
        </Typography>
        <Autocomplete
          multiple
          options={INDUSTRY_OPTIONS}
          value={data.avoided_industries}
          onChange={(_, newValue) => updateData({ avoided_industries: newValue })}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  variant="outlined"
                  color="error"
                  label={option}
                  {...tagProps}
                  key={option}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="Industries you want to avoid" />
          )}
        />
      </Box>
    </Box>
  );
}














