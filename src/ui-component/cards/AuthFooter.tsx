import { Link as RouterLink } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ==============================|| AUTHENTICATION FOOTER ||============================== //

const AuthFooter: FC = () => {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="subtitle2" component={RouterLink} to="https://codedthemes.com" target="_blank" underline="hover">
        codedthemes.com
      </Typography>
      <Typography variant="subtitle2" component={RouterLink} to="https://codedthemes.com" target="_blank" underline="hover">
        &copy; codedthemes.com
      </Typography>
    </Stack>
  );
};

export default AuthFooter;