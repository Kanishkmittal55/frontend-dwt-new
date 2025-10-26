import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { IconFileText } from '@tabler/icons-react';

interface EmptyStateProps {
  hasFilters: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters }) => {
  return (
    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
      <IconFileText size={64} stroke={1} />
      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        {hasFilters ? 'No Chunks Found' : 'No Chunks Created Yet'}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {hasFilters 
          ? 'Try adjusting your search or filters'
          : 'Add your first chunk to start organizing knowledge'}
      </Typography>
    </Paper>
  );
};
