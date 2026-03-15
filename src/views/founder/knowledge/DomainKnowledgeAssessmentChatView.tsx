/**
 * Domain Knowledge Assessment Chat View
 * Graph + chat for "What you don't know" Q&A flow
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { getDomainKnowledgeGraph, getDomainKnowledgeFounderGraph } from 'api/founder/knowledgeAPI';
import type {
  DomainKnowledgeGraphResponse,
  DomainKnowledgeFounderGraphResponse
} from 'api/founder/knowledgeAPI';
import useFounderAgent from '@/hooks/useFounderAgent';
import ChatMessage from '@/views/founder/agent/components/ChatMessage';
import ChatInput from '@/views/founder/agent/components/ChatInput';
import AgentTypingIndicator from '@/views/founder/agent/components/AgentTypingIndicator';
import DomainKnowledgeNeuralMap from './DomainKnowledgeNeuralMap';
import { IconGripVertical, IconPlugConnected, IconPlugConnectedX, IconLoader } from '@tabler/icons-react';

export type GraphColorMode = 'difficulty' | 'coverage';

interface DomainKnowledgeAssessmentChatViewProps {
  slug: string;
  domainName: string;
  userId?: number;
  onDone: () => void | Promise<void>;
  isEnding?: boolean;
  onError?: (message: string) => void;
}

export default function DomainKnowledgeAssessmentChatView({
  slug,
  domainName,
  userId,
  onDone,
  isEnding = false,
  onError
}: DomainKnowledgeAssessmentChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [colorMode, setColorMode] = useState<GraphColorMode>('difficulty');
  const [graph, setGraph] = useState<
    DomainKnowledgeGraphResponse | DomainKnowledgeFounderGraphResponse | null
  >(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [focusConceptSlug, setFocusConceptSlug] = useState<string | null>(null);

  const founderAgent = useFounderAgent({
    onError: (err) => onError?.(err.message),
    onAgentResponse: (payload) => {
      const slug = payload.focus_concept_slug;
      console.log('[DomainKnowledgeAssessmentChatView] onAgentResponse:', {
        focus_concept_slug: slug,
        has_slug: !!slug,
        payload_focus: payload.focus_concept_slug
      });
      setFocusConceptSlug(slug ?? null);
    }
  });

  const { isConnected, session: agentSession, messages, isTyping, sendMessage, connectionState, connect, startSession, endSession } = founderAgent;

  const ConnectionIcon = connectionState === 'connected' ? IconPlugConnected : connectionState === 'disconnected' ? IconPlugConnectedX : IconLoader;
  const connectionLabel = connectionState === 'connected' ? 'Connected' : connectionState === 'disconnected' ? 'Disconnected' : 'Connecting...';

  const handleKickOff = useCallback(() => {
    sendMessage('Which concepts should I focus on?');
  }, [sendMessage]);

  useEffect(() => {
    let cancelled = false;
    setGraphLoading(true);
    setGraphError(null);
    const load = () => {
      if (colorMode === 'coverage' && userId && userId > 0) {
        return getDomainKnowledgeFounderGraph(slug, userId);
      }
      return getDomainKnowledgeGraph(slug);
    };
    load()
      .then((g) => {
        if (!cancelled) setGraph(g);
      })
      .catch((err) => {
        if (!cancelled) setGraphError(err instanceof Error ? err.message : 'Failed to load graph');
      })
      .finally(() => {
        if (!cancelled) setGraphLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, colorMode, userId]);

  useEffect(() => {
    const ensureReady = async () => {
      if (connectionState === 'disconnected') {
        await connect().catch((err) => {
          console.error('[ChatView] connect failed:', err);
          onError?.('Failed to connect to agent');
        });
      }
      if (isConnected && !agentSession) {
        await startSession('learning', `domain_knowledge_assessment:${slug}`).catch((err) => {
          console.error('[ChatView] startSession failed:', err);
          onError?.('Failed to start agent session');
        });
      }
    };
    ensureReady();
  }, [slug, connectionState, isConnected, agentSession, connect, startSession, onError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleDone = useCallback(async () => {
    await endSession();
    await onDone();
  }, [endSession, onDone]);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = useState(400);
  const [graphLeftPct, setGraphLeftPct] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const el = graphContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      setGraphHeight(Math.max(300, el.clientHeight - 52));
    };
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();
    return () => ro.disconnect();
  }, [graph, graphLoading]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setGraphLeftPct(Math.max(25, Math.min(75, pct)));
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: 'calc(100vh - 88px)',
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      {/* Left: Graph */}
      <Box
        ref={graphContainerRef}
        sx={{
          width: `${graphLeftPct}%`,
          minWidth: 200,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: 1,
          borderColor: 'divider'
        }}
      >
        {graphLoading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}
        {graphError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {graphError}
          </Alert>
        )}
        {graph && !graphLoading && (
          <DomainKnowledgeNeuralMap
            graph={graph}
            height={Math.max(300, graphHeight)}
            focusConceptSlug={focusConceptSlug}
            colorMode={colorMode}
          />
        )}
      </Box>

      {/* Resize handle */}
      <Box
        onMouseDown={() => setIsResizing(true)}
        sx={{
          width: 6,
          cursor: 'col-resize',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          '&:hover': { bgcolor: 'action.selected' }
        }}
      >
        <IconGripVertical size={14} style={{ opacity: 0.5 }} />
      </Box>

      {/* Right: Chat */}
      <Card
        variant="outlined"
        sx={{
          flex: 1,
          minWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 0,
          border: 0,
          borderLeft: 1,
          borderColor: 'divider'
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Difficulty"
              size="small"
              color={colorMode === 'difficulty' ? 'primary' : 'default'}
              variant={colorMode === 'difficulty' ? 'filled' : 'outlined'}
              onClick={() => setColorMode('difficulty')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Coverage"
              size="small"
              color={colorMode === 'coverage' ? 'primary' : 'default'}
              variant={colorMode === 'coverage' ? 'filled' : 'outlined'}
              onClick={() => setColorMode('coverage')}
              disabled={!userId || userId <= 0}
              sx={{ cursor: userId && userId > 0 ? 'pointer' : 'default' }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Chat — {domainName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Ask about concepts you don&apos;t know. The graph highlights the current topic.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={connectionLabel}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: connectionState === 'connected' ? 'primary.main' : connectionState === 'disconnected' ? 'error.main' : 'warning.main',
                  color: 'white'
                }}
              >
                <ConnectionIcon size={18} />
              </Box>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              onClick={handleDone}
              disabled={isEnding}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Done
            </Button>
          </Box>
        </Box>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0, minHeight: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {isTyping && <AgentTypingIndicator />}
            <div ref={messagesEndRef} />
          </Box>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <ChatInput
              onSend={sendMessage}
              disabled={!isConnected || isEnding}
              placeholder="Ask for help or hints..."
              onKickOff={handleKickOff}
              kickOffLabel="Start exploring"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
