import type { MenuItem } from 'types';

// assets
import { 
  IconBulb, 
  IconChecklist, 
  IconChartBar, 
  IconUser,
  IconRocket,
  IconBooks
} from '@tabler/icons-react';

// constant
const icons = { 
  IconBulb, 
  IconChecklist, 
  IconChartBar, 
  IconUser,
  IconRocket,
  IconBooks
};

// ==============================|| FOUNDER OS MENU ITEMS ||============================== //

const founder: MenuItem = {
  id: 'founder',
  title: 'Founder OS',
  type: 'group',
  children: [
    {
      id: 'founder-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/founder/dashboard',
      icon: icons.IconRocket,
      breadcrumbs: false
    },
    {
      id: 'founder-ideas',
      title: 'Ideas',
      type: 'item',
      url: '/founder/ideas',
      icon: icons.IconBulb,
      breadcrumbs: false
    },
    {
      id: 'founder-library',
      title: 'Library',
      type: 'item',
      url: '/founder/library',
      icon: icons.IconBooks,
      breadcrumbs: false
    },
    {
      id: 'founder-tasks',
      title: 'Daily Tasks',
      type: 'item',
      url: '/founder/today',
      icon: icons.IconChecklist,
      breadcrumbs: false
    },
    {
      id: 'founder-profile',
      title: 'Profile',
      type: 'item',
      url: '/founder/profile',
      icon: icons.IconUser,
      breadcrumbs: false
    }
  ]
};

export default founder;
























