import React from 'react';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Button, CardActions, CardContent, Divider, Grid, Menu, MenuItem, Typography } from '@mui/material';

// project imports
import BajajAreaChartCard from './BajajAreaChartCard';
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import { gridSpacing } from 'store/constant';

// assets
import EarningIcon from 'assets/images/icons/earning.svg';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import GetAppTwoToneIcon from '@mui/icons-material/GetAppOutlined';
import FileCopyTwoToneIcon from '@mui/icons-material/FileCopyOutlined';
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ArchiveTwoToneIcon from '@mui/icons-material/ArchiveOutlined';

interface EarningCardProps {
  isLoading: boolean;
}

const EarningCard: FC<EarningCardProps> = ({ isLoading }) => {
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {isLoading ? (
        <SkeletonEarningCard />
      ) : (
        <MainCard
          border={false}
          content={false}
          sx={{
            bgcolor: 'secondary.dark',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              width: 210,
              height: 210,
              background: theme.palette.secondary[800],
              borderRadius: '50%',
              top: -85,
              right: -95,
              [theme.breakpoints.down('sm')]: {
                top: -105,
                right: -140
              }
            },
            '&:before': {
              content: '""',
              position: 'absolute',
              width: 210,
              height: 210,
              background: theme.palette.secondary[800],
              borderRadius: '50%',
              top: -125,
              right: -15,
              opacity: 0.5,
              [theme.breakpoints.down('sm')]: {
                top: -155,
                right: -70
              }
            }
          }}
        >
          <CardContent>
            <Grid container direction="column">
              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Avatar
                      variant="rounded"
                      sx={{
                        ...theme.typography.commonAvatar,
                        ...theme.typography.largeAvatar,
                        bgcolor: 'secondary.800',
                        mt: 1
                      }}
                    >
                      <img src={EarningIcon} alt="Notification" />
                    </Avatar>
                  </Grid>
                  <Grid item>
                    <Button
                      disableRipple
                      onClick={handleClick}
                      sx={{ color: 'inherit' }}
                      aria-controls={anchorEl ? 'profile-menu-list-grow' : undefined}
                      aria-haspopup="true"
                    >
                      <MoreHorizIcon
                        fontSize="inherit"
                        sx={{ color: 'secondary.200' }}
                      />
                    </Button>
                    <Menu
                      id="profile-menu-list-grow"
                      anchorEl={anchorEl}
                      placement="bottom-end"
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                    >
                      <MenuItem onClick={handleClose}>
                        <GetAppTwoToneIcon sx={{ mr: 1.75 }} /> Import Card
                      </MenuItem>
                      <MenuItem onClick={handleClose}>
                        <FileCopyTwoToneIcon sx={{ mr: 1.75 }} /> Copy Data
                      </MenuItem>
                      <MenuItem onClick={handleClose}>
                        <PictureAsPdfTwoToneIcon sx={{ mr: 1.75 }} /> Export
                      </MenuItem>
                      <MenuItem onClick={handleClose}>
                        <ArchiveTwoToneIcon sx={{ mr: 1.75 }} /> Archive File
                      </MenuItem>
                    </Menu>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item>
                <Grid container alignItems="center">
                  <Grid item>
                    <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: 1.75, mb: 0.75 }}>$500.00</Typography>
                  </Grid>
                  <Grid item>
                    <Avatar
                      sx={{
                        cursor: 'pointer',
                        ...theme.typography.smallAvatar,
                        bgcolor: 'secondary.200',
                        color: 'secondary.dark'
                      }}
                    >
                      <ArrowUpwardIcon fontSize="inherit" sx={{ transform: 'rotate3d(1, 1, 1, 45deg)' }} />
                    </Avatar>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ mb: 1.25 }}>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'secondary.200'
                  }}
                >
                  Total Earning
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
          <CardActions sx={{ p: 1.25, pt: 0, justifyContent: 'center' }}>
            <Button size="small" disableRipple>
              View Account
            </Button>
          </CardActions>
        </MainCard>
      )}
    </>
  );
};

export default EarningCard;