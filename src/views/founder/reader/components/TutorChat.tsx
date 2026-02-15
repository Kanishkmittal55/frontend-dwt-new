/**
 * TutorChat Component
 * Real-time chat interface with the AI tutor.
 * Supports streaming responses, markdown formatting, and an inline
 * concept-vetting overlay that temporarily replaces normal chat when active.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconSend,
  IconRobot,
  IconUser,
  IconMicrophone,
  IconSparkles,
  IconBulb,
  IconQuestionMark,
  IconRefresh,
  IconBook,
  IconPlayerSkipForward,
  IconBrain,
  IconPlayerStop,
  IconCheck,
  IconX,
  IconArrowBack
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

import type { ChatMessage, VetMessage, VetVerdict } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface LessonContextType {
  title: string;
  content?: string;
  keyConcepts: string[];
}

interface LessonCompletePromptType {
  lessonUUID: string;
  lessonTitle: string;
  promptType: string;
  message: string;
  nextChunkIdx: number;
  hasMoreContent: boolean;
}

interface TutorChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  onSend: (message: string) => Promise<void>;
  suggestedQuestions?: string[];
  lessonContext?: LessonContextType | undefined;
  lessonCompletePrompt?: LessonCompletePromptType | null;
  onStartQuiz?: () => void;
  onSkipToNext?: (lessonUUID: string, nextChunkIdx: number) => void;
  // Concept Vetting Mode (optional — only used in interactive mode)
  isVettingMode?: boolean;
  vetMessages?: VetMessage[];
  vetConceptText?: string | null;
  isAgentThinking?: boolean;
  vetVerdict?: VetVerdict | null;
  onInjectVetMessage?: (text: string) => void;
  onStopVetLoop?: (reason?: string) => void;
  onExitVetting?: () => void;
}

// Context window constants (gpt-4o-mini)
const MODEL_CONTEXT_LIMIT = 128000;
const FIXED_OVERHEAD_TOKENS = 800; // System prompt, persona template
const MAX_RESPONSE_TOKENS = 1000;
const AVAILABLE_TOKENS = MODEL_CONTEXT_LIMIT - MAX_RESPONSE_TOKENS;

// Rough token estimation: ~4 chars per token for English
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// ============================================================================
// Component
// ============================================================================

export default function TutorChat({
  messages,
  isTyping,
  isConnected,
  onSend,
  suggestedQuestions = [],
  lessonContext,
  lessonCompletePrompt,
  onStartQuiz,
  onSkipToNext,
  // Vetting mode props
  isVettingMode = false,
  vetMessages = [],
  vetConceptText,
  isAgentThinking = false,
  vetVerdict,
  onInjectVetMessage,
  onStopVetLoop,
  onExitVetting
}: TutorChatProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const vetMessagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-scroll to bottom (normal chat)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-scroll to bottom (vetting messages)
  useEffect(() => {
    if (isVettingMode) {
      vetMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [vetMessages, isAgentThinking, isVettingMode]);

  // Handle send — routes to vetting inject or normal chat
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !isConnected) return;

    // In vetting mode, inject into the running agent loop
    if (isVettingMode && onInjectVetMessage) {
      console.log('%c[TutorChat/Vet] → Injecting message', 'color: #7c4dff; font-weight: bold', {
        text: trimmed.substring(0, 50)
      });
      setInput('');
      onInjectVetMessage(trimmed);
      return;
    }

    // Normal chat send
    setSending(true);
    setInput('');
    try {
      await onSend(trimmed);
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  }, [input, sending, isConnected, onSend, isVettingMode, onInjectVetMessage]);

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggested question click
  const handleSuggestedClick = (question: string) => {
    setInput(question);
  };

  // Default suggested questions based on lesson context
  const defaultSuggestions = lessonContext?.keyConcepts?.slice(0, 3).map(
    concept => `Can you explain "${concept}" in more detail?`
  ) || [
    'Can you explain this in simpler terms?',
    'Can you give me an example?',
    'What should I focus on most?',
    '✏️ Write hello world on the canvas'
  ];

  const allSuggestions = suggestedQuestions.length > 0 ? suggestedQuestions : defaultSuggestions;

  // Calculate context window usage
  const contextUsage = useMemo(() => {
    const chatTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const lessonTokens = lessonContext?.content ? estimateTokens(lessonContext.content) : 0;
    const inputTokens = estimateTokens(input);
    const totalUsed = FIXED_OVERHEAD_TOKENS + chatTokens + lessonTokens + inputTokens;
    const percentage = Math.min((totalUsed / AVAILABLE_TOKENS) * 100, 100);
    
    return {
      used: totalUsed,
      available: AVAILABLE_TOKENS,
      percentage,
      color: percentage < 50 ? theme.palette.success.main 
           : percentage < 80 ? theme.palette.warning.main 
           : theme.palette.error.main
    };
  }, [messages, lessonContext?.content, input, theme]);

  // Parse verdict into structured data for display
  const parsedVerdict = useMemo(() => {
    if (!vetVerdict?.finalContent) return null;
    try {
      const parsed = JSON.parse(vetVerdict.finalContent);
      return {
        action: parsed.action as 'approve' | 'reject' | 'suggest_refinement',
        reason: parsed.reason || vetVerdict.reason,
        refined_text: parsed.refined_text,
      };
    } catch {
      return { action: 'reject' as const, reason: vetVerdict.reason, refined_text: undefined };
    }
  }, [vetVerdict]);

  // ============================================================================
  // Render — Vetting Mode
  // ============================================================================
  if (isVettingMode) {
    const isLoopDone = !!vetVerdict;
    const canSend = isConnected && !isLoopDone && !isAgentThinking;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
        {/* Vetting Header */}
        <Box
          sx={{
            px: 2, py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.warning.main, 0.06),
            display: 'flex', alignItems: 'center', gap: 1.5
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main }}>
            <IconBrain size={20} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600}>Concept Vetting</Typography>
            {vetConceptText && (
              <Typography variant="caption" color="text.secondary" noWrap title={vetConceptText}>
                &ldquo;{vetConceptText.length > 40 ? vetConceptText.substring(0, 40) + '…' : vetConceptText}&rdquo;
              </Typography>
            )}
          </Box>
          {!isLoopDone && (
            <Tooltip title="Stop vetting">
              <IconButton size="small" onClick={() => onStopVetLoop?.('founder_cancelled')} sx={{ color: theme.palette.error.main }}>
                <IconPlayerStop size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Vet Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {vetMessages.map((msg) => (
            <VetMessageBubble key={msg.id} message={msg} />
          ))}

          {/* Agent Thinking Indicator */}
          {isAgentThinking && !isLoopDone && (
            <Fade in>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main }}>
                  <IconBrain size={16} />
                </Avatar>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Agent is analyzing…
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.4, ml: 0.5 }}>
                  {[0, 1, 2].map((i) => (
                    <Box key={i} sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      bgcolor: theme.palette.warning.main,
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: `${i * 0.16}s`,
                      '@keyframes bounce': {
                        '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                        '40%': { transform: 'scale(1)', opacity: 1 }
                      }
                    }} />
                  ))}
                </Box>
              </Box>
            </Fade>
          )}

          {/* Verdict Banner */}
          {parsedVerdict && (
            <Fade in>
              <Paper
                sx={{
                  p: 2, borderRadius: 2, mt: 1,
                  bgcolor: parsedVerdict.action === 'approve'
                    ? alpha(theme.palette.success.main, 0.08)
                    : parsedVerdict.action === 'reject'
                      ? alpha(theme.palette.error.main, 0.08)
                      : alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${
                    parsedVerdict.action === 'approve'
                      ? alpha(theme.palette.success.main, 0.3)
                      : parsedVerdict.action === 'reject'
                        ? alpha(theme.palette.error.main, 0.3)
                        : alpha(theme.palette.info.main, 0.3)
                  }`,
                  display: 'flex', flexDirection: 'column', gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {parsedVerdict.action === 'approve' && <IconCheck size={20} color={theme.palette.success.main} />}
                  {parsedVerdict.action === 'reject' && <IconX size={20} color={theme.palette.error.main} />}
                  {parsedVerdict.action === 'suggest_refinement' && <IconRefresh size={20} color={theme.palette.info.main} />}
                  <Typography variant="subtitle2" fontWeight={700}>
                    {parsedVerdict.action === 'approve' && 'Concept Approved ✅'}
                    {parsedVerdict.action === 'reject' && 'Concept Rejected ❌'}
                    {parsedVerdict.action === 'suggest_refinement' && 'Refinement Suggested 🔄'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {parsedVerdict.reason}
                </Typography>
                {parsedVerdict.refined_text && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.info.main }}>
                    Suggested: &ldquo;{parsedVerdict.refined_text}&rdquo;
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconArrowBack size={16} />}
                  onClick={onExitVetting}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                >
                  Return to Chat
                </Button>
              </Paper>
            </Fade>
          )}

          <div ref={vetMessagesEndRef} />
        </Box>

        {/* Vetting Input Area */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
          {isLoopDone ? (
            <Button fullWidth variant="contained" startIcon={<IconArrowBack size={16} />} onClick={onExitVetting}>
              Return to Chat
            </Button>
          ) : (
            <Box
              sx={{
                display: 'flex', alignItems: 'flex-end', gap: 1, p: 1,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
              }}
            >
              <TextField
                fullWidth multiline maxRows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to the agent…"
                disabled={!canSend}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.9375rem', px: 1 } }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || !canSend}
                sx={{
                  bgcolor: input.trim() ? theme.palette.warning.main : 'transparent',
                  color: input.trim() ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: input.trim() ? theme.palette.warning.dark : alpha(theme.palette.warning.main, 0.1) },
                  '&:disabled': { bgcolor: 'transparent', color: 'text.disabled' }
                }}
              >
                <IconSend size={18} />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ============================================================================
  // Render — Normal Chat Mode
  // ============================================================================
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: alpha(theme.palette.secondary.main, 0.15),
            color: theme.palette.secondary.main
          }}
        >
          <IconRobot size={20} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            AI Tutor
          </Typography>
          <Typography variant="caption" color={isConnected ? 'success.main' : 'text.secondary'}>
            {isConnected ? 'Online' : 'Connecting...'}
          </Typography>
        </Box>
        {lessonContext && (
          <Chip
            size="small"
            icon={<IconBulb size={14} />}
            label={lessonContext.title}
            sx={{
              maxWidth: 180,
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {/* Empty state */}
        {messages.length === 0 && !isTyping && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 3
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <IconSparkles size={28} color={theme.palette.secondary.main} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
              Ask me anything!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 280 }}>
              I'm here to help you understand the material. Ask questions, request examples, or discuss concepts.
            </Typography>

            {/* Suggested Questions */}
            <Stack spacing={1} sx={{ width: '100%', maxWidth: 320 }}>
              {allSuggestions.map((q, idx) => (
                <Paper
                  key={idx}
                  onClick={() => handleSuggestedClick(q)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <IconQuestionMark size={16} color={theme.palette.primary.main} />
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    {q}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Message list */}
        {messages.map((msg, idx) => (
          <MessageBubble key={msg.id} message={msg} isLatest={idx === messages.length - 1} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <Fade in>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                  color: theme.palette.secondary.main
                }}
              >
                <IconRobot size={18} />
              </Avatar>
              <Paper
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  borderTopLeftRadius: 4,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: theme.palette.text.secondary,
                        animation: 'bounce 1.4s infinite ease-in-out both',
                        animationDelay: `${i * 0.16}s`,
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                          '40%': { transform: 'scale(1)', opacity: 1 }
                        }
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          </Fade>
        )}

        {/* Lesson Complete Prompt */}
        {lessonCompletePrompt && (
          <Fade in>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.main
                  }}
                >
                  <IconSparkles size={20} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Lesson Complete! 🎉
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lessonCompletePrompt.lessonTitle}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {lessonCompletePrompt.message}
              </Typography>
              
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconBook size={16} />}
                  onClick={onStartQuiz}
                  sx={{ flex: 1 }}
                >
                  Yes, take quiz
                </Button>
                {lessonCompletePrompt.hasMoreContent && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<IconPlayerSkipForward size={16} />}
                    onClick={() => onSkipToNext?.(lessonCompletePrompt.lessonUUID, lessonCompletePrompt.nextChunkIdx)}
                    sx={{ flex: 1 }}
                  >
                    Skip to next
                  </Button>
                )}
              </Stack>
            </Paper>
          </Fade>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            p: 1,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={!isConnected || sending}
            variant="standard"
            InputProps={{
              disableUnderline: true
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.9375rem',
                px: 1
              }
            }}
          />
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Context Window Indicator */}
            <Tooltip title={`Context: ${Math.round(contextUsage.used / 1000)}k / ${Math.round(contextUsage.available / 1000)}k tokens (${Math.round(contextUsage.percentage)}%)`}>
              <Box sx={{ width: 24, height: 24, position: 'relative', cursor: 'help' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  {/* Background circle */}
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke={alpha(theme.palette.text.secondary, 0.2)}
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke={contextUsage.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(contextUsage.percentage / 100) * 56.5} 56.5`}
                    transform="rotate(-90 12 12)"
                    style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease' }}
                  />
                </svg>
              </Box>
            </Tooltip>
            <Tooltip title="Voice input (coming soon)">
              <span>
                <IconButton size="small" disabled sx={{ color: 'text.secondary' }}>
                  <IconMicrophone size={18} />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || !isConnected || sending}
              sx={{
                bgcolor: input.trim() ? theme.palette.primary.main : 'transparent',
                color: input.trim() ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: input.trim() ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.1)
                },
                '&:disabled': {
                  bgcolor: 'transparent',
                  color: 'text.disabled'
                }
              }}
            >
              {sending ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
  isLatest: boolean;
}

