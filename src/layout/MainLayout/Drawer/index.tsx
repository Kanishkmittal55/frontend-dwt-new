import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Drawer, useMediaQuery } from '@mui/material';

// project imports
import Sidebar from '../Sidebar';
import { drawerWidth } from 'store/constant';
import { useGetMenuMaster, handlerDrawerOpen } from 'api/menu';

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

const MainDrawer: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const handleDrawerToggle = () => {
    handlerDrawerOpen(!drawerOpen);
  };

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, width: downMD ? 'auto' : drawerWidth }}>
      <Drawer
        variant={downMD ? 'temporary' : 'persistent'}
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            background: theme.palette.background.default,
            color: theme.palette.text.primary,
            borderRight: 'none',
            [theme.breakpoints.up('md')]: {
              top: '88px'
            }
          }
        }}
        ModalProps={{ keepMounted: true }}
        color="inherit"
      >
        <Sidebar />
      </Drawer>
    </Box>
  );
};

export default MainDrawer;