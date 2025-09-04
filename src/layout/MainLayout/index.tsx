import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box } from '@mui/material';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import navigation from 'menu-items';
import Breadcrumbs from 'ui-component/extended/Breadcrumbs';
import { drawerWidth } from 'store/constant';
import { useGetMenuMaster, handlerDrawerOpen } from 'api/menu';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// assets
import { IconChevronRight } from '@tabler/icons-react';
import Customization from '../Customization';

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  useEffect(() => {
    handlerDrawerOpen(!downMD);
  }, [downMD]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Drawer />
      <Box 
        component="main" 
        sx={{ 
          width: '100%', 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 },
          marginTop: '88px',
          marginLeft: drawerOpen ? `${drawerWidth}px` : '72px',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Breadcrumbs separator={IconChevronRight} navigation={navigation} icon title rightAlign />
        <Outlet />
      </Box>
      <Customization />
    </Box>
  );
};

export default MainLayout;