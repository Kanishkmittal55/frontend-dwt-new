/**
 * Domain Knowledge Assessment Config Dialog
 * Config form before generating assessment — scenario count, difficulty, concept filter
 */
import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getDomainKnowledgeGraph } from 'api/founder/knowledgeAPI';
import type { DomainKnowledgeGraphResponse } from 'api/founder/knowledgeAPI';

export interface AssessmentConfigOverrides {
  scenario_count?: number;
  max_difficulty?: string;
  concept_filter?: string[];
  /** When true, LLM suggests best concept combinations (ignores concept_filter) */
  auto_select?: boolean;
}

interface DomainKnowledgeAssessmentConfigDialogProps {
  open: boolean;
  onClose: () => void;
  domainName: string;
  slug: string;
  onGenerate: (overrides: AssessmentConfigOverrides) => void;
  generating: boolean;
  /** Required for LLM-based generation (auto suggest and concept-based scenarios) */
  userId?: number | null;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

export default function DomainKnowledgeAssessmentConfigDialog({
  open,
  onClose,
  domainName,
  slug,
  onGenerate,
  generating,
  userId
}: DomainKnowledgeAssessmentConfigDialogProps) {
  const [scenarioCount, setScenarioCount] = useState(5);
  const [maxDifficulty, setMaxDifficulty] = useState('intermediate');
  const [conceptFilter, setConceptFilter] = useState<string[]>([]);
  const [autoSelect, setAutoSelect] = useState(false);
  const [concepts, setConcepts] = useState<{ slug: string; name: string }[]>([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);

  useEffect(() => {
    if (!open || !slug) return;
    setConceptsLoading(true);
    getDomainKnowledgeGraph(slug)
      .then((g: DomainKnowledgeGraphResponse) => {
        const list = (g.concepts ?? []).map((c) => ({ slug: c.slug, name: c.name }));
        setConcepts(list);
      })
      .catch(() => setConcepts([]))
      .finally(() => setConceptsLoading(false));
  }, [open, slug]);

  const handleGenerate = useCallback(() => {
    const overrides: AssessmentConfigOverrides = {
      scenario_count: scenarioCount,
      max_difficulty: maxDifficulty,
      auto_select: autoSelect
    };
    if (!autoSelect && conceptFilter.length > 0) {
      overrides.concept_filter = conceptFilter;
    }
    onGenerate(overrides);
  }, [scenarioCount, maxDifficulty, conceptFilter, autoSelect, onGenerate]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" component="span">
            Configure assessment — {domainName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          {userId && (
            <Typography variant="caption" color="primary" sx={{ mb: -0.5 }}>
              AI will generate interesting scenarios from your domain concepts
            </Typography>
          )}
          <TextField
            label="Scenario count"
            type="number"
            value={scenarioCount}
            onChange={(e) => setScenarioCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 5)))}
            inputProps={{ min: 1, max: 20 }}
            size="small"
            helperText="Number of scenarios to generate (1–20)"
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Max difficulty</InputLabel>
            <Select
              value={maxDifficulty}
              label="Max difficulty"
              onChange={(e) => setMaxDifficulty(e.target.value)}
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Concepts beyond this level won&apos;t be included
            </Typography>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={autoSelect}
                onChange={(e) => setAutoSelect(e.target.checked)}
                color="primary"
                disabled={!userId}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AutoAwesomeIcon fontSize="small" color="primary" />
                <span>Auto suggest concept combinations</span>
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            {userId
              ? 'Let the AI suggest the best concept combinations for maximum learning (uses LLM)'
              : 'Log in to use AI-suggested concept combinations'}
          </Typography>
          <FormControl size="small" fullWidth disabled={autoSelect}>
            <InputLabel>Concept filter (optional)</InputLabel>
            <Select
              multiple
              value={conceptFilter}
              label="Concept filter (optional)"
              onChange={(e) => setConceptFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Concept filter (optional)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((s) => (
                    <Chip key={s} label={concepts.find((c) => c.slug === s)?.name ?? s} size="small" />
                  ))}
                </Box>
              )}
              disabled={conceptsLoading || autoSelect}
            >
              {concepts.map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {autoSelect ? 'Ignored when auto suggest is on' : 'Leave empty to include all concepts'}
            </Typography>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
