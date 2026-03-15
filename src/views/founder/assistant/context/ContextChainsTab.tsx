/**
 * ContextChainsTab — Context chain list, detail, CRUD, and preview
 */
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  getContextChainsList,
  getContextChainByUuid,
  getContextChainPreview,
  createContextChain,
  updateContextChain,
  deleteContextChain,
  getCurrentUserId,
  type ContextChainResponse,
  type ContextChainDetailResponse,
  type CreateContextChainRequest
} from '@/api/founder';
import type { UpdateContextChainRequest } from '@/api/founder/schemas';
import SubCard from 'ui-component/cards/SubCard';
import CreateContextChainDialog from './CreateContextChainDialog';
import EditContextChainDialog from './EditContextChainDialog';
import DeleteContextChainConfirmDialog from './DeleteContextChainConfirmDialog';
import ContextChainPreview from './ContextChainPreview';
import DryRunChatDialog from './DryRunChatDialog';

export default function ContextChainsTab() {
  const [chains, setChains] = useState<ContextChainResponse[]>([]);
  const [selectedChain, setSelectedChain] = useState<ContextChainDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getContextChainPreview>> | null>(
    null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dryRunOpen, setDryRunOpen] = useState(false);

  const loadChains = useCallback(async () => {
    try {
      const res = await getContextChainsList();
      setChains(res.chains ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chains');
    }
  }, []);

  const loadDetail = useCallback(async (uuid: string) => {
    setDetailLoading(true);
    setSelectedChain(null);
    try {
      const detail = await getContextChainByUuid(uuid);
      setSelectedChain(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chain');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadPreview = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPreviewError('Not authenticated');
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const p = await getContextChainPreview(userId);
      setPreview(p);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadChains();
    setLoading(false);
  }, [loadChains]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSelectChain = (chain: ContextChainResponse) => {
    if (chain.uuid) {
      loadDetail(chain.uuid);
    }
  };

  const handleCreate = async (data: CreateContextChainRequest) => {
    await createContextChain(data);
    await loadChains();
    setCreateOpen(false);
  };

  const handleEdit = async (data: UpdateContextChainRequest) => {
    if (!selectedChain?.uuid) return;
    await updateContextChain(selectedChain.uuid, data);
    await loadDetail(selectedChain.uuid);
    await loadChains();
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedChain?.uuid) return;
    await deleteContextChain(selectedChain.uuid);
    setSelectedChain(null);
    await loadChains();
    setDeleteOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4} md={3}>
          <SubCard
            title="Context Chains"
            secondary={
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
                variant="outlined"
              >
                Add
              </Button>
            }
          >
            {chains.length === 0 ? (
              <Typography color="text.secondary">No chains found.</Typography>
            ) : (
              <Stack spacing={1}>
                {chains.map((c) => (
                  <Card
                    key={c.uuid ?? c.id}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      borderColor:
                        selectedChain?.uuid === c.uuid ? 'primary.main' : 'divider',
                      bgcolor: selectedChain?.uuid === c.uuid ? 'action.selected' : 'transparent'
                    }}
                    onClick={() => handleSelectChain(c)}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2">{c.name ?? '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.task_type ?? '—'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </SubCard>
        </Grid>

        <Grid item xs={12} sm={8} md={9}>
          <Stack spacing={2}>
            <SubCard title="Chain Detail">
              {detailLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : selectedChain ? (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip label={selectedChain.name ?? '—'} size="small" />
                    <Chip label={selectedChain.task_type ?? '—'} size="small" variant="outlined" />
                    {selectedChain.description && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedChain.description}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => setDryRunOpen(true)}
                    >
                      Dry Run
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditOpen(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                  </Stack>

                  {selectedChain.nodes && selectedChain.nodes.length > 0 && (
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Nodes
                    </Typography>
                  )}
                  {selectedChain.nodes && selectedChain.nodes.length > 0 && (
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>UUID</TableCell>
                            <TableCell>Position</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedChain.nodes.map((n) => (
                            <TableRow key={n.uuid ?? n.id}>
                              <TableCell>{n.node_type ?? '—'}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {n.uuid ?? '—'}
                              </TableCell>
                              <TableCell>
                                {n.position_x != null && n.position_y != null
                                  ? `(${n.position_x}, ${n.position_y})`
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {selectedChain.edges && selectedChain.edges.length > 0 && (
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Edges
                    </Typography>
                  )}
                  {selectedChain.edges && selectedChain.edges.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedChain.edges.map((e) => (
                            <TableRow key={e.uuid ?? e.id}>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {e.from_node_id ?? '—'}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {e.to_node_id ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {(!selectedChain.nodes || selectedChain.nodes.length === 0) &&
                    (!selectedChain.edges || selectedChain.edges.length === 0) && (
                      <Typography variant="body2" color="text.secondary">
                        No nodes or edges. Chain structure is managed via backend/DB.
                      </Typography>
                    )}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Select a chain to view details.
                </Typography>
              )}
            </SubCard>

            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Chain Preview (active session)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 1 }}>
                  <Button size="small" variant="outlined" onClick={loadPreview}>
                    Load Preview
                  </Button>
                </Box>
                <ContextChainPreview
                  preview={preview}
                  loading={previewLoading}
                  error={previewError}
                />
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Grid>
      </Grid>

      <CreateContextChainDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
      <EditContextChainDialog
        open={editOpen}
        chain={selectedChain}
        onClose={() => setEditOpen(false)}
        onSave={handleEdit}
      />
      <DeleteContextChainConfirmDialog
        open={deleteOpen}
        chainName={selectedChain?.name ?? ''}
        chainUuid={selectedChain?.uuid ?? ''}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
      <DryRunChatDialog
        open={dryRunOpen}
        onClose={() => setDryRunOpen(false)}
        taskType={selectedChain?.task_type ?? 'domain_knowledge_assessment'}
      />
    </Box>
  );
}
