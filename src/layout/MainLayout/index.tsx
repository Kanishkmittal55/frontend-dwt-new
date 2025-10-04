import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box } from '@mui/material';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import { handlerDrawerOpen } from 'api/menu';
import Customization from '../Customization';

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

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
        }}
      >
        <Outlet />
      </Box>
      <Customization />
    </Box>
  );
};

export default MainLayout;