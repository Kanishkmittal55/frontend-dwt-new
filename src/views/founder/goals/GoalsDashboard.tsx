/**
 * Mission Dashboard
 * Define and track founder missions — pursuits, tracks, and milestones.
 * Uses HTTP for CRUD; Founder Agent (WebSocket) for chat.
 */
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import { IconPlus, IconRobot, IconMessageCircle, IconMessageCircleOff, IconCloudUpload } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import MainCard from '@/ui-component/cards/MainCard';
import usePursuits from './hooks/usePursuits';
import {
  uploadTrackAsset,
  deleteTrackAsset,
  updateTrackAssetRelevance,
  createRadarRun,
  deleteRadarRun
} from '@/api/founder/pursuitsAPI';
import { syncSeeds } from '@/api/founder/founderProfileAPI';
import PursuitCard from './components/PursuitCard';
import CreatePursuitDialog from './components/CreatePursuitDialog';
import CreateTrackDialog from './components/CreateTrackDialog';
import CreateMilestoneDialog from './components/CreateMilestoneDialog';
import ChatInput from '../agent/components/ChatInput';
import ChatMessage from '../agent/components/ChatMessage';
import AgentTypingIndicator from '../agent/components/AgentTypingIndicator';
import StreamingEventBubble from '../agent/components/StreamingEventBubble';
import useFounderAgent from '@/hooks/useFounderAgent';
import { useDiscoveryLive } from '@/contexts/DiscoveryLiveContext';
import { radarRunStreamStore } from '@/stores/radarRunStreamStore';
import type { PursuitWithTracks } from './hooks/usePursuits';

// ============================================================================
// Constants
// ============================================================================

const CHAT_MIN_WIDTH = 280;
const CHAT_MAX_WIDTH = 600;
const CHAT_DEFAULT_WIDTH = 360;

// ============================================================================
// Component
// ============================================================================

