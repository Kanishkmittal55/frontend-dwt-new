/**
 * AgentChat View
 * Main chat interface for the Founder Agent
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { IconBook, IconTarget, IconRefresh } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

import MainCard from '@/ui-component/cards/MainCard';
import useFounderAgent from '@/hooks/useFounderAgent';
import type { AgentDomain, MilestonePayload, ErrorPayload } from '@/api/founder/schemas';

import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import AgentTypingIndicator from './components/AgentTypingIndicator';
import SessionStatus from './components/SessionStatus';

export default function AgentChat() {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Session start dialog state
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<AgentDomain>('learning');
  const [goalId, setGoalId] = useState('');
  
  // Notifications
  const [milestone, setMilestone] = useState<MilestonePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Agent hook
  const {
    connectionState,
    isConnected,
    session,
    messages,
    isTyping,
    connect,
    disconnect,
    startSession,
    endSession,
    sendMessage,
    clearMessages
  } = useFounderAgent({
    onError: (err: ErrorPayload) => setError(err.message)
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Connect on mount (only if user is logged in)
  // Empty deps array - run only once, ignore StrictMode double-mount
  useEffect(() => {
    const userId = localStorage.getItem('founder_user_id');
    if (!userId) {
      setError('Please log in to use the AI Agent');
      return;
    }

    // Check if already connected (handles StrictMode re-mount)
    if (isConnected) {
      return;
    }

    connect().catch((err) => {
      console.error('[AgentChat] Failed to connect:', err);
      setError('Failed to connect to agent. Is the backend running?');
    });
    
    // No cleanup - WebSocket client handles its own lifecycle
    // Disconnecting on cleanup causes issues with React StrictMode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle start session
  const handleStartSession = useCallback(async () => {
    try {
      await startSession(selectedDomain, goalId || undefined);
      setShowStartDialog(false);
      clearMessages();
    } catch (err) {
      setError('Failed to start session');
    }
  }, [startSession, selectedDomain, goalId, clearMessages]);

  // Handle end session
  const handleEndSession = useCallback(async () => {
    try {
      await endSession();
    } catch (err) {
      setError('Failed to end session');
    }
  }, [endSession]);

  // Handle reconnect
  const handleReconnect = useCallback(async () => {
    try {
      await connect();
    } catch (err) {
      setError('Failed to reconnect');
    }
  }, [connect]);

  return (
    <MainCard title="Founder Agent" secondary={
      <Box sx={{ display: 'flex', gap: 1 }}>
        {!session && isConnected && (
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowStartDialog(true)}
          >
            Start Session
          </Button>
        )}
        {session && (
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={handleEndSession}
          >
            End Session
          </Button>
        )}
        {connectionState === 'disconnected' && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconRefresh size={16} />}
            onClick={handleReconnect}
          >
            Reconnect
          </Button>
        )}
      </Box>
    }>
      <Card
        sx={{
          height: 'calc(100vh - 240px)',
          minHeight: 500,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Session Status Bar */}
        <SessionStatus connectionState={connectionState} session={session} />

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: theme.palette.grey[50]
          }}
        >
          {messages.length === 0 && !isTyping && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary'
              }}
            >
              {!session ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Welcome to Founder Agent
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400, mb: 2 }}>
                    Start a session to begin chatting with your AI learning assistant or habit coach.
                  </Typography>
                  <ButtonGroup variant="outlined">
                    <Button
                      startIcon={<IconBook size={18} />}
                      onClick={() => {
                        setSelectedDomain('learning');
                        setShowStartDialog(true);
                      }}
                    >
                      Learning
                    </Button>
                    <Button
                      startIcon={<IconTarget size={18} />}
                      onClick={() => {
                        setSelectedDomain('habit_breaking');
                        setShowStartDialog(true);
                      }}
                    >
                      Habit Coach
                    </Button>
                  </ButtonGroup>
                </>
              ) : (
                <Typography variant="body2">
                  Session started! Send a message to begin.
                </Typography>
              )}
            </Box>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && <AgentTypingIndicator agentName={session?.domain === 'learning' ? 'Learning Agent' : 'Habit Coach'} />}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <ChatInput
          onSend={sendMessage}
          disabled={!session || !isConnected}
          placeholder={session ? 'Ask me anything...' : 'Start a session to chat'}
        />
      </Card>

      {/* Start Session Dialog */}
      <Dialog open={showStartDialog} onClose={() => setShowStartDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start Agent Session</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as AgentDomain)}
              fullWidth
            >
              <MenuItem value="learning">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconBook size={18} />
                  Learning (CLRS)
                </Box>
              </MenuItem>
              <MenuItem value="habit_breaking">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconTarget size={18} />
                  Habit Coach (TTM)
                </Box>
              </MenuItem>
            </TextField>
            <TextField
              label="Goal ID (optional)"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              placeholder={selectedDomain === 'learning' ? 'e.g., clrs-ch1' : 'e.g., quit-smoking'}
              fullWidth
              helperText={selectedDomain === 'learning' 
                ? 'Chapter or topic you want to learn'
                : 'Habit you want to work on'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStartDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStartSession}>
            Start
          </Button>
        </DialogActions>
      </Dialog>

      {/* Milestone Snackbar */}
      <Snackbar
        open={!!milestone}
        autoHideDuration={6000}
        onClose={() => setMilestone(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setMilestone(null)}>
          🎉 {milestone?.title}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}

