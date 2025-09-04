import PropTypes from 'prop-types';
import { memo } from 'react';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Grid, LinearProgress, Typography } from '@mui/material';

// project imports
import { gridSpacing } from 'store/constant';

// assets
import { IconBrandFramer } from '@tabler/icons';

// ==============================|| PROGRESS BAR WITH LABEL ||============================== //

interface LinearProgressWithLabelProps {
  value: number;
  [key: string]: any;
}

const LinearProgressWithLabel: FC<LinearProgressWithLabelProps> = ({ value, ...others }) => {
  return (
    <Grid container direction="column" spacing={1} sx={{ mt: 1.5 }}>
      <Grid>
        <Grid container justifyContent="space-between">
          <Grid>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Progress
            </Typography>
          </Grid>
          <Grid>
            <Typography variant="h6" color="inherit">{`${Math.round(value)}%`}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid>
        <LinearProgress variant="determinate" value={value} {...others} />
      </Grid>
    </Grid>
  );
};

// ==============================|| SIDEBAR - MENU CARD ||============================== //

const MenuCard: FC = () => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.primary.light,
        marginBottom: '22px',
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
          content: '""',
          position: 'absolute',
          width: '157px',
          height: '157px',
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(210.04deg, ${theme.palette.primary.dark} -50.94%, rgba(144, 202, 249, 0) 95.49%)`
              : theme.palette.primary[800],
          borderRadius: '50%',
          top: '-105px',
          right: '-96px'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Grid container direction="column" spacing={gridSpacing}>
          <Grid>
            <Grid container justifyContent="space-between">
              <Grid>
                <IconBrandFramer stroke={1.5} size="3rem" color={theme.palette.secondary.dark} />
              </Grid>
            </Grid>
          </Grid>
          <Grid>
            <LinearProgressWithLabel value={80} />
          </Grid>
          <Grid>
            <Typography variant="subtitle2" sx={{ color: theme.palette.grey[800] }}>
              Get extra space for your next project
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <Box sx={{ p: 2, pt: 0, mt: -1 }}>
        <Grid container direction="column" spacing={1}>
          <Grid>
            <Grid container justifyContent="space-between">
              <Grid>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  68GB
                </Typography>
              </Grid>
              <Grid>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  / 100GB
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
};

export default memo(MenuCard);