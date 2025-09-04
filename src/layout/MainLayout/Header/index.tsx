// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { FC } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header: FC = () => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <ProfileSection />
    </>
  );
};

export default Header;