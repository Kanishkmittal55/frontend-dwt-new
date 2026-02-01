import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// material-ui
import {
  Button,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  Tabs,
  Tab,
  FormHelperText
} from '@mui/material';

// icons
import {
  IconKey,
  IconRefresh,
  IconDatabase,
  IconUser,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconBrandOpenai,
  IconEye,
  IconEyeOff,
  IconFileImport,
  IconRobot,
  IconCloud,
  IconSettings,
  IconClock,
  IconMessage,
  IconBooks
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { founderProfileAPI, type LLMConfig, type UpdateLLMConfigRequest } from '@/api/founder/founderProfileAPI';
import { UpdateLLMConfigRequestSchema } from '@/api/founder/schemas';
import { useAuth } from '@/contexts/AuthContext';

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Model options per provider (updated Feb 2026)
// Reference: https://docs.anthropic.com/en/docs/about-claude/models
// Note: "thinking" variants require extended thinking API - not included
const MODEL_OPTIONS: Record<string, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini', 
    'gpt-4-turbo',
    'o1',
    'o1-mini',
    'o3-mini'
  ],
  anthropic: [
    // Claude 3.5 (recommended - stable and widely supported)
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    // Claude 3.7
    'claude-3-7-sonnet-20250219',
    // Claude 4 (latest - may require API updates)
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514'
  ],
  xai: [
    'grok-2', 
    'grok-2-mini'
  ]
};

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Claude (Anthropic)',
  xai: 'Grok (xAI)'
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  openai: <IconBrandOpenai size={20} />,
  anthropic: <IconCloud size={20} />,
  xai: <IconRobot size={20} />
};

// ==============================|| SETTINGS ||============================== //