export default function GoalsDashboard() {
  const theme = useTheme();
  const { userId } = useAuth();
  const [showCreatePursuit, setShowCreatePursuit] = useState(false);
  const [showCreateTrack, setShowCreateTrack] = useState(false);
  const [trackDialogPursuit, setTrackDialogPursuit] = useState<PursuitWithTracks | null>(null);
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [milestoneDialogTrack, setMilestoneDialogTrack] = useState<{
    pursuit: PursuitWithTracks;
    track: import('./hooks/usePursuits').TrackWithMilestones;
  } | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [chatPanelWidth, setChatPanelWidth] = useState(CHAT_DEFAULT_WIDTH);
  const [syncLoading, setSyncLoading] = useState(false);
  const { invalidateDiscoveries, invalidateRadarRunsByPursuit } = useDiscoveryLive();
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    pursuitsWithTracks,
    activePursuit,
    loading,
    error,
    refetch,
    createPursuit,
    createTrack,
    createMilestone,
    updatePhase,
    completePursuit,
    completeMilestone,
    deletePursuit,
    deleteTrack,
    deleteMilestone,
    updateAssetFromApiResponse
  } = usePursuits({ userId, autoFetch: !!userId });

  const handlePursuitUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRadarDiscoveryIngested = useCallback(
    (pursuitUUID: string) => {
      invalidateDiscoveries(pursuitUUID);
      invalidateRadarRunsByPursuit(pursuitUUID);
    },
    [invalidateDiscoveries, invalidateRadarRunsByPursuit]
  );

  const {
    isConnected,
    connectionState,
    session,
    messages,
    isTyping,
    streamingEvents,
    startSession,
    sendMessage
  } = useFounderAgent({
    autoConnect: true,
    onPursuitUpdated: handlePursuitUpdated,
    onRadarDiscoveryIngested: handleRadarDiscoveryIngested,
    onRadarRunProgress: radarRunStreamStore.addEvent
  });

  const handleCreatePursuit = useCallback(
    async (params: Parameters<typeof createPursuit>[0]) => {
      await createPursuit(params);
    },
    [createPursuit]
  );

  const handleCreateTrack = useCallback(
    async (params: Parameters<typeof createTrack>[1]) => {
      if (!trackDialogPursuit) return;
      await createTrack(trackDialogPursuit.uuid, params);
      setTrackDialogPursuit(null);
      setShowCreateTrack(false);
    },
    [createTrack, trackDialogPursuit]
  );

  const openCreateTrack = useCallback((pursuit: PursuitWithTracks) => {
    setTrackDialogPursuit(pursuit);
    setShowCreateTrack(true);
  }, []);

  const openCreateMilestone = useCallback(
    (pursuit: PursuitWithTracks, track: import('./hooks/usePursuits').TrackWithMilestones) => {
      setMilestoneDialogTrack({ pursuit, track });
      setShowCreateMilestone(true);
    },
    []
  );

  const handleUploadAsset = useCallback(
    async (pursuitUUID: string, trackUUID: string, file: File) => {
      if (!userId) return;
      await uploadTrackAsset(userId, pursuitUUID, trackUUID, file);
      handlePursuitUpdated();
    },
    [userId, handlePursuitUpdated]
  );

  const handleDeleteAsset = useCallback(
    async (pursuitUUID: string, trackUUID: string, assetUUID: string) => {
      if (!userId) return;
      await deleteTrackAsset(userId, pursuitUUID, trackUUID, assetUUID);
      handlePursuitUpdated();
    },
    [userId, handlePursuitUpdated]
  );

  const handleRunDiscovery = useCallback(
    async (pursuitUUID: string, trackUUID: string) => {
      if (!userId) return;
      await createRadarRun(userId, pursuitUUID, trackUUID);
      handlePursuitUpdated();
      invalidateRadarRunsByPursuit(pursuitUUID);
    },
    [userId, handlePursuitUpdated, invalidateRadarRunsByPursuit]
  );

  const handleDeleteRadarRun = useCallback(
    async (
      pursuitUUID: string,
      trackUUID: string,
      runUUID: string
    ) => {
      if (!userId) return;
      await deleteRadarRun(userId, pursuitUUID, trackUUID, runUUID);
      invalidateRadarRunsByPursuit(pursuitUUID);
    },
    [userId, invalidateRadarRunsByPursuit]
  );

  const handleUpdateAssetRelevance = useCallback(
    async (
      pursuitUUID: string,
      trackUUID: string,
      assetUUID: string,
      enabled: boolean
    ) => {
      if (!userId) return;
      const asset = await updateTrackAssetRelevance(
        userId,
        pursuitUUID,
        trackUUID,
        assetUUID,
        enabled
      );
      // Use API response (includes extracted_text) to update local state — no refetch needed
      updateAssetFromApiResponse(asset);
    },
    [userId, updateAssetFromApiResponse]
  );

  const handleCreateMilestone = useCallback(
    async (params: Parameters<typeof createMilestone>[2]) => {
      if (!milestoneDialogTrack) return;
      const { pursuit, track } = milestoneDialogTrack;
      await createMilestone(pursuit.uuid, track.uuid, params);
      setMilestoneDialogTrack(null);
      setShowCreateMilestone(false);
    },
    [createMilestone, milestoneDialogTrack]
  );

  const handleSyncToCsv = useCallback(async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const result = await syncSeeds();
      const total = result.results?.reduce((sum, r) => sum + (r.exported ?? 0), 0) ?? 0;
      setSyncMessage({
        type: 'success',
        text: `Synced ${result.results?.length ?? 0} tables (${total} rows) in ${result.total_time ?? '0s'}`
      });
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to sync to CSV'
      });
    } finally {
      setSyncLoading(false);
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatPanelWidth;
    const onMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      let newWidth = startWidth + deltaX;
      newWidth = Math.max(CHAT_MIN_WIDTH, Math.min(CHAT_MAX_WIDTH, newWidth));
      setChatPanelWidth(newWidth);
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [chatPanelWidth]);

  // Auto-start session when connected (Mission page keeps agent connected)
  useEffect(() => {
    if (!userId || !isConnected || session) return;
    startSession('learning', activePursuit?.uuid).catch(console.error);
  }, [userId, isConnected, session, activePursuit?.uuid, startSession]);

  if (!userId) {
    return (
      <MainCard title="Mission">
        <Alert severity="info">Please log in to view your missions.</Alert>
      </MainCard>
    );
  }

  return (
    <Box
      sx={{
        height: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 136px)' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <MainCard
        title="Mission"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        contentSX={{
          flex: 1,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          '&:last-child': { pb: 0 }
        }}
        secondary={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Sync DB to CSV (save changes to seed files)">
              <span>
                <IconButton
                  onClick={handleSyncToCsv}
                  disabled={syncLoading}
                  size="small"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {syncLoading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <IconCloudUpload size={18} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={showChatPanel ? 'Hide Founder Agent' : 'Show Founder Agent'}>
              <IconButton
                onClick={() => setShowChatPanel(!showChatPanel)}
                size="small"
                sx={{
                  color: showChatPanel ? theme.palette.primary.main : theme.palette.text.secondary,
                  bgcolor: showChatPanel ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                {showChatPanel ? <IconMessageCircle size={18} /> : <IconMessageCircleOff size={18} />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => setShowCreatePursuit(true)}
            >
              New Pursuit
            </Button>
          </Stack>
        }
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          {syncMessage && (
            <Alert
              severity={syncMessage.type}
              onClose={() => setSyncMessage(null)}
              sx={{ mx: 2, mt: 1, flexShrink: 0 }}
            >
              {syncMessage.text}
            </Alert>
          )}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              minHeight: 0
            }}
          >
          {/* Left: Pursuits content */}
          <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
            {/* Only show loading spinner on initial load; keep pursuits visible during refetch to avoid collapsing expanded sections */}
            {loading && pursuitsWithTracks.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => refetch()}>
                {error}
              </Alert>
            )}

            {!loading && !error && pursuitsWithTracks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  No pursuits yet. Define your first mission to get started.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => setShowCreatePursuit(true)}
                >
                  New Pursuit
                </Button>
              </Box>
            )}

            {!loading && pursuitsWithTracks.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {activePursuit && (
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Active: {activePursuit.title} ({activePursuit.goal_type})
                  </Typography>
                )}
                {pursuitsWithTracks.map((p) => (
                  <PursuitCard
                    key={p.uuid}
                    pursuit={p}
                    userId={userId}
                    onUpdatePhase={updatePhase}
                    onCompletePursuit={completePursuit}
                    onDeletePursuit={deletePursuit}
                    onCompleteMilestone={completeMilestone}
                    onAddTrack={() => openCreateTrack(p)}
                    onAddMilestone={openCreateMilestone}
                    onDeleteTrack={deleteTrack}
                    onDeleteMilestone={deleteMilestone}
                    onUploadAsset={handleUploadAsset}
                    onDeleteAsset={handleDeleteAsset}
                    onUpdateAssetRelevance={handleUpdateAssetRelevance}
                    onRunDiscovery={handleRunDiscovery}
                    onDeleteRadarRun={handleDeleteRadarRun}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Resize handle + Founder Agent panel (right-side chat) */}
          {showChatPanel && (
            <>
              <Box
                onMouseDown={handleResizeStart}
                sx={{
                  width: 6,
                  flexShrink: 0,
                  cursor: 'col-resize',
                  bgcolor: theme.palette.divider,
                  '&:hover': { bgcolor: theme.palette.primary.main, opacity: 0.5 }
                }}
                role="separator"
                aria-label="Resize Founder Agent panel"
              />
              <Slide direction="left" in={showChatPanel}>
                <Box
                  sx={{
                    width: chatPanelWidth,
                    minWidth: CHAT_MIN_WIDTH,
                    maxWidth: CHAT_MAX_WIDTH,
                    height: '100%',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.background.paper,
                    overflow: 'hidden',
                    borderLeft: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <IconRobot size={20} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Founder Agent
                    </Typography>
                    {connectionState === 'connected' && (
                      <Typography variant="caption" color="success.main">
                        Connected
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2 }}>
                    {!isConnected && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {connectionState === 'connecting' || connectionState === 'reconnecting'
                            ? 'Connecting...'
                            : 'Connecting to Founder Agent...'}
                        </Typography>
                        {(connectionState === 'connecting' || connectionState === 'reconnecting') && (
                          <CircularProgress size={16} sx={{ ml: 1 }} />
                        )}
                      </Box>
                    )}
                    {isConnected && (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, minHeight: 0 }}>
                          {messages.length === 0 && !isTyping && (
                            <Typography variant="body2" color="text.secondary">
                              Ask the agent about your pursuits, goals, or next steps.
                            </Typography>
                          )}
                          {messages.map((m) => (
                            <ChatMessage key={m.id} message={m} />
                          ))}
                          {streamingEvents.map((e) => (
                            <StreamingEventBubble key={e.id} event={e} />
                          ))}
                          {isTyping && <AgentTypingIndicator />}
                        </Box>
                        <ChatInput onSend={sendMessage} placeholder="Ask about your mission..." />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Slide>
            </>
          )}
          </Box>
        </Box>
      </MainCard>

      <CreatePursuitDialog
        open={showCreatePursuit}
        onClose={() => setShowCreatePursuit(false)}
        onCreate={handleCreatePursuit}
      />

      <CreateTrackDialog
        open={showCreateTrack}
        pursuitTitle={trackDialogPursuit?.title ?? ''}
        onClose={() => {
          setShowCreateTrack(false);
          setTrackDialogPursuit(null);
        }}
        onCreate={handleCreateTrack}
      />

      <CreateMilestoneDialog
        open={showCreateMilestone}
        trackTitle={milestoneDialogTrack?.track.title ?? ''}
        onClose={() => {
          setShowCreateMilestone(false);
          setMilestoneDialogTrack(null);
        }}
        onCreate={handleCreateMilestone}
      />
    </Box>
  );
}
