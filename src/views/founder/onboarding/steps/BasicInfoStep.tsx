/**
 * Basic Info Step - Onboarding
 */
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import type { OnboardingData } from '../OnboardingWizard';

interface BasicInfoStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const INDUSTRY_OPTIONS = [
  'Tech/Software',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Education',
  'Marketing',
  'Media/Content',
  'Real Estate',
  'Food & Beverage',
  'Retail',
  'Manufacturing',
  'Consulting',
  'SaaS',
  'Mobile Apps',
  'AI/ML',
  'Crypto/Web3',
  'Gaming',
  'Travel',
  'Fashion',
  'Other'
];

export default function BasicInfoStep({ data, updateData }: BasicInfoStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Display Name"
        value={data.display_name}
        onChange={(e) => updateData({ display_name: e.target.value })}
        placeholder="How should we call you?"
        fullWidth
      />

      <TextField
        label="Current Job Title"
        value={data.job_title}
        onChange={(e) => updateData({ job_title: e.target.value })}
        placeholder="e.g., Software Engineer, Product Manager"
        fullWidth
      />

      <TextField
        label="Years of Professional Experience"
        type="number"
        value={data.years_experience}
        onChange={(e) => updateData({ years_experience: parseInt(e.target.value) || 0 })}
        inputProps={{ min: 0, max: 50 }}
        fullWidth
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Industry Background
        </Typography>
        <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
          Select industries you have experience in
        </Typography>
        <Autocomplete
          multiple
          options={INDUSTRY_OPTIONS}
          value={data.industry_background}
          onChange={(_, newValue) => updateData({ industry_background: newValue })}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  variant="outlined"
                  label={option}
                  {...tagProps}
                  key={option}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select industries..."
            />
          )}
        />
      </Box>
    </Box>
  );
}



