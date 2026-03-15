/**
 * ContextChainPreview — Display chain preview (encounter, agent config, pipeline)
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import type { ContextChainPreviewResponse } from '@/api/founder';

export interface ContextChainPreviewProps {
  preview: ContextChainPreviewResponse | null;
  loading: boolean;
  error: string | null;
}

export default function ContextChainPreview({
  preview,
  loading,
  error
}: ContextChainPreviewProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!preview) {
    return (
      <Typography variant="body2" color="text.secondary">
        No preview available. Ensure you have an active session.
      </Typography>
    );
  }

  const encounter = preview.encounter;
  const agentConfig = preview.agent_config;
  const steps = preview.per_turn_pipeline?.steps ?? [];

  return (
    <Stack spacing={2}>
      {encounter && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Encounter
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {encounter.task_type && (
              <Chip label={`task: ${encounter.task_type}`} size="small" variant="outlined" />
            )}
            {encounter.domain && (
              <Chip label={`domain: ${encounter.domain}`} size="small" variant="outlined" />
            )}
            {encounter.goal_id && (
              <Chip label={`goal: ${encounter.goal_id}`} size="small" variant="outlined" />
            )}
            {encounter.resolved_subjects &&
              encounter.resolved_subjects.map((s) => (
                <Chip key={s} label={s} size="small" />
              ))}
          </Stack>
        </Paper>
      )}

      {agentConfig && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Agent Config
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {agentConfig.agent_id && (
              <Chip label={agentConfig.agent_id} size="small" variant="outlined" />
            )}
            {agentConfig.provider && (
              <Chip label={agentConfig.provider} size="small" variant="outlined" />
            )}
            {agentConfig.model && (
              <Chip label={agentConfig.model} size="small" color="primary" variant="outlined" />
            )}
            {agentConfig.tools_enabled?.map((t) => (
              <Chip key={t} label={t} size="small" />
            ))}
          </Stack>
        </Paper>
      )}

      {steps.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Per-turn Pipeline
          </Typography>
          <Stack spacing={0.5}>
            {steps.map((s, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  {s.step ?? i + 1}.
                </Typography>
                <Typography variant="body2">{s.name ?? '—'}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {preview.tool_results_this_session && preview.tool_results_this_session.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Tool Results This Session
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {preview.tool_results_this_session.length} tool call(s)
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}
