import type { FC } from 'react';

// material-ui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

// ==============================|| SKELETON - TOTAL GROWTH BAR CHART ||============================== //

const TotalGrowthBarChart: FC = () => (
  <Card>
    <CardContent>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid>
              <Grid container direction="column" spacing={1}>
                <Grid>
                  <Skeleton variant="rectangular" sx={{ my: 2 }} height={20} />
                </Grid>
                <Grid>
                  <Skeleton variant="rectangular" height={20} />
                </Grid>
              </Grid>
            </Grid>
            <Grid>
              <Skeleton variant="rectangular" width={80} height={20} />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={12}>
          <Skeleton variant="rectangular" height={530} />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

export default TotalGrowthBarChart;