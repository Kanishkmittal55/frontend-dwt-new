/**
 * Add URL Dialog
 * Dialog for adding URLs to the library for scraping
 */
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { IconLink, IconPlus, IconX } from '@tabler/icons-react';

interface AddUrlDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (urls: string[]) => Promise<void>;
}

export default function AddUrlDialog({ open, onClose, onSubmit }: AddUrlDialogProps) {
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setUrlInput('');
    setUrls([]);
    setError(null);
    onClose();
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Handle multiple URLs (comma or newline separated)
    const newUrls = trimmed
      .split(/[,\n]/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const validUrls: string[] = [];
    const invalidUrls: string[] = [];

    for (const url of newUrls) {
      // Add https:// if no protocol
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      if (isValidUrl(normalizedUrl) && !urls.includes(normalizedUrl)) {
        validUrls.push(normalizedUrl);
      } else if (!isValidUrl(normalizedUrl)) {
        invalidUrls.push(url);
      }
    }

    if (invalidUrls.length > 0) {
      setError(`Invalid URL(s): ${invalidUrls.join(', ')}`);
    } else {
      setError(null);
    }

    if (validUrls.length > 0) {
      setUrls([...urls, ...validUrls]);
      setUrlInput('');
    }
  };

  const removeUrl = (url: string) => {
    setUrls(urls.filter(u => u !== url));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUrl();
    }
  };

  const handleSubmit = async () => {
    if (urls.length === 0) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(urls);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add URLs');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconLink size={24} />
        Add URLs to Library
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add URLs to scrape for business ideas. The system will extract content and generate ideas automatically.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Enter URL (e.g., techcrunch.com/article...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            disabled={submitting}
          />
          <Button
            variant="outlined"
            onClick={addUrl}
            disabled={!urlInput.trim() || submitting}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <IconPlus size={20} />
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Tip: Paste multiple URLs separated by commas or newlines
        </Typography>

        {urls.length > 0 && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            maxHeight: 200,
            overflow: 'auto'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              URLs to add ({urls.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {urls.map((url) => (
                <Chip
                  key={url}
                  label={new URL(url).hostname.replace('www.', '')}
                  onDelete={() => removeUrl(url)}
                  deleteIcon={<IconX size={16} />}
                  size="small"
                  sx={{ maxWidth: '100%' }}
                  title={url}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={urls.length === 0 || submitting}
        >
          {submitting ? 'Adding...' : `Add ${urls.length} URL${urls.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

