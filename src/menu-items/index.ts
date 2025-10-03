import type { MenuItem } from 'types';

import dashboard from './dashboard';
import knowledgeGraph from './knowledge-graph';
import settings from './settings';

// ==============================|| MENU ITEMS ||============================== //

interface MenuItems {
  items: MenuItem[];
}

const menuItems: MenuItems = {
  items: [dashboard, knowledgeGraph, settings]
};

export default menuItems;