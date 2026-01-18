/**
 * ProgressTracker Component
 * Shows learning progress, due items, and SM-2 stats
 */
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { IconFlame, IconClock, IconTrendingUp, IconBrain, IconRefresh } from '@tabler/icons-react';
import { useTheme, alpha } from '@mui/material/styles';

import type { LearningItem } from '../hooks/useLearningItems';

// Simple relative time formatter (no date-fns dependency)
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 0) return 'overdue';
  if (diffMins < 60) return `in ${diffMins} min`;
  if (diffHours < 24) return `in ${diffHours} hours`;
  return `in ${diffDays} days`;
}

interface ProgressTrackerProps {
  dueItems: LearningItem[];
  allItems: LearningItem[];
  onStartReview: (item: LearningItem) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function ProgressTracker({ 
  dueItems, 
  allItems, 
  onStartReview, 
  onRefresh,
  loading 
}: ProgressTrackerProps) {
  const theme = useTheme();

  // Calculate stats
  const totalItems = allItems.length;
  const dueCount = dueItems.length;
  const masteredCount = allItems.filter(i => i.repetition_count >= 5).length;
  const avgEaseFactor = totalItems > 0
    ? (allItems.reduce((sum, i) => sum + i.ease_factor, 0) / totalItems).toFixed(2)
    : '2.50';

  // Format next review time
  const formatNextReview = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    try {
      return formatRelativeTime(dateStr);
    } catch {
      return 'Soon';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
        <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.error.main, 0.08) }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconFlame size={20} color={theme.palette.error.main} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{dueCount}</Typography>
                <Typography variant="caption" color="text.secondary">Due Now</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.success.main, 0.08) }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconBrain size={20} color={theme.palette.success.main} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{masteredCount}</Typography>
                <Typography variant="caption" color="text.secondary">Mastered</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.info.main, 0.08) }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconTrendingUp size={20} color={theme.palette.info.main} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{avgEaseFactor}</Typography>
                <Typography variant="caption" color="text.secondary">Ease Factor</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconClock size={20} color={theme.palette.warning.main} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{totalItems}</Typography>
                <Typography variant="caption" color="text.secondary">Tracked</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Due Items List */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Due for Review
          </Typography>
          <Button
            size="small"
            startIcon={<IconRefresh size={14} />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {dueItems.length === 0 ? (
          <Card variant="outlined" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              🎉 All caught up! No reviews due.
            </Typography>
          </Card>
        ) : (
          <Card variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
            <List dense disablePadding>
              {dueItems.map((item, idx) => (
                <Box key={item.uuid}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onStartReview(item)}
                      >
                        Review
                      </Button>
                    }
                    sx={{ pr: 10 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <IconFlame size={18} color={theme.palette.error.main} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {item.title || item.item_id}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={item.item_type}
                            size="small"
                            sx={{ height: 18, fontSize: 10 }}
                          />
                          <Tooltip title={`${item.repetition_count} successful reviews`}>
                            <Typography variant="caption" color="text.secondary">
                              Rep: {item.repetition_count}
                            </Typography>
                          </Tooltip>
                        </Box>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </Card>
        )}
      </Box>

      {/* Next Up */}
      {allItems.length > 0 && dueItems.length === 0 && (
        <Card variant="outlined">
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Next Review
            </Typography>
            {(() => {
              const nextItem = allItems
                .filter(i => i.next_review_at && !i.is_due)
                .sort((a, b) => new Date(a.next_review_at!).getTime() - new Date(b.next_review_at!).getTime())[0];
              
              if (!nextItem) return <Typography variant="body2">No upcoming reviews</Typography>;
              
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={500}>
                    {nextItem.title || nextItem.item_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatNextReview(nextItem.next_review_at)}
                  </Typography>
                </Box>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

