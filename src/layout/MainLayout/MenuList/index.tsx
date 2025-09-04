import { memo, useState } from 'react';
import type { FC } from 'react';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

// ==============================|| SIDEBAR MENU LIST ||============================== //

const MenuList: FC = () => {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const navItems = menuItems.map((item) => {
    switch (item.type) {
      case 'collapse':
        return (
          <NavCollapse
            key={item.id}
            menu={item}
            level={1}
            parentId={item.id}
          />
        );
      case 'item':
        return <NavItem key={item.id} item={item} level={1} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Menu Items
          </Typography>
        );
    }
  });

  return <Box {...(drawerOpen && { sx: { mt: 1.5 } })}>{navItems}</Box>;
};

export default memo(MenuList);