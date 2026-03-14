/**
 * DomainKnowledgeManageTab — Concepts and Edges CRUD within a domain
 */
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getDomainKnowledgeConcepts,
  getDomainKnowledgeEdges,
  createDomainKnowledgeConcept,
  updateDomainKnowledgeConcept,
  deleteDomainKnowledgeConcept,
  createDomainKnowledgeEdge,
  updateDomainKnowledgeEdge,
  deleteDomainKnowledgeEdge
} from '@/api/founder/knowledgeAPI';
import type {
  DomainKnowledgeConceptResponse,
  DomainKnowledgeEdgeResponse
} from '@/api/founder/knowledgeAPI';
import type {
  CreateDomainKnowledgeConceptRequest,
  UpdateDomainKnowledgeConceptRequest,
  CreateDomainKnowledgeEdgeRequest,
  UpdateDomainKnowledgeEdgeRequest
} from '@/api/founder/schemas';
import CreateConceptDialog from './CreateConceptDialog';
import EditConceptDialog from './EditConceptDialog';
import DeleteConceptConfirmDialog from './DeleteConceptConfirmDialog';
import CreateEdgeDialog from './CreateEdgeDialog';
import EditEdgeDialog from './EditEdgeDialog';
import DeleteEdgeConfirmDialog from './DeleteEdgeConfirmDialog';

export interface DomainKnowledgeManageTabProps {
  slug: string;
  domainName: string;
  onGraphChanged?: () => void;
}

export default function DomainKnowledgeManageTab({
  slug,
  domainName,
  onGraphChanged
}: DomainKnowledgeManageTabProps) {
  const [tab, setTab] = useState(0);
  const [concepts, setConcepts] = useState<DomainKnowledgeConceptResponse[]>([]);
  const [edges, setEdges] = useState<DomainKnowledgeEdgeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createConceptOpen, setCreateConceptOpen] = useState(false);
  const [editConceptOpen, setEditConceptOpen] = useState(false);
  const [deleteConceptOpen, setDeleteConceptOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<DomainKnowledgeConceptResponse | null>(null);

  const [createEdgeOpen, setCreateEdgeOpen] = useState(false);
  const [editEdgeOpen, setEditEdgeOpen] = useState(false);
  const [deleteEdgeOpen, setDeleteEdgeOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<DomainKnowledgeEdgeResponse | null>(null);

  const loadConcepts = useCallback(async () => {
    try {
      const res = await getDomainKnowledgeConcepts(slug);
      setConcepts(res.concepts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concepts');
    }
  }, [slug]);

  const loadEdges = useCallback(async () => {
    try {
      const res = await getDomainKnowledgeEdges(slug);
      setEdges(res.edges ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load edges');
    }
  }, [slug]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadConcepts(), loadEdges()]);
    setLoading(false);
  }, [loadConcepts, loadEdges]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateConcept = async (data: CreateDomainKnowledgeConceptRequest) => {
    await createDomainKnowledgeConcept(slug, data);
    await loadConcepts();
    onGraphChanged?.();
    setCreateConceptOpen(false);
  };

  const handleEditConcept = async (data: UpdateDomainKnowledgeConceptRequest) => {
    if (!selectedConcept) return;
    await updateDomainKnowledgeConcept(slug, selectedConcept.slug, data);
    await loadConcepts();
    onGraphChanged?.();
    setEditConceptOpen(false);
    setSelectedConcept(null);
  };

  const handleDeleteConcept = async () => {
    if (!selectedConcept) return;
    await deleteDomainKnowledgeConcept(slug, selectedConcept.slug);
    await loadConcepts();
    onGraphChanged?.();
    setDeleteConceptOpen(false);
    setSelectedConcept(null);
  };

  const handleCreateEdge = async (data: CreateDomainKnowledgeEdgeRequest) => {
    await createDomainKnowledgeEdge(slug, data);
    await loadEdges();
    onGraphChanged?.();
    setCreateEdgeOpen(false);
  };

  const handleEditEdge = async (data: UpdateDomainKnowledgeEdgeRequest) => {
    if (!selectedEdge) return;
    await updateDomainKnowledgeEdge(slug, selectedEdge.uuid, data);
    await loadEdges();
    onGraphChanged?.();
    setEditEdgeOpen(false);
    setSelectedEdge(null);
  };

  const handleDeleteEdge = async () => {
    if (!selectedEdge) return;
    await deleteDomainKnowledgeEdge(slug, selectedEdge.uuid);
    await loadEdges();
    onGraphChanged?.();
    setDeleteEdgeOpen(false);
    setSelectedEdge(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Concepts" />
        <Tab label="Edges" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Concepts ({concepts.length})</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateConceptOpen(true)}
            >
              Add concept
            </Button>
          </Box>
          {concepts.length === 0 ? (
            <Typography color="text.secondary">No concepts yet. Add one to get started.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Slug</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Sub-domain</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {concepts.map((c) => (
                  <TableRow key={c.uuid}>
                    <TableCell>{c.slug}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <Chip label={c.difficulty} size="small" />
                    </TableCell>
                    <TableCell>{c.sub_domain ?? '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedConcept(c);
                          setEditConceptOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedConcept(c);
                          setDeleteConceptOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Edges ({edges.length})</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateEdgeOpen(true)}
              disabled={concepts.length < 2}
            >
              Add edge
            </Button>
          </Box>
          {concepts.length < 2 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Add at least 2 concepts before creating edges.
            </Alert>
          )}
          {edges.length === 0 ? (
            <Typography color="text.secondary">
              No edges yet. Edges connect concepts (e.g. prerequisite, builds_on).
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Strength</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {edges.map((e) => (
                  <TableRow key={e.uuid}>
                    <TableCell>{e.from_concept_slug ?? e.from_concept_uuid}</TableCell>
                    <TableCell>{e.to_concept_slug ?? e.to_concept_uuid}</TableCell>
                    <TableCell>
                      <Chip label={e.relationship} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{e.strength.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedEdge(e);
                          setEditEdgeOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedEdge(e);
                          setDeleteEdgeOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      <CreateConceptDialog
        open={createConceptOpen}
        onClose={() => setCreateConceptOpen(false)}
        onCreate={handleCreateConcept}
      />
      <EditConceptDialog
        open={editConceptOpen}
        concept={selectedConcept}
        onClose={() => {
          setEditConceptOpen(false);
          setSelectedConcept(null);
        }}
        onSave={handleEditConcept}
      />
      <DeleteConceptConfirmDialog
        open={deleteConceptOpen}
        concept={selectedConcept}
        onClose={() => {
          setDeleteConceptOpen(false);
          setSelectedConcept(null);
        }}
        onConfirm={handleDeleteConcept}
      />
      <CreateEdgeDialog
        open={createEdgeOpen}
        concepts={concepts}
        onClose={() => setCreateEdgeOpen(false)}
        onCreate={handleCreateEdge}
      />
      <EditEdgeDialog
        open={editEdgeOpen}
        edge={selectedEdge}
        onClose={() => {
          setEditEdgeOpen(false);
          setSelectedEdge(null);
        }}
        onSave={handleEditEdge}
      />
      <DeleteEdgeConfirmDialog
        open={deleteEdgeOpen}
        edge={selectedEdge}
        onClose={() => {
          setDeleteEdgeOpen(false);
          setSelectedEdge(null);
        }}
        onConfirm={handleDeleteEdge}
      />
    </Box>
  );
}
