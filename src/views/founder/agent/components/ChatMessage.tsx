/**
 * ChatMessage Component
 * Displays a single chat message bubble
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { IconUser, IconRobot } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import type { ChatMessage as ChatMessageType } from '@/hooks/useFounderAgent';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
          width: 36,
          height: 36
        }}
      >
        {isUser ? <IconUser size={20} /> : <IconRobot size={20} />}
      </Avatar>

      {/* Message Content */}
      <Box sx={{ maxWidth: '70%' }}>
        {/* Agent name for agent messages */}
        {!isUser && message.agentName && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 1, mb: 0.5, display: 'block' }}
          >
            {message.agentName}
          </Typography>
        )}

        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: isUser ? theme.palette.primary.light : theme.palette.background.paper,
            color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
            borderTopLeftRadius: isUser ? 16 : 4,
            borderTopRightRadius: isUser ? 4 : 16
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              '& code': {
                bgcolor: 'rgba(0,0,0,0.1)',
                px: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace'
              }
            }}
          >
            {message.content}
          </Typography>

          {/* Actions if present */}
          {message.actions && message.actions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {message.actions.map((action, idx) => (
                <Chip
                  key={idx}
                  label={action.type}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 1, mt: 0.5, display: 'block' }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
}

