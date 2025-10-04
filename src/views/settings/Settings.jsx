import { useState, useEffect } from 'react';

// material-ui
import {
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
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
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  Tooltip,
  Collapse
} from '@mui/material';

// icons
import {
  IconKey,
  IconRefresh,
  IconSettings,
  IconDatabase,
  IconServer,
  IconUser,
  IconTrash,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconBrandOpenai,
  IconBrandAzure,
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
  IconDownload,
  IconFileImport
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';
import { userAPI } from 'api/userAPI';
import { systemAPI } from 'api/systemAPI';
import { WhyHowClient } from 'api/baseClient';
import { workspaceAPI } from 'api/workspaceAPI';

// ==============================|| TAB PANEL ||============================== //

function TabPanel({ children, value, index, ...other }) {
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

// ==============================|| SETTINGS ||============================== //

export default function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // User data
  const [apiKeyData, setApiKeyData] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [providers, setProviders] = useState(null);

  // System data
  const [systemInfo, setSystemInfo] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [settings, setSettings] = useState(null);

  // Demo data
  const [demoWorkspaces, setDemoWorkspaces] = useState([]);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Provider form
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [providerType, setProviderType] = useState('byo-openai');
  const [providerForm, setProviderForm] = useState({
    api_key: '',
    language_model_name: '',
    embedding_name: '',
    azure_endpoint: '',
    api_version: ''
  });

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDemoDialogOpen, setDeleteDemoDialogOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchSystemData();
    fetchDemoWorkspaces();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch API key
      const apiKeyResponse = await userAPI.getApiKey();
      setApiKeyData(apiKeyResponse.whyhow_api_key?.[0]);

      // Fetch user status
      const statusResponse = await userAPI.getUserStatus();
      setUserStatus(statusResponse);

      // Fetch provider details
      try {
        const providerResponse = await userAPI.getProvidersDetails();
        setProviders(providerResponse.providers);
      } catch (err) {
        // Provider details might not be set
        console.log('No provider details set');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemData = async () => {
    try {
      // Fetch system info
      const rootResponse = await systemAPI.getRoot();
      setSystemInfo(rootResponse);

      // Fetch database info
      const dbResponse = await systemAPI.getDatabase();
      setDbInfo(dbResponse);

      // Fetch settings
      const settingsResponse = await systemAPI.getSettings();
      setSettings(settingsResponse);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
    }
  };

  const fetchDemoWorkspaces = async () => {
    try {
      const response = await workspaceAPI.getWorkspaces();
      const demos = response.workspaces.filter(w => 
        w.name.toLowerCase().includes('demo')
      );
      setDemoWorkspaces(demos);
    } catch (err) {
      console.error('Failed to fetch demo workspaces:', err);
    }
  };

  const handleLoadDemoData = async () => {
    setLoadingDemo(true);
    setError(null);
    try {
      const client = new WhyHowClient();
      const response = await client.loadDemoData();
      
      if (response.status === 'success') {
        setSuccessMessage('Demo workspace created successfully!');
        await fetchDemoWorkspaces();
      } else {
        setError('Failed to create demo workspace: ' + response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load demo data');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleDeleteDemoData = async () => {
    if (demoWorkspaces.length === 0) {
      setError('No demo workspaces found to delete');
      return;
    }

    setLoadingDemo(true);
    setError(null);
    try {
      let deletedCount = 0;
      const errors = [];

      for (const workspace of demoWorkspaces) {
        try {
          await workspaceAPI.deleteWorkspace(workspace._id);
          deletedCount++;
        } catch (err) {
          errors.push(`Failed to delete ${workspace.name}: ${err.message}`);
        }
      }

      if (deletedCount > 0) {
        setSuccessMessage(`Successfully deleted ${deletedCount} demo workspace(s)`);
        await fetchDemoWorkspaces();
      }

      if (errors.length > 0) {
        setError(errors.join('; '));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete demo data');
    } finally {
      setLoadingDemo(false);
      setDeleteDemoDialogOpen(false);
    }
  };

  const handleRotateApiKey = async () => {
    if (!window.confirm('Are you sure you want to rotate your API key? The current key will be invalidated.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.rotateApiKey();
      setApiKeyData(response.whyhow_api_key?.[0]);
      setSuccessMessage('API key rotated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to rotate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKeyData?.api_key) {
      navigator.clipboard.writeText(apiKeyData.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenProviderDialog = () => {
    setProviderForm({
      api_key: '',
      language_model_name: '',
      embedding_name: '',
      azure_endpoint: '',
      api_version: ''
    });
    setProviderDialogOpen(true);
  };

  const handleSaveProvider = async () => {
    setLoading(true);
    setError(null);
    try {
      const metadata = {
        language_model_name: providerForm.language_model_name || null,
        embedding_name: providerForm.embedding_name || null
      };

      if (providerType === 'byo-azure-openai') {
        metadata.azure_endpoint = providerForm.azure_endpoint || null;
        metadata.api_version = providerForm.api_version || null;
      }

      const data = {
        providers: [{
          type: 'llm',
          value: providerType,
          api_key: providerForm.api_key,
          metadata: {
            [providerType]: metadata
          }
        }]
      };

      await userAPI.setProvidersDetails(data);
      setSuccessMessage('Provider details saved successfully');
      setProviderDialogOpen(false);
      fetchUserData();
    } catch (err) {
      setError(err.message || 'Failed to save provider details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      await userAPI.deleteUser();
      // Redirect to login or home after account deletion
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    const start = key.substring(0, 8);
    const end = key.substring(key.length - 4);
    return `${start}...${end}`;
  };

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
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<IconKey />} label="API Keys" />
          <Tab icon={<IconBrandOpenai />} label="AI Providers" />
          <Tab icon={<IconDatabase />} label="Demo Data" />
          <Tab icon={<IconUser />} label="Account" />
          <Tab icon={<IconServer />} label="System Info" />
        </Tabs>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {/* API Keys Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SubCard title="WhyHow API Key">
              {apiKeyData ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Key"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyData.api_key}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                              {showApiKey ? <IconEyeOff /> : <IconEye />}
                            </IconButton>
                            <IconButton onClick={handleCopyApiKey}>
                              {copied ? <IconCheck color="green" /> : <IconCopy />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">Created</Typography>
                    <Typography variant="body2">
                      {formatDate(apiKeyData.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">Last Updated</Typography>
                    <Typography variant="body2">
                      {formatDate(apiKeyData.updated_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<IconRefresh />}
                      onClick={handleRotateApiKey}
                      disabled={loading}
                    >
                      Rotate API Key
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No API key found
                </Typography>
              )}
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* AI Providers Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SubCard 
              title="AI Provider Configuration"
              secondary={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleOpenProviderDialog}
                >
                  Configure Provider
                </Button>
              }
            >
              {providers && providers.length > 0 ? (
                <List>
                  {providers.map((provider, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {provider.value.includes('azure') ? <IconBrandAzure /> : <IconBrandOpenai />}
                      </ListItemIcon>
                      <ListItemText
                        primary={provider.value === 'byo-openai' ? 'OpenAI' : 'Azure OpenAI'}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="caption">
                              API Key: {maskApiKey(provider.api_key)}
                            </Typography>
                            {provider.metadata && Object.entries(provider.metadata).map(([key, meta]) => (
                              <Box key={key}>
                                {meta.language_model_name && (
                                  <Typography variant="caption" display="block">
                                    Model: {meta.language_model_name}
                                  </Typography>
                                )}
                                {meta.embedding_name && (
                                  <Typography variant="caption" display="block">
                                    Embedding: {meta.embedding_name}
                                  </Typography>
                                )}
                                {meta.azure_endpoint && (
                                  <Typography variant="caption" display="block">
                                    Endpoint: {meta.azure_endpoint}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No AI providers configured. Configure your OpenAI or Azure OpenAI provider to enable AI features.
                </Typography>
              )}
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Demo Data Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SubCard title="Demo Data Management">
              <Stack spacing={3}>
                <Alert severity="info">
                  Load demo workspace with sample documents and knowledge graph data for testing and exploration.
                </Alert>

                {demoWorkspaces.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Existing Demo Workspaces ({demoWorkspaces.length})
                    </Typography>
                    <List dense>
                      {demoWorkspaces.map((workspace) => (
                        <ListItem key={workspace._id}>
                          <ListItemIcon>
                            <IconDatabase size={20} />
                          </ListItemIcon>
                          <ListItemText
                            primary={workspace.name}
                            secondary={`Created: ${formatDate(workspace.created_at)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<IconFileImport />}
                    onClick={handleLoadDemoData}
                    disabled={loadingDemo}
                  >
                    {loadingDemo ? 'Loading...' : 'Load Demo Data'}
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<IconTrash />}
                    onClick={() => setDeleteDemoDialogOpen(true)}
                    disabled={loadingDemo || demoWorkspaces.length === 0}
                  >
                    Delete All Demo Data
                  </Button>
                </Stack>

                {loadingDemo && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="textSecondary">
                      Processing demo data...
                    </Typography>
                  </Box>
                )}
              </Stack>
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Account Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SubCard title="Account Status">
              {userStatus && (
                <Box>
                  <Chip
                    label={userStatus.active ? 'Active' : 'Inactive'}
                    color={userStatus.active ? 'success' : 'error'}
                    icon={userStatus.active ? <IconCheck /> : <IconAlertCircle />}
                  />
                </Box>
              )}
            </SubCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <SubCard title="Danger Zone">
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Deleting your account is permanent and cannot be undone. All your data will be permanently removed.
                </Typography>
              </Alert>
              <Button
                variant="outlined"
                color="error"
                startIcon={<IconTrash />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </SubCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* System Info Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {systemInfo && (
            <Grid item xs={12} md={6}>
              <SubCard title="System Status">
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={systemInfo.message || 'System is running'}
                    />
                  </ListItem>
                  {systemInfo.version && (
                    <ListItem>
                      <ListItemText
                        primary="Version"
                        secondary={systemInfo.version}
                      />
                    </ListItem>
                  )}
                </List>
              </SubCard>
            </Grid>
          )}

          {dbInfo && (
            <Grid item xs={12} md={6}>
              <SubCard title="Database">
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <IconDatabase />
                    </ListItemIcon>
                    <ListItemText
                      primary="Status"
                      secondary={dbInfo.message || 'Connected'}
                    />
                  </ListItem>
                  {dbInfo.collections && (
                    <ListItem>
                      <ListItemText
                        primary="Collections"
                        secondary={dbInfo.collections}
                      />
                    </ListItem>
                  )}
                </List>
              </SubCard>
            </Grid>
          )}

          {settings && (
            <Grid item xs={12}>
              <SubCard title="System Settings">
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" component="pre">
                    {JSON.stringify(settings, null, 2)}
                  </Typography>
                </Paper>
              </SubCard>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Provider Configuration Dialog */}
      <Dialog open={providerDialogOpen} onClose={() => setProviderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure AI Provider</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Provider Type</InputLabel>
                <Select
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value)}
                  label="Provider Type"
                >
                  <MenuItem value="byo-openai">OpenAI</MenuItem>
                  <MenuItem value="byo-azure-openai">Azure OpenAI</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={providerForm.api_key}
                onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Language Model Name"
                placeholder="e.g., gpt-4"
                value={providerForm.language_model_name}
                onChange={(e) => setProviderForm({ ...providerForm, language_model_name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Embedding Model Name"
                placeholder="e.g., text-embedding-ada-002"
                value={providerForm.embedding_name}
                onChange={(e) => setProviderForm({ ...providerForm, embedding_name: e.target.value })}
              />
            </Grid>

            {providerType === 'byo-azure-openai' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Azure Endpoint"
                    placeholder="https://your-resource.openai.azure.com/"
                    value={providerForm.azure_endpoint}
                    onChange={(e) => setProviderForm({ ...providerForm, azure_endpoint: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Version"
                    placeholder="2023-05-15"
                    value={providerForm.api_version}
                    onChange={(e) => setProviderForm({ ...providerForm, api_version: e.target.value })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProviderDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveProvider} 
            variant="contained"
            disabled={!providerForm.api_key || loading}
          >
            Save Provider
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Demo Data Dialog */}
      <Dialog open={deleteDemoDialogOpen} onClose={() => setDeleteDemoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Demo Data</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will delete {demoWorkspaces.length} demo workspace(s) and all associated data including documents, chunks, and graphs.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDemoDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteDemoData} 
            variant="contained"
            color="error"
            disabled={loadingDemo}
          >
            Delete Demo Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <TextField
            fullWidth
            label="Type DELETE to confirm"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
            error={deleteConfirmation && deleteConfirmation !== 'DELETE'}
            helperText="Please type DELETE in capital letters to confirm"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteAccount} 
            variant="contained"
            color="error"
            disabled={deleteConfirmation !== 'DELETE' || loading}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}