import { Link as RouterLink } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import Link from '@mui/material/Link';

// project imports
import { DASHBOARD_PATH } from 'config';
import Logo from 'ui-component/Logo';

// ==============================|| MAIN LOGO ||============================== //

const LogoSection: FC = () => {
  return (
    <Link component={RouterLink} to={DASHBOARD_PATH} aria-label="theme-logo">
      <Logo />
    </Link>
  );
};

export default LogoSection;