import React, { useState, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import { Box, Typography, Chip, Pagination, Alert, CircularProgress } from '@mui/material';
import MainCard from '@/ui-component/cards/MainCard';
import { ChunkFilters } from './components/chunks/ChunkFilters';
import { ChunkStats } from './components/chunks/ChunkStats';
import { ChunkCard } from './components/chunks/ChunkCard';
import { ChunkHeader } from './components/chunks/ChunkHeader';
import { ChunkDialogs } from './components/chunks/ChunkDialogs';
import { EmptyState } from './components/chunks/EmptyState';
import { useChunks } from '@/hooks/useChunks';
import { usePagination } from '@/hooks/usePagination';
import { ChunkUtils } from '../utilities/chunk.utils';
import { chunkAPI } from '@/api/chunkAPI';
import { Chunk } from '@/types/api';
// ...imports unchanged, add a couple:
import { saveAs } from 'file-saver';
import { Button, Stack } from '@mui/material';
import { IconDownload, IconUserPlus, IconUserMinus, IconTrash } from '@tabler/icons-react';
import type { ServerFilters } from '@/hooks/useChunks';

const ChunkList: React.FC = () => {
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchTerm, setSearchTerm] = useState('');

  const [filterType, setFilterType] = useState('all');

  const [sortBy, setSortBy] = useState('created_desc');

  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [selectedChunks, setSelectedChunks] = useState<Chunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  
  // Dialog states
  const [dialogStates, setDialogStates] = useState({
    addDialog: false,
    viewDialog: false,
    assignDialog: false
  });

  
  const [serverFilters, setServerFilters] = useState<ServerFilters>({ order: -1 });
  const [selectedWorkspaceIdFilter, setSelectedWorkspaceIdFilter] = useState<string | null>(null);
  
  const { chunks, workspaces, loading, error, totalChunks, workspaceId, setError, refetch } =
    useChunks(selectedWorkspaceIdFilter ?? undefined, serverFilters);
  
  // Process chunks with filters and sorting
  const filteredChunks = useMemo(() => 
    ChunkUtils.processChunks(chunks, { searchTerm, filterType, sortBy }),
    [chunks, searchTerm, filterType, sortBy]
  );
  
  // Pagination
  const { page, totalPages, startIndex, endIndex, goToPage } = 
    usePagination(filteredChunks.length, itemsPerPage);
  
  const paginatedChunks = filteredChunks.slice(startIndex, endIndex);
  
  // Stats calculation
  const stats = useMemo(() => ({
    totalChunks: filteredChunks.length,
    workspacesCount: workspaces.length,
    taggedChunks: filteredChunks.filter(c => c.tags && c.tags.length > 0).length,
    dataTypes: [...new Set(filteredChunks.map(c => c.data_type))].length
  }), [filteredChunks, workspaces]);
  
  // Handlers
  const handleSelectChunk = (chunk: Chunk) => {
    setSelectedChunks(prev => {
      const isSelected = prev.some(c => c._id === chunk._id);
      return isSelected 
        ? prev.filter(c => c._id !== chunk._id)
        : [...prev, chunk];
    });
  };
  
  const handleDeleteChunk = async (chunkId: string) => {
    if (!window.confirm('Are you sure you want to delete this chunk?')) return;
    
    try {
      await chunkAPI.deleteChunk(chunkId);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to delete chunk');
    }
  };
  
  const toggleDialog = (dialog: keyof typeof dialogStates, state?: boolean) => {
    setDialogStates(prev => ({
      ...prev,
      [dialog]: state !== undefined ? state : !prev[dialog]
    }));
  };

  // bulk actions
const selectedIds = selectedChunks.map(c => c._id);

const bulkAssign = async (targetWorkspaceId: string) => {
  try {
    await chunkAPI.assignChunksToWorkspace(targetWorkspaceId, selectedIds);
    setSelectedChunks([]);
    refetch();
  } catch (e:any) { setError(e.message || 'Failed to assign'); }
};

const bulkUnassign = async (fromWorkspaceId: string) => {
  try {
    await chunkAPI.unassignChunksFromWorkspace(fromWorkspaceId, selectedIds);
    setSelectedChunks([]);
    refetch();
  } catch (e:any) { setError(e.message || 'Failed to unassign'); }
};

const bulkDelete = async () => {
  if (!window.confirm(`Delete ${selectedIds.length} chunk(s)? This cannot be undone.`)) return;
  try {
    for (const id of selectedIds) {
      await chunkAPI.deleteChunk(id);
    }
    setSelectedChunks([]);
    refetch();
  } catch (e:any) { setError(e.message || 'Failed to delete'); }
};

// export utilities
const exportJSON = () => {
  const blob = new Blob([JSON.stringify(filteredChunks, null, 2)], { type: 'application/json' });
  saveAs(blob, `chunks_${Date.now()}.json`);
};

const exportCSV = () => {
  const rows = filteredChunks.map(c => ({
    id: c._id,
    type: c.data_type,
    // flatten a little for CSV
    content: typeof c.content === 'string' ? c.content.replace(/\s+/g,' ').slice(0,200) : JSON.stringify(c.content),
    workspaces: Array.isArray(c.workspaces) ? c.workspaces.map(w => ('_id' in w ? w.name : w)).join('|') : '',
    doc: c.document?.filename ?? '',
    // prefer end - start when present
    length: (c.metadata?.start != null && c.metadata?.end != null)
      ? (Number(c.metadata.end) - Number(c.metadata.start))
      : (c.metadata?.length ?? ''),
    page: c.metadata?.page ?? '',
    created_at: c.created_at ?? ''
  }));
  const header = Object.keys(rows[0] || {});
  const csv = [header.join(','), ...rows.map(r => header.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `chunks_${Date.now()}.csv`);
};
  
  return (
    <MainCard 
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h3">Knowledge Chunks</Typography>
          <Chip label={`${totalChunks || filteredChunks.length} total`} color="primary" size="small" />
          {selectedChunks.length > 0 && (
            <Chip label={`${selectedChunks.length} selected`} color="secondary" size="small" />
          )}
        </Box>
      }
      secondary={
        <>
          <ChunkHeader
            viewMode={viewMode}
            selectedCount={selectedChunks.length}
            onViewModeChange={setViewMode}
            onAddClick={() => toggleDialog('addDialog', true)}
            onAssignClick={() => toggleDialog('assignDialog', true)}
            onRefresh={refetch}
          />
          {selectedChunks.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
              <Button size="small" startIcon={<IconUserPlus/>}
                onClick={() => toggleDialog('assignDialog', true)}>Assign</Button>
              {/** If you’re inside a workspace route, offer a 1-click unassign */}
              {workspaceId && (
                <Button size="small" startIcon={<IconUserMinus/>}
                  onClick={() => bulkUnassign(workspaceId)}>Unassign</Button>
              )}
              <Button size="small" color="error" startIcon={<IconTrash/>} onClick={bulkDelete}>Delete</Button>
              <Button size="small" startIcon={<IconDownload/>} onClick={exportJSON}>Export JSON</Button>
              <Button size="small" startIcon={<IconDownload/>} onClick={exportCSV}>Export CSV</Button>
            </Stack>
          )}
        </>
      }
      
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <ChunkFilters
      searchTerm={searchTerm}
      filterType={filterType}
      sortBy={sortBy}
      itemsPerPage={itemsPerPage}
      workspaces={workspaces}
      selectedWorkspaceId={selectedWorkspaceIdFilter ?? workspaceId ?? null}
      onWorkspaceChange={(id) => setSelectedWorkspaceIdFilter(id)}
      dataType={(serverFilters.data_type ?? 'all') as any}
      onDataTypeChange={(v) => setServerFilters(f => ({ ...f, data_type: v === 'all' ? undefined : v }))}
      order={serverFilters.order ?? -1}
      onOrderChange={(v) => setServerFilters(f => ({ ...f, order: v }))}
      documentId={serverFilters.document_id}
      onDocumentIdChange={(v) => setServerFilters(f => ({ ...f, document_id: v || undefined }))}
      documentFilename={serverFilters.document_filename}
      onDocumentFilenameChange={(v) => setServerFilters(f => ({ ...f, document_filename: v || undefined }))}
      seedConcept={serverFilters.seed_concept}
      onSeedConceptChange={(v) => setServerFilters(f => ({ ...f, seed_concept: v || undefined }))}
      onSearchChange={setSearchTerm}
      onFilterTypeChange={setFilterType}
      onSortChange={setSortBy}
      onItemsPerPageChange={(value) => { setItemsPerPage(value); goToPage(1); }}
    />

      
      {filteredChunks.length > 0 && <ChunkStats {...stats} />}
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : paginatedChunks.length === 0 ? (
        <EmptyState hasFilters={!!searchTerm || filterType !== 'all'} />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {paginatedChunks.map(chunk => (
              <Grid 
                size={{
                  xs: 12,
                  md: viewMode === 'grid' ? 6 : 12,
                  lg: viewMode === 'grid' ? 4 : 12
                }}
                key={chunk._id}
              >
                <ChunkCard
                  chunk={chunk}
                  workspaces={workspaces}
                  allChunks={filteredChunks}
                  viewMode={viewMode}
                  isSelected={selectedChunks.some(c => c._id === chunk._id)}
                  onView={(chunk) => {
                    setSelectedChunk(chunk);
                    toggleDialog('viewDialog', true);
                  }}
                  onDelete={handleDeleteChunk}
                  onSelect={handleSelectChunk}
                />
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={(_, value) => goToPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
          
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
            Showing {startIndex + 1} - {Math.min(endIndex, filteredChunks.length)} of {filteredChunks.length} chunks
          </Typography>
        </>
      )}
      
      <ChunkDialogs
        dialogStates={dialogStates}
        selectedChunk={selectedChunk}
        selectedChunks={selectedChunks}
        workspaces={workspaces}
        onClose={(dialog) => toggleDialog(dialog, false)}
        onSuccess={refetch}
      />
    </MainCard>
  );
};

export default ChunkList;