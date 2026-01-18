/**
 * AgentTypingIndicator Component
 * Shows animated dots when agent is typing
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { IconRobot } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
`;

interface AgentTypingIndicatorProps {
  agentName?: string;
}

export default function AgentTypingIndicator({ agentName = 'Agent' }: AgentTypingIndicatorProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2
      }}
    >
      <Avatar
        sx={{
          bgcolor: theme.palette.secondary.main,
          width: 36,
          height: 36
        }}
      >
        <IconRobot size={20} />
      </Avatar>

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 1, mb: 0.5, display: 'block' }}
        >
          {agentName}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 2,
            py: 1.5,
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            borderTopLeftRadius: 4
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: theme.palette.text.secondary,
                animation: `${bounce} 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

