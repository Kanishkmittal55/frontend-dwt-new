import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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

/** Minimal layout for embedded terminal iframe — no navbar/drawer */
const TerminalEmbedLayout: FC = () => (
  <Box sx={{ width: '100%', height: '100vh', minHeight: 400, overflow: 'hidden' }}>
    <Outlet />
  </Box>
);

const MainLayout: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  // Terminal standalone page (Open in new tab) — no navbar/drawer
  const isTerminalEmbed = location.pathname.includes('founder/terminal');

  useEffect(() => {
    handlerDrawerOpen(!downMD);
  }, [downMD]);

  if (isTerminalEmbed) {
    return <TerminalEmbedLayout />;
  }

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