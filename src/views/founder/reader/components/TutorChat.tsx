/**
 * TutorChat Component
 * Real-time chat interface with the AI tutor
 * Supports streaming responses and markdown formatting
 */
import { useState, useRef, useEffect, useCallback } from 'react';
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
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconSend,
  IconRobot,
  IconUser,
  IconMicrophone,
  IconSparkles,
  IconBulb,
  IconQuestionMark,
  IconRefresh
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

import type { ChatMessage } from '@/hooks/useTutorAgent';

// ============================================================================
// Types
// ============================================================================

interface TutorChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  onSend: (message: string) => Promise<void>;
  suggestedQuestions?: string[];
  lessonContext?: {
    title: string;
    keyConcepts: string[];
  };
}

// ============================================================================
// Component
// ============================================================================

export default function TutorChat({
  messages,
  isTyping,
  isConnected,
  onSend,
  suggestedQuestions = [],
  lessonContext
}: TutorChatProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !isConnected) return;

    setSending(true);
    setInput('');
    try {
      await onSend(trimmed);
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  }, [input, sending, isConnected, onSend]);

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
    'What should I focus on most?'
  ];

  const allSuggestions = suggestedQuestions.length > 0 ? suggestedQuestions : defaultSuggestions;

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
          <Stack direction="row" spacing={0.5}>
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



