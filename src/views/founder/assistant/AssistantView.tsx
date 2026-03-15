/**
 * CoFounders Dashboard
 * Manage agents, config, prompts, and active sessions.
 * Config changes require backend restart to take effect — shown via alert after save.
 */
import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { IconRobot, IconSettings, IconUsers, IconFileText, IconTool, IconDatabase } from '@tabler/icons-react';

import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import {
  getAgentsList,
  getAgentById,
  putAgentConfig,
  getAgentSessions,
  getAgentPromptsList,
  getAgentPromptByKey,
  type AgentSummary,
  type AgentDetailResponse,
  type AgentConfigResponse,
  type AgentPromptResponse,
  type AgentSessionResponse,
  type UpsertAgentConfigRequest
} from '@/api/founder';
import ContextChainsTab from './context/ContextChainsTab';

// ============================================================================
// Constants
// ============================================================================

const RESTART_WARNING =
  'Config updated. Restart the backend for changes to take effect.';

/** Temporarily disable Save Config until DB data is restored (re-run seed). Backend now preserves provider/model. */
const SAVE_CONFIG_DISABLED = true;

// ============================================================================
// Tab Panel
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function CoFoundersView() {
  const [tabValue, setTabValue] = useState(0);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [sessions, setSessions] = useState<AgentSessionResponse[]>([]);
  const [prompts, setPrompts] = useState<AgentPromptResponse[]>([]);
  const [promptDetail, setPromptDetail] = useState<AgentPromptResponse | null>(null);
  const [promptDetailLoading, setPromptDetailLoading] = useState(false);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restartAlert, setRestartAlert] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<AgentDetailResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await getAgentsList();
      setAgents(res.agents);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await getAgentSessions();
      setSessions(res.sessions ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await getAgentPromptsList();
      setPrompts(res.prompts ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAgents(), fetchSessions(), fetchPrompts()]);
    } finally {
      setLoading(false);
    }
  }, [fetchAgents, fetchSessions, fetchPrompts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSelectAgent = useCallback(async (agentId: string) => {
    setSelectedAgent(null);
    setConfigLoading(true);
    setConfigError(null);
    try {
      const detail = await getAgentById(agentId);
      setSelectedAgent(detail);
    } catch (e) {
      setConfigError((e as Error).message);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const handleSaveConfig = useCallback(
    async (agentId: string, body: UpsertAgentConfigRequest) => {
      setConfigSaving(true);
      setConfigError(null);
      try {
        await putAgentConfig(agentId, body);
        setRestartAlert(true);
        const detail = await getAgentById(agentId);
        setSelectedAgent(detail);
        setTimeout(() => setRestartAlert(false), 8000);
      } catch (e) {
        setConfigError((e as Error).message);
      } finally {
        setConfigSaving(false);
      }
    },
    []
  );

  if (loading) {
    return (
      <MainCard title="CoFounders">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard title="CoFounders">
      {restartAlert && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {RESTART_WARNING}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab icon={<IconRobot size={18} />} iconPosition="start" label="Agents" />
        <Tab icon={<IconUsers size={18} />} iconPosition="start" label="Sessions" />
        <Tab icon={<IconFileText size={18} />} iconPosition="start" label="Prompts" />
        <Tab icon={<IconDatabase size={18} />} iconPosition="start" label="Contextual encounters" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <SubCard title="Agents">
              {agents.length === 0 ? (
                <Typography color="text.secondary">No agents found.</Typography>
              ) : (
                <Stack spacing={1}>
                  {agents.map((a) => (
                    <Card
                      key={a.id}
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        borderColor: selectedAgent?.id === a.id ? 'primary.main' : 'divider',
                        bgcolor: selectedAgent?.id === a.id ? 'action.selected' : 'transparent'
                      }}
                      onClick={() => handleSelectAgent(a.id)}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="subtitle2">{a.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {a.domain} · {a.id}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </SubCard>
          </Grid>
          <Grid item xs={12} sm={8} md={9}>
            <SubCard title="Agent Config" secondary={<IconSettings size={18} />}>
              {configLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : selectedAgent ? (
                <AgentConfigForm
                  agent={selectedAgent}
                  onSave={(body) => handleSaveConfig(selectedAgent.id, body)}
                  saving={configSaving}
                  error={configError}
                />
              ) : (
                <Typography color="text.secondary">
                  Select an agent to view and edit config.
                </Typography>
              )}
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <SubCard title="Active Sessions">
          {sessions.length === 0 ? (
            <Typography color="text.secondary">No active sessions.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Goal ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.user_id ?? '-'}</TableCell>
                      <TableCell>{s.domain ?? '-'}</TableCell>
                      <TableCell>{s.state ?? '-'}</TableCell>
                      <TableCell>{s.goal_id ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SubCard>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <SubCard title="Prompts">
          {prompts.length === 0 ? (
            <Typography color="text.secondary">No prompts found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {prompts.map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p.prompt_key}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                        boxShadow: 1
                      }
                    }}
                    onClick={async () => {
                      setPromptDetail(p);
                      setPromptDetailLoading(true);
                      setPromptDialogOpen(true);
                      try {
                        const detail = await getAgentPromptByKey(p.prompt_key);
                        setPromptDetail(detail);
                      } catch {
                        // Keep p (may have content from list)
                      } finally {
                        setPromptDetailLoading(false);
                      }
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" fontWeight={600} color="primary">
                        {p.prompt_key}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
                        <Chip label={p.agent_id ?? '—'} size="small" variant="outlined" />
                        <Chip label={p.task_type ?? '—'} size="small" variant="outlined" />
                        <Chip label={p.variant ?? 'default'} size="small" />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </SubCard>
        <PromptDetailDialog
          open={promptDialogOpen}
          prompt={promptDetail}
          loading={promptDetailLoading}
          onClose={() => {
            setPromptDialogOpen(false);
            setPromptDetail(null);
          }}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ContextChainsTab />
      </TabPanel>
    </MainCard>
  );
}

// ============================================================================
// Prompt Detail Dialog — shows full prompt content when a card is clicked
// ============================================================================

interface PromptDetailDialogProps {
  open: boolean;
  prompt: AgentPromptResponse | null;
  loading: boolean;
  onClose: () => void;
}

function PromptDetailDialog({ open, prompt, loading, onClose }: PromptDetailDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: 400 } }}>
      <DialogTitle sx={{ pb: prompt ? 1 : 0 }}>
        <Typography variant="h6">{prompt?.prompt_key ?? 'Prompt'}</Typography>
        {prompt && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
            <Chip label={prompt.agent_id ?? '—'} size="small" variant="outlined" />
            <Chip label={prompt.task_type ?? '—'} size="small" variant="outlined" />
            <Chip label={prompt.variant ?? 'default'} size="small" />
          </Stack>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : prompt?.content ? (
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              p: 0,
              m: 0
            }}
          >
            {prompt.content}
          </Box>
        ) : (
          <Typography color="text.secondary">No content available.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Tools Cell — display and edit tools_enabled per task
// ============================================================================

interface ToolsCellProps {
  tools: string[];
  onChange: (tools: string[]) => void;
}

function ToolsCell({ tools, onChange }: ToolsCellProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(tools.join(', '));

  const handleBlur = () => {
    setEditing(false);
    const parsed = inputValue
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(parsed);
    setInputValue(parsed.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
  };

  if (editing) {
    return (
      <TextField
        size="small"
        fullWidth
        variant="outlined"
        placeholder="tool_a, tool_b, tool_c"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
      />
    );
  }

  return (
    <Box
      onClick={() => {
        setEditing(true);
        setInputValue(tools.join(', '));
      }}
      sx={{
        minHeight: 40,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'text',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
      }}
    >
      {tools.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No tools · click to add
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
          {tools.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 22,
                '& .MuiChip-label': { px: 0.75 }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
                setInputValue(tools.join(', '));
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ============================================================================
// Agent Config Form (simplified — tasks required by backend)
// ============================================================================

interface AgentConfigFormProps {
  agent: AgentDetailResponse;
  onSave: (body: UpsertAgentConfigRequest) => void;
  saving: boolean;
  error: string | null;
}

function AgentConfigForm({ agent, onSave, saving, error }: AgentConfigFormProps) {
  const config = agent.config;
  const tasks = config?.tasks ?? {};
  const taskTypesFromConfig = Object.keys(tasks);
  const taskTypesFromAgent = agent.task_types ?? [];
  const taskTypes =
    taskTypesFromConfig.length > 0
      ? taskTypesFromConfig
      : taskTypesFromAgent.length > 0
        ? taskTypesFromAgent
        : ['default'];

  const [taskOverrides, setTaskOverrides] = useState<
    Record<string, { prompt_key?: string; execution_mode?: 'loop' | 'one_shot'; tools_enabled?: string[] }>
  >({});

  useEffect(() => {
    const keys =
      taskTypesFromConfig.length > 0
        ? taskTypesFromConfig
        : taskTypesFromAgent.length > 0
          ? taskTypesFromAgent
          : ['default'];
    const init: Record<string, { prompt_key?: string; execution_mode?: 'loop' | 'one_shot'; tools_enabled?: string[] }> = {};
    for (const tt of keys) {
      const tc = tasks[tt];
      init[tt] = {
        prompt_key: tc?.prompt_key,
        execution_mode: (tc?.execution_mode as 'loop' | 'one_shot') ?? 'loop',
        tools_enabled: tc?.tools ?? []
      };
    }
    setTaskOverrides(init);
  }, [config, agent.task_types]);

  const handleSubmit = () => {
    const body: UpsertAgentConfigRequest = {
      llm: config?.llm,
      tasks: {}
    };
    for (const tt of taskTypes) {
      const ov = taskOverrides[tt];
      const tc = tasks[tt];
      body.tasks![tt] = {
        execution_mode: ov?.execution_mode ?? (tc?.execution_mode as 'loop' | 'one_shot') ?? 'loop',
        prompt_key: ov?.prompt_key ?? tc?.prompt_key ?? tt,
        tools_enabled: ov?.tools_enabled ?? tc?.tools ?? []
      };
    }
    onSave(body);
  };

  const getMode = (tt: string) =>
    taskOverrides[tt]?.execution_mode ?? (tasks[tt]?.execution_mode as 'loop' | 'one_shot') ?? 'loop';
  const getPromptKey = (tt: string) =>
    taskOverrides[tt]?.prompt_key ?? tasks[tt]?.prompt_key ?? '';
  const getTools = (tt: string): string[] =>
    taskOverrides[tt]?.tools_enabled ?? tasks[tt]?.tools ?? [];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip label={agent.id} size="small" variant="outlined" />
        <Chip label={`Source: ${config?.source ?? 'unknown'}`} size="small" variant="outlined" />
        {config?.llm && (
          <Chip
            label={`${config.llm.provider ?? '—'} / ${config.llm.model ?? '—'}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>
      {taskTypes.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 130 }}>Task</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Prompt key</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <IconTool size={16} />
                    Tools
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taskTypes.map((tt) => (
                <TableRow key={tt}>
                  <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {tt}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                    <ToggleButtonGroup
                      value={getMode(tt)}
                      exclusive
                      size="small"
                      onChange={(_, v) => {
                        if (v)
                          setTaskOverrides((prev) => ({
                            ...prev,
                            [tt]: { ...prev[tt], execution_mode: v }
                          }));
                      }}
                    >
                      <ToggleButton value="loop">Loop</ToggleButton>
                      <ToggleButton value="one_shot">One-shot</ToggleButton>
                    </ToggleButtonGroup>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }} style={{ minWidth: 180 }}>
                    <TextField
                      size="small"
                      placeholder="e.g. learning.domain_chat"
                      value={getPromptKey(tt)}
                      onChange={(e) =>
                        setTaskOverrides((prev) => ({
                          ...prev,
                          [tt]: { ...prev[tt], prompt_key: e.target.value || undefined }
                        }))
                      }
                      fullWidth
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }} style={{ minWidth: 220 }}>
                    <ToolsCell
                      tools={getTools(tt)}
                      onChange={(tools) =>
                        setTaskOverrides((prev) => ({
                          ...prev,
                          [tt]: { ...prev[tt], tools_enabled: tools }
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={SAVE_CONFIG_DISABLED || saving}
        startIcon={saving ? <CircularProgress size={16} /> : null}
        title={
          SAVE_CONFIG_DISABLED
            ? 'Save Config is temporarily disabled'
            : undefined
        }
      >
        {SAVE_CONFIG_DISABLED ? 'Save Config (disabled)' : saving ? 'Saving…' : 'Save Config'}
      </Button>
    </Box>
  );
}
