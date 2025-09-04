import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  ClickAwayListener,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  OutlinedInput,
  Paper,
  Popper,
  Stack,
  Switch,
  Typography,
  useMediaQuery
} from '@mui/material';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';

// assets
import { IconBell } from '@tabler/icons-react';

// notification status options
const status: Array<{ value: string; label: string }> = [
  {
    value: 'all',
    label: 'All Notification'
  },
  {
    value: 'new',
    label: 'New'
  },
  {
    value: 'unread',
    label: 'Unread'
  }
];

// ==============================|| NOTIFICATION ||============================== //

const NotificationSection: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const anchorRef = useRef<any>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current?.focus();
    }
    prevOpen.current = open;
  }, [open]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target.value) setValue(event?.target.value);
  };

  return (
    <>
      <Box
        sx={{
          ml: 2,
          mr: 3,
          [theme.breakpoints.down('md')]: {
            mr: 2
          }
        }}
      >
        <ButtonBase sx={{ borderRadius: '12px' }}>
          <Avatar
            variant="rounded"
            sx={{
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              transition: 'all .2s ease-in-out',
              background: theme.palette.secondary.light,
              color: theme.palette.secondary.dark,
              '&[aria-controls="menu-list-grow"],&:hover': {
                background: theme.palette.secondary.dark,
                color: theme.palette.secondary.light
              }
            }}
            ref={anchorRef}
            aria-controls={open ? 'menu-list-grow' : undefined}
            aria-haspopup="true"
            onClick={handleToggle}
            color="inherit"
          >
            <IconBell stroke={1.5} size="1.3rem" />
          </Avatar>
        </ButtonBase>
      </Box>
      <Popper
        placement={downMD ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [downMD ? 5 : 0, 20]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions position={downMD ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                  <Grid container direction="column" spacing={2}>
                    <Grid item xs={12}>
                      <Grid container alignItems="center" justifyContent="space-between" sx={{ pt: 2, px: 2 }}>
                        <Grid item>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="subtitle1">All Notification</Typography>
                            <Chip
                              size="small"
                              label="01"
                              sx={{
                                color: theme.palette.background.default,
                                bgcolor: theme.palette.warning.dark
                              }}
                            />
                          </Stack>
                        </Grid>
                        <Grid item>
                          <Typography component={Link} to="#" variant="subtitle2" color="primary">
                            Mark as all read
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <PerfectScrollbar
                        style={{ height: '100%', maxHeight: 'calc(100vh - 205px)', overflowX: 'hidden' }}
                      >
                        <Grid container direction="column" spacing={2}>
                          <Grid item xs={12}>
                            <Box sx={{ px: 2, pt: 0.25 }}>
                              <OutlinedInput
                                id="input-search-notification"
                                placeholder="Search notification"
                                value={value}
                                onChange={handleChange}
                                startAdornment={
                                  <InputAdornment position="start">
                                    <IconBell stroke={1.5} size="1rem" color={theme.palette.grey[500]} />
                                  </InputAdornment>
                                }
                                size="small"
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} p={0}>
                            <Divider sx={{ my: 0 }} />
                          </Grid>
                        </Grid>
                        <List
                          component="nav"
                          sx={{
                            width: '100%',
                            maxWidth: 350,
                            minWidth: 300,
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: '10px',
                            [theme.breakpoints.down('md')]: {
                              minWidth: '100%'
                            },
                            '& .MuiListItemButton-root': {
                              mt: 0.5
                            }
                          }}
                        >
                          <ListItemButton
                            sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
                            selected={value === 'all'}
                            onClick={(event: React.MouseEvent<HTMLDivElement>) => handleChange(event as any)}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  color: theme.palette.success.dark,
                                  backgroundColor: theme.palette.success.light,
                                  border: 'none',
                                  borderColor: theme.palette.success.main
                                }}
                              >
                                <IconBell stroke={1.5} size="1.3rem" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1">
                                  Store Verification Done
                                </Typography>
                              }
                              secondary={
                                <Typography variant="subtitle2">
                                  We have successfully received your request.
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Grid container justifyContent="flex-end">
                                <Grid item xs={12}>
                                  <Typography variant="caption" display="block" gutterBottom>
                                    2 min ago
                                  </Typography>
                                </Grid>
                              </Grid>
                            </ListItemSecondaryAction>
                          </ListItemButton>
                          <Divider />
                          <ListItemButton
                            sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
                            selected={value === 'new'}
                            onClick={(event: React.MouseEvent<HTMLDivElement>) => handleChange(event as any)}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  color: theme.palette.primary.dark,
                                  backgroundColor: theme.palette.primary.light,
                                  border: 'none',
                                  borderColor: theme.palette.primary.main
                                }}
                              >
                                <IconBell stroke={1.5} size="1.3rem" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1">
                                  Check Your Mail
                                </Typography>
                              }
                              secondary={
                                <Typography variant="subtitle2">
                                  All done! Now check your inbox as you're in for a sweet treat!
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Grid container justifyContent="flex-end">
                                <Grid item xs={12}>
                                  <Typography variant="caption" display="block" gutterBottom>
                                    2 min ago
                                  </Typography>
                                </Grid>
                              </Grid>
                            </ListItemSecondaryAction>
                          </ListItemButton>
                          <Divider />
                          <ListItemButton
                            sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
                            selected={value === 'unread'}
                            onClick={(event: React.MouseEvent<HTMLDivElement>) => handleChange(event as any)}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  color: theme.palette.secondary.dark,
                                  backgroundColor: theme.palette.secondary.light,
                                  border: 'none',
                                  borderColor: theme.palette.secondary.main
                                }}
                              >
                                <IconBell stroke={1.5} size="1.3rem" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1">
                                  Launch Admin
                                </Typography>
                              }
                              secondary={
                                <Typography variant="subtitle2">
                                  Just see the my new admin!
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Grid container justifyContent="flex-end">
                                <Grid item xs={12}>
                                  <Typography variant="caption" display="block" gutterBottom>
                                    9 min ago
                                  </Typography>
                                </Grid>
                              </Grid>
                            </ListItemSecondaryAction>
                          </ListItemButton>
                        </List>
                      </PerfectScrollbar>
                    </Grid>
                  </Grid>
                  <Divider />
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Typography component={Link} to="#" variant="h6" color="primary">
                        View All
                      </Typography>
                    </Stack>
                  </CardContent>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </>
  );
};

export default NotificationSection;