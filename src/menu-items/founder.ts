import type { MenuItem } from 'types';

// assets
import { 
  IconBulb, 
  IconChecklist, 
  IconUser,
  IconBooks,
  IconBook2,
  IconChartBar,
  IconSettings,
  IconDatabase
} from '@tabler/icons-react';

// constant
const icons = { 
  IconBulb, 
  IconChecklist, 
  IconUser,
  IconBooks,
  IconBook2,
  IconChartBar,
  IconSettings,
  IconDatabase
};

// ==============================|| LEARNING MENU ITEMS ||============================== //

const learning: MenuItem = {
  id: 'learning',
  title: 'Learning',
  type: 'group',
  children: [
    {
      id: 'founder-courses',
      title: 'Courses',
      type: 'item',
      url: '/founder/courses',
      icon: icons.IconBook2,
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
      id: 'founder-ideas',
      title: 'Ideas',
      type: 'item',
      url: '/founder/ideas',
      icon: icons.IconBulb,
      breadcrumbs: false
    },
    {
      id: 'founder-insights',
      title: 'Insights',
      type: 'item',
      url: '/founder/library',
      icon: icons.IconChartBar,
      breadcrumbs: false
    }
  ]
};

// ==============================|| PROFILE MENU ITEMS ||============================== //

const profile: MenuItem = {
  id: 'profile',
  title: 'Account',
  type: 'group',
  children: [
    {
      id: 'founder-profile',
      title: 'Founder Profile',
      type: 'item',
      url: '/founder/dashboard',
      icon: icons.IconUser,
      breadcrumbs: false
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.IconSettings,
      breadcrumbs: false
    }
  ]
};

// ==============================|| WORKSPACE MENU ITEMS ||============================== //

const workspace: MenuItem = {
  id: 'workspace',
  title: '',
  type: 'group',
  children: [
    {
      id: 'workspaces',
      title: 'Workspaces',
      type: 'item',
      url: '/knowledge-graph/workspaces',
      icon: icons.IconDatabase,
      breadcrumbs: false
    }
  ]
};

export { learning, profile, workspace };
export default learning;
