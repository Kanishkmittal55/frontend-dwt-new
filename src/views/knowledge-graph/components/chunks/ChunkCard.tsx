import React, { useMemo, useState } from 'react';
import {
  Card, CardContent, CardActions, Box, Typography, Button, Chip, Stack,
  Avatar, Checkbox, IconButton, Paper, Tooltip
} from '@mui/material';
import {
  IconEye, IconCopy, IconTrash, IconChevronUp, IconChevronDown,
  IconJson, IconFileText, IconDatabase, IconTag, IconLanguage,
  IconDimensions, IconCalendar
} from '@tabler/icons-react';
import { OverlapIndicator } from './OverlapIndicator';
import { ChunkUtils } from '../../../utilities/chunk.utils';

// ✅ Use the API types
import type { Chunk, WorkspaceRef } from '../../../../types/api';

interface ChunkCardProps {
  chunk: Chunk;
  workspaces: WorkspaceRef[];         // available workspaces (for name lookup)
  allChunks: Chunk[];
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onView: (chunk: Chunk) => void;
  onDelete: (chunkId: string) => void;
  onSelect: (chunk: Chunk) => void;
}

export const ChunkCard: React.FC<ChunkCardProps> = ({
  chunk,
  workspaces,
  allChunks,
  viewMode,
  isSelected,
  onView,
  onDelete,
  onSelect
}) => {
  const [expanded, setExpanded] = useState(false);

  // defensively resolve when the item could be an id string or a populated object
  const resolveWorkspace = (ws: string | WorkspaceRef) => {
    if (typeof ws === 'string') {
      const found = workspaces.find(w => w._id === ws);
      return { id: ws, name: found?.name ?? '—' };
    }
    return { id: ws._id, name: ws.name ?? '—' };
  };

  const getChunkIcon = (dataType: Chunk['data_type']) =>
    dataType === 'object' ? <IconJson size={20} /> : <IconFileText size={20} />;

  const contentString = useMemo(() => {
    if (typeof chunk.content === 'string') return chunk.content;
    try {
      return JSON.stringify(chunk.content, null, 2);
    } catch {
      return String(chunk.content);
    }
  }, [chunk.content]);

  const preview = expanded
    ? contentString
    : ChunkUtils.formatContent(contentString, viewMode === 'grid' ? 150 : 300);

  // tags can be string[] (scoped) OR a map { wsId: string[] }
  const tagsList = useMemo(() => {
    if (Array.isArray(chunk.tags)) return chunk.tags;
    if (chunk.tags && typeof chunk.tags === 'object') {
      return Object.values(chunk.tags).flat();
    }
    return [];
  }, [chunk.tags]);

  // prefer end-start; then metadata.length; then fallback by content type
  const computedLength = useMemo(() => {
    const m = chunk.metadata || {};
    if (m.start != null && m.end != null) {
      return Math.max(0, Number(m.end) - Number(m.start));
    }
    if (m.length != null) return m.length;
    return typeof chunk.content === 'string'
      ? chunk.content.length
      : Object.keys(chunk.content || {}).length;
  }, [chunk.metadata, chunk.content]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'primary.light' },
        background: isSelected
          ? 'linear-gradient(to bottom right, rgba(33,150,243,.04), transparent)'
          : 'background.paper'
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox checked={isSelected} onChange={() => onSelect(chunk)} size="small" sx={{ p: 0 }} />
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
              {getChunkIcon(chunk.data_type)}
            </Avatar>
            <Stack spacing={0}>
              <Typography variant="caption" color="textSecondary">
                #{chunk._id.slice(-6)}
              </Typography>
              <Chip
                label={chunk.data_type.toUpperCase()}
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
              />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <OverlapIndicator chunk={chunk} allChunks={allChunks} />
            <IconButton
              size="small"
              onClick={() => onView(chunk)}
              color="primary"
              sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light' } }}
            >
              <IconEye size={16} />
            </IconButton>
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: expanded ? 'none' : (viewMode === 'grid' ? '100px' : '150px'),
              overflow: 'hidden'
            }}
          >
            {preview}
          </Typography>

          {contentString.length > 150 && (
            <Box sx={{ textAlign: 'center', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                size="small"
                onClick={() => setExpanded(!expanded)}
                startIcon={expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                sx={{ fontSize: '0.75rem' }}
              >
                {expanded ? 'Show Less' : 'Show More'}
              </Button>
            </Box>
          )}
        </Paper>

        <Stack spacing={1}>
          {Array.isArray(chunk.workspaces) && chunk.workspaces.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <IconDatabase size={14} />
              {chunk.workspaces.map((ws, i) => {
                const { id, name } = resolveWorkspace(ws as any);
                return (
                  <Chip
                    key={`${id}-${i}`}
                    label={name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 22, bgcolor: 'primary.lighter' }}
                  />
                );
              })}
            </Box>
          )}

          {tagsList.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <IconTag size={14} />
              {tagsList.slice(0, 3).map((tag, index) => (
                <Chip
                  key={`${tag}-${index}`}
                  label={tag}
                  size="small"
                  sx={{ fontSize: '0.7rem', height: 22, bgcolor: 'secondary.lighter' }}
                />
              ))}
              {tagsList.length > 3 && (
                <Chip label={`+${tagsList.length - 3}`} size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            {chunk.metadata?.language && (
              <Tooltip title="Language">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconLanguage size={14} />
                  <Typography variant="caption" color="textSecondary">
                    {chunk.metadata.language}
                  </Typography>
                </Stack>
              </Tooltip>
            )}

            <Tooltip title="Length">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconDimensions size={14} />
                <Typography variant="caption" color="textSecondary">
                  {computedLength}
                </Typography>
              </Stack>
            </Tooltip>

            <Tooltip title="Created">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconCalendar size={14} />
                <Typography variant="caption" color="textSecondary">
                  {ChunkUtils.formatDate(chunk.created_at ?? '')}
                </Typography>
              </Stack>
            </Tooltip>
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1, bgcolor: 'grey.50' }}>
        <Button
          size="small"
          startIcon={<IconCopy size={14} />}
          onClick={() => ChunkUtils.copyToClipboard(contentString)}
        >
          Copy
        </Button>
        <Button size="small" color="error" startIcon={<IconTrash size={14} />} onClick={() => onDelete(chunk._id)}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};
