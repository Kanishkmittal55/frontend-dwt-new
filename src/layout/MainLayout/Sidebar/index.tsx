import { memo, useMemo } from 'react';
import type { FC } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import MenuCard from './MenuCard';
import MenuList from '../MenuList';
import LogoSection from '../LogoSection';
import { drawerWidth } from 'store/constant';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const drawer = useMemo(
    () => (
      <>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, p: 1, mx: 'auto' }}>
          <LogoSection />
        </Box>
        <PerfectScrollbar
          component="div"
          style={{
            height: !downMD ? 'calc(100vh - 88px)' : 'calc(100vh - 56px)',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <MenuList />
          <MenuCard />
          <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
            <Chip label={import.meta.env.VITE_APP_VERSION} disabled chipcolor="secondary" size="small" sx={{ cursor: 'pointer' }} />
          </Stack>
        </PerfectScrollbar>
      </>
    ),
    [downMD]
  );

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, width: downMD ? 'auto' : drawerWidth }}>
      {drawer}
    </Box>
  );
};

export default memo(Sidebar);