/**
 * DryRunChatDialog — Chat window that runs the chain with execution trace
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import useFounderAgent from '@/hooks/useFounderAgent';
import DryRunChatMessage from './DryRunChatMessage';
import ChatInput from '@/views/founder/agent/components/ChatInput';
import AgentTypingIndicator from '@/views/founder/agent/components/AgentTypingIndicator';
import { IconPlugConnected, IconPlugConnectedX, IconLoader } from '@tabler/icons-react';

interface DryRunChatDialogProps {
  open: boolean;
  onClose: () => void;
  /** Chain task type (e.g. domain_knowledge_assessment) */
  taskType?: string;
  /** Pre-filled domain slug when known */
  defaultSlug?: string;
}

export default function DryRunChatDialog({
  open,
  onClose,
  taskType = 'domain_knowledge_assessment',
  defaultSlug = ''
}: DryRunChatDialogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState(defaultSlug || 'docker');
  const [sessionReady, setSessionReady] = useState(false);

  const founderAgent = useFounderAgent({
    dryRun: true,
    onError: (err) => console.error('[DryRunChat]', err)
  });

  const {
    isConnected,
    session,
    messages,
    isTyping,
    connect,
    startSession,
    sendMessage,
    connectionState,
    clearMessages
  } = founderAgent;

  const ConnectionIcon =
    connectionState === 'connected'
      ? IconPlugConnected
      : connectionState === 'disconnected'
        ? IconPlugConnectedX
        : IconLoader;

  const goalId = `domain_knowledge_assessment:${slug.trim() || 'docker'}`;

  const handleStartSession = useCallback(async () => {
    if (connectionState === 'disconnected') {
      await connect().catch(console.error);
    }
    if (connectionState === 'connected' || isConnected) {
      await startSession('learning', goalId).catch(console.error);
      setSessionReady(true);
    }
  }, [connect, startSession, goalId, connectionState, isConnected]);

  useEffect(() => {
    if (open && connectionState === 'disconnected') {
      connect().catch(console.error);
    }
  }, [open, connectionState, connect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!open) {
      setSessionReady(false);
      clearMessages();
    }
  }, [open, clearMessages]);

  const canChat = isConnected && (session != null || sessionReady);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle>Dry Run — Test flow</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 520 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexShrink: 0, overflow: 'visible', pt: 1, pb: 0.5 }}>
            <TextField
              label="Domain slug"
              size="small"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. docker, golang"
              disabled={session != null}
              sx={{ minWidth: 180 }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={handleStartSession}
              disabled={!slug.trim() || (session != null)}
              startIcon={<ConnectionIcon size={18} />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {session != null ? 'Session active' : 'Start session'}
            </Button>
          </Box>

          {taskType === 'domain_knowledge_assessment' && (
            <Alert severity="info" sx={{ py: 0, flexShrink: 0 }}>
              Uses chain: {taskType}. Goal: {goalId}
            </Alert>
          )}

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 320
            }}
          >
            {messages.map((m) => (
              <DryRunChatMessage key={m.id} message={m} />
            ))}
            {isTyping && <AgentTypingIndicator />}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1, flexShrink: 0 }}>
            <ChatInput
              onSend={sendMessage}
              disabled={!canChat}
              placeholder="Send a message to run the chain..."
              onKickOff={() => sendMessage('Which concepts should I focus on?')}
              kickOffLabel="Start exploring"
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