function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <Fade in={isLatest} timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1.5
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isUser 
              ? alpha(theme.palette.primary.main, 0.15) 
              : alpha(theme.palette.secondary.main, 0.15),
            color: isUser ? theme.palette.primary.main : theme.palette.secondary.main
          }}
        >
          {isUser ? <IconUser size={18} /> : <IconRobot size={18} />}
        </Avatar>

        <Paper
          elevation={0}
          sx={{
            maxWidth: '80%',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            borderTopLeftRadius: isUser ? 16 : 4,
            borderTopRightRadius: isUser ? 4 : 16,
            bgcolor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
            color: isUser ? 'white' : 'text.primary',
            border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
            '& .markdown-content': {
              '& p': {
                m: 0,
                mb: 1,
                '&:last-child': { mb: 0 },
                lineHeight: 1.6,
                fontSize: '0.9375rem'
              },
              '& ul, & ol': {
                m: 0,
                pl: 2.5,
                '& li': {
                  mb: 0.5,
                  fontSize: '0.9375rem'
                }
              },
              '& code': {
                bgcolor: isUser 
                  ? alpha('#000', 0.2) 
                  : alpha(theme.palette.text.primary, 0.08),
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8125rem'
              },
              '& pre': {
                bgcolor: isUser 
                  ? alpha('#000', 0.2) 
                  : theme.palette.grey[100],
                p: 1.5,
                borderRadius: 1.5,
                overflow: 'auto',
                '& code': {
                  bgcolor: 'transparent',
                  p: 0
                }
              },
              '& strong': {
                fontWeight: 600
              },
              '& a': {
                color: isUser ? '#fff' : theme.palette.primary.main,
                textDecoration: 'underline'
              }
            }
          }}
        >
          <Box className="markdown-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}

