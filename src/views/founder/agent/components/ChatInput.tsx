/**
 * ChatInput Component
 * Message input with send button
 */
import { useState, useCallback, KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { IconSend, IconRocket } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  /** Optional: rocket button to kick off the flow (e.g. domain knowledge exploration) */
  onKickOff?: () => void;
  /** Tooltip label for the kick-off button */
  kickOffLabel?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  onKickOff,
  kickOffLabel = 'Kick off'
}: ChatInputProps) {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [message, sending, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || sending}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3
          }
        }}
      />
      {onKickOff && (
        <Tooltip title={kickOffLabel}>
          <span>
            <IconButton
              onClick={onKickOff}
              disabled={disabled || sending}
              color="secondary"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.secondary.dark
                },
                '&:disabled': {
                  bgcolor: theme.palette.action.disabledBackground
                }
              }}
            >
              <IconRocket size={20} />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <IconButton
        onClick={handleSend}
        disabled={!message.trim() || disabled || sending}
        color="primary"
        sx={{
          bgcolor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            bgcolor: theme.palette.primary.dark
          },
          '&:disabled': {
            bgcolor: theme.palette.action.disabledBackground
          }
        }}
      >
        {sending ? <CircularProgress size={20} color="inherit" /> : <IconSend size={20} />}
      </IconButton>
    </Box>
  );
}

