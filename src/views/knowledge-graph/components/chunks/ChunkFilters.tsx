import React, { useState, useEffect } from 'react';
import { Grid, TextField, MenuItem, Select, InputLabel, FormControl, Box, Stack } from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import type { Workspace } from '../../../../types/chunk-ui';

interface Props {
  searchTerm: string;
  filterType: string;                       // kept for local client-side filter
  sortBy: string;                           // kept for local sort (cards)
  itemsPerPage: number;

  // new server-side filters
  workspaces: Workspace[];
  selectedWorkspaceId?: string | null;
  onWorkspaceChange: (id: string | null) => void;

  dataType?: 'string' | 'object' | 'all';
  onDataTypeChange: (v: 'string' | 'object' | 'all') => void;

  order: 1 | -1;
  onOrderChange: (v: 1 | -1) => void;

  documentId?: string;
  onDocumentIdChange: (v: string) => void;
  documentFilename?: string;
  onDocumentFilenameChange: (v: string) => void;

  seedConcept?: string;
  onSeedConceptChange: (v: string) => void;

  onSearchChange: (v: string) => void;
  onFilterTypeChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onItemsPerPageChange: (n: number) => void;
}

export const ChunkFilters: React.FC<Props> = ({
  searchTerm, filterType, sortBy, itemsPerPage,
  workspaces, selectedWorkspaceId, onWorkspaceChange,
  dataType = 'all', onDataTypeChange,
  order, onOrderChange,
  documentId, onDocumentIdChange,
  documentFilename, onDocumentFilenameChange,
  seedConcept, onSeedConceptChange,
  onSearchChange, onFilterTypeChange, onSortChange, onItemsPerPageChange
}) => {
  const [workspaceVal, setWorkspaceVal] = useState<string>(selectedWorkspaceId ?? '');

  useEffect(() => setWorkspaceVal(selectedWorkspaceId ?? ''), [selectedWorkspaceId]);

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search chunks by content or tags…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <IconSearch size={18} style={{ marginRight: 8 }} />
            }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Workspace</InputLabel>
            <Select
              label="Workspace"
              value={workspaceVal}
              onChange={(e) => onWorkspaceChange(e.target.value ? String(e.target.value) : null)}
            >
              <MenuItem value="">All</MenuItem>
              {workspaces.map(ws => (
                <MenuItem key={ws._id} value={ws._id}>{ws.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={dataType}
              onChange={(e) => onDataTypeChange(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="string">Text</MenuItem>
              <MenuItem value="object">Structured</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Order</InputLabel>
            <Select
              label="Order"
              value={order}
              onChange={(e) => onOrderChange(Number(e.target.value) as 1 | -1)}
            >
              <MenuItem value={-1}>Newest First</MenuItem>
              <MenuItem value={1}>Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Items / Page</InputLabel>
            <Select
              label="Items / Page"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              {[12, 24, 36, 60].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Document ID"
            value={documentId ?? ''}
            onChange={(e) => onDocumentIdChange(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Document Filename"
            value={documentFilename ?? ''}
            onChange={(e) => onDocumentFilenameChange(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Semantic search (seed concept)"
            placeholder="e.g., 'portfolio diversification with low volatility'"
            value={seedConcept ?? ''}
            onChange={(e) => onSeedConceptChange(e.target.value)}
            helperText="Requires backend seed_concept support; safely ignored otherwise."
          />
        </Grid>
      </Grid>
    </Box>
  );
};
