/**
 * PDFViewer Component
 * Displays CLRS PDF with page navigation and reading signals
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconZoomIn, 
  IconZoomOut,
  IconMaximize,
  IconDownload
} from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  /** URL or path to the PDF file */
  pdfUrl?: string;
  /** Blob data for PDF (from IndexedDB) */
  pdfBlob?: Blob | null;
  /** Initial page to display */
  initialPage?: number;
  /** Callback when page changes */
  onPageChange?: (page: number, totalPages: number) => void;
  /** Callback when user spends time on a page (for signals) */
  onTimeOnPage?: (page: number, seconds: number) => void;
  /** Callback when PDF is loaded */
  onDocumentLoad?: (totalPages: number) => void;
}

export default function PDFViewer({
  pdfUrl,
  pdfBlob,
  initialPage = 1,
  onPageChange,
  onTimeOnPage,
  onDocumentLoad
}: PDFViewerProps) {
  // Determine PDF source - prefer blob over URL
  const pdfSource = pdfBlob || pdfUrl;
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageStartTime = useRef<number>(Date.now());

  // State
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInputValue, setPageInputValue] = useState<string>(String(initialPage));

  // Track time on page
  useEffect(() => {
    pageStartTime.current = Date.now();
    
    return () => {
      const timeSpent = Math.round((Date.now() - pageStartTime.current) / 1000);
      if (timeSpent > 2 && onTimeOnPage) {
        onTimeOnPage(currentPage, timeSpent);
      }
    };
  }, [currentPage, onTimeOnPage]);

  // Handle document load success
  const handleDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setLoading(false);
    onDocumentLoad?.(total);
  }, [onDocumentLoad]);

  // Handle document load error
  const handleDocumentLoadError = useCallback((err: Error) => {
    setLoading(false);
    setError(err.message || 'Failed to load PDF');
  }, []);

  // Navigate to page
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, numPages));
    
    // Track time on current page before navigating
    const timeSpent = Math.round((Date.now() - pageStartTime.current) / 1000);
    if (timeSpent > 2 && onTimeOnPage) {
      onTimeOnPage(currentPage, timeSpent);
    }
    
    setCurrentPage(validPage);
    setPageInputValue(String(validPage));
    onPageChange?.(validPage, numPages);
  }, [numPages, currentPage, onPageChange, onTimeOnPage]);

  // Handle page input
  const handlePageInput = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInputValue, 10);
      if (!isNaN(page)) {
        goToPage(page);
      }
    }
  }, [pageInputValue, goToPage]);

  // Zoom controls
  const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.25, 3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.25, 0.5)), []);
  const fitToWidth = useCallback(() => {
    if (containerRef.current) {
      // Reset to a reasonable default
      setScale(1.0);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in any input/textarea/editable element
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest('[role="textbox"]')
      ) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          goToPage(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'PageDown':
          goToPage(currentPage + 1);
          break;
        case 'Home':
          goToPage(1);
          break;
        case 'End':
          goToPage(numPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, goToPage]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.grey[100]
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper'
        }}
      >
        {/* Page Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <IconChevronLeft size={20} />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              size="small"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => setPageInputValue(String(currentPage))}
              sx={{ width: 60 }}
              inputProps={{ 
                style: { textAlign: 'center', padding: '4px 8px' }
              }}
            />
            <Typography variant="body2" color="text.secondary">
              / {numPages}
            </Typography>
          </Box>
          
          <IconButton 
            size="small" 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <IconChevronRight size={20} />
          </IconButton>
        </Box>

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={zoomOut} disabled={scale <= 0.5}>
              <IconZoomOut size={20} />
            </IconButton>
          </Tooltip>
          
          <Slider
            size="small"
            value={scale}
            min={0.5}
            max={3}
            step={0.25}
            onChange={(_, value) => setScale(value as number)}
            sx={{ width: 100 }}
          />
          
          <Typography variant="caption" sx={{ minWidth: 40 }}>
            {Math.round(scale * 100)}%
          </Typography>
          
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={zoomIn} disabled={scale >= 3}>
              <IconZoomIn size={20} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fit to width">
            <IconButton size="small" onClick={fitToWidth}>
              <IconMaximize size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Actions */}
        <Box>
          {pdfUrl && (
            <Tooltip title="Download PDF">
              <IconButton size="small" component="a" href={pdfUrl} download target="_blank">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* PDF Display */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          p: 2
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}
          >
            <Typography color="error" variant="h6">
              Failed to load PDF
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {error}
            </Typography>
            {pdfUrl && (
              <Typography color="text.secondary" variant="caption">
                Make sure the PDF file exists at: {pdfUrl}
              </Typography>
            )}
          </Box>
        )}

        <Document
          file={pdfSource}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={null}
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={
              <Box sx={{ width: 600, height: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            }
          />
        </Document>
      </Box>

      {/* Page Progress Bar */}
      <Box
        sx={{
          height: 4,
          bgcolor: alpha(theme.palette.primary.main, 0.1)
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${(currentPage / numPages) * 100}%`,
            bgcolor: theme.palette.primary.main,
            transition: 'width 0.3s ease'
          }}
        />
      </Box>
    </Box>
  );
}

