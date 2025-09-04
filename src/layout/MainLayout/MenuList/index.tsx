import { memo } from 'react';
import type { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// project imports
import NavGroup from './NavGroup';
import menuItems from 'menu-items';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| SIDEBAR MENU LIST ||============================== //

const MenuList: FC = () => {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const navItems = menuItems.items.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={item.id} item={item} setSelectedID={() => {}} />;
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