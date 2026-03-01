/**
 * Domain Knowledge Assessment Dialog
 * Displays generated scenario-based tests for a domain
 */
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QuizIcon from '@mui/icons-material/Quiz';
import type { DomainKnowledgeAssessmentScenario } from 'api/founder/knowledgeAPI';

export interface AssessmentStartResult {
  sessionId: string;
  sessionUrl: string;
  slug: string;
}

interface DomainKnowledgeAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  domainName: string;
  slug: string;
  scenarios: DomainKnowledgeAssessmentScenario[];
  totalCount: number;
  onStart: (scenario: DomainKnowledgeAssessmentScenario) => Promise<AssessmentStartResult>;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  dockerfile_edit: 'Dockerfile',
  command_build: 'Command',
  compose_edit: 'Compose',
  scenario_choice: 'Choice',
  code_edit: 'Code',
  test_write: 'Test'
};

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error'
};

export default function DomainKnowledgeAssessmentDialog({
  open,
  onClose,
  domainName,
  slug,
  scenarios,
  totalCount,
  onStart
}: DomainKnowledgeAssessmentDialogProps) {
  const [startingScenarioId, setStartingScenarioId] = React.useState<string | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const handleStart = React.useCallback(
    async (scenario: DomainKnowledgeAssessmentScenario) => {
      setStartError(null);
      setStartingScenarioId(scenario.id);
      try {
        const result = await onStart(scenario);
        // Parent switches to assessment view via their onStart handler
        return result;
      } catch (err) {
        setStartError(err instanceof Error ? err.message : 'Failed to start assessment');
        throw err;
      } finally {
        setStartingScenarioId(null);
      }
    },
    [onStart, onClose]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuizIcon color="primary" />
          <Typography variant="h6" component="span">
            {domainName} — Knowledge Assessment
          </Typography>
          <Chip label={`${totalCount} scenarios`} size="small" color="primary" variant="outlined" />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {startError && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {startError}
          </Typography>
        )}
        <Stepper orientation="vertical" sx={{ mt: 0 }}>
          {scenarios.map((s) => (
            <Step key={s.id} active completed={false}>
              <StepLabel
                optional={
                  <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    <Chip
                      label={TASK_TYPE_LABELS[s.task_type] ?? s.task_type}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={s.difficulty}
                      size="small"
                      color={DIFFICULTY_COLORS[s.difficulty] ?? 'default'}
                    />
                    <Typography component="span" variant="caption" color="text.secondary">
                      ~{s.estimated_time_sec}s
                    </Typography>
                  </Box>
                }
              >
                {s.concept_name}
              </StepLabel>
              <StepContent>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                    {s.prompt}
                  </Typography>
                  {s.initial_content && (
                    <Box
                      component="pre"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        fontSize: '0.8rem',
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {s.initial_content}
                    </Box>
                  )}
                  {s.hint && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Hint: {s.hint}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={
                        startingScenarioId === s.id ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <PlayArrowIcon />
                        )
                      }
                      onClick={() => handleStart(s)}
                      disabled={!!startingScenarioId}
                    >
                      Start
                    </Button>
                  </Box>
                </Paper>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
