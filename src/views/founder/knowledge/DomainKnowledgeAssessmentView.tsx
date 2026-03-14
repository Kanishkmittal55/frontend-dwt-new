/**
 * Domain Knowledge Assessment View
 * Terminal + Founder Agent chat side-by-side during hands-on assessment
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { useTheme } from '@mui/material/styles';

import useFounderAgent, { type UseFounderAgentReturn } from '@/hooks/useFounderAgent';
import ChatMessage from '@/views/founder/agent/components/ChatMessage';
import ChatInput from '@/views/founder/agent/components/ChatInput';
import AgentTypingIndicator from '@/views/founder/agent/components/AgentTypingIndicator';
import VerifyResultCard from '@/views/founder/knowledge/VerifyResultCard';
import { verifyDomainKnowledgeAssessment } from 'api/founder/knowledgeAPI';
import { getStoredUserId } from 'api/founder/founderClient';

import type { DomainKnowledgeAssessmentScenario } from 'api/founder/knowledgeAPI';

export interface AssessmentSession {
  sessionId: string;
  sessionUrl: string;
  slug: string;
  domainName: string;
  /** Scenario required for Verify. When missing (e.g. resume after refresh), only End is available. */
  scenario?: DomainKnowledgeAssessmentScenario;
}

export interface VerifyResult {
  passed: boolean;
  score: number;
  feedback: string[];
}

interface DomainKnowledgeAssessmentViewProps {
  session: AssessmentSession;
  /** Called when user clicks Done. Receives verify result (Verify is called before End). */
  onDone: (verifyResult?: VerifyResult) => void | Promise<void>;
  isEnding?: boolean;
  onError?: (message: string) => void;
  /** Pass founder agent from parent so chat uses same connection/session (required for chat to work) */
  founderAgent?: UseFounderAgentReturn;
  /** Ref for terminal iframe — parent uses it to postMessage commands from agent */
  terminalIframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export default function DomainKnowledgeAssessmentView({
  session,
  onDone,
  isEnding = false,
  onError,
  founderAgent: founderAgentProp,
  terminalIframeRef: terminalIframeRefProp
}: DomainKnowledgeAssessmentViewProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localIframeRef = useRef<HTMLIFrameElement>(null);
  const terminalIframeRef = terminalIframeRefProp ?? localIframeRef;
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyResultCardOpen, setVerifyResultCardOpen] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const internalAgent = useFounderAgent({
    onError: (err) => onError?.(err.message)
  });

  // Use passed founder agent so chat shares connection/session (fixes chat not working)
  const {
    isConnected,
    session: agentSession,
    messages,
    isTyping,
    sendMessage,
    connectionState,
    connect,
    startSession
  } = founderAgentProp ?? internalAgent;

  // Ensure connected and session started when using internal agent (parent passes founderAgent in normal flow)
  useEffect(() => {
    if (founderAgentProp) return;
    const ensureReady = async () => {
      if (connectionState === 'disconnected') {
        await connect().catch((err) => {
          console.error('[AssessmentView] connect failed:', err);
          onError?.('Failed to connect to agent');
        });
      }
      if (isConnected && !agentSession) {
        await startSession('learning').catch((err) => {
          console.error('[AssessmentView] startSession failed:', err);
          onError?.('Failed to start agent session');
        });
      }
    };
    ensureReady();
  }, [founderAgentProp, connectionState, isConnected, agentSession, connect, startSession, onError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleOpenInNewTab = useCallback(() => {
    const wrapperUrl = `${import.meta.env.VITE_APP_BASE_NAME || ''}/founder/terminal?url=${encodeURIComponent(session.sessionUrl)}`;
    window.open(wrapperUrl, '_blank', 'noopener,noreferrer');
  }, [session.sessionUrl]);

  const handleVerify = useCallback(async (): Promise<VerifyResult | null> => {
    if (!session.scenario) return null; // No scenario = resume after refresh, skip Verify
    const uid = getStoredUserId();
    if (!uid) {
      onError?.('Please log in to verify');
      return null;
    }
    setVerifyError(null);
    try {
      const result = await verifyDomainKnowledgeAssessment(
        session.slug,
        session.sessionId,
        uid,
        session.scenario
      );
      const vr: VerifyResult = { passed: result.passed, score: result.score, feedback: result.feedback ?? [] };
      setVerifyResult(vr);
      setVerifyResultCardOpen(true);
      return vr;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setVerifyError(msg);
      onError?.(msg);
      return null;
    }
  }, [session.slug, session.sessionId, session.scenario, onError]);

  const handleVerifyClick = useCallback(async () => {
    setIsVerifying(true);
    try {
      await handleVerify();
    } finally {
      setIsVerifying(false);
    }
  }, [handleVerify]);

  const handleDone = useCallback(async () => {
    const uid = getStoredUserId();
    if (!uid) return;
    // End session; pass verifyResult if user already verified
    await onDone(verifyResult ?? undefined);
  }, [onDone, verifyResult]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        height: 'calc(100vh - 120px)',
        minHeight: 500,
        p: 2
      }}
    >
      {/* Terminal panel */}
      <Card
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'action.hover'
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Terminal — {session.domainName}
          </Typography>
          <IconButton size="small" onClick={handleOpenInNewTab} title="Open in new tab">
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <iframe
            ref={terminalIframeRef}
            src={`${import.meta.env.VITE_APP_BASE_NAME || ''}/founder/terminal?url=${encodeURIComponent(session.sessionUrl)}`}
            title="Assessment terminal"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: 400
            }}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </Box>
      </Card>

      {/* Chat panel */}
      <Card
        sx={{
          flex: { xs: '1 1 auto', md: '0 0 380px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'action.hover'
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Founder Agent — Assessment mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {session.scenario && (
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isVerifying ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <FactCheckIcon fontSize="small" />
                  )
                }
                onClick={handleVerifyClick}
                disabled={isVerifying || isEnding}
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={
                isEnding ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CheckCircleIcon />
                )
              }
              onClick={handleDone}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'Done'}
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: theme.palette.grey[50],
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {verifyError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVerifyError(null)}>
              {verifyError}
            </Alert>
          )}
          {messages.length === 0 && !isTyping && !verifyError && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chat with the agent for hints or help. It can run commands and read files in your terminal.
            </Typography>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && <AgentTypingIndicator agentName="Learning Agent" />}
          <div ref={messagesEndRef} />
        </Box>
        <ChatInput
          onSend={sendMessage}
          disabled={!agentSession || !isConnected}
          placeholder={agentSession ? 'Ask for help or hints...' : 'Connecting...'}
        />
      </Card>

      {verifyResult && (
        <VerifyResultCard
          open={verifyResultCardOpen}
          onClose={() => setVerifyResultCardOpen(false)}
          result={verifyResult}
        />
      )}
    </Box>
  );
}
