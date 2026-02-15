import type { MenuItem } from 'types';

// assets
import { 
  IconChecklist, 
  IconUser,
  IconBook2,
  IconChartBar,
  IconSettings,
  IconBrain,
  IconTarget,
  IconRadar2,
  IconRobot,
  IconMap2,
  IconRocket
} from '@tabler/icons-react';

// constant
const icons = { 
  IconChecklist, 
  IconUser,
  IconBook2,
  IconChartBar,
  IconSettings,
  IconBrain,
  IconTarget,
  IconRadar2,
  IconRobot,
  IconMap2,
  IconRocket
};

// ==============================|| FOUNDER CORE ||============================== //

const founderCore: MenuItem = {
  id: 'founder-core',
  title: '',
  type: 'group',
  children: [
    {
      id: 'founder-persona',
      title: 'Founder Persona',
      type: 'item',
      url: '/founder/dashboard',
      icon: icons.IconUser,
      breadcrumbs: false
    },
    {
      id: 'cofounder',
      title: 'CoFounder',
      type: 'item',
      url: '/founder/cofounder',
      icon: icons.IconRobot,
      breadcrumbs: false
    },
    {
      id: 'memory',
      title: 'Memory',
      type: 'item',
      url: '/memory',
      icon: icons.IconBrain,
      breadcrumbs: false
    },
    {
      id: 'mission',
      title: 'Mission',
      type: 'item',
      url: '/founder/mission',
      icon: icons.IconTarget,
      breadcrumbs: false
    }
  ]
};

// ==============================|| LEARN & EXECUTE ||============================== //

const action: MenuItem = {
  id: 'action',
  title: '',
  type: 'group',
  children: [
    {
      id: 'learn',
      title: 'Learn',
      type: 'item',
      url: '/founder/courses',
      icon: icons.IconBook2,
      breadcrumbs: false
    },
    {
      id: 'train',
      title: 'Train',
      type: 'item',
      url: '/founder/today',
      icon: icons.IconChecklist,
      breadcrumbs: false
    },
    {
      id: 'radar',
      title: 'Radar',
      type: 'item',
      url: '/founder/radar',
      icon: icons.IconRadar2,
      breadcrumbs: false
    },
    {
      id: 'intel',
      title: 'Intel',
      type: 'item',
      url: '/founder/intel',
      icon: icons.IconChartBar,
      breadcrumbs: false
    },
    {
      id: 'playbook',
      title: 'Playbook',
      type: 'item',
      url: '/founder/playbook',
      icon: icons.IconMap2,
      breadcrumbs: false
    },
    {
      id: 'shipped',
      title: 'Shipped',
      type: 'item',
      url: '/founder/shipped',
      icon: icons.IconRocket,
      breadcrumbs: false
    }
  ]
};

// ==============================|| PREFERENCES ||============================== //

const preferences: MenuItem = {
  id: 'preferences-group',
  title: '',
  type: 'group',
  children: [
    {
      id: 'preferences',
      title: 'Preferences',
      type: 'item',
      url: '/settings',
      icon: icons.IconSettings,
      breadcrumbs: false
    }
  ]
};

export { founderCore, action, preferences };
export default action;
