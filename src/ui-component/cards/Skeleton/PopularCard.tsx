import type { FC } from 'react';

// material-ui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

// ==============================|| SKELETON - POPULAR CARD ||============================== //

const PopularCard: FC = () => (
  <Card>
    <CardContent>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid>
              <Skeleton variant="rectangular" width={44} height={44} />
            </Grid>
            <Grid>
              <Skeleton variant="rectangular" width={34} height={34} />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={12}>
          <Skeleton variant="rectangular" height={150} />
        </Grid>
        <Grid size={12}>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Skeleton variant="rectangular" height={20} />
            </Grid>
            <Grid size={12}>
              <Skeleton variant="rectangular" height={20} />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={12}>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Skeleton variant="rectangular" height={20} />
            </Grid>
            <Grid size={12}>
              <Skeleton variant="rectangular" height={20} />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={12}>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Skeleton variant="rectangular" height={20} />
            </Grid>
            <Grid size={12}>
              <Skeleton variant="rectangular" height={20} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

export default PopularCard;