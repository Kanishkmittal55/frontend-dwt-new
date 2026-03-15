/**
 * Domain Knowledge Assessment Mode Dialog
 * Choose between Terminal Scenarios (rig) and What you don't know Q/A (chat)
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import ChatIcon from '@mui/icons-material/Chat';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';

export type AssessmentMode = 'rig' | 'chat';

interface DomainKnowledgeAssessmentModeDialogProps {
  open: boolean;
  onClose: () => void;
  domainName: string;
  onSelect: (mode: AssessmentMode) => void;
}

export default function DomainKnowledgeAssessmentModeDialog({
  open,
  onClose,
  domainName,
  onSelect
}: DomainKnowledgeAssessmentModeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6">Test knowledge — {domainName}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose how you want to test your knowledge
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardActionArea onClick={() => onSelect('rig')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <TerminalIcon color="primary" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Terminal Scenarios
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hands-on tasks in a terminal — fix Docker, run commands, etc.
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardActionArea onClick={() => onSelect('chat')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <ChatIcon color="primary" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    What you don&apos;t know Q/A
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chat with the agent — explore gaps in your knowledge graph
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
