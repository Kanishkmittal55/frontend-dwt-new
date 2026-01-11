/**
 * URL Source Card
 * Displays a URL source with its processing status
 */
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  IconLink, 
  IconTrash, 
  IconRefresh, 
  IconCheck, 
  IconAlertCircle,
  IconClock,
  IconBulb,
  IconExternalLink
} from '@tabler/icons-react';
import type { UrlSource } from 'api/founder/libraryAPI';

interface UrlSourceCardProps {
  source: UrlSource;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

const statusConfig = {
  pending: {
    color: 'default' as const,
    icon: IconClock,
    label: 'Pending'
  },
  processing: {
    color: 'info' as const,
    icon: CircularProgress,
    label: 'Processing'
  },
  completed: {
    color: 'success' as const,
    icon: IconCheck,
    label: 'Completed'
  },
  failed: {
    color: 'error' as const,
    icon: IconAlertCircle,
    label: 'Failed'
  }
};

export default function UrlSourceCard({ source, onDelete, onRetry }: UrlSourceCardProps) {
  const config = statusConfig[source.status];
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card 
      variant="outlined"
      sx={{ 
        transition: 'all 0.2s',
        '&:hover': { 
          boxShadow: 2,
          borderColor: 'primary.main'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Icon */}
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 1, 
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconLink size={24} />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {source.title || 'Unknown'}
              </Typography>
              <Tooltip title="Open URL">
                <IconButton 
                  size="small" 
                  onClick={() => window.open(source.url, '_blank')}
                  sx={{ p: 0.5 }}
                >
                  <IconExternalLink size={16} />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 1
              }}
            >
              {source.url}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                color={config.color}
                icon={source.status === 'processing' 
                  ? <CircularProgress size={12} color="inherit" /> 
                  : <StatusIcon size={14} />
                }
                label={config.label}
              />

              {source.ideas_generated > 0 && (
                <Chip
                  size="small"
                  icon={<IconBulb size={14} />}
                  label={`${source.ideas_generated} idea${source.ideas_generated !== 1 ? 's' : ''}`}
                  variant="outlined"
                />
              )}

              <Typography variant="caption" color="text.secondary">
                Added {formatDate(source.created_at)}
              </Typography>
            </Box>

            {source.error && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {source.error}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {source.status === 'failed' && (
              <Tooltip title="Retry">
                <IconButton size="small" onClick={() => onRetry(source.id)}>
                  <IconRefresh size={18} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton 
                size="small" 
                onClick={() => onDelete(source.id)}
                sx={{ color: 'error.main' }}
              >
                <IconTrash size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

