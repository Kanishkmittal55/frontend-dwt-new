/**
 * ChatSidebar Component
 * Resizable AI chat panel for CLRS Reader
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { 
  IconRobot, 
  IconUser, 
  IconSend, 
  IconX,
  IconGripVertical
} from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';

import type { ChatMessage } from '@/hooks/useFounderAgent';

interface ChatSidebarProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  hasSession: boolean;
  agentName?: string;
  onSend: (message: string) => Promise<void>;
  onClose?: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export default function ChatSidebar({
  messages,
  isTyping,
  isConnected,
  hasSession,
  agentName = 'Learning Agent',
  onSend,
  onClose,
  width,
  onWidthChange,
  minWidth = 280,
  maxWidth = 600
}: ChatSidebarProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onWidthChange(clampedWidth);
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
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || sending || !hasSession || !isConnected) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setMessage('');
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  }, [message, sending, hasSession, isConnected, onSend]);

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        width,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        borderLeft: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        position: 'relative'
      }}
    >
      {/* Resize Handle */}
      <Box
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        sx={{
          width: 6,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isResizing ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          borderRight: `1px solid ${isResizing ? theme.palette.primary.main : 'transparent'}`,
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            '& .resize-icon': {
              opacity: 1
            }
          }
        }}
      >
        <IconGripVertical 
          size={12} 
          className="resize-icon"
          style={{ 
            opacity: isResizing ? 1 : 0.3,
            transition: 'opacity 0.2s',
            color: theme.palette.text.secondary
          }} 
        />
      </Box>

      {/* Chat Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: theme.palette.secondary.main
              }}
            >
              <IconRobot size={16} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {agentName}
              </Typography>
              <Typography variant="caption" color={isConnected && hasSession ? 'success.main' : 'text.secondary'}>
                {!isConnected ? 'Disconnected' : !hasSession ? 'No session' : 'Active'}
              </Typography>
            </Box>
          </Box>
          {onClose && (
            <Tooltip title="Close chat">
              <IconButton size="small" onClick={onClose}>
                <IconX size={16} />
              </IconButton>
            </Tooltip>
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
            gap: 2,
            bgcolor: alpha(theme.palette.grey[100], 0.5)
          }}
        >
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
              <IconRobot size={40} color={theme.palette.text.disabled} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {!isConnected
                  ? 'Connect to start chatting'
                  : !hasSession
                  ? 'Start a session to ask questions'
                  : 'Ask me anything about the chapter!'}
              </Typography>
            </Box>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.secondary.main }}>
                <IconRobot size={14} />
              </Avatar>
              <Paper
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: theme.palette.text.secondary,
                        animation: 'bounce 1.4s infinite ease-in-out both',
                        animationDelay: `${i * 0.16}s`,
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0)' },
                          '40%': { transform: 'scale(1)' }
                        }
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            p: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper'
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={3}
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasSession ? 'Ask about CLRS...' : 'Start session first'}
            disabled={!hasSession || !isConnected || sending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.875rem'
              }
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!message.trim() || !hasSession || !isConnected || sending}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: theme.palette.primary.dark
              },
              '&:disabled': {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled
              }
            }}
          >
            {sending ? <CircularProgress size={16} color="inherit" /> : <IconSend size={16} />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
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
          width: 24,
          height: 24,
          bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main
        }}
      >
        {isUser ? <IconUser size={14} /> : <IconRobot size={14} />}
      </Avatar>

      <Paper
        elevation={0}
        sx={{
          maxWidth: '85%',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: isUser ? theme.palette.primary.main : 'background.paper',
          color: isUser ? 'white' : 'text.primary',
          border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
          borderTopLeftRadius: isUser ? 12 : 4,
          borderTopRightRadius: isUser ? 4 : 12
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
            '& code': {
              bgcolor: alpha(isUser ? '#000' : theme.palette.grey[200], 0.3),
              px: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }
          }}
        >
          {message.content}
        </Typography>
      </Paper>
    </Box>
  );
}

