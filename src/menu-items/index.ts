import type { MenuItem } from 'types';

import dashboard from './dashboard';
import pages from './pages';
import utilities from './utilities';
import other from './other';

// ==============================|| MENU ITEMS ||============================== //

interface MenuItems {
  items: MenuItem[];
}

const menuItems: MenuItems = {
  items: [dashboard, pages, utilities, other]
};

export default menuItems;