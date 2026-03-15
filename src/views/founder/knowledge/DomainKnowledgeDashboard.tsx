/**
 * Domain Knowledge Dashboard — Curated skill taxonomies (Docker, Go, etc.)
 * Clickable cards open the NeuralMap graph for each domain.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

// MUI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';

// Icons
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';

// API
import {
  getDomainKnowledgeList,
  getDomainKnowledgeGraph,
  getDomainKnowledgeFounderGraph,
  getDomainKnowledgeMetrics,
  createDomainKnowledge,
  updateDomainKnowledge,
  deleteDomainKnowledge,
  generateDomainKnowledgeAssessment,
  startDomainKnowledgeAssessment,
  verifyDomainKnowledgeAssessment,
  endDomainKnowledgeAssessment
} from 'api/founder/knowledgeAPI';
import { syncSeeds } from 'api/founder';
import type {
  DomainKnowledgeListResponse,
  DomainKnowledgeGraphResponse,
  DomainKnowledgeFounderGraphResponse,
  DomainKnowledgeAssessmentGenerateResponse,
  DomainKnowledgeAssessmentScenario
} from 'api/founder/knowledgeAPI';
import type { GraphColorMode } from './DomainKnowledgeAssessmentChatView';
import type { CreateDomainKnowledgeRequest } from '@/api/founder/schemas';
import { getStoredUserId } from 'api/founder/founderClient';

// Hooks
import useFounderAgent from '@/hooks/useFounderAgent';

// Sub-components
import DomainKnowledgeNeuralMap from './DomainKnowledgeNeuralMap';
import DomainKnowledgeManageTab from './DomainKnowledgeManageTab';
import CreateDomainDialog from './CreateDomainDialog';
import EditDomainDialog from './EditDomainDialog';
import DeleteDomainConfirmDialog from './DeleteDomainConfirmDialog';
import DomainKnowledgeAssessmentDialog from './DomainKnowledgeAssessmentDialog';
import DomainKnowledgeAssessmentConfigDialog, {
  type AssessmentConfigOverrides
} from './DomainKnowledgeAssessmentConfigDialog';
import DomainKnowledgeAssessmentModeDialog, { type AssessmentMode } from './DomainKnowledgeAssessmentModeDialog';
import DomainKnowledgeAssessmentView, {
  type AssessmentSession
} from './DomainKnowledgeAssessmentView';
import DomainKnowledgeAssessmentChatView from './DomainKnowledgeAssessmentChatView';
import DomainKnowledgeMetricsDialog from './DomainKnowledgeMetricsDialog';

// Icons (additional)
import QuizIcon from '@mui/icons-material/Quiz';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

// ============================================================================
// Domain icon mapping
// ============================================================================
const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  docker: <StorageIcon sx={{ fontSize: 40 }} />,
  golang: <CodeIcon sx={{ fontSize: 40 }} />,
  default: <BubbleChartIcon sx={{ fontSize: 40 }} />
};

function getDomainIcon(slug: string): React.ReactNode {
  return DOMAIN_ICONS[slug] ?? DOMAIN_ICONS.default;
}

// localStorage key for active assessment (enables resume after page refresh)
const ACTIVE_ASSESSMENT_STORAGE_KEY = 'founder_active_assessment';

interface StoredActiveAssessment {
  sessionId: string;
  sessionUrl: string;
  slug: string;
  domainName: string;
  scenario: DomainKnowledgeAssessmentScenario;
}

function loadStoredActiveAssessment(): StoredActiveAssessment | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ASSESSMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveAssessment;
    if (
      parsed &&
      typeof parsed.sessionId === 'string' &&
      typeof parsed.sessionUrl === 'string' &&
      typeof parsed.slug === 'string' &&
      typeof parsed.domainName === 'string' &&
      parsed.scenario &&
      typeof parsed.scenario.id === 'string'
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveStoredActiveAssessment(data: StoredActiveAssessment): void {
  try {
    localStorage.setItem(ACTIVE_ASSESSMENT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function clearStoredActiveAssessment(): void {
  try {
    localStorage.removeItem(ACTIVE_ASSESSMENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ============================================================================
// Component
// ============================================================================
export default function DomainKnowledgeDashboard() {
  const [domains, setDomains] = useState<DomainKnowledgeListResponse['domains']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [graph, setGraph] = useState<DomainKnowledgeGraphResponse | DomainKnowledgeFounderGraphResponse | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [graphColorMode, setGraphColorMode] = useState<GraphColorMode>('difficulty');

  const [assessment, setAssessment] = useState<DomainKnowledgeAssessmentGenerateResponse | null>(null);
  const [assessmentSlug, setAssessmentSlug] = useState<string | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogSlug, setConfigDialogSlug] = useState<string | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [modeDialogSlug, setModeDialogSlug] = useState<string | null>(null);
  const [chatAssessmentSlug, setChatAssessmentSlug] = useState<string | null>(null);
  const [chatAssessmentDomainName, setChatAssessmentDomainName] = useState<string | null>(null);

  const [activeAssessment, setActiveAssessment] = useState<AssessmentSession | null>(null);
  const [endingAssessment, setEndingAssessment] = useState(false);
  const [doneSnackbar, setDoneSnackbar] = useState(false);
  const [endErrorSnackbar, setEndErrorSnackbar] = useState<string | null>(null);
  const [metricsDialogSlug, setMetricsDialogSlug] = useState<string | null>(null);
  const [createDomainOpen, setCreateDomainOpen] = useState(false);
  const [editDomainOpen, setEditDomainOpen] = useState(false);
  const [editDomainSlug, setEditDomainSlug] = useState<string | null>(null);
  const [deleteDomainOpen, setDeleteDomainOpen] = useState(false);
  const [deleteDomainSlug, setDeleteDomainSlug] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState(0); // 0 = graph, 1 = manage
  const [syncing, setSyncing] = useState(false);
  const [syncNotification, setSyncNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const terminalIframeRef = useRef<HTMLIFrameElement>(null);
  const founderAgent = useFounderAgent({
    onTerminalInput: (cmd) =>
      terminalIframeRef.current?.contentWindow?.postMessage(
        { type: 'terminal_input', command: cmd },
        '*'
      )
  });
  const { isConnected, connectionState, session: agentSession, connect, startSession, endSession } = founderAgent;
  const userId = getStoredUserId();

  // Block navigation while assessment is active — user must complete or end gracefully
  const blocker = useBlocker(!!activeAssessment || !!chatAssessmentSlug);

  // Warn on tab close / reload during active assessment
  useEffect(() => {
    if (!activeAssessment && !chatAssessmentSlug) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active knowledge assessment. End it first to avoid leaving resources running.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeAssessment, chatAssessmentSlug]);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDomainKnowledgeList(userId ?? undefined);
      setDomains(res.domains ?? []);

      // Restore active assessment after page refresh
      const apiActive = res.active_assessment;
      if (apiActive && userId) {
        const stored = loadStoredActiveAssessment();
        if (stored && stored.sessionId === apiActive.session_id && stored.slug === apiActive.slug) {
          // Full restore: we have scenario from localStorage
          setActiveAssessment({
            sessionId: stored.sessionId,
            sessionUrl: stored.sessionUrl,
            slug: stored.slug,
            domainName: stored.domainName,
            scenario: stored.scenario
          });
        } else {
          // Partial restore: API says active but no matching localStorage (e.g. different device)
          // Show terminal + End only (no Verify)
          setActiveAssessment({
            sessionId: apiActive.session_id,
            sessionUrl: apiActive.session_url,
            slug: apiActive.slug,
            domainName: apiActive.domain_name
            // scenario omitted — user can only End, not Verify
          });
        }
      } else {
        clearStoredActiveAssessment(); // No active assessment, clear stale data
      }
    } catch (err) {
      console.error('[DomainKnowledgeDashboard] load error:', err);
      setError(err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  // Reconnect and start session when restoring active assessment after page reload
  useEffect(() => {
    if (!activeAssessment || !userId) return;
    const ensureReady = async () => {
      if (connectionState === 'disconnected') {
        await connect().catch((err) => {
          console.error('[DomainKnowledgeDashboard] reconnect failed:', err);
        });
      }
      if (isConnected && !agentSession) {
        await startSession('learning').catch((err) => {
          console.error('[DomainKnowledgeDashboard] startSession failed:', err);
        });
      }
    };
    ensureReady();
  }, [activeAssessment, userId, connectionState, isConnected, agentSession, connect, startSession]);

  const handleMetricsClick = useCallback((e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    setMetricsDialogSlug(slug);
  }, []);

  const loadGraph = useCallback(
    async (slug: string, colorMode: GraphColorMode) => {
      setGraph(null);
      setGraphError(null);
      setGraphLoading(true);
      try {
        const g =
          colorMode === 'coverage' && userId && userId > 0
            ? await getDomainKnowledgeFounderGraph(slug, userId)
            : await getDomainKnowledgeGraph(slug);
        setGraph(g);
      } catch (err) {
        console.error('[DomainKnowledgeDashboard] graph error:', err);
        setGraphError(
          err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Failed to load graph'
        );
      } finally {
        setGraphLoading(false);
      }
    },
    [userId]
  );

  const handleCardClick = useCallback(
    async (slug: string) => {
      setSelectedSlug(slug);
      await loadGraph(slug, graphColorMode);
    },
    [loadGraph, graphColorMode]
  );

  const handleGraphColorModeChange = useCallback(
    (mode: GraphColorMode) => {
      setGraphColorMode(mode);
      if (selectedSlug) loadGraph(selectedSlug, mode);
    },
    [selectedSlug, loadGraph]
  );

  const handleCloseDialog = useCallback(() => {
    setSelectedSlug(null);
    setGraph(null);
    setGraphError(null);
    setDetailTab(0);
  }, []);

  const handleSyncSeeds = useCallback(async () => {
    setSyncing(true);
    setSyncNotification(null);
    try {
      const result = await syncSeeds();
      const tableCount = result.results?.length || 0;
      setSyncNotification({
        type: 'success',
        message: `Synced ${tableCount} tables to CSV in ${result.total_time ?? 'N/A'}`
      });
    } catch (err) {
      console.error('[DomainKnowledgeDashboard] Sync failed:', err);
      setSyncNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to sync to CSV'
      });
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleCreateDomain = useCallback(
    async (params: CreateDomainKnowledgeRequest) => {
      await createDomainKnowledge(params);
      loadDomains();
      setCreateDomainOpen(false);
    },
    [loadDomains]
  );

  const handleEditDomain = useCallback(
    async (params: { name?: string; description?: string }) => {
      if (!editDomainSlug) return;
      await updateDomainKnowledge(editDomainSlug, params);
      loadDomains();
      setEditDomainOpen(false);
      setEditDomainSlug(null);
      if (selectedSlug === editDomainSlug) {
        setGraph(null);
        setGraphError(null);
      }
    },
    [editDomainSlug, loadDomains, selectedSlug]
  );

  const handleDeleteDomain = useCallback(async () => {
    if (!deleteDomainSlug) return;
    await deleteDomainKnowledge(deleteDomainSlug);
    loadDomains();
    setDeleteDomainOpen(false);
    setDeleteDomainSlug(null);
    if (selectedSlug === deleteDomainSlug) {
      handleCloseDialog();
    }
  }, [deleteDomainSlug, loadDomains, selectedSlug, handleCloseDialog]);

  const handleTestKnowledgeClick = useCallback((e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    setModeDialogSlug(slug);
    setModeDialogOpen(true);
    setAssessmentError(null);
  }, []);

  const handleModeSelect = useCallback(
    (mode: AssessmentMode) => {
      if (!modeDialogSlug) return;
      const domainName = domains.find((d) => d.slug === modeDialogSlug)?.name ?? modeDialogSlug;
      setModeDialogOpen(false);
      if (mode === 'rig') {
        setConfigDialogSlug(modeDialogSlug);
        setConfigDialogOpen(true);
        setModeDialogSlug(null);
      } else {
        setChatAssessmentSlug(modeDialogSlug);
        setChatAssessmentDomainName(domainName);
        setModeDialogSlug(null);
      }
    },
    [modeDialogSlug, domains]
  );

  const handleCloseModeDialog = useCallback(() => {
    setModeDialogOpen(false);
    setModeDialogSlug(null);
  }, []);

  const handleDoneChatAssessment = useCallback(async () => {
    setChatAssessmentSlug(null);
    setChatAssessmentDomainName(null);
    setDoneSnackbar(true);
    loadDomains();
  }, [loadDomains]);

  const handleCloseConfigDialog = useCallback(() => {
    setConfigDialogOpen(false);
    setConfigDialogSlug(null);
  }, []);

  const handleGenerateFromConfig = useCallback(
    async (overrides: AssessmentConfigOverrides) => {
      if (!configDialogSlug) return;
      setAssessmentSlug(configDialogSlug);
      setAssessment(null);
      setAssessmentError(null);
      setAssessmentLoading(true);

      try {
        const res = await generateDomainKnowledgeAssessment(configDialogSlug, overrides, userId ?? undefined);
        setAssessment(res);
        setConfigDialogOpen(false);
        setConfigDialogSlug(null);
      } catch (err) {
        console.error('[DomainKnowledgeDashboard] assessment error:', err);
        setAssessmentError(
          err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Failed to generate assessment'
        );
      } finally {
        setAssessmentLoading(false);
      }
    },
    [configDialogSlug, userId]
  );

  const handleCloseAssessmentDialog = useCallback(() => {
    setAssessmentSlug(null);
    setAssessment(null);
    setAssessmentError(null);
  }, []);

  const handleStartScenario = useCallback(
    async (scenario: DomainKnowledgeAssessmentScenario): Promise<{ sessionId: string; sessionUrl: string; slug: string }> => {
      const slug = assessmentSlug;
      const userId = getStoredUserId();
      if (!slug || !userId) {
        throw new Error('Missing domain or user. Please log in.');
      }

      if (!isConnected) {
        await connect();
      }
      if (!agentSession) {
        await startSession('learning');
      }

      const res = await startDomainKnowledgeAssessment(slug, userId, scenario);
      const domainName = domains.find((d) => d.slug === slug)?.name ?? slug;
      const session: AssessmentSession = {
        sessionId: res.session_id,
        sessionUrl: res.session_url,
        slug,
        domainName,
        scenario
      };
      setActiveAssessment(session);
      saveStoredActiveAssessment({
        sessionId: res.session_id,
        sessionUrl: res.session_url,
        slug,
        domainName,
        scenario
      });
      setAssessmentSlug(null);
      setAssessment(null);
      return { sessionId: res.session_id, sessionUrl: res.session_url, slug };
    },
    [assessmentSlug, domains, isConnected, agentSession, connect, startSession]
  );

  const handleDoneAssessment = useCallback(
    async (verifyResult?: { passed: boolean; score: number; feedback: string[] }) => {
      if (!activeAssessment) return;
      const uid = getStoredUserId();
      if (!uid) return;

      setEndingAssessment(true);
      try {
        // End rig session (stops container, captures log). Pass verify results to store in DB.
        await endDomainKnowledgeAssessment(
          activeAssessment.slug,
          activeAssessment.sessionId,
          uid,
          verifyResult
        );
        // End agent session to release WebSocket and any orphan processes
        await endSession();
        clearStoredActiveAssessment();
        setDoneSnackbar(true);
        setActiveAssessment(null);
        loadDomains(); // Refresh to show new metrics
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to end assessment';
        setAssessmentError(msg);
        setEndErrorSnackbar(msg);
        // Clear state so user can navigate away even when End fails (avoids being stuck)
        clearStoredActiveAssessment();
        setActiveAssessment(null);
        loadDomains();
      } finally {
        setEndingAssessment(false);
      }
    },
    [activeAssessment, loadDomains, endSession]
  );

  // ========== Render ==========
  if (chatAssessmentSlug && chatAssessmentDomainName) {
    return (
      <>
        <DomainKnowledgeAssessmentChatView
          slug={chatAssessmentSlug}
          domainName={chatAssessmentDomainName}
          userId={userId ?? undefined}
          onDone={handleDoneChatAssessment}
          onError={setAssessmentError}
        />
        <Snackbar
          open={doneSnackbar}
          autoHideDuration={4000}
          onClose={() => setDoneSnackbar(false)}
          message="Assessment complete"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
        <Snackbar
          open={blocker.state === 'blocked'}
          autoHideDuration={4000}
          onClose={() => {
            if (blocker.state === 'blocked' && typeof blocker.reset === 'function') blocker.reset();
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            onClose={() => {
              if (blocker.state === 'blocked' && typeof blocker.reset === 'function') blocker.reset();
            }}
          >
            End your assessment first to navigate away
          </Alert>
        </Snackbar>
      </>
    );
  }

  if (activeAssessment) {
    return (
      <>
        <DomainKnowledgeAssessmentView
          session={activeAssessment}
          onDone={handleDoneAssessment}
          isEnding={endingAssessment}
          onError={setAssessmentError}
          founderAgent={founderAgent}
          terminalIframeRef={terminalIframeRef}
        />
        <Snackbar
          open={doneSnackbar}
          autoHideDuration={4000}
          onClose={() => setDoneSnackbar(false)}
          message="Assessment complete"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
        <Snackbar
          open={blocker.state === 'blocked'}
          autoHideDuration={4000}
          onClose={() => {
            if (blocker.state === 'blocked' && typeof blocker.reset === 'function') blocker.reset();
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            onClose={() => {
              if (blocker.state === 'blocked' && typeof blocker.reset === 'function') blocker.reset();
            }}
          >
            End your assessment first to navigate away
          </Alert>
        </Snackbar>
      </>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (domains.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <BubbleChartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No domain knowledge graphs yet
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Create your first domain to get started (e.g. Docker, Go, Kubernetes).
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDomainOpen(true)}
        >
          Create domain
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Domain Knowledge
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Curated skill taxonomies — explore concept graphs for each domain
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={syncing ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSyncSeeds}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync to CSV'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDomainOpen(true)}
          >
            Create domain
          </Button>
        </Box>
      </Box>

      {/* Sync notification */}
      <Snackbar
        open={!!syncNotification}
        autoHideDuration={5000}
        onClose={() => setSyncNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={syncNotification?.type ?? 'info'}
          onClose={() => setSyncNotification(null)}
          sx={{ width: '100%' }}
        >
          {syncNotification?.message}
        </Alert>
      </Snackbar>

      {/* Domain cards */}
      <Grid container spacing={2}>
        {domains.map((d) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={d.slug}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: 4,
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 72,
                    height: 72,
                    mx: 'auto',
                    mb: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                  }}
                >
                  {getDomainIcon(d.slug)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {d.name}
                </Typography>
                {d.skill_score_pct != null && (
                  <Chip
                    label={`${d.skill_score_pct}%`}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                )}
                {d.description && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {d.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 1.5 }}>
                  <Chip
                    label="View graph"
                    size="small"
                    onClick={() => handleCardClick(d.slug)}
                    icon={<BubbleChartIcon sx={{ fontSize: 16 }} />}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Manage"
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      handleCardClick(d.slug);
                      setDetailTab(1);
                    }}
                    icon={<SettingsIcon sx={{ fontSize: 16 }} />}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Metrics"
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleMetricsClick(e, d.slug)}
                    icon={<BarChartIcon sx={{ fontSize: 16 }} />}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Test knowledge"
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleTestKnowledgeClick(e, d.slug)}
                    icon={<QuizIcon sx={{ fontSize: 16 }} />}
                    sx={{ cursor: 'pointer' }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditDomainSlug(d.slug);
                      setEditDomainOpen(true);
                    }}
                    sx={{ ml: 0.5 }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDomainSlug(d.slug);
                      setDeleteDomainOpen(true);
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Graph / Manage dialog */}
      <Dialog
        open={!!selectedSlug}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography variant="h6" component="span">
            {domains.find((d) => d.slug === selectedSlug)?.name ?? selectedSlug}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Graph" />
          <Tab label="Manage" />
        </Tabs>
        <DialogContent dividers>
          {detailTab === 0 && (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Difficulty"
                  size="small"
                  color={graphColorMode === 'difficulty' ? 'primary' : 'default'}
                  variant={graphColorMode === 'difficulty' ? 'filled' : 'outlined'}
                  onClick={() => handleGraphColorModeChange('difficulty')}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Coverage"
                  size="small"
                  color={graphColorMode === 'coverage' ? 'primary' : 'default'}
                  variant={graphColorMode === 'coverage' ? 'filled' : 'outlined'}
                  onClick={() => handleGraphColorModeChange('coverage')}
                  disabled={!userId || userId <= 0}
                  sx={{ cursor: userId && userId > 0 ? 'pointer' : 'default' }}
                />
              </Box>
              {graphLoading && (
                <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 2 }} />
              )}
              {graphError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {graphError}
                </Alert>
              )}
              {graph && !graphLoading && (
                <DomainKnowledgeNeuralMap graph={graph} height={520} colorMode={graphColorMode} />
              )}
            </>
          )}
          {detailTab === 1 && selectedSlug && (
            <DomainKnowledgeManageTab
              slug={selectedSlug}
              domainName={domains.find((d) => d.slug === selectedSlug)?.name ?? selectedSlug}
              onGraphChanged={() => {
                setGraph(null);
                handleCardClick(selectedSlug);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Mode dialog (rig vs chat) */}
      <DomainKnowledgeAssessmentModeDialog
        open={modeDialogOpen}
        onClose={handleCloseModeDialog}
        domainName={domains.find((d) => d.slug === modeDialogSlug)?.name ?? modeDialogSlug ?? ''}
        onSelect={handleModeSelect}
      />

      {/* Config dialog (before generating) */}
      <DomainKnowledgeAssessmentConfigDialog
        open={configDialogOpen}
        onClose={handleCloseConfigDialog}
        domainName={domains.find((d) => d.slug === configDialogSlug)?.name ?? configDialogSlug ?? ''}
        slug={configDialogSlug ?? ''}
        onGenerate={handleGenerateFromConfig}
        generating={assessmentLoading}
        userId={userId ?? undefined}
      />

      {/* Assessment dialog */}
      <DomainKnowledgeAssessmentDialog
        open={!!assessmentSlug && !!assessment}
        onClose={handleCloseAssessmentDialog}
        domainName={domains.find((d) => d.slug === assessmentSlug)?.name ?? assessmentSlug ?? ''}
        slug={assessmentSlug ?? ''}
        scenarios={assessment?.scenarios ?? []}
        totalCount={assessment?.total_count ?? 0}
        onStart={handleStartScenario}
      />

      {/* End error snackbar (when End API failed but we cleared state so user can leave) */}
      <Snackbar
        open={!!endErrorSnackbar}
        autoHideDuration={8000}
        onClose={() => setEndErrorSnackbar(null)}
        message={endErrorSnackbar ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{ sx: { bgcolor: 'error.main', color: 'error.contrastText' } }}
      />

      {/* Metrics dialog */}
      <DomainKnowledgeMetricsDialog
        open={!!metricsDialogSlug}
        onClose={() => setMetricsDialogSlug(null)}
        slug={metricsDialogSlug ?? ''}
        domainName={domains.find((d) => d.slug === metricsDialogSlug)?.name ?? metricsDialogSlug ?? ''}
        userId={userId ?? undefined}
      />

      {/* Create / Edit / Delete domain dialogs */}
      <CreateDomainDialog
        open={createDomainOpen}
        onClose={() => setCreateDomainOpen(false)}
        onCreate={handleCreateDomain}
      />
      <EditDomainDialog
        open={editDomainOpen}
        slug={editDomainSlug ?? ''}
        currentName={domains.find((d) => d.slug === editDomainSlug)?.name ?? ''}
        currentDescription={domains.find((d) => d.slug === editDomainSlug)?.description}
        onClose={() => {
          setEditDomainOpen(false);
          setEditDomainSlug(null);
        }}
        onSave={handleEditDomain}
      />
      <DeleteDomainConfirmDialog
        open={deleteDomainOpen}
        slug={deleteDomainSlug ?? ''}
        name={domains.find((d) => d.slug === deleteDomainSlug)?.name ?? ''}
        onClose={() => {
          setDeleteDomainOpen(false);
          setDeleteDomainSlug(null);
        }}
        onConfirm={handleDeleteDomain}
      />

      {/* Assessment error snackbar / inline */}
      {assessmentSlug && assessmentError && !assessment && (
        <Alert
          severity="error"
          sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1400, maxWidth: 400, mx: 'auto' }}
          onClose={() => {
            setAssessmentError(null);
            setAssessmentSlug(null);
          }}
        >
          {assessmentError}
        </Alert>
      )}
    </Box>
  );
}
