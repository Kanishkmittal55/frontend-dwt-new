/**
 * ScribeOCR Dialog
 * 
 * Embeds scribeocr.com in an iframe for PDF text extraction.
 * User uploads PDF in scribeocr, copies extracted text, pastes into our app.
 * 
 * Trade-offs:
 * - Pros: No server-side PDF processing, works with any PDF, familiar scribeocr UI
 * - Cons: Requires manual copy/paste, depends on external service availability
 */
import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  IconFileText,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconRefresh,
  IconX
} from '@tabler/icons-react';

// ============================================================================
// Types
// ============================================================================

interface ScribeOcrDialogProps {
  open: boolean;
  onClose: () => void;
  onTextExtracted: (text: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const SCRIBEOCR_URL = 'https://scribeocr.com';

const INSTRUCTIONS = [
  'Click "Open ScribeOCR" or use the embedded viewer below',
  'Upload your PDF document in ScribeOCR',
  'Wait for the OCR processing to complete',
  'Select all text (Ctrl+A / Cmd+A) and copy it (Ctrl+C / Cmd+C)',
  'Paste the extracted text into the text area below'
];

// ============================================================================
// Component
// ============================================================================

export default function ScribeOcrDialog({
  open,
  onClose,
  onTextExtracted
}: ScribeOcrDialogProps) {
  const [extractedText, setExtractedText] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showIframe, setShowIframe] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reset state when dialog opens/closes
  const handleClose = useCallback(() => {
    setExtractedText('');
    setActiveStep(0);
    setShowIframe(true);
    onClose();
  }, [onClose]);

  // Handle text paste - auto-advance step
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setExtractedText(text);
    if (text.length > 0 && activeStep < 4) {
      setActiveStep(4); // Jump to final step
    }
  }, [activeStep]);

  // Confirm and use extracted text
  const handleUseText = useCallback(() => {
    if (extractedText.trim()) {
      onTextExtracted(extractedText.trim());
      handleClose();
    }
  }, [extractedText, onTextExtracted, handleClose]);

  // Open ScribeOCR in new tab
  const handleOpenInNewTab = useCallback(() => {
    window.open(SCRIBEOCR_URL, '_blank', 'noopener,noreferrer');
    setActiveStep(1);
  }, []);

  // Reload iframe
  const handleReloadIframe = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  // Copy text to clipboard
  const handleCopyText = useCallback(async () => {
    if (extractedText) {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [extractedText]);

  // Calculate character and word count
  const charCount = extractedText.length;
  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '900px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconFileText size={24} />
          <Typography variant="h4">Extract Text from PDF</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Instructions Stepper */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Use ScribeOCR to extract text from your PDF. The extracted text will be used to generate business ideas.
          </Alert>
          
          <Stepper activeStep={activeStep} orientation="horizontal" alternativeLabel>
            {['Open ScribeOCR', 'Upload PDF', 'Wait for OCR', 'Copy Text', 'Paste Below'].map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Divider />

        {/* Main Content - Split View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
          {/* Left: ScribeOCR iframe or placeholder */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: { md: '1px solid' },
            borderColor: { md: 'divider' }
          }}>
            <Box sx={{ p: 1, bgcolor: 'background.default', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                ScribeOCR
              </Typography>
              <Tooltip title="Open in new tab">
                <IconButton size="small" onClick={handleOpenInNewTab}>
                  <IconExternalLink size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reload">
                <IconButton size="small" onClick={handleReloadIframe}>
                  <IconRefresh size={18} />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant={showIframe ? 'outlined' : 'contained'}
                onClick={() => setShowIframe(!showIframe)}
              >
                {showIframe ? 'Hide' : 'Show'} Viewer
              </Button>
            </Box>
            
            {showIframe ? (
              <Box sx={{ flex: 1, position: 'relative', minHeight: 300 }}>
                <iframe
                  key={iframeKey}
                  src={SCRIBEOCR_URL}
                  title="ScribeOCR - PDF Text Extraction"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                />
              </Box>
            ) : (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                p: 3,
                textAlign: 'center'
              }}>
                <IconFileText size={64} color="#9e9e9e" />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  ScribeOCR Viewer Hidden
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  Click "Show Viewer" above or open in a new tab
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<IconExternalLink />}
                  onClick={handleOpenInNewTab}
                >
                  Open ScribeOCR in New Tab
                </Button>
              </Box>
            )}
          </Box>

          {/* Right: Text Input Area */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            p: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">
                Extracted Text
              </Typography>
              {extractedText && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy text'}>
                    <IconButton size="small" onClick={handleCopyText}>
                      {copied ? <IconCheck size={16} color="green" /> : <IconCopy size={16} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            <TextField
              multiline
              fullWidth
              placeholder="Paste the extracted text from ScribeOCR here...

Instructions:
1. Upload your PDF in ScribeOCR (left panel or new tab)
2. Wait for OCR processing to complete
3. Select all text (Ctrl+A / Cmd+A)
4. Copy the text (Ctrl+C / Cmd+C)
5. Paste it here (Ctrl+V / Cmd+V)"
              value={extractedText}
              onChange={handleTextChange}
              sx={{ 
                flex: 1,
                '& .MuiInputBase-root': {
                  height: '100%',
                  alignItems: 'flex-start'
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  overflow: 'auto !important'
                }
              }}
              slotProps={{
                input: {
                  sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                }
              }}
            />

            {extractedText.length > 0 && extractedText.length < 50 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                The extracted text seems very short. Make sure you copied all the content from your PDF.
              </Alert>
            )}

            {extractedText.length >= 50 && (
              <Alert severity="success" sx={{ mt: 1 }}>
                Text extracted! Click "Use This Text" to proceed with idea generation.
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUseText}
          disabled={extractedText.trim().length < 10}
          startIcon={<IconCheck />}
        >
          Use This Text ({wordCount} words)
        </Button>
      </DialogActions>
    </Dialog>
  );
}















