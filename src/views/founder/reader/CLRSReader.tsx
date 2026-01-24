/**
 * CLRSReader View
 * Main reading experience for CLRS with SM-2 spaced repetition
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LinearProgress from '@mui/material/LinearProgress';
import { IconMenu2, IconMessageCircle, IconBook, IconList, IconUpload, IconFileTypePdf, IconTrash } from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';

import MainCard from '@/ui-component/cards/MainCard';
import useFounderAgent from '@/hooks/useFounderAgent';

import ChapterNav from './components/ChapterNav';
import ChapterContent from './components/ChapterContent';
import PDFViewer from './components/PDFViewer';
import ChatSidebar from './components/ChatSidebar';
import useLearningItems from './hooks/useLearningItems';
import { CLRS_CHAPTERS, type CLRSChapter, getChapterById } from './data/chapters';
import { savePDF, loadPDF, deletePDF } from './utils/pdfStorage';

const NAV_WIDTH = 280;
const DEFAULT_CHAT_WIDTH = 360;
const MIN_CHAT_WIDTH = 280;
const MAX_CHAT_WIDTH = 600;

export default function CLRSReader() {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedChapter, setSelectedChapter] = useState<CLRSChapter | null>(CLRS_CHAPTERS[0]);
  const [showNav, setShowNav] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'overview'>('pdf');
  
  // PDF Storage State
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Hooks
  const {
    items: learningItems,
    error: itemsError,
    fetchItemsByType,
    createItem,
    recordReview,
    SM2_GRADES
  } = useLearningItems({
    autoFetchDue: false,
    onItemUpdated: (item) => {
      setNotification({ type: 'success', message: `Updated: ${item.title || item.item_id}` });
    }
  });

  const {
    connectionState,
    isConnected,
    session,
    messages,
    isTyping,
    sendMessage,
    sendEvent,
    startSession,
    connect
  } = useFounderAgent({
    onError: (err) => setNotification({ type: 'error', message: err.message })
  });

  // Load PDF from IndexedDB on mount
  useEffect(() => {
    setPdfLoading(true);
    loadPDF()
      .then((blob) => {
        if (blob) {
          setPdfBlob(blob);
        } else {
          setShowUploadDialog(true);
        }
      })
      .catch(() => {
        setShowUploadDialog(true);
      })
      .finally(() => {
        setPdfLoading(false);
      });
  }, []);

  // Connect and start session on mount
  useEffect(() => {
    const userId = localStorage.getItem('founder_user_id');
    if (!userId) {
      setNotification({ type: 'error', message: 'Please log in to track learning progress' });
      return;
    }

    if (!isConnected) {
      connect().then(() => {
        // Start learning session
        startSession('learning', 'clrs-reading');
      }).catch(() => {
        setNotification({ type: 'error', message: 'Failed to connect to agent' });
      });
    } else if (!session) {
      startSession('learning', 'clrs-reading');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch items when connected
  useEffect(() => {
    if (isConnected && session) {
      fetchItemsByType('chapter');
    }
  }, [isConnected, session, fetchItemsByType]);

  // Get learning item for selected chapter
  const selectedChapterItem = selectedChapter
    ? learningItems.find(i => i.item_type === 'chapter' && i.item_id === selectedChapter.id)
    : undefined;

  // Handle chapter selection
  const handleSelectChapter = useCallback(async (chapter: CLRSChapter) => {
    setSelectedChapter(chapter);

    // Create learning item if it doesn't exist
    if (isConnected) {
      const existing = learningItems.find(i => i.item_type === 'chapter' && i.item_id === chapter.id);
      if (!existing) {
        await createItem('chapter', chapter.id, `Chapter ${chapter.number}: ${chapter.title}`);
      }
    }
  }, [isConnected, learningItems, createItem]);

  // Handle starting reading
  const handleStartReading = useCallback(() => {
    if (selectedChapter) {
      setNotification({ type: 'info', message: `Started reading: ${selectedChapter.title}` });
      
      // Emit reading started signal
      if (isConnected && session) {
        sendEvent('reading_started', {
          item_type: 'chapter',
          item_id: selectedChapter.id,
          title: selectedChapter.title
        });
      }
    }
  }, [selectedChapter, isConnected, session, sendEvent]);

  // Handle marking complete (record a successful review)
  const handleMarkComplete = useCallback(async () => {
    if (selectedChapter && isConnected) {
      const result = await recordReview('chapter', selectedChapter.id, SM2_GRADES.CORRECT_HESITATION);
      if (result) {
        setNotification({ type: 'success', message: `Progress saved! Next review in ${result.interval_days} days` });
      }
    }
  }, [selectedChapter, isConnected, recordReview, SM2_GRADES]);

  // Handle asking the agent - sends to chat sidebar
  const handleAskAgent = useCallback((question: string) => {
    if (isConnected && session) {
      sendMessage(question);
      // Ensure chat is visible when asking
      setShowChat(true);
    } else {
      setNotification({ type: 'error', message: 'Connect to agent first' });
    }
  }, [isConnected, session, sendMessage]);

  // Handle navigation
  const handleNavigate = useCallback((chapterId: string) => {
    const chapter = getChapterById(chapterId);
    if (chapter) {
      handleSelectChapter(chapter);
    }
  }, [handleSelectChapter]);

  // Handle PDF page change - emit signal for tracking
  const handlePageChange = useCallback((page: number, totalPages: number) => {
    console.log(`[CLRS] Page ${page}/${totalPages}`);
    if (isConnected && session) {
      sendEvent('page_viewed', {
        item_type: 'chapter',
        item_id: selectedChapter?.id,
        page,
        total_pages: totalPages
      });
    }
  }, [isConnected, session, sendEvent, selectedChapter]);

  // Handle time spent on PDF page - emit signal
  const handleTimeOnPage = useCallback((page: number, seconds: number) => {
    console.log(`[CLRS] Spent ${seconds}s on page ${page}`);
    
    // Send time_spent signal for meaningful durations (> 5 seconds)
    if (isConnected && session && seconds > 5) {
      sendEvent('time_spent', {
        item_type: 'chapter',
        item_id: selectedChapter?.id,
        page,
        duration_seconds: seconds
      });
    }
    
    if (seconds > 30) {
      setNotification({ type: 'info', message: `Great focus! ${seconds}s on page ${page}` });
    }
  }, [isConnected, session, sendEvent, selectedChapter]);

  // Handle PDF document load
  const handleDocumentLoad = useCallback((totalPages: number) => {
    setNotification({ type: 'success', message: `PDF loaded: ${totalPages} pages` });
  }, []);

  // Handle PDF file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setNotification({ type: 'error', message: 'Please select a PDF file' });
      return;
    }

    try {
      setUploadProgress(30);
      await savePDF(file);
      setUploadProgress(70);
      
      const blob = await loadPDF();
      setUploadProgress(100);
      
      if (blob) {
        setPdfBlob(blob);
        setShowUploadDialog(false);
        setNotification({ type: 'success', message: 'PDF uploaded successfully!' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to save PDF' });
    } finally {
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  // Handle PDF removal
  const handleRemovePDF = useCallback(async () => {
    try {
      await deletePDF();
      setPdfBlob(null);
      setShowUploadDialog(true);
      setNotification({ type: 'info', message: 'PDF removed' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to remove PDF' });
    }
  }, []);

  return (
    <MainCard
      title="CLRS Reader"
      secondary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="pdf" aria-label="PDF view">
              <IconBook size={16} />
              <Typography variant="caption" sx={{ ml: 0.5 }}>Read</Typography>
            </ToggleButton>
            <ToggleButton value="overview" aria-label="Overview">
              <IconList size={16} />
              <Typography variant="caption" sx={{ ml: 0.5 }}>Overview</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* PDF Upload/Replace */}
          <IconButton 
            size="small" 
            onClick={() => setShowUploadDialog(true)}
            color={pdfBlob ? 'default' : 'primary'}
          >
            <IconUpload size={18} />
          </IconButton>
          
          <Typography variant="caption" color="text.secondary">
            {connectionState === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </Typography>
          <IconButton size="small" onClick={() => setShowNav(!showNav)}>
            <IconMenu2 size={18} />
          </IconButton>
          <IconButton size="small" onClick={() => setShowChat(!showChat)} color={showChat ? 'primary' : 'default'}>
            <IconMessageCircle size={18} />
          </IconButton>
        </Box>
      }
      sx={{ height: 'calc(100vh - 100px)' }}
      contentSX={{ p: 0, height: '100%', display: 'flex' }}
    >
      {/* Chapter Navigation - Left Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={showNav}
        sx={{
          width: showNav ? NAV_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: NAV_WIDTH,
            position: 'relative',
            border: 'none',
            borderRight: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        <ChapterNav
          selectedChapterId={selectedChapter?.id || null}
          onSelectChapter={handleSelectChapter}
          learningItems={learningItems}
        />
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}
      >
        {viewMode === 'pdf' ? (
          /* PDF Reader View */
          pdfLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">Loading PDF...</Typography>
            </Box>
          ) : pdfBlob ? (
            <PDFViewer
              pdfBlob={pdfBlob}
              onPageChange={handlePageChange}
              onTimeOnPage={handleTimeOnPage}
              onDocumentLoad={handleDocumentLoad}
            />
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                gap: 3
              }}
            >
              <IconFileTypePdf size={64} color={theme.palette.text.secondary} />
              <Typography variant="h6" color="text.secondary">
                No PDF uploaded
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your CLRS PDF to start reading
              </Typography>
              <Button
                variant="contained"
                startIcon={<IconUpload size={18} />}
                onClick={() => setShowUploadDialog(true)}
              >
                Upload PDF
              </Button>
            </Box>
          )
        ) : (
          /* Chapter Overview */
          selectedChapter ? (
            <ChapterContent
              chapter={selectedChapter}
              learningItem={selectedChapterItem}
              onStartReading={() => {
                handleStartReading();
                setViewMode('pdf'); // Switch to PDF view
              }}
              onMarkComplete={handleMarkComplete}
              onAskAgent={handleAskAgent}
              onNavigate={handleNavigate}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                Select a chapter to begin
              </Typography>
            </Box>
          )
        )}
      </Box>

      {/* AI Chat Sidebar - Right */}
      {showChat && (
        <ChatSidebar
          messages={messages}
          isTyping={isTyping}
          isConnected={isConnected}
          hasSession={!!session}
          agentName="CLRS Learning Agent"
          onSend={sendMessage}
          onClose={() => setShowChat(false)}
          width={chatWidth}
          onWidthChange={setChatWidth}
          minWidth={MIN_CHAT_WIDTH}
          maxWidth={MAX_CHAT_WIDTH}
        />
      )}

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notification?.type || 'info'}
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      {itemsError && (
        <Snackbar
          open={!!itemsError}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error">{itemsError}</Alert>
        </Snackbar>
      )}

      {/* PDF Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => pdfBlob && setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {pdfBlob ? 'Replace PDF' : 'Upload CLRS PDF'}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 3
            }}
          >
            <Box
              sx={{
                width: '100%',
                p: 4,
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconFileTypePdf size={48} color={theme.palette.primary.main} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Click to select PDF file
              </Typography>
              <Typography variant="caption" color="text.secondary">
                or drag and drop
              </Typography>
            </Box>

            {uploadProgress > 0 && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Saving PDF... {uploadProgress}%
                </Typography>
              </Box>
            )}

            {pdfBlob && (
              <Alert severity="info" sx={{ width: '100%' }}>
                You already have a PDF uploaded. Uploading a new one will replace it.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {pdfBlob && (
            <Button
              color="error"
              startIcon={<IconTrash size={16} />}
              onClick={handleRemovePDF}
            >
              Remove PDF
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          {pdfBlob && (
            <Button onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </MainCard>
  );
}

