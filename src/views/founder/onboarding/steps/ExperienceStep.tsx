/**
 * Experience Step - Research-backed startup/management experience
 * Source: Stuart & Abetti 1990, Delmar & Shane 2006, Dencker et al. 2021
 */
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';

import type { OnboardingData } from '../OnboardingWizard';

interface ExperienceStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const STARTUP_EXPERIENCE_TYPES = [
  { value: 'none', label: 'No startup experience' },
  { value: 'employee_late', label: 'Late-stage startup employee' },
  { value: 'employee_early', label: 'Early-stage startup employee' },
  { value: 'cofounder', label: 'Co-founder of a startup' },
  { value: 'solo_founder', label: 'Solo founder' }
];

const EMPLOYER_TIERS = [
  { value: 'unknown', label: 'Not sure / Other' },
  { value: 'startup', label: 'Startup' },
  { value: 'smb', label: 'Small/Medium Business' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'faang', label: 'FAANG / Big Tech' }
];

const FUNCTIONAL_AREAS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Product',
  'Finance',
  'Operations',
  'Customer Success',
  'HR',
  'Legal',
  'Design'
];

export default function ExperienceStep({ data, updateData }: ExperienceStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Your experience helps us match you with ideas suited to your background.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Prior Startups Founded"
            type="number"
            value={data.prior_startup_count ?? 0}
            onChange={(e) => updateData({ prior_startup_count: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 0, max: 20 }}
            fullWidth
            helperText="Number of startups you've founded"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Successful Exits"
            type="number"
            value={data.successful_exits ?? 0}
            onChange={(e) => updateData({ successful_exits: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 0, max: 20 }}
            fullWidth
            helperText="Acquisitions, IPOs, or profitable sales"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Startup Experience Type</InputLabel>
            <Select
              value={data.startup_experience_type ?? 'none'}
              label="Startup Experience Type"
              onChange={(e) => updateData({ startup_experience_type: e.target.value as OnboardingData['startup_experience_type'] })}
            >
              {STARTUP_EXPERIENCE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Prior Employer Tier</InputLabel>
            <Select
              value={data.prior_employer_tier ?? 'unknown'}
              label="Prior Employer Tier"
              onChange={(e) => updateData({ prior_employer_tier: e.target.value as OnboardingData['prior_employer_tier'] })}
            >
              {EMPLOYER_TIERS.map((tier) => (
                <MenuItem key={tier.value} value={tier.value}>
                  {tier.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Management Experience (Years)"
            type="number"
            value={data.management_experience_years ?? 0}
            onChange={(e) => updateData({ management_experience_years: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 0, max: 40 }}
            fullWidth
            helperText="Years managing people/teams"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Largest Team Managed"
            type="number"
            value={data.largest_team_managed ?? 0}
            onChange={(e) => updateData({ largest_team_managed: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 0, max: 1000 }}
            fullWidth
            helperText="Largest team size you've managed"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Functional Areas Experienced
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            "Jack of all trades" founders often succeed (Lazear 2004)
          </Typography>
          <Autocomplete
            multiple
            options={FUNCTIONAL_AREAS}
            value={data.functional_areas_experienced ?? []}
            onChange={(_, newValue) => updateData({ functional_areas_experienced: newValue })}
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
              <TextField {...params} placeholder="Select functional areas..." />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
}


