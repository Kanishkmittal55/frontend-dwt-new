/**
 * Mindset Step - Research-backed psychological factors
 * Source: Gielnik 2020, Murnieks 2020, Chen et al. 1998, Zhao et al. 2010
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { OnboardingData } from '../OnboardingWizard';

interface MindsetStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const ESE_DIMENSIONS = [
  { key: 'marketing', label: 'Marketing', desc: 'Confidence in marketing products/services' },
  { key: 'innovation', label: 'Innovation', desc: 'Confidence in developing new ideas' },
  { key: 'management', label: 'Management', desc: 'Confidence in managing people/resources' },
  { key: 'risk_taking', label: 'Risk Taking', desc: 'Comfort with calculated risks' },
  { key: 'financial_control', label: 'Financial Control', desc: 'Confidence managing finances' }
];

const TRAIT_SLIDERS = [
  { key: 'action_orientation', label: '🚀 Action Orientation', desc: 'Bias toward action vs analysis (Gielnik 2020)' },
  { key: 'grit_score', label: '💪 Grit', desc: 'Persistence through adversity (Murnieks 2020)' },
  { key: 'openness_to_experience', label: '🌍 Openness', desc: 'Open to new experiences (Zhao 2010)' },
  { key: 'need_for_achievement', label: '🏆 Need for Achievement', desc: 'Drive to excel (Rauch & Frese 2007)' }
];

const LEARNING_AGILITY_OPTIONS = [
  { value: 'low', label: 'Low - Prefer structured learning' },
  { value: 'medium', label: 'Medium - Adapt when needed' },
  { value: 'high', label: 'High - Learn fast from any situation' }
];

const DECISION_STYLE_OPTIONS = [
  { value: 'causal', label: 'Causal - Set goals, then find resources' },
  { value: 'effectual', label: 'Effectual - Start with what I have' },
  { value: 'mixed', label: 'Mixed - Depends on situation' }
];

export default function MindsetStep({ data, updateData }: MindsetStepProps) {
  const handleEseChange = (dimension: string, value: number) => {
    updateData({
      ese_scores: {
        ...(data.ese_scores ?? {}),
        [dimension]: value
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Your mindset and self-belief shape how you'll approach challenges.
      </Typography>

      {/* Entrepreneurial Self-Efficacy */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">🎯 Self-Efficacy (Chen et al. 1998)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Rate your confidence in each entrepreneurial dimension (1-10)
          </Typography>
          <Grid container spacing={2}>
            {ESE_DIMENSIONS.map((dim) => {
              const value = data.ese_scores?.[dim.key] ?? 5;
              return (
                <Grid size={{ xs: 12, sm: 6 }} key={dim.key}>
                  <Box>
                    <Typography variant="subtitle2">{dim.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{dim.desc}</Typography>
                    <Slider
                      value={value}
                      onChange={(_, newValue) => handleEseChange(dim.key, newValue as number)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Psychological Traits */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">🧠 Psychological Traits</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {TRAIT_SLIDERS.map((trait) => {
              const value = (data[trait.key as keyof OnboardingData] as number) ?? 5;
              return (
                <Grid size={{ xs: 12, sm: 6 }} key={trait.key}>
                  <Box>
                    <Typography variant="subtitle2">{trait.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{trait.desc}</Typography>
                    <Slider
                      value={value}
                      onChange={(_, newValue) => updateData({ [trait.key]: newValue as number })}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Decision Style & Learning */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Learning Agility</InputLabel>
            <Select
              value={data.learning_agility ?? 'medium'}
              label="Learning Agility"
              onChange={(e) => updateData({ learning_agility: e.target.value as OnboardingData['learning_agility'] })}
            >
              {LEARNING_AGILITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Decision Style (Sarasvathy 2001)</InputLabel>
            <Select
              value={data.decision_style ?? 'mixed'}
              label="Decision Style (Sarasvathy 2001)"
              onChange={(e) => updateData({ decision_style: e.target.value as OnboardingData['decision_style'] })}
            >
              {DECISION_STYLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}


