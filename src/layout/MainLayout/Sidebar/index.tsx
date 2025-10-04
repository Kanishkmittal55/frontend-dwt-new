import { memo, useMemo } from 'react';
import type { FC } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import MenuCard from './MenuCard';
import MenuList from '../MenuList';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const drawer = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Menu Items */}
        <PerfectScrollbar
          component="div"
          style={{
            height: !downMD ? 'calc(100vh - 88px)' : 'calc(100vh - 56px)',
            paddingLeft: drawerOpen ? '16px' : '8px',
            paddingRight: drawerOpen ? '16px' : '8px',
            paddingTop: '16px'
          }}
        >
          <MenuList />
          
          {/* Bottom Section - Only show when drawer is open */}
          {drawerOpen && (
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <MenuCard />
              <Stack direction="row" justifyContent="center" sx={{ mb: 2, mt: 2 }}>
                <Chip 
                  label={import.meta.env.VITE_APP_VERSION} 
                  disabled 
                  chipcolor="secondary" 
                  size="small" 
                  sx={{ cursor: 'pointer' }} 
                />
              </Stack>
            </Box>
          )}
        </PerfectScrollbar>
      </Box>
    ),
    [downMD, drawerOpen]
  );

  return drawer;
};

export default memo(Sidebar);