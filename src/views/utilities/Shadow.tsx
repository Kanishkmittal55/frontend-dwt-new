import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import MainCard from 'components/MainCard';

// ===============================|| SHADOW BOX ||=============================== //

interface ShadowBoxProps {
  shadow: string;
}

const ShadowBox: FC<ShadowBoxProps> = ({ shadow }) => {
  return (
    <Card sx={{ mb: 3, boxShadow: shadow }}>
      <Box sx={{ p: 1.5 }}>
        <Typography variant="h6" color="textSecondary">
          {shadow}
        </Typography>
      </Box>
    </Card>
  );
};

// ===============================|| SHADOW BOX ||=============================== //

interface CustomShadowBoxProps {
  shadow: string;
  label?: string;
  color: string;
}

const CustomShadowBox: FC<CustomShadowBoxProps> = ({ shadow, label, color }) => {
  return (
    <Card sx={{ mb: 3, boxShadow: shadow }}>
      <Box sx={{ p: 1.5 }}>
        <Typography variant="h6" color={color}>
          {label}
        </Typography>
      </Box>
    </Card>
  );
};

// ============================|| UTILITIES SHADOW ||============================ //

const UtilitiesShadow: FC = () => {
  const theme = useTheme();

  return (
    <MainCard title="Shadow" codeHighlight>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <ShadowBox shadow={theme.customShadows.z1} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CustomShadowBox shadow={theme.customShadows.primary} label="Primary" color="primary.main" />
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default UtilitiesShadow;