/**
 * Network Step - Social capital and connections
 * Source: Davidsson & Honig 2003, Mosey & Wright 2007, Hsu 2007
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import type { OnboardingData } from '../OnboardingWizard';

interface NetworkStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const NETWORK_STRENGTH_OPTIONS = [
  { value: 'weak', label: 'Weak - Few professional connections' },
  { value: 'moderate', label: 'Moderate - Some useful contacts' },
  { value: 'strong', label: 'Strong - Well-connected in my field' }
];

const INDUSTRY_NETWORK_OPTIONS = [
  { value: 'none', label: 'None - No industry connections' },
  { value: 'peripheral', label: 'Peripheral - Know a few people' },
  { value: 'connected', label: 'Connected - Good relationships' },
  { value: 'well_connected', label: 'Well Connected - Deep network' }
];

export default function NetworkStep({ data, updateData }: NetworkStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Your network is a key resource for startup success (Davidsson & Honig 2003).
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Overall Network Strength</InputLabel>
            <Select
              value={data.network_strength ?? 'weak'}
              label="Overall Network Strength"
              onChange={(e) => updateData({ network_strength: e.target.value as OnboardingData['network_strength'] })}
            >
              {NETWORK_STRENGTH_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Industry Network Depth</InputLabel>
            <Select
              value={data.industry_network_depth ?? 'none'}
              label="Industry Network Depth"
              onChange={(e) => updateData({ industry_network_depth: e.target.value as OnboardingData['industry_network_depth'] })}
            >
              {INDUSTRY_NETWORK_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Key Connections
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.mentor_access ?? false}
                  onChange={(e) => updateData({ mentor_access: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Access to Mentors</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Have experienced entrepreneurs who advise you
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={data.investor_network ?? false}
                  onChange={(e) => updateData({ investor_network: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Investor Connections</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Know angels/VCs personally (Hsu 2007)
                  </Typography>
                </Box>
              }
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

