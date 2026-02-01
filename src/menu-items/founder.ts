import type { MenuItem } from 'types';

// assets
import { 
  IconBulb, 
  IconChecklist, 
  IconRocket,
  IconBooks,
  IconRobot,
  IconBook2
} from '@tabler/icons-react';

// constant
const icons = { 
  IconBulb, 
  IconChecklist, 
  IconRocket,
  IconBooks,
  IconRobot,
  IconBook2
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
      id: 'founder-agent',
      title: 'AI Agent',
      type: 'item',
      url: '/founder/agent',
      icon: icons.IconRobot,
      breadcrumbs: false
    },
    {
      id: 'founder-courses',
      title: 'Courses',
      type: 'item',
      url: '/founder/courses',
      icon: icons.IconBook2,
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
    }
  ]
};

export default founder;

