export default function Settings() {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const userID = userId;

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // LLM Config state
  const [llmConfig, setLLMConfig] = useState<LLMConfig | null>(null);
  const [loadingLLM, setLoadingLLM] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({
    openai: false,
    anthropic: false,
    xai: false
  });

  // Form for LLM config
  const { control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<UpdateLLMConfigRequest>({
    resolver: zodResolver(UpdateLLMConfigRequestSchema),
    defaultValues: {
      llm_provider: 'openai',
      llm_model: 'gpt-4o',
      openai_api_key: '',
      anthropic_api_key: '',
      xai_api_key: '',
      // Tutor config defaults
      tutor_response_interval_sec: 3,
      tutor_idle_nudge_sec: 60,
      tutor_context_window_size: 20,
      tutor_summarize_threshold: 50,
      tutor_max_context_tokens: 4000
    }
  });

  const selectedProvider = watch('llm_provider');

  // Fetch LLM config on mount
  const fetchLLMConfig = useCallback(async () => {
    if (!userID) return;

    setLoadingLLM(true);
    try {
      const config = await founderProfileAPI.getLLMConfig(userID);
      setLLMConfig(config);

      // Update form with fetched values
      setValue('llm_provider', config.llm_provider);
      setValue('llm_model', config.llm_model);
      // Don't set API keys - they are masked from server
      
      // Set tutor config values
      if (config.tutor_response_interval_sec) {
        setValue('tutor_response_interval_sec', config.tutor_response_interval_sec);
      }
      if (config.tutor_idle_nudge_sec) {
        setValue('tutor_idle_nudge_sec', config.tutor_idle_nudge_sec);
      }
      if (config.tutor_context_window_size) {
        setValue('tutor_context_window_size', config.tutor_context_window_size);
      }
      if (config.tutor_summarize_threshold) {
        setValue('tutor_summarize_threshold', config.tutor_summarize_threshold);
      }
      if (config.tutor_max_context_tokens) {
        setValue('tutor_max_context_tokens', config.tutor_max_context_tokens);
      }
    } catch (err) {
      console.error('Failed to fetch LLM config:', err);
      // Use defaults if not found
    } finally {
      setLoadingLLM(false);
    }
  }, [userID, setValue]);

  useEffect(() => {
    fetchLLMConfig();
  }, [fetchLLMConfig]);

  // Update model when provider changes
  useEffect(() => {
    if (selectedProvider && MODEL_OPTIONS[selectedProvider]) {
      const currentModel = watch('llm_model');
      if (!MODEL_OPTIONS[selectedProvider].includes(currentModel || '')) {
        setValue('llm_model', MODEL_OPTIONS[selectedProvider][0]);
      }
    }
  }, [selectedProvider, setValue, watch]);

  const onSubmitLLMConfig = async (data: UpdateLLMConfigRequest) => {
    if (!userID) return;

    setLoading(true);
    setError(null);
    try {
      // Only send fields that have values
      const updateData: UpdateLLMConfigRequest = {
        llm_provider: data.llm_provider,
        llm_model: data.llm_model
      };

      // Only include API keys if they were entered (non-empty)
      if (data.openai_api_key && data.openai_api_key.length > 0) {
        updateData.openai_api_key = data.openai_api_key;
      }
      if (data.anthropic_api_key && data.anthropic_api_key.length > 0) {
        updateData.anthropic_api_key = data.anthropic_api_key;
      }
      if (data.xai_api_key && data.xai_api_key.length > 0) {
        updateData.xai_api_key = data.xai_api_key;
      }

      // Include tutor config fields
      if (data.tutor_response_interval_sec !== undefined) {
        updateData.tutor_response_interval_sec = data.tutor_response_interval_sec;
      }
      if (data.tutor_idle_nudge_sec !== undefined) {
        updateData.tutor_idle_nudge_sec = data.tutor_idle_nudge_sec;
      }
      if (data.tutor_context_window_size !== undefined) {
        updateData.tutor_context_window_size = data.tutor_context_window_size;
      }
      if (data.tutor_summarize_threshold !== undefined) {
        updateData.tutor_summarize_threshold = data.tutor_summarize_threshold;
      }
      if (data.tutor_max_context_tokens !== undefined) {
        updateData.tutor_max_context_tokens = data.tutor_max_context_tokens;
      }

      const updated = await founderProfileAPI.updateLLMConfig(userID, updateData);
      setLLMConfig(updated);
      setSuccessMessage('Configuration saved successfully');

      // Clear the API key inputs after successful save
      setValue('openai_api_key', '');
      setValue('anthropic_api_key', '');
      setValue('xai_api_key', '');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getApiKeyStatus = (provider: string): { hasKey: boolean; masked: string } => {
    if (!llmConfig) return { hasKey: false, masked: '' };

    switch (provider) {
      case 'openai':
        return { hasKey: llmConfig.has_openai_key || false, masked: llmConfig.openai_api_key || '' };
      case 'anthropic':
        return { hasKey: llmConfig.has_anthropic_key || false, masked: llmConfig.anthropic_api_key || '' };
      case 'xai':
        return { hasKey: llmConfig.has_xai_key || false, masked: llmConfig.xai_api_key || '' };
      default:
        return { hasKey: false, masked: '' };
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <MainCard title="Settings">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (!isAuthenticated || !userID) {
    return (
      <MainCard title="Settings">
        <Alert severity="warning">Please log in to access settings.</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Settings">
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<IconBrandOpenai size={20} />} label="AI Provider" />
          <Tab icon={<IconSettings size={20} />} label="Tutor Behavior" />
          <Tab icon={<IconUser size={20} />} label="Account" />
        </Tabs>
      </Box>

      {/* AI Provider Tab */}
      <TabPanel value={tabValue} index={0}>
        {loadingLLM ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmitLLMConfig)}>
            <Grid container spacing={3}>
              {/* Current Configuration */}
              <Grid size={12}>
                <SubCard title="Current Configuration">
                  {llmConfig ? (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip
                        icon={PROVIDER_ICONS[llmConfig.llm_provider] as React.ReactElement}
                        label={PROVIDER_NAMES[llmConfig.llm_provider]}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={llmConfig.llm_model}
                        color="secondary"
                        variant="outlined"
                      />
                      {llmConfig.has_openai_key || llmConfig.has_anthropic_key || llmConfig.has_xai_key ? (
                        <Chip
                          icon={<IconCheck size={16} />}
                          label="API Key Configured"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<IconAlertCircle size={16} />}
                          label="No API Key"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Stack>
                  ) : (
                    <Typography color="textSecondary">No configuration found</Typography>
                  )}
                </SubCard>
              </Grid>

              {/* Provider & Model Selection */}
              <Grid size={{ xs: 12, md: 6 }}>
                <SubCard title="Provider & Model">
                  <Stack spacing={3}>
                    <Controller
                      name="llm_provider"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.llm_provider}>
                          <InputLabel>AI Provider</InputLabel>
                          <Select {...field} label="AI Provider">
                            <MenuItem value="openai">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconBrandOpenai size={20} />
                                <span>OpenAI</span>
                              </Stack>
                            </MenuItem>
                            <MenuItem value="anthropic">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconCloud size={20} />
                                <span>Claude (Anthropic)</span>
                              </Stack>
                            </MenuItem>
                            <MenuItem value="xai">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconRobot size={20} />
                                <span>Grok (xAI)</span>
                              </Stack>
                            </MenuItem>
                          </Select>
                          {errors.llm_provider && (
                            <FormHelperText>{errors.llm_provider.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />

                    <Controller
                      name="llm_model"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.llm_model}>
                          <InputLabel>Model</InputLabel>
                          <Select {...field} label="Model">
                            {(MODEL_OPTIONS[selectedProvider || 'openai'] || []).map((model) => (
                              <MenuItem key={model} value={model}>
                                {model}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.llm_model && (
                            <FormHelperText>{errors.llm_model.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Stack>
                </SubCard>
              </Grid>

              {/* API Keys */}
              <Grid size={{ xs: 12, md: 6 }}>
                <SubCard title="API Keys">
                  <Stack spacing={2}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Only enter a key if you want to update it. Leave blank to keep existing key.
                    </Alert>

                    {/* OpenAI Key */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <IconBrandOpenai size={16} />
                        <Typography variant="subtitle2">OpenAI</Typography>
                        {getApiKeyStatus('openai').hasKey && (
                          <Chip label={getApiKeyStatus('openai').masked} size="small" color="success" variant="outlined" />
                        )}
                      </Stack>
                      <Controller
                        name="openai_api_key"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            type={showApiKeys.openai ? 'text' : 'password'}
                            placeholder={getApiKeyStatus('openai').hasKey ? 'Enter new key to replace' : 'sk-...'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleApiKeyVisibility('openai')}
                                  >
                                    {showApiKeys.openai ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        )}
                      />
                    </Box>

                    {/* Anthropic Key */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <IconCloud size={16} />
                        <Typography variant="subtitle2">Anthropic (Claude)</Typography>
                        {getApiKeyStatus('anthropic').hasKey && (
                          <Chip label={getApiKeyStatus('anthropic').masked} size="small" color="success" variant="outlined" />
                        )}
                      </Stack>
                      <Controller
                        name="anthropic_api_key"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            type={showApiKeys.anthropic ? 'text' : 'password'}
                            placeholder={getApiKeyStatus('anthropic').hasKey ? 'Enter new key to replace' : 'sk-ant-...'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleApiKeyVisibility('anthropic')}
                                  >
                                    {showApiKeys.anthropic ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        )}
                      />
                    </Box>

                    {/* xAI Key */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <IconRobot size={16} />
                        <Typography variant="subtitle2">xAI (Grok)</Typography>
                        {getApiKeyStatus('xai').hasKey && (
                          <Chip label={getApiKeyStatus('xai').masked} size="small" color="success" variant="outlined" />
                        )}
                      </Stack>
                      <Controller
                        name="xai_api_key"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            type={showApiKeys.xai ? 'text' : 'password'}
                            placeholder={getApiKeyStatus('xai').hasKey ? 'Enter new key to replace' : 'xai-...'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleApiKeyVisibility('xai')}
                                  >
                                    {showApiKeys.xai ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        )}
                      />
                    </Box>
                  </Stack>
                </SubCard>
              </Grid>

              {/* Save Button */}
              <Grid size={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<IconRefresh size={18} />}
                    onClick={fetchLLMConfig}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : undefined}
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        )}
      </TabPanel>

      {/* Tutor Behavior Tab */}
      <TabPanel value={tabValue} index={1}>
        {loadingLLM ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmitLLMConfig)}>
            <Grid container spacing={3}>
              {/* Current Tutor Config Summary */}
              <Grid size={12}>
                <SubCard title="Current Tutor Settings">
                  {llmConfig ? (
                    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                      <Chip
                        icon={<IconClock size={16} />}
                        label={`Response: ${llmConfig.tutor_response_interval_sec || 3}s`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<IconMessage size={16} />}
                        label={`Idle Nudge: ${llmConfig.tutor_idle_nudge_sec || 60}s`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<IconBooks size={16} />}
                        label={`Context: ${llmConfig.tutor_context_window_size || 20} msgs`}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  ) : (
                    <Typography color="textSecondary">Using default settings</Typography>
                  )}
                </SubCard>
              </Grid>

              {/* Response Timing */}
              <Grid size={{ xs: 12, md: 6 }}>
                <SubCard title="Response Timing">
                  <Stack spacing={3}>
                    <Controller
                      name="tutor_response_interval_sec"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          label="Response Interval (seconds)"
                          helperText="Minimum seconds between AI responses (1-60)"
                          InputProps={{
                            inputProps: { min: 1, max: 60 },
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconClock size={18} />
                              </InputAdornment>
                            )
                          }}
                          error={!!errors.tutor_response_interval_sec}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />

                    <Controller
                      name="tutor_idle_nudge_sec"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          label="Idle Nudge Delay (seconds)"
                          helperText="Seconds of inactivity before AI sends a nudge (10-300)"
                          InputProps={{
                            inputProps: { min: 10, max: 300 },
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconMessage size={18} />
                              </InputAdornment>
                            )
                          }}
                          error={!!errors.tutor_idle_nudge_sec}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </Stack>
                </SubCard>
              </Grid>

              {/* Context Management */}
              <Grid size={{ xs: 12, md: 6 }}>
                <SubCard title="Context Management">
                  <Stack spacing={3}>
                    <Controller
                      name="tutor_context_window_size"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          label="Context Window Size"
                          helperText="Recent messages always included in context (5-100)"
                          InputProps={{
                            inputProps: { min: 5, max: 100 },
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconBooks size={18} />
                              </InputAdornment>
                            )
                          }}
                          error={!!errors.tutor_context_window_size}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />

                    <Controller
                      name="tutor_summarize_threshold"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          label="Summarization Threshold"
                          helperText="Messages before auto-summarization (20-500)"
                          InputProps={{
                            inputProps: { min: 20, max: 500 }
                          }}
                          error={!!errors.tutor_summarize_threshold}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />

                    <Controller
                      name="tutor_max_context_tokens"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          label="Max Context Tokens"
                          helperText="Maximum tokens for conversation context (1000-32000)"
                          InputProps={{
                            inputProps: { min: 1000, max: 32000 }
                          }}
                          error={!!errors.tutor_max_context_tokens}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </Stack>
                </SubCard>
              </Grid>

              {/* Info Alert */}
              <Grid size={12}>
                <Alert severity="info" icon={<IconSettings size={20} />}>
                  <Typography variant="body2">
                    <strong>Response Interval:</strong> Controls how quickly the AI responds to your input.
                    <br />
                    <strong>Idle Nudge:</strong> If you're idle for this long, the AI will offer a gentle prompt.
                    <br />
                    <strong>Context Window:</strong> Number of recent messages the AI remembers. Larger = more context, but slower.
                    <br />
                    <strong>Summarization:</strong> When conversation exceeds this, older messages are compressed into summaries.
                  </Typography>
                </Alert>
              </Grid>

              {/* Save Button */}
              <Grid size={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<IconRefresh size={18} />}
                    onClick={fetchLLMConfig}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : undefined}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        )}
      </TabPanel>

      {/* Account Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SubCard title="Account Status">
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="textSecondary">User ID:</Typography>
                  <Typography variant="body1">{userID}</Typography>
                </Stack>
                <Chip
                  label="Active"
                  color="success"
                  icon={<IconCheck size={16} />}
                />
              </Stack>
            </SubCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SubCard title="Danger Zone">
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Account deletion is not available in this view. Contact support for assistance.
                </Typography>
              </Alert>
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>
    </MainCard>
  );
}

