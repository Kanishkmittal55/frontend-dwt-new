import { useEffect, useState } from 'react';
import type { FC } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';

// ==============================|| DEFAULT DASHBOARD ||============================== //

const Dashboard: FC = () => {
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12}>
          <MainCard title="Welcome to Berry Dashboard">
            <Typography variant="body1">
              This is a TypeScript version of the Berry Material-UI React Dashboard.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              The dashboard is now loading successfully! You can start building your features from here.
            </Typography>
          </MainCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;