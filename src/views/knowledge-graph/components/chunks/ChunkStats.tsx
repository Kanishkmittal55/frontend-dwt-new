import React from 'react';
import Grid from '@mui/material/Grid';
import { Paper, Typography } from '@mui/material';

interface ChunkStatsProps {
  totalChunks: number;
  workspacesCount: number;
  taggedChunks: number;
  dataTypes: number;
}

export const ChunkStats: React.FC<ChunkStatsProps> = ({
  totalChunks,
  workspacesCount,
  taggedChunks,
  dataTypes
}) => {
  const stats = [
    { label: 'Total Chunks', value: totalChunks, bgcolor: 'primary.lighter' },
    { label: 'Workspaces', value: workspacesCount, bgcolor: 'secondary.lighter' },
    { label: 'Tagged Chunks', value: taggedChunks, bgcolor: 'warning.lighter' },
    { label: 'Data Types', value: dataTypes, bgcolor: 'success.lighter' }
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat, index) => (
        <Grid size={{ xs: 12, md: 3 }} key={index}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: stat.bgcolor }}>
            <Typography variant="h4">{stat.value}</Typography>
            <Typography variant="caption">{stat.label}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};