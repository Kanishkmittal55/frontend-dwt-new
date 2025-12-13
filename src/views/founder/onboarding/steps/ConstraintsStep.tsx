/**
 * Constraints Step - Onboarding
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import InputAdornment from '@mui/material/InputAdornment';

import type { OnboardingData } from '../OnboardingWizard';

interface ConstraintsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const HOURS_MARKS = [
  { value: 5, label: '5h' },
  { value: 10, label: '10h' },
  { value: 20, label: '20h' },
  { value: 30, label: '30h' },
  { value: 40, label: '40h+' }
];

export default function ConstraintsStep({ data, updateData }: ConstraintsStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Day Job */}
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={data.has_day_job}
              onChange={(e) => updateData({ has_day_job: e.target.checked })}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle1">I have a day job</Typography>
              <Typography variant="caption" color="text.secondary">
                Are you currently employed full-time?
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Hours per Week */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Hours Available Per Week
        </Typography>
        <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
          How many hours can you dedicate to side projects?
        </Typography>
        <Box sx={{ px: 2, pt: 2 }}>
          <Slider
            value={data.hours_per_week}
            onChange={(_, newValue) => updateData({ hours_per_week: newValue as number })}
            min={1}
            max={40}
            step={1}
            marks={HOURS_MARKS}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${value}h/week`}
          />
        </Box>
        <Typography 
          variant="body2" 
          color="primary" 
          align="center" 
          sx={{ mt: 1 }}
        >
          {data.hours_per_week} hours per week
        </Typography>
      </Box>

      {/* Budget */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Available Budget
        </Typography>
        <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
          How much can you invest in a side project (one-time)?
        </Typography>
        <TextField
          type="number"
          value={data.budget_available}
          onChange={(e) => updateData({ budget_available: parseInt(e.target.value) || 0 })}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>
          }}
          inputProps={{ min: 0, max: 100000, step: 100 }}
          fullWidth
          placeholder="0"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 Enter $0 if you're bootstrapping with no budget
        </Typography>
      </Box>
    </Box>
  );
}














