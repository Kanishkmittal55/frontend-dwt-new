import type { MenuItem } from 'types';

import dashboard from './dashboard';
import knowledgeGraph from './knowledge-graph';
import settings from './settings';

// ==============================|| MENU ITEMS ||============================== //

<<<<<<< Updated upstream:src/menu-items/index.ts
interface MenuItems {
  items: MenuItem[];
}

const menuItems: MenuItems = {
  items: [dashboard, pages, utilities, other]
=======
const menuItems = {
  items: [dashboard, knowledgeGraph, settings]
>>>>>>> Stashed changes:src/menu-items/index.js
};

export default menuItems;