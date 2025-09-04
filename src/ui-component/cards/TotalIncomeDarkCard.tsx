import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from './MainCard';
import SkeletonTotalIncomeCard from './Skeleton/TotalIncomeCard';
import { TotalIncomeDarkCardProps } from 'types/ui-components';

// assets
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';

// ==============================|| DASHBOARD - TOTAL INCOME DARK CARD ||============================== //

const TotalIncomeDarkCard: FC<TotalIncomeDarkCardProps> = ({ isLoading }) => {
  const theme = useTheme();

  return (
    <>
      {isLoading ? (
        <SkeletonTotalIncomeCard />
      ) : (
        <MainCard
          border={false}
          content={false}
          sx={{
            bgcolor: 'secondary.dark',
            color: 'primary.light',
            overflow: 'hidden',
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              width: 210,
              height: 210,
              background: `linear-gradient(210.04deg, ${theme.palette.secondary[200]} -50.94%, rgba(144, 202, 249, 0) 83.49%)`,
              borderRadius: '50%',
              top: -30,
              right: -180
            },
            '&:before': {
              content: '""',
              position: 'absolute',
              width: 210,
              height: 210,
              background: `linear-gradient(140.9deg, ${theme.palette.secondary[200]} -14.02%, rgba(144, 202, 249, 0) 70.50%)`,
              borderRadius: '50%',
              top: -160,
              right: -130
            }
          }}
        >
          <Box sx={{ p: 2.25 }}>
            <Grid container direction="column">
              <Grid sx={{ mb: 0.75 }}>
                <Grid container alignItems="center">
                  <Grid>
                    <Avatar
                      variant="rounded"
                      sx={{
                        ...theme.typography.commonAvatar,
                        ...theme.typography.largeAvatar,
                        bgcolor: 'secondary.800',
                        color: '#fff'
                      }}
                    >
                      <TableChartOutlinedIcon fontSize="inherit" />
                    </Avatar>
                  </Grid>
                </Grid>
              </Grid>
              <Grid>
                <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, color: 'primary.light' }}>$203k</Typography>
              </Grid>
              <Grid>
                <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'secondary.200' }}>Total Income</Typography>
              </Grid>
            </Grid>
          </Box>
        </MainCard>
      )}
    </>
  );
};

export default TotalIncomeDarkCard;