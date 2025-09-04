// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { FC } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

// project imports
import SearchSection from './SearchSection';
import ProfileSection from './ProfileSection';
import NotificationSection from './NotificationSection';
import LogoSection from '../LogoSection';
import { useGetMenuMaster, handlerDrawerOpen } from 'api/menu';

// assets
import { IconMenu2 } from '@tabler/icons-react';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const handleLeftDrawerToggle = () => {
    handlerDrawerOpen(!drawerOpen);
  };

  return (
    <AppBar
      enableColorOnDark
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: theme.palette.background.default,
        transition: drawerOpen ? theme.transitions.create('width') : 'none'
      }}
    >
      <Toolbar>
        {/* logo & toggler button */}
        <Box
          sx={{
            width: 228,
            display: 'flex',
            [theme.breakpoints.down('md')]: {
              width: 'auto'
            }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
            <LogoSection />
          </Box>
          <ButtonBase sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Avatar
              variant="rounded"
              sx={{
                ...theme.typography.commonAvatar,
                ...theme.typography.mediumAvatar,
                transition: 'all .2s ease-in-out',
                background: theme.palette.secondary.light,
                color: theme.palette.secondary.dark,
                '&:hover': {
                  background: theme.palette.secondary.dark,
                  color: theme.palette.secondary.light
                }
              }}
              onClick={handleLeftDrawerToggle}
              color="inherit"
            >
              <IconMenu2 stroke={1.5} size="1.3rem" />
            </Avatar>
          </ButtonBase>
        </Box>

        {/* header search */}
        <SearchSection />
        <Box sx={{ flexGrow: 1 }} />

        {/* notification & profile */}
        <NotificationSection />
        <ProfileSection />
      </Toolbar>
    </AppBar>
  );
};

export default Header;