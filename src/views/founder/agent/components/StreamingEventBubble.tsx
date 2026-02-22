/**
 * StreamingEventBubble Component
 * Renders real-time agent activity: thinking, tool calls, tool results, discoveries
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { IconRobot, IconTool, IconCheck, IconSparkles } from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';
import type { StreamingEvent } from '@/hooks/useFounderAgent';
import type { RadarDiscoveryItemPayload } from '@/api/founder/agentAPI';

interface StreamingEventBubbleProps {
  event: StreamingEvent;
}

function ThinkingBubble({ payload }: { payload: { message?: string } }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 1.5
      }}
    >
      <Avatar sx={{ bgcolor: theme.palette.grey[600], width: 28, height: 28 }}>
        <IconRobot size={16} />
      </Avatar>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.info.main, 0.08),
          borderLeft: `3px solid ${theme.palette.info.main}`
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
          Thinking…
        </Typography>
        <Typography variant="body2" color="text.primary">
          {payload.message || 'Processing…'}
        </Typography>
      </Box>
    </Box>
  );
}

function ToolCallBubble({ payload }: { payload: { name?: string } }) {
  const theme = useTheme();
  const name = payload.name || 'tool';
  const label = name === 'crawl_radar' ? 'Scanning radar…' : `Calling ${name}…`;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1.5
      }}
    >
      <Avatar sx={{ bgcolor: theme.palette.grey[600], width: 28, height: 28 }}>
        <IconTool size={16} />
      </Avatar>
      <Chip
        size="small"
        icon={<IconTool size={14} />}
        label={label}
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    </Box>
  );
}

function ToolResultBubble({ payload }: { payload: { name?: string; error?: string } }) {
  const theme = useTheme();
  const name = payload.name || 'tool';
  const label = payload.error ? `Error: ${payload.error}` : name === 'crawl_radar' ? 'Radar scan complete' : `Completed ${name}`;
  const color = payload.error ? 'error' : 'success';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1.5
      }}
    >
      <Avatar sx={{ bgcolor: theme.palette[color].main, width: 28, height: 28 }}>
        <IconCheck size={16} />
      </Avatar>
      <Chip
        size="small"
        icon={<IconCheck size={14} />}
        label={label}
        color={payload.error ? 'error' : 'success'}
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    </Box>
  );
}

function DiscoveriesBubble({ payload }: { payload: { pursuit_uuid?: string; items?: RadarDiscoveryItemPayload[]; count?: number } }) {
  const theme = useTheme();
  const count = payload.count ?? payload.items?.length ?? 0;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 1.5
      }}
    >
      <Avatar sx={{ bgcolor: theme.palette.success.main, width: 28, height: 28 }}>
        <IconSparkles size={16} />
      </Avatar>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.success.main, 0.08),
          borderLeft: `3px solid ${theme.palette.success.main}`
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
          Discoveries
        </Typography>
        <Typography variant="body2" color="text.primary">
          Found {count} item{count !== 1 ? 's' : ''} from radar scan
        </Typography>
      </Box>
    </Box>
  );
}

export default function StreamingEventBubble({ event }: StreamingEventBubbleProps) {
  switch (event.type) {
    case 'thinking':
      return <ThinkingBubble payload={event.payload as { message?: string }} />;
    case 'tool_call':
      return <ToolCallBubble payload={event.payload as { name?: string }} />;
    case 'tool_result':
      return <ToolResultBubble payload={event.payload as { name?: string; error?: string }} />;
    case 'discoveries':
      return <DiscoveriesBubble payload={event.payload as { pursuit_uuid?: string; items?: RadarDiscoveryItemPayload[]; count?: number }} />;
    default:
      return null;
  }
}
