/**
 * AI Step - AI tool proficiency and dependence
 * Practical fields (not yet research-validated)
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';

import type { OnboardingData } from '../OnboardingWizard';

interface AIStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const AI_TOOLS = [
  { key: 'chatgpt', label: 'ChatGPT', emoji: '🤖' },
  { key: 'copilot', label: 'GitHub Copilot', emoji: '💻' },
  { key: 'cursor', label: 'Cursor', emoji: '⌨️' },
  { key: 'claude', label: 'Claude', emoji: '🧠' },
  { key: 'midjourney', label: 'Midjourney/DALL-E', emoji: '🎨' },
  { key: 'perplexity', label: 'Perplexity', emoji: '🔍' }
];

const AI_TASK_OPTIONS = [
  'Coding',
  'Writing',
  'Research',
  'Design',
  'Analysis',
  'Marketing Copy',
  'Data Analysis',
  'Customer Support',
  'Legal/Contracts'
];

const CORE_SKILL_OPTIONS = [
  'Coding',
  'Writing',
  'Design',
  'Analysis',
  'Sales',
  'Marketing',
  'System Design',
  'Architecture',
  'Product Strategy'
];

const AI_STYLE_OPTIONS = [
  { value: 'minimal', label: 'Minimal - Rarely use AI, prefer manual work' },
  { value: 'balanced', label: 'Balanced - Use AI to accelerate, understand fundamentals' },
  { value: 'heavy', label: 'Heavy - Rely heavily on AI for most tasks' }
];

export default function AIStep({ data, updateData }: AIStepProps) {
  const handleToolChange = (tool: string, value: number) => {
    updateData({
      ai_tool_proficiency: {
        ...(data.ai_tool_proficiency ?? {}),
        [tool]: value
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info" sx={{ mb: 1 }}>
        Understanding your AI usage helps us recommend ideas that match your working style.
      </Alert>

      {/* AI Tool Proficiency */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          🤖 AI Tool Proficiency
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Rate your proficiency with each tool (0 = never used, 10 = expert)
        </Typography>
        <Grid container spacing={2}>
          {AI_TOOLS.map((tool) => {
            const value = data.ai_tool_proficiency?.[tool.key] ?? 0;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={tool.key}>
                <Box>
                  <Typography variant="subtitle2">
                    {tool.emoji} {tool.label}
                  </Typography>
                  <Slider
                    value={value}
                    onChange={(_, newValue) => handleToolChange(tool.key, newValue as number)}
                    min={0}
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
      </Box>

      {/* AI Augmentation Style */}
      <FormControl fullWidth>
        <InputLabel>AI Augmentation Style</InputLabel>
        <Select
          value={data.ai_augmentation_style ?? 'balanced'}
          label="AI Augmentation Style"
          onChange={(e) => updateData({ ai_augmentation_style: e.target.value as OnboardingData['ai_augmentation_style'] })}
        >
          {AI_STYLE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* AI Task Dependence */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Tasks You Can't Do Without AI
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Which tasks would be very difficult without AI assistance?
        </Typography>
        <Autocomplete
          multiple
          options={AI_TASK_OPTIONS}
          value={data.ai_task_dependence ?? []}
          onChange={(_, newValue) => updateData({ ai_task_dependence: newValue })}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  variant="outlined"
                  color="warning"
                  label={option}
                  {...tagProps}
                  key={option}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="Select tasks..." />
          )}
        />
      </Box>

      {/* Core Skills Without AI */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Core Skills (Without AI)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          What can you do well even without AI tools? (Resilience indicator)
        </Typography>
        <Autocomplete
          multiple
          options={CORE_SKILL_OPTIONS}
          value={data.core_skills_without_ai ?? []}
          onChange={(_, newValue) => updateData({ core_skills_without_ai: newValue })}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  variant="outlined"
                  color="success"
                  label={option}
                  {...tagProps}
                  key={option}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="Select core skills..." />
          )}
        />
      </Box>
    </Box>
  );
}

