import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Drawer, useMediaQuery } from '@mui/material';

// project imports
import Sidebar from '../Sidebar';
import { drawerWidth } from 'store/constant';
import { useGetMenuMaster, handlerDrawerOpen } from 'api/menu';

const miniDrawerWidth = 72;

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
    <Box 
      component="nav" 
      sx={{ 
        flexShrink: { md: 0 }, 
        width: downMD ? 'auto' : (drawerOpen ? drawerWidth : miniDrawerWidth),
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        })
      }}
    >
      <Drawer
        variant={downMD ? 'temporary' : 'permanent'}
        anchor="left"
        open={downMD ? drawerOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: downMD ? drawerWidth : (drawerOpen ? drawerWidth : miniDrawerWidth),
            background: theme.palette.background.default,
            color: theme.palette.text.primary,
            borderRight: 'none',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            [theme.breakpoints.up('md')]: {
              top: '88px',
              height: 'calc(100vh - 88px)'
            }
          }
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Sidebar />
      </Drawer>
    </Box>
  );
};

export default MainDrawer;