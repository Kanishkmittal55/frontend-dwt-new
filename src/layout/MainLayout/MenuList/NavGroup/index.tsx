import { useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import type { FC } from 'react';
import type { MenuItem } from 'types';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider, List, Typography, useMediaQuery } from '@mui/material';

// project imports
import NavItem from '../NavItem';
import NavCollapse from '../NavCollapse';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //

interface NavGroupProps {
  item: MenuItem;
  lastItem?: number | null;
  remItems?: any[];
  lastItemId?: string;
  setSelectedID: (id: string) => void;
}

const NavGroup: FC<NavGroupProps> = ({ item, lastItem, remItems, lastItemId, setSelectedID }) => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedID, setSelectedID2] = useState<string>('');

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // menu list collapse & items
  const items = item.children?.map((menu) => {
    switch (menu.type) {
      case 'collapse':
        return <NavCollapse key={menu.id} menu={menu} level={1} parentId={item.id} />;
      case 'item':
        return <NavItem key={menu.id} item={menu} level={1} setSelectedID={() => setSelectedID2(menu.id)} />;
      default:
        return (
          <Typography key={menu.id} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  });

  return (
    <>
      <List
        component="div"
        disablePadding
        sx={{
          position: 'relative',
          '&:after': {
            content: "''",
            position: 'absolute',
            left: '32px',
            top: 0,
            height: '100%',
            width: '1px',
            opacity: theme.palette.mode === 'dark' ? 0.2 : 1,
            background: theme.palette.mode === 'dark' ? theme.palette.dark.light : theme.palette.primary.light
          }
        }}
      >
        {items}
      </List>

      {/* group divider */}
      {drawerOpen && <Divider sx={{ mt: 0.25, mb: 1.25 }} />}
    </>
  );
};

export default NavGroup;