/**
 * DryRunChatMessage — Chat message with optional execution trace panel
 */
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IconUser, IconRobot } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import type { ChatMessage as ChatMessageType, PipelineStepPayload } from '@/hooks/useFounderAgent';

interface DryRunChatMessageProps {
  message: ChatMessageType;
}

function StepOutput({ output }: { output?: Record<string, unknown> }) {
  if (!output || Object.keys(output).length === 0) return null;
  return (
    <Box
      component="pre"
      sx={{
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        overflow: 'auto',
        maxHeight: 200,
        p: 1,
        bgcolor: 'action.hover',
        borderRadius: 1
      }}
    >
      {JSON.stringify(output, null, 2)}
    </Box>
  );
}

export default function DryRunChatMessage({ message }: DryRunChatMessageProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const hasTrace = message.executionTrace && message.executionTrace.length > 0;

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
      <Avatar
        sx={{
          bgcolor: isUser ? theme.palette.primary.main : theme.palette.grey[600],
          width: 36,
          height: 36
        }}
      >
        {isUser ? <IconUser size={20} /> : <IconRobot size={20} />}
      </Avatar>

      <Box sx={{ maxWidth: '70%', width: '100%' }}>
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
            bgcolor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
            color: isUser ? '#fff' : theme.palette.text.primary,
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
                bgcolor: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                px: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace'
              }
            }}
          >
            {message.content}
          </Typography>

          {message.actions && message.actions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {message.actions.map((action, idx) => (
                <Chip
                  key={idx}
                  label={action.type}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    ...(isUser && {
                      borderColor: 'rgba(255,255,255,0.7)',
                      color: '#fff'
                    })
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>

        {hasTrace && (
          <Accordion
            defaultExpanded={false}
            sx={{
              mt: 1,
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" color="primary">
                Execution trace ({message.executionTrace!.length} steps)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {message.executionTrace!.map((step: PipelineStepPayload, i: number) => (
                  <Box key={i}>
                    <Typography variant="caption" color="text.secondary">
                      {step.step}. {step.name}
                    </Typography>
                    <StepOutput output={step.output} />
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

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
