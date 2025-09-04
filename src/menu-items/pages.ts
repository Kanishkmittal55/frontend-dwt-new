import type { MenuItem } from 'types';

// assets
import { IconKey } from '@tabler/icons-react';

// constant
const icons = { IconKey };

// ==============================|| EXTRA PAGES MENU ITEMS ||============================== //

const pages: MenuItem = {
  id: 'pages',
  title: 'Pages',
  type: 'group',
  url: '/pages',
  children: [
    {
      id: 'authentication',
      title: 'Authentication',
      type: 'collapse',
      icon: icons.IconKey,
      children: [
        {
          id: 'login3',
          title: 'Login',
          type: 'item',
          url: '/pages/login',
          target: true
        },
        {
          id: 'register3',
          title: 'Register',
          type: 'item',
          url: '/pages/register',
          target: true
        }
      ]
    }
  ]
};

export default pages;