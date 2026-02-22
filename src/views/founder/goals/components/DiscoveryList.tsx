/**
 * DiscoveryList
 * Compact dot-style display for radar discovery items (job listings, etc.)
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import type { RadarDiscoveryItem } from '@/api/founder';

export interface DiscoveryListProps {
  items: RadarDiscoveryItem[];
  loading?: boolean;
  error?: string | null;
  /** Show "No discoveries yet" when empty (e.g. for job_search pursuits) */
  showEmptyState?: boolean;
}

export default function DiscoveryList({
  items,
  loading,
  error,
  showEmptyState = false
}: DiscoveryListProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!items?.length) {
    if (!showEmptyState) return null;
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No discoveries yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Discoveries
        </Typography>
        <Box
          component="span"
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            fontSize: '0.7rem',
            fontWeight: 600,
            color: theme.palette.primary.main
          }}
        >
          {items.length}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'wrap'
          }}
        >
          {items.slice(0, 24).map((item, index) => {
            const title = item.title ?? 'Untitled';
            const url = item.source_url ?? undefined;
            const matchPct =
              item.match_score != null ? Math.round(item.match_score * 100) : null;

            return (
              <Tooltip
                key={item.uuid ?? `d-${index}`}
                title={
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                      {title}
                    </Typography>
                    {item.source_site && (
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {item.source_site}
                        {matchPct != null ? ` · ${matchPct}% match` : ''}
                      </Typography>
                    )}
                    {url && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        Click to open
                      </Typography>
                    )}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box
                  component={url ? 'a' : 'span'}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: matchPct != null && matchPct >= 70
                      ? theme.palette.success.main
                      : matchPct != null && matchPct >= 50
                        ? theme.palette.warning.main
                        : theme.palette.grey[400],
                    cursor: url ? 'pointer' : 'default',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    '&:hover': url
                      ? {
                          transform: 'scale(1.3)',
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
                        }
                      : {}
                  }}
                />
              </Tooltip>
            );
          })}
          {items.length > 24 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              +{items.length - 24}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
