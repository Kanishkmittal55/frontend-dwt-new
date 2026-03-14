/**
 * VerifyResultCard — Shows assessment verify score in a separate card.
 * Opens when Verify is clicked; can be closed (X) to return to the test.
 * Updates when Verify is clicked again.
 */
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export interface VerifyResult {
  passed: boolean;
  score: number;
  feedback: string[];
}

interface VerifyResultCardProps {
  open: boolean;
  onClose: () => void;
  result: VerifyResult;
}

export default function VerifyResultCard({ open, onClose, result }: VerifyResultCardProps) {
  const theme = useTheme();
  const { passed, score, feedback } = result;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${passed ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3)}`,
          bgcolor: passed ? alpha(theme.palette.success.main, 0.06) : alpha(theme.palette.error.main, 0.06)
        }
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
          pb: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {passed ? (
            <CheckCircleIcon color="success" fontSize="medium" />
          ) : (
            <CancelIcon color="error" fontSize="medium" />
          )}
          <Typography variant="h6" component="span">
            {passed ? 'Passed' : 'Not passed'}
          </Typography>
          <Typography variant="h6" color="text.secondary" component="span">
            — Score: {score}/100
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {feedback.length > 0 && (
          <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
            {feedback.map((line, i) => (
              <Typography key={i} component="li" variant="body2" color="text.secondary">
                {line}
              </Typography>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
