import { Outlet } from 'react-router-dom';
import type { FC } from 'react';

// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout: FC = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default MinimalLayout;