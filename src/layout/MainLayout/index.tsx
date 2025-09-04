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
import { SET_MENU } from 'store/actions';
import { useDispatch, useSelector } from 'store';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// assets
import { IconChevronRight } from '@tabler/icons';
import Customization from '../Customization';

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { drawerOpen } = useSelector((state) => state.menu);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: SET_MENU, opened: !downMD });
  }, [downMD, dispatch]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Drawer />
      <Box component="main" sx={{ width: '100%', flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Breadcrumbs separator={IconChevronRight} navigation={navigation} icon title rightAlign />
        <Outlet />
      </Box>
      <Customization />
    </Box>
  );
};

export default MainLayout;