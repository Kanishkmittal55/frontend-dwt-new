import type { FC, ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';

// project imports
import MainCard from 'ui-component/cards/MainCard';

interface AuthCardWrapperProps {
  children: ReactNode;
  [key: string]: any;
}

// ==============================|| AUTHENTICATION CARD WRAPPER ||============================== //

const AuthCardWrapper: FC<AuthCardWrapperProps> = ({ children, ...other }) => {
  return (
    <MainCard
      sx={{
        maxWidth: { xs: 400, lg: 475 },
        margin: { xs: 2.5, md: 3 },
        '& > *': {
          flexGrow: 1,
          flexBasis: '50%'
        }
      }}
      content={false}
      {...other}
    >
      <Box sx={{ p: { xs: 2, sm: 3, xl: 5 } }}>{children}</Box>
    </MainCard>
  );
};

export default AuthCardWrapper;