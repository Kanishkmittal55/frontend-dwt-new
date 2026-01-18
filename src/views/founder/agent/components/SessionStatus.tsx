/**
 * SessionStatus Component
 * Displays current session domain, state, and connection status
 */
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { IconPlugConnected, IconPlugConnectedX, IconLoader } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import type { ConnectionState, AgentSession } from '@/api/founder/agentAPI';

interface SessionStatusProps {
  connectionState: ConnectionState;
  session: AgentSession | null;
}

const connectionColors: Record<ConnectionState, 'success' | 'error' | 'warning' | 'default'> = {
  connected: 'success',
  disconnected: 'error',
  connecting: 'warning',
  reconnecting: 'warning'
};

const connectionLabels: Record<ConnectionState, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...'
};

const domainLabels: Record<string, string> = {
  learning: '📚 Learning',
  habit_breaking: '🎯 Habit Coach'
};

const stateLabels: Record<string, string> = {
  // Learning states
  idle: 'Ready',
  reading: 'Reading',
  quiz: 'Quiz',
  review: 'Review',
  practice: 'Practice',
  // TTM states
  precontemplation: 'Awareness',
  contemplation: 'Considering',
  preparation: 'Planning',
  action: 'In Action',
  maintenance: 'Maintaining'
};

export default function SessionStatus({ connectionState, session }: SessionStatusProps) {
  const theme = useTheme();

  const ConnectionIcon = connectionState === 'connected' 
    ? IconPlugConnected 
    : connectionState === 'disconnected' 
      ? IconPlugConnectedX 
      : IconLoader;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Connection Status */}
      <Chip
        icon={<ConnectionIcon size={16} />}
        label={connectionLabels[connectionState]}
        color={connectionColors[connectionState]}
        size="small"
        variant="outlined"
      />

      {/* Session Info */}
      {session && (
        <>
          <Chip
            label={domainLabels[session.domain] || session.domain}
            size="small"
            color="primary"
          />
          <Chip
            label={stateLabels[session.currentState] || session.currentState}
            size="small"
            variant="outlined"
          />
          {session.goalId && (
            <Typography variant="caption" color="text.secondary">
              Goal: {session.goalId}
            </Typography>
          )}
        </>
      )}

      {!session && connectionState === 'connected' && (
        <Typography variant="caption" color="text.secondary">
          No active session - Start a session to begin
        </Typography>
      )}
    </Box>
  );
}

