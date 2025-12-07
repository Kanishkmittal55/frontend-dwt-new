import { Outlet } from 'react-router-dom';
import type { FC } from 'react';
import { AuthProvider } from 'contexts/AuthContext';

// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout: FC = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default MinimalLayout;