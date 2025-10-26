// src/views/knowledge-graph/components/chunks/ChunkDialogs.tsx
import React, { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Chip, Box, MenuItem, Select, InputLabel, FormControl, Typography, Divider, IconButton
} from '@mui/material';
import { IconPlus, IconX } from '@tabler/icons-react';
import { chunkAPI } from '../../../../api/chunkAPI';
import type { Chunk } from '../../../../types/api';
import type { Workspace } from '../../../../types/workspace';

interface Props {
  dialogStates: { addDialog: boolean; viewDialog: boolean; assignDialog: boolean; };
  selectedChunk: Chunk | null;
  selectedChunks: Chunk[];
  workspaces: Workspace[];
  onClose: (d: 'addDialog' | 'viewDialog' | 'assignDialog') => void;
  onSuccess: () => void;
}

export const ChunkDialogs: React.FC<Props> = ({
  dialogStates, selectedChunk, selectedChunks, workspaces, onClose, onSuccess
}) => {
  // --------- Add Chunks -----------
  const [addWS, setAddWS] = useState<string>('');
  const [addText, setAddText] = useState('');
  const [addTags, setAddTags] = useState<string>('');
  const [addMeta, setAddMeta] = useState<{ key: string; value: string }>({ key: '', value: '' });
  const [addMetaPairs, setAddMetaPairs] = useState<Array<{ key: string; value: string }>>([]);

  const submitAdd = async () => {
    if (!addWS) return;
    const chunks = addText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => ({
        content: s,
        tags: addTags ? addTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        user_metadata: addMetaPairs.reduce((acc, kv) => ({ ...acc, [kv.key]: kv.value }), {} as Record<string, unknown>)
      }));
    await chunkAPI.addChunks(addWS, { chunks });
    setAddText(''); setAddTags(''); setAddMetaPairs([]); onClose('addDialog'); onSuccess();
  };

  // --------- View/Edit (Tags/Metadata) -----------
  const [editWS, setEditWS] = useState<string>('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editMetaKey, setEditMetaKey] = useState('');
  const [editMetaValue, setEditMetaValue] = useState('');

  const editableWorkspaces = useMemo(() => {
    const arr = (selectedChunk?.workspaces ?? []);
    return arr.map((w:any) => ('_id' in w ? w : { _id: w, name: '' }));
  }, [selectedChunk]);

  const commitEdit = async () => {
    if (!selectedChunk || !editWS) return;
    const tags = editTagsInput ? editTagsInput.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    const user_metadata = editMetaKey ? { [editMetaKey]: editMetaValue } : undefined;
    await chunkAPI.updateChunk(selectedChunk._id, editWS, { tags, user_metadata });
    onClose('viewDialog'); onSuccess();
  };

  // --------- Assign / Unassign (bulk) -----------
  const [assignWS, setAssignWS] = useState<string>('');
  const [assignMode, setAssignMode] = useState<'assign' | 'unassign'>('assign');
  const canSubmitAssign = assignWS && selectedChunks.length > 0;

  const submitAssign = async () => {
    if (!canSubmitAssign) return;
    if (assignMode === 'assign') {
      await chunkAPI.assignChunksToWorkspace(assignWS, selectedChunks.map(c => c._id));
    } else {
      await chunkAPI.unassignChunksFromWorkspace(assignWS, selectedChunks.map(c => c._id));
    }
    onClose('assignDialog'); onSuccess();
  };

  return (
    <>
      {/* Add Dialog */}
      <Dialog open={dialogStates.addDialog} onClose={() => onClose('addDialog')} maxWidth="md" fullWidth>
        <DialogTitle>Add Chunks</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Workspace</InputLabel>
              <Select label="Workspace" value={addWS} onChange={(e) => setAddWS(String(e.target.value))}>
                {workspaces.map(w => <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="One chunk per line"
              multiline minRows={6}
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
            />
            <TextField
              label="Tags (comma separated)"
              value={addTags}
              onChange={(e) => setAddTags(e.target.value)}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField label="Metadata key" value={addMeta.key} onChange={(e)=>setAddMeta(s=>({...s,key:e.target.value}))}/>
              <TextField label="Metadata value" value={addMeta.value} onChange={(e)=>setAddMeta(s=>({...s,value:e.target.value}))}/>
              <IconButton onClick={() => {
                if (addMeta.key) setAddMetaPairs(p=>[...p,{...addMeta}]), setAddMeta({key:'',value:''});
              }}><IconPlus/></IconButton>
            </Stack>
            <Box>
              {addMetaPairs.map((kv,i)=>(
                <Chip key={i} label={`${kv.key}: ${kv.value}`} onDelete={()=>setAddMetaPairs(p=>p.filter((_,j)=>j!==i))} deleteIcon={<IconX/>} sx={{mr:1,mb:1}}/>
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose('addDialog')}>Cancel</Button>
          <Button variant="contained" disabled={!addWS || !addText.trim()} onClick={submitAdd}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* View/Edit Dialog */}
      <Dialog open={dialogStates.viewDialog} onClose={() => onClose('viewDialog')} maxWidth="md" fullWidth>
        <DialogTitle>Chunk Details</DialogTitle>
        <DialogContent>
          {selectedChunk ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ p:2, border:'1px solid', borderColor:'divider', borderRadius:1, fontFamily:'monospace', whiteSpace:'pre-wrap' }}>
                {typeof selectedChunk.content === 'string'
                  ? selectedChunk.content
                  : JSON.stringify(selectedChunk.content, null, 2)}
              </Box>

              <Divider/>

              <Typography variant="subtitle2">Workspace-scoped fields</Typography>
              <FormControl fullWidth>
                <InputLabel>Workspace</InputLabel>
                <Select
                  label="Workspace"
                  value={editWS}
                  onChange={(e)=>setEditWS(String(e.target.value))}
                >
                  {editableWorkspaces.map((w:any) =>
                    <MenuItem key={w._id} value={w._id}>{w.name || w._id}</MenuItem>)}
                </Select>
              </FormControl>

              <TextField
                label="Replace tags (comma separated)"
                value={editTagsInput}
                onChange={(e)=>setEditTagsInput(e.target.value)}
                helperText="Leave empty to keep existing tags unchanged."
              />

              <Stack direction="row" spacing={1}>
                <TextField label="Metadata key" value={editMetaKey} onChange={(e)=>setEditMetaKey(e.target.value)} />
                <TextField label="Metadata value" value={editMetaValue} onChange={(e)=>setEditMetaValue(e.target.value)} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                If provided, replaces/sets the key only. For complex updates build a richer form later.
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose('viewDialog')}>Close</Button>
          <Button variant="contained" disabled={!selectedChunk || !editWS} onClick={commitEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Assign / Unassign Dialog */}
      <Dialog open={dialogStates.assignDialog} onClose={() => onClose('assignDialog')}>
        <DialogTitle>{assignMode === 'assign' ? 'Assign to Workspace' : 'Unassign from Workspace'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Mode</InputLabel>
              <Select label="Mode" value={assignMode} onChange={(e)=>setAssignMode(e.target.value as any)}>
                <MenuItem value="assign">Assign</MenuItem>
                <MenuItem value="unassign">Unassign</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Workspace</InputLabel>
              <Select label="Workspace" value={assignWS} onChange={(e)=>setAssignWS(String(e.target.value))}>
                {workspaces.map(w => <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {selectedChunks.length} chunk(s) selected
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose('assignDialog')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmitAssign} onClick={submitAssign}>
            {assignMode === 'assign' ? 'Assign' : 'Unassign'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