// ============================================================================
// Vet Message Bubble Component (for concept vetting mode)
// ============================================================================

function VetMessageBubble({ message }: { message: VetMessage }) {
  const theme = useTheme();

  // System messages → centered, italic, muted
  if (message.role === 'system') {
    return (
      <Fade in timeout={200}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
              bgcolor: alpha(theme.palette.action.hover, 0.4),
              px: 1.5, py: 0.5, borderRadius: 2
            }}
          >
            {message.text}
          </Typography>
        </Box>
      </Fade>
    );
  }

  const isUser = message.role === 'user';

  return (
    <Fade in timeout={200}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1
        }}
      >
        <Avatar
          sx={{
            width: 28, height: 28,
            bgcolor: isUser
              ? alpha(theme.palette.primary.main, 0.15)
              : alpha(theme.palette.warning.main, 0.15),
            color: isUser ? theme.palette.primary.main : theme.palette.warning.main
          }}
        >
          {isUser ? <IconUser size={16} /> : <IconBrain size={16} />}
        </Avatar>
        <Paper
          elevation={0}
          sx={{
            maxWidth: '85%',
            px: 1.5, py: 1,
            borderRadius: 2,
            borderTopLeftRadius: isUser ? 12 : 4,
            borderTopRightRadius: isUser ? 4 : 12,
            bgcolor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
            color: isUser ? 'white' : 'text.primary',
            border: isUser ? 'none' : `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            '& .markdown-content': {
              '& p': { m: 0, mb: 0.5, '&:last-child': { mb: 0 }, lineHeight: 1.5, fontSize: '0.875rem' },
              '& code': {
                bgcolor: isUser ? alpha('#000', 0.2) : alpha(theme.palette.text.primary, 0.08),
                px: 0.5, py: 0.25, borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.8rem'
              },
              '& strong': { fontWeight: 600 }
            }
          }}
        >
          <Box className="markdown-content">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}



