import type { FC, ReactNode } from 'react';

// material-ui
import { styled } from '@mui/material/styles';

interface AuthWrapper1Props {
  children: ReactNode;
}

// ==============================|| AUTHENTICATION 1 WRAPPER ||============================== //

const AuthWrapper1Styled = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  minHeight: '100vh'
}));

const AuthWrapper1: FC<AuthWrapper1Props> = ({ children }) => {
  return <AuthWrapper1Styled>{children}</AuthWrapper1Styled>;
};

export default AuthWrapper1;